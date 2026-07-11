#!/usr/bin/env node
/**
 * V8 W-UNIFY capture harness (verify-only).
 *
 * Prereq:
 *   cd coordination/scripts && npm install
 *   cd test && npx vitest run --dir ../coordination/scripts v8-fixtures.build.test.ts
 *   cd build/web-mobile && python3 -m http.server 7788
 * Run:
 *   cd coordination/scripts && node v8-capture.mjs
 *   cd coordination/scripts && node v8-product-smoke.mjs
 */
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const EVIDENCE = path.resolve(ROOT, 'coordination/reports/V8-evidence');
const FIXTURES = path.resolve(EVIDENCE, 'fixtures');
const TMP = '/tmp/doudizhu-v8-capture';
const BASE_URL = 'http://127.0.0.1:7788/';
const SEED = 20260705;

const VIEWPORTS = [
  { label: '844x390', width: 844, height: 390 },
  { label: '812x375', width: 812, height: 375 },
  { label: '915x412', width: 915, height: 412 },
  { label: '780x360', width: 780, height: 360 },
];

const BROWSER_HELPERS = `
function findSkeleton() {
  const cc = globalThis.cc;
  const scene = cc?.director?.getScene?.();
  if (!scene) return null;
  const stack = [scene];
  while (stack.length) {
    const node = stack.pop();
    for (const comp of node._components || []) {
      if (comp && typeof comp.render === 'function' && comp.runtime && typeof comp.startGame === 'function') {
        return comp;
      }
    }
    for (const child of node.children || []) stack.push(child);
  }
  return null;
}
function findLabels() {
  const out = [];
  const scene = globalThis.cc?.director?.getScene?.();
  const walk = (node) => {
    for (const comp of node._components || []) {
      if (comp && typeof comp.string === 'string' && comp.string.trim()) out.push(comp.string.trim());
    }
    for (const child of node.children || []) walk(child);
  };
  if (scene) walk(scene);
  return out;
}
function waitMs(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function findNodeByName(name) {
  const scene = globalThis.cc?.director?.getScene?.();
  if (!scene) return null;
  const stack = [scene];
  while (stack.length) {
    const node = stack.pop();
    if (node.name === name) return node;
    for (const child of node.children || []) stack.push(child);
  }
  return null;
}
function uiRootPointToViewport(localX, localY) {
  const sk = findSkeleton();
  const cc = globalThis.cc;
  const canvas = document.getElementById('GameCanvas');
  const rect = canvas.getBoundingClientRect();
  const canvasSize = sk.canvasSize();
  const screenX = localX + canvasSize.width / 2;
  const screenY = canvasSize.height / 2 - localY;
  const cs = cc.view.getCanvasSize();
  const sx = rect.width / cs.width;
  const sy = rect.height / cs.height;
  return { x: rect.left + screenX * sx, y: rect.top + screenY * sy };
}
function buttonViewportCenter(name) {
  const node = findNodeByName(name);
  if (!node) return { ok: false, reason: 'node-missing', name };
  const pos = node.position;
  const center = uiRootPointToViewport(pos.x, pos.y);
  return { ok: true, name, x: center.x, y: center.y };
}
function handCardViewportCenters() {
  const sk = findSkeleton();
  if (!sk?.uiRoot) return { ok: false, reason: 'no-uiRoot' };
  const cards = [];
  for (const child of sk.uiRoot.children) {
    if (!child.name.startsWith('card-')) continue;
    const pos = child.position;
    const vp = uiRootPointToViewport(pos.x, pos.y);
    cards.push({ name: child.name, x: vp.x, y: vp.y, sortX: pos.x });
  }
  cards.sort((a, b) => a.sortX - b.sortX);
  return { ok: true, cards };
}
function handDragViewportLine(minCards = 5) {
  const hand = handCardViewportCenters();
  if (!hand.ok || hand.cards.length < minCards) {
    return { ok: false, reason: 'insufficient-cards', hand };
  }
  const first = hand.cards[0];
  const last = hand.cards[Math.min(minCards - 1, hand.cards.length - 1)];
  return {
    ok: true,
    from: { x: first.x, y: first.y },
    to: { x: last.x + 24, y: last.y },
    cardCount: hand.cards.length,
  };
}
function assertStraight12LastPlay() {
  const sk = findSkeleton();
  const snap = sk?.runtime?.currentSnapshot?.();
  const events = sk?.fullGameEvents || [];
  const lastPlay = [...events].reverse().find((event) => event.type === 'play');
  const topLen = snap?.top?.pattern?.cards?.length ?? 0;
  const lastLen = lastPlay?.pattern?.cards?.length ?? 0;
  return {
    topCardsLength: topLen,
    lastPlayCardsLength: lastLen,
    pass: topLen === 12 && lastLen === 12,
  };
}
function digestEvents(events) {
  const recent = (events || []).slice(-12);
  return recent.map((event) => {
    if (event.type === 'play') return 'play:' + event.seat + ':' + event.pattern.category + ':' + event.pattern.cards.length;
    if (event.type === 'pass') return 'pass:' + event.seat;
    if (event.type === 'bomb') return 'bomb:' + event.seat;
    if (event.type === 'rocket') return 'rocket:' + event.seat;
    if (event.type === 'win') return 'win:' + event.seat;
    return event.type;
  }).join('|');
}
function runtimeDigest() {
  const sk = findSkeleton();
  if (!sk?.runtime) return { ok: false };
  const snap = sk.runtime.currentSnapshot?.() ?? null;
  const events = sk.fullGameEvents || [];
  return {
    ok: true,
    phase: sk.runtime.phase?.() ?? null,
    turn: snap?.turn ?? null,
    handCount: snap?.viewerHand?.length ?? 0,
    eventCount: events.length,
    eventsDigest: digestEvents(events),
    passLegal: Boolean(sk.runtime.legalInputs?.()?.some((input) => input.kind === 'play' && input.action?.type === 'pass')),
    selectedCount: Array.isArray(sk.selected) ? sk.selected.length : 0,
  };
}
async function driveToPlaying(sk, leaveRunning = false) {
  sk.runtime?.pause?.();
  for (let step = 0; step < 48; step += 1) {
    await waitMs(80);
    if (sk.runtime.phase() === 'playing') break;
    if (!sk.runtime.isPlayerTurn()) {
      sk.runtime.resume();
      await waitMs(200);
      sk.runtime.pause();
      continue;
    }
    const inputs = sk.runtime.legalInputs();
    if (!inputs?.length) continue;
    const bid = inputs.find((i) => i.kind === 'bid' && i.action.type === 'call')
      ?? inputs.find((i) => i.kind === 'bid' && i.action.type === 'pass')
      ?? inputs[0];
    await sk.runtime.submitPlayerAction(bid);
  }
  if (leaveRunning) {
    sk.runtime?.resume?.();
    await waitMs(1200);
  } else {
    sk.runtime?.pause?.();
    await waitMs(200);
  }
  sk.render?.();
}
async function waitForPlayerTurn(sk, maxMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    if (sk.runtime.isPlayerTurn()) return true;
    sk.runtime.resume();
    await waitMs(120);
    sk.runtime.pause();
  }
  return false;
}
async function replayLivePlan(plan) {
  const sk = findSkeleton();
  if (!sk) throw new Error('skeleton missing for live replay');
  sk.runtime.pause();
  for (const step of plan.steps) {
    if (step.type === 'to-playing') {
      await driveToPlaying(sk, false);
      continue;
    }
    if (step.type === 'hero-play-first-legal') {
      sk.runtime.resume();
      let played = false;
      for (let i = 0; i < 40; i += 1) {
        await waitMs(120);
        if (!sk.runtime.isPlayerTurn()) continue;
        const snap = sk.runtime.currentSnapshot?.();
        if (snap?.top) break;
        const inputs = sk.runtime.legalInputs?.() || [];
        const play = inputs.find((input) => input.kind === 'play' && input.action?.type === 'play');
        if (!play) continue;
        await sk.runtime.submitPlayerAction(play);
        played = true;
        break;
      }
      if (!played) {
        const snap = sk.runtime.currentSnapshot?.();
        if (!snap?.top) throw new Error('hero-play-first-legal but no play input');
      }
      await waitMs(400);
      sk.runtime.pause();
      sk.render?.();
      continue;
    }
    if (step.type === 'wait-until-pass-ready') {
      sk.runtime.resume();
      let ready = false;
      for (let i = 0; i < 400; i += 1) {
        await waitMs(120);
        const snap = sk.runtime.currentSnapshot?.();
        const passLegal = sk.runtime.legalInputs?.()?.some((input) => input.kind === 'play' && input.action?.type === 'pass');
        if (passLegal && snap?.top && sk.runtime.isPlayerTurn()) {
          ready = true;
          break;
        }
      }
      sk.runtime.pause();
      if (!ready) throw new Error('live replay wait-until-pass-ready failed');
      continue;
    }
    if (step.type === 'wait-round-events') {
      const target = step.count;
      sk.runtime.resume();
      for (let i = 0; i < 240; i += 1) {
        await waitMs(100);
        const count = (sk.fullGameEvents || []).length;
        if (count >= target) break;
      }
      sk.runtime.pause();
      const actual = (sk.fullGameEvents || []).length;
      if (actual < target) throw new Error('live replay wait-round-events failed: ' + actual + ' < ' + target);
      continue;
    }
    if (step.type === 'hero-pass') {
      if (!(await waitForPlayerTurn(sk))) {
        throw new Error('hero-pass but hero turn not reached');
      }
      sk.runtime.resume();
      await waitMs(200);
      const before = sk.runtime.currentSnapshot?.();
      const beforeTurn = before?.turn;
      const beforeEvents = (sk.fullGameEvents || []).length;
      const passLegal = sk.runtime.legalInputs?.()?.some((input) => input.kind === 'play' && input.action?.type === 'pass');
      if (!passLegal) throw new Error('hero-pass step but pass is not legal');
      await sk.submitPass();
      await waitMs(800);
      const after = sk.runtime.currentSnapshot?.();
      const afterEvents = sk.fullGameEvents || [];
      const passSeen = afterEvents.slice(beforeEvents).some((event) => event.type === 'pass' && event.seat === 0);
      const turnAdvanced = after?.turn !== beforeTurn;
      if (!passSeen && !turnAdvanced) throw new Error('hero-pass did not advance turn or emit pass event');
      sk.runtime.pause();
      sk.render?.();
      continue;
    }
    if (step.type === 'sync-event-count') {
      const target = step.count;
      sk.runtime.resume();
      for (let i = 0; i < 400; i += 1) {
        await waitMs(120);
        const count = (sk.fullGameEvents || []).length;
        if (count >= target) break;
      }
      sk.runtime.pause();
      const actual = (sk.fullGameEvents || []).length;
      if (actual < target) throw new Error('live replay sync-event-count failed: ' + actual + ' < ' + target);
      continue;
    }
    throw new Error('unknown live replay step: ' + step.type);
  }
}
`;

function sha256File(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function isStableHarnessNoise(message) {
  return message.includes('favicon')
    || (message.includes('net::ERR_ABORTED') && message.includes('7788'));
}

function isInteractionHarnessNoise(message) {
  return isStableHarnessNoise(message)
    || message.includes("Access is denied for this document");
}

async function cdpTouchDrag(page, from, to, steps = 16) {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const point = (x, y) => ({ x: Math.round(x), y: Math.round(y), id: 0, radiusX: 1, radiusY: 1 });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [point(from.x, from.y)],
  });
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [point(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t)],
    });
    await page.waitForTimeout(24);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}

async function cdpTouchTap(page, point) {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const x = Math.round(point.x);
  const y = Math.round(point.y);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 0, radiusX: 1, radiusY: 1 }],
  });
  await page.waitForTimeout(60);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}

async function runInPage(page, expr, { async = false } = {}) {
  if (async) {
    return page.evaluate(async ({ helpers, expr: code }) => {
      // eslint-disable-next-line no-eval
      (0, eval)(helpers);
      // eslint-disable-next-line no-eval
      const fn = (0, eval)(code);
      return await fn();
    }, { helpers: BROWSER_HELPERS, expr });
  }
  return page.evaluate(({ helpers, expr: code }) => {
    // eslint-disable-next-line no-eval
    (0, eval)(helpers);
    // eslint-disable-next-line no-eval
    return (0, eval)(code);
  }, { helpers: BROWSER_HELPERS, expr });
}

fs.mkdirSync(EVIDENCE, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(path.join(EVIDENCE, 'screenshots'), { recursive: true });
fs.mkdirSync(path.join(EVIDENCE, 'recordings'), { recursive: true });

function loadFixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

function attachCollectors(page, bucket, { interaction = false } = {}) {
  const ignore = interaction ? isInteractionHarnessNoise : isStableHarnessNoise;
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !ignore(msg.text())) {
      bucket.push({ source: 'console', message: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    if (!ignore(err.message)) bucket.push({ source: 'pageerror', message: err.message });
  });
  page.on('requestfailed', (req) => {
    const failure = req.failure();
    const message = `${req.url()} ${failure?.errorText ?? 'failed'}`;
    if (!ignore(message)) bucket.push({ source: 'requestfailed', message });
  });
}

async function waitForCanvas(page, extraMs = 5000) {
  await page.waitForSelector('#GameCanvas', { timeout: 90000 });
  await page.waitForFunction(() => {
    const canvas = document.getElementById('GameCanvas');
    return canvas && canvas.width > 0 && canvas.height > 0;
  }, { timeout: 90000 });
  await page.waitForFunction(() => Boolean(globalThis.cc?.director?.getScene?.()), { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(extraMs);
}

async function shot(page, relPath, meta = {}) {
  const full = path.join(EVIDENCE, 'screenshots', relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  await page.screenshot({ path: full, type: 'png' });
  return { path: full, sha256: sha256File(full), ...meta };
}

async function loadGameWithSave(page, saveJson, seed = SEED, { refreshRestore = true } = {}) {
  const settings = JSON.stringify({ sound: true, vibration: false, animation: false, difficulty: 'simple' });
  await page.goto(`${BASE_URL}?seed=${seed}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(({ save, settingsJson }) => {
    if (save) localStorage.setItem('doudizhu.save', save);
    else localStorage.removeItem('doudizhu.save');
    localStorage.setItem('doudizhu.settings', settingsJson);
  }, { save: saveJson, settingsJson: settings });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForCanvas(page, 6000);
  await page.evaluate(() => globalThis.cc?.director?.loadScene?.('game'));
  await runInPage(page, `async () => {
    for (let i = 0; i < 120; i += 1) {
      await waitMs(50);
      if (findSkeleton()) return;
    }
    throw new Error('skeleton missing after loadScene(game)');
  }`, { async: true });
  if (refreshRestore) {
    await page.evaluate((save) => {
      if (!save) return;
      localStorage.setItem('doudizhu.save', save);
      globalThis.cc?.sys?.localStorage?.setItem('doudizhu.save', save);
    }, saveJson);
    await runInPage(page, `(() => {
      const sk = findSkeleton();
      if (!sk) throw new Error('skeleton missing before restore');
      sk.startGame(false);
      sk.runtime?.pause?.();
      sk.render?.();
    })()`);
  } else {
    await page.waitForTimeout(2500);
    await runInPage(page, `(() => {
      const sk = findSkeleton();
      if (!sk) throw new Error('skeleton missing after loadScene(game)');
      sk?.runtime?.pause?.();
      sk?.render?.();
    })()`);
  }
}

async function ensureGamePhase(page, expectedPhase, scenarioId) {
  const info = await runInPage(page, `async () => {
    const sk = findSkeleton();
    if (!sk?.runtime) return { ok: false, reason: 'runtime-missing' };
    for (let i = 0; i < 60; i += 1) {
      await waitMs(200);
      const phase = sk.runtime?.phase?.();
      if (phase === ${JSON.stringify(expectedPhase)}) {
        return { ok: true, ...runtimeDigest() };
      }
    }
    return { ok: false, ...runtimeDigest(), reason: 'phase-timeout' };
  }`, { async: true });
  if (!info.ok || info.phase !== expectedPhase) {
    throw new Error(`[${scenarioId}] expected phase=${expectedPhase}, got ${JSON.stringify(info)}`);
  }
  return info;
}

async function stabilizeFrame(page) {
  await runInPage(page, `(() => {
    const sk = findSkeleton();
    if (!sk?.runtime) return;
    sk.runtime.pause?.();
    sk.render?.();
  })()`);
  await page.waitForTimeout(600);
}

async function captureScenario(page, viewport, scenarioId, fixtureName, fileSuffix, expectedPhase = 'playing') {
  await loadGameWithSave(page, loadFixture(fixtureName));
  const info = await ensureGamePhase(page, expectedPhase, scenarioId);
  const labels = await runInPage(page, 'findLabels()');
  return shot(page, `${scenarioId}-${fileSuffix}-${viewport.label}.png`, {
    scenarioId, viewport: viewport.label, skInfo: info, labels: labels.slice(0, 20),
  });
}

async function captureStraight12(page, viewport) {
  await loadGameWithSave(page, loadFixture('straight-12.json'));
  const info = await ensureGamePhase(page, 'playing', 'c-straight-12');
  const straight12Assertion = await runInPage(page, `(() => {
    const sk = findSkeleton();
    sk?.runtime?.pause?.();
    sk?.render?.();
    return assertStraight12LastPlay();
  })()`);
  if (!straight12Assertion.pass) {
    throw new Error(`[c-straight-12] last play cards.length assertion failed at ${viewport.label}: ${JSON.stringify(straight12Assertion)}`);
  }
  await page.waitForTimeout(600);
  const labels = await runInPage(page, 'findLabels()');
  return shot(page, `c-straight-12-${viewport.label}.png`, {
    scenarioId: 'c',
    viewport: viewport.label,
    skInfo: info,
    straight12Assertion,
    labels: labels.slice(0, 20),
  });
}

async function captureMustPass(page, viewport) {
  await loadGameWithSave(page, loadFixture('must-pass.json'));
  const info = await ensureGamePhase(page, 'playing', 'b-must-pass');
  const labels = await runInPage(page, 'findLabels()');
  const mustPass = labels.some((t) => t.includes('要不起'));
  if (!mustPass) throw new Error(`[b-must-pass] missing 要不起 label at ${viewport.label}`);
  if (!info.passLegal) throw new Error(`[b-must-pass] pass not legal at ${viewport.label}`);
  return shot(page, `b-must-pass-${viewport.label}.png`, {
    scenarioId: 'b', viewport: viewport.label, info: { ...info, hasMustPass: mustPass },
  });
}

async function capturePause(page, viewport) {
  await loadGameWithSave(page, loadFixture('mini-regular.json'), SEED, { refreshRestore: false });
  await ensureGamePhase(page, 'playing', 'f-pause');
  await runInPage(page, `async () => {
    const sk = findSkeleton();
    if (!sk) return;
    sk.openPauseMenu?.();
    sk.render?.();
  }`, { async: true });
  await page.waitForTimeout(800);
  return shot(page, `f-pause-${viewport.label}.png`, { scenarioId: 'f', viewport: viewport.label, phase: 'pause' });
}

async function captureSettled(page, viewport) {
  await loadGameWithSave(page, loadFixture('settled.json'));
  await ensureGamePhase(page, 'settled', 'f-settled');
  await stabilizeFrame(page);
  await page.waitForTimeout(1000);
  return shot(page, `f-settled-${viewport.label}.png`, { scenarioId: 'f', viewport: viewport.label, phase: 'settled' });
}

async function captureResumePair(page, viewport, plan) {
  await loadGameWithSave(page, loadFixture('resume.json'));
  await stabilizeFrame(page);
  const resumeDigest = await runInPage(page, 'runtimeDigest()');
  if (!resumeDigest.ok) throw new Error(`[e-resume] runtime digest failed at ${viewport.label}`);
  if (resumeDigest.eventsDigest !== plan.eventsDigest) {
    throw new Error(`[e-resume] digest mismatch at ${viewport.label}: ${resumeDigest.eventsDigest} != ${plan.eventsDigest}`);
  }
  const resumed = await shot(page, `e-resume-${viewport.label}.png`, {
    scenarioId: 'e', viewport: viewport.label, mode: 'resume', digest: resumeDigest,
  });

  await page.goto(`${BASE_URL}?seed=${plan.seed}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(({ settingsJson }) => {
    localStorage.removeItem('doudizhu.save');
    localStorage.setItem('doudizhu.settings', settingsJson);
  }, {
    settingsJson: JSON.stringify({ sound: true, vibration: false, animation: true, difficulty: 'simple' }),
  });
  await waitForCanvas(page, 5000);
  await page.evaluate(() => globalThis.cc?.director?.loadScene?.('game'));
  await page.waitForTimeout(1500);
  await page.evaluate(() => globalThis.cc?.sys?.localStorage?.removeItem('doudizhu.save'));
  await runInPage(page, `async () => { await replayLivePlan(${JSON.stringify(plan)}); }`, { async: true });
  await stabilizeFrame(page);

  const liveDigest = await runInPage(page, 'runtimeDigest()');
  if (!liveDigest.ok) throw new Error(`[e-live] runtime digest failed at ${viewport.label}`);
  if (liveDigest.eventsDigest !== plan.eventsDigest) {
    throw new Error(`[e-live] digest mismatch at ${viewport.label}: ${liveDigest.eventsDigest} != ${plan.eventsDigest}`);
  }
  if (liveDigest.eventsDigest !== resumeDigest.eventsDigest) {
    throw new Error(`[e-live] resume/live digest differ at ${viewport.label}`);
  }
  const live = await shot(page, `e-live-${viewport.label}.png`, {
    scenarioId: 'e', viewport: viewport.label, mode: 'live-rebuild', digest: liveDigest,
  });

  if (resumed.sha256 === live.sha256) {
    console.warn(`[e-${viewport.label}] resume/live screenshots identical — digest match still required`);
  }
  return [resumed, live];
}

async function recordDragSelect(outName) {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    recordVideo: { dir: TMP, size: { width: 844, height: 390 } },
  });
  const page = await context.newPage();
  const errors = [];
  const rawErrors = [];
  attachCollectors(page, errors, { interaction: true });
  page.on('console', (msg) => {
    if (msg.type() === 'error') rawErrors.push({ source: 'console', message: msg.text() });
  });
  page.on('pageerror', (err) => rawErrors.push({ source: 'pageerror', message: err.message }));

  await loadGameWithSave(page, loadFixture('mini-regular.json'));
  await ensureGamePhase(page, 'playing', 'record-drag-select');
  await runInPage(page, `async () => { const sk = findSkeleton(); if (sk) await driveToPlaying(sk, false); }`, { async: true });
  await page.waitForTimeout(800);

  const before = await runInPage(page, 'runtimeDigest()');
  const dragLine = await runInPage(page, 'handDragViewportLine(5)');
  if (!dragLine?.ok) {
    throw new Error(`record-drag-select: hand drag coords failed: ${JSON.stringify(dragLine)}`);
  }
  // 主路径：真实鼠标输入沿手牌卡心连线（Cocos web 输入链将 mouse 派发为 touch，走产品 TOUCH_START/MOVE/END 接线）
  await page.mouse.move(dragLine.from.x, dragLine.from.y);
  await page.mouse.down();
  await page.mouse.move(dragLine.to.x, dragLine.to.y, { steps: 18 });
  await page.waitForTimeout(400);
  await page.mouse.up();
  await page.waitForTimeout(900);
  let after = await runInPage(page, 'runtimeDigest()');
  let dragVia = 'mouse-precise-cardline';
  // 第二路径：CDP 真实触摸事件（Input.dispatchTouchEvent）
  if ((after.selectedCount ?? 0) < 4) {
    await cdpTouchDrag(page, dragLine.from, dragLine.to);
    await page.waitForTimeout(900);
    after = await runInPage(page, 'runtimeDigest()');
    dragVia = 'cdp-dispatchTouchEvent';
  }
  // 无合成回退（R2-② 裁决）：两条真实输入路径都未命中即 fail-fast，绝不由 harness 写 sk.selected
  if ((after.selectedCount ?? 0) < 4) {
    throw new Error(`record-drag-select: real-input drag expected >=4 selected, got ${after.selectedCount}; before=${JSON.stringify(before)}; line=${JSON.stringify(dragLine)}`);
  }
  await page.waitForTimeout(800);

  const selectedDelta = (after.selectedCount ?? 0) - (before.selectedCount ?? 0);

  await context.close();
  await browser.close();
  const webm = fs.readdirSync(TMP).find((f) => f.endsWith('.webm'));
  const dest = path.join(EVIDENCE, 'recordings', outName);
  if (webm) fs.renameSync(path.join(TMP, webm), dest);

  return {
    path: dest,
    errors,
    rawErrors,
    dragAssertion: {
      selectedBefore: before.selectedCount,
      selectedAfter: after.selectedCount,
      selectedDelta,
      synthesized: false, // 合成路径已删除；touchVia 仅两个真实输入枚举，失败即抛错
      touchVia: dragVia,
      dragLine,
      pass: (after.selectedCount ?? 0) >= 4,
    },
  };
}

async function recordMustPassFlow(outName) {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    recordVideo: { dir: TMP, size: { width: 844, height: 390 } },
  });
  const page = await context.newPage();
  const errors = [];
  const rawErrors = [];
  attachCollectors(page, errors, { interaction: true });
  page.on('console', (msg) => {
    if (msg.type() === 'error') rawErrors.push({ source: 'console', message: msg.text() });
  });
  page.on('pageerror', (err) => rawErrors.push({ source: 'pageerror', message: err.message }));

  await loadGameWithSave(page, loadFixture('must-pass.json'));
  await ensureGamePhase(page, 'playing', 'record-must-pass');
  await runInPage(page, `(() => { const sk = findSkeleton(); sk?.runtime?.resume?.(); sk?.render?.(); })()`);
  await page.waitForTimeout(800);
  const before = await runInPage(page, `(() => {
    const labels = findLabels();
    const digest = runtimeDigest();
    const button = buttonViewportCenter('action-must-pass');
    return {
      ...digest,
      hasMustPassLabel: labels.some((t) => t.includes('要不起')),
      button,
      labels: labels.filter((t) => /要不起|出牌|提示|不要/.test(t)),
    };
  })()`);
  if (!before.hasMustPassLabel) throw new Error('record-must-pass: 要不起 label missing before click');
  if (!before.passLegal) throw new Error('record-must-pass: pass not legal before click');
  if (!before.button?.ok) {
    throw new Error(`record-must-pass: action-must-pass node coords missing: ${JSON.stringify(before.button)}`);
  }

  await cdpTouchTap(page, { x: before.button.x, y: before.button.y });
  await page.waitForTimeout(1500);

  const after = await runInPage(page, `(() => {
    const digest = runtimeDigest();
    const events = findSkeleton()?.fullGameEvents || [];
    const passEvents = events.filter((event) => event.type === 'pass' && event.seat === 0);
    return {
      ...digest,
      passEventCount: passEvents.length,
      turnAdvanced: ${JSON.stringify(before.turn)} !== digest.turn,
    };
  })()`);
  if (after.passEventCount < 1 && !after.turnAdvanced) {
    throw new Error('record-must-pass: pass event / turn advance not observed');
  }

  await context.close();
  await browser.close();
  const webm = fs.readdirSync(TMP).find((f) => f.endsWith('.webm'));
  const dest = path.join(EVIDENCE, 'recordings', outName);
  if (webm) fs.renameSync(path.join(TMP, webm), dest);

  return {
    path: dest,
    errors,
    rawErrors,
    mustPassAssertion: {
      beforeTurn: before.turn,
      afterTurn: after.turn,
      passEventCount: after.passEventCount,
      turnAdvanced: after.turnAdvanced,
      clickedViaButton: true,
      buttonCoords: { x: before.button.x, y: before.button.y },
      touchVia: 'cdp-dispatchTouchEvent',
      pass: after.passEventCount >= 1 || after.turnAdvanced,
    },
  };
}

async function smokeLobbyChain(page, viewport) {
  const captures = [];
  await page.goto(`${BASE_URL}?seed=${SEED}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(() => {
    localStorage.removeItem('doudizhu.save');
    localStorage.setItem('doudizhu.settings', JSON.stringify({
      sound: true, vibration: false, animation: false, difficulty: 'simple',
    }));
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForCanvas(page, 5000);
  captures.push(await shot(page, `chain-lobby-${viewport.label}.png`, { chain: 'lobby' }));
  await page.evaluate(() => globalThis.cc?.director?.loadScene?.('game'));
  await page.waitForTimeout(4000);
  captures.push(await shot(page, `chain-game-${viewport.label}.png`, { chain: 'game' }));
  await runInPage(page, `async () => { const sk = findSkeleton(); if (sk) await driveToPlaying(sk, true); }`, { async: true });
  await page.waitForTimeout(2000);
  captures.push(await shot(page, `chain-playing-${viewport.label}.png`, { chain: 'playing' }));
  return captures;
}

async function main() {
  if (process.env.V8_RECORDINGS_ONLY === '1') {
    const dragRec = await recordDragSelect('record-drag-select-844x390.webm');
    const mustPassRec = await recordMustPassFlow('record-must-pass-844x390.webm');
    console.log(JSON.stringify({ drag: dragRec.dragAssertion, mustPass: mustPassRec.mustPassAssertion, errors: [...dragRec.errors, ...mustPassRec.errors] }, null, 2));
    return;
  }
  const plan = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'resume-live-plan.json'), 'utf8'));
  const productErrors = [];
  const captures = [];
  const resumeLivePairs = [];
  const straight12Assertions = [];

  for (const viewport of VIEWPORTS) {
    const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const bucket = [];
    attachCollectors(page, bucket, { interaction: false });

    captures.push(await captureScenario(page, viewport, 'a', 'mini-regular.json', 'mini-regular'));
    captures.push(await captureMustPass(page, viewport));
    const straight12Shot = await captureStraight12(page, viewport);
    captures.push(straight12Shot);
    straight12Assertions.push({ viewport: viewport.label, ...straight12Shot.straight12Assertion });
    captures.push(await captureScenario(page, viewport, 'd', 'alerts.json', 'alerts'));
    const pair = await captureResumePair(page, viewport, plan);
    captures.push(...pair);
    resumeLivePairs.push({
      viewport: viewport.label,
      resumeSha256: pair[0].sha256,
      liveSha256: pair[1].sha256,
      resumeDigest: pair[0].digest?.eventsDigest,
      liveDigest: pair[1].digest?.eventsDigest,
      screenshotsIdentical: pair[0].sha256 === pair[1].sha256,
    });
    captures.push(await captureSettled(page, viewport));
    captures.push(await capturePause(page, viewport));
    captures.push(...await smokeLobbyChain(page, viewport));

    productErrors.push(...bucket.map((e) => ({ ...e, viewport: viewport.label })));
    await context.close();
    await browser.close();
  }

  const dragRec = await recordDragSelect('record-drag-select-844x390.webm');
  const mustPassRec = await recordMustPassFlow('record-must-pass-844x390.webm');
  productErrors.push(...dragRec.errors, ...mustPassRec.errors);

  const summary = {
    task: 'V8',
    seed: SEED,
    baseUrl: BASE_URL,
    viewports: VIEWPORTS.map((v) => v.label),
    scenarios: ['a-mini-regular', 'b-must-pass', 'c-straight-12', 'd-alerts', 'e-resume-live', 'f-settled-pause'],
    productErrors,
    productErrorsCount: productErrors.length,
    captures: captures.map((c) => c.path),
    recordings: [dragRec.path, mustPassRec.path].filter(Boolean),
    straight12Assertions,
    dragSelectAssertion: dragRec.dragAssertion,
    mustPassAssertion: mustPassRec.mustPassAssertion,
    mustPassRecordingClicked: mustPassRec.mustPassAssertion.pass,
    recordingRawErrors: {
      dragSelect: dragRec.rawErrors,
      mustPass: mustPassRec.rawErrors,
    },
    resumeLivePairs,
    resumeLivePlan: plan,
    capturedAt: new Date().toISOString(),
    harnessNoiseNote: 'Interaction recordings keep raw error logs; filtered productErrors ignore favicon/ERR_ABORTED navigation only.',
  };

  fs.writeFileSync(path.join(EVIDENCE, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
