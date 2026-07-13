#!/usr/bin/env node
/**
 * W3-B fx 采证:涟漪/炸弹爆点/王炸拖尾星爆/胜局彩带星光/跨局清理/动效关对照。
 * 前置:W3-B worktree 已构建,worktree 根起 http://127.0.0.1:7789。
 * 运行:cd coordination/scripts && node w3b-fx-probe.mjs
 * 红线:全程真实输入(CDP 触摸真实按钮/真实手牌节点);状态只读(节点普查/回合判断),零直写零直调。
 * hero 策略与 test/verify/w3b-fx-seed-hunt.test.ts 的 heroProbePolicy 同构:
 *   领出=有炸打炸/有王炸打王炸/否则最小单;跟单=最小能大过的单;否则过。
 * 种子:14=炸弹+胜局(狩猎产物,炸弹爆点与彩带一趟采齐);15=王炸。
 */
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const EVIDENCE = path.resolve(ROOT, 'coordination/reports/W-JUICE-W3B-evidence');
const BASE = 'http://127.0.0.1:7789/build/web-mobile/';
fs.mkdirSync(EVIDENCE, { recursive: true });

const HELPERS = `
function walkNodes(cb) {
  const cc = globalThis.cc; const scene = cc?.director?.getScene?.(); if (!scene) return;
  const stack = [scene];
  while (stack.length) { const n = stack.pop(); if (cb(n)) return n; for (const c of n.children || []) stack.push(c); }
  return null;
}
function findSkeleton() {
  let found = null;
  walkNodes((n) => { for (const c of n._components || []) if (c && typeof c.render === 'function' && c.runtime !== undefined && typeof c.startGame === 'function') { found = c; return true; } return false; });
  return found;
}
function sceneName() { return globalThis.cc?.director?.getScene?.()?.name ?? null; }
function nodeByName(name) { let f = null; walkNodes((n) => { if (n.name === name && n.activeInHierarchy) { f = n; return true; } return false; }); return f; }
function nodeByLabel(text) {
  const cc = globalThis.cc; let f = null;
  walkNodes((n) => {
    if (!n.activeInHierarchy) return false;
    for (const c of n._components || []) {
      if (c && typeof c.string === 'string' && c.string.trim() === text) {
        let cur = n;
        for (let i = 0; i < 4 && cur; i += 1) {
          if (cur.getComponent(cc.Button)) { f = cur; return true; }
          cur = cur.parent;
        }
        return false;
      }
    }
    return false;
  });
  return f;
}
function vp(node) {
  const cc = globalThis.cc;
  const canvasComp = cc.director.getScene().getComponentInChildren(cc.Canvas);
  const cam = canvasComp.cameraComponent;
  const sp = cam.worldToScreen(node.worldPosition);
  const rect = document.getElementById('GameCanvas').getBoundingClientRect();
  const cs = cc.view.getCanvasSize();
  return { x: rect.left + sp.x * (rect.width / cs.width), y: rect.top + rect.height - sp.y * (rect.height / cs.height) };
}
function btnPoint(nameOrLabel) {
  const node = nodeByName(nameOrLabel) ?? nodeByLabel(nameOrLabel);
  if (!node) return { ok: false, target: nameOrLabel };
  const p = vp(node);
  return { ok: true, target: nameOrLabel, x: p.x, y: p.y };
}
function handCards() {
  const sk = findSkeleton(); if (!sk?.uiRoot) return [];
  return sk.uiRoot.children
    .filter((c) => c.name.startsWith('card-') && c.activeInHierarchy)
    .sort((a, b) => a.position.x - b.position.x)
    .map((c) => {
      const key = c.name.split('-').slice(2).join('-');
      const p = vp(c);
      return { name: c.name, rank: Number(key.split(':')[0]), x: p.x, y: p.y };
    });
}
function turnInfo() {
  const sk = findSkeleton();
  const snap = sk?.runtime?.currentSnapshot?.();
  return {
    phase: sk?.runtime?.phase?.() ?? null,
    myTurn: Boolean(sk?.runtime?.isPlayerTurn?.()),
    top: snap?.top ? { seat: snap.top.seat, count: snap.top.pattern.cards.length, maxRank: Math.max(...snap.top.pattern.cards.map((c) => c.rank)) } : null,
    winner: snap?.winner ?? null,
    selected: (sk?.selected ?? []).length,
  };
}
function fxCensus() {
  const layer = nodeByName('fx-layer-runtime');
  return layer ? layer.children.filter((c) => c.isValid).map((c) => c.name) : [];
}
`;

const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
const summary = { task: 'W3B-fx', base: BASE, capturedAt: new Date().toISOString(), flows: {}, pageErrorsByFlow: {} };

function tally(names) {
  const out = {};
  for (const n of names) {
    const key = n.replace(/-\d+$/, '').replace(/-\d{10,}/, '');
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

async function newSession(animation) {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const evalIn = (expr) => page.evaluate(`(() => { ${HELPERS}; return (${expr}); })()`);
  const tap = async (point, settle = 420) => {
    const pt = { x: Math.round(point.x), y: Math.round(point.y), id: 0, radiusX: 1, radiusY: 1 };
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
    await page.waitForTimeout(60);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(settle);
  };
  const tapTarget = async (nameOrLabel, settle = 420) => {
    const p = await evalIn(`btnPoint(${JSON.stringify(nameOrLabel)})`);
    if (!p.ok) throw new Error(`button not found: ${nameOrLabel} @scene=${await evalIn('sceneName()')}`);
    await tap(p, settle);
    return p;
  };
  return { browser, page, client, errors, evalIn, tap, tapTarget, animation };
}

async function boot(sess, seed, animation) {
  const { page } = sess;
  await page.goto(`${BASE}?seed=${seed}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate((anim) => {
    localStorage.removeItem('doudizhu.save');
    localStorage.setItem('doudizhu.settings', JSON.stringify({ sound: false, vibration: false, animation: anim, difficulty: 'simple' }));
  }, animation);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => { const c = document.getElementById('GameCanvas'); return c && c.width > 0; }, undefined, { timeout: 90000 });
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, undefined, { timeout: 90000, polling: 300 });
  await page.waitForTimeout(1600);
}

async function bidToPlaying(sess) {
  const { page, evalIn, tap } = sess;
  for (let i = 0; i < 40; i += 1) {
    const phase = await evalIn(`findSkeleton()?.runtime?.phase?.() ?? null`);
    if (phase === 'playing') return;
    let acted = false;
    for (const t of ['叫地主', '抢地主', '抢']) {
      const b = await evalIn(`btnPoint(${JSON.stringify(t)})`);
      if (b.ok) { await tap(b); acted = true; break; }
    }
    if (!acted) await page.waitForTimeout(420);
  }
  throw new Error('bidding did not reach playing');
}

/** 快速普查采样:窗口内轮询 fx 层子名,聚合每前缀最大同时数与总见名。 */
async function censusWindow(sess, ms) {
  const { evalIn } = sess;
  const seen = new Set();
  const peak = {};
  const firstAt = {};
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const names = await evalIn('fxCensus()');
      const t = tally(names);
      for (const [k, v] of Object.entries(t)) {
        peak[k] = Math.max(peak[k] ?? 0, v);
        if (!(k in firstAt)) firstAt[k] = Date.now();
      }
      names.forEach((n) => seen.add(n.replace(/\d{10,}/, 'T')));
    } catch { /* transitioning */ }
  }
  return { peak, firstAt, seenSample: [...seen].slice(0, 24) };
}

/** hero 策略一步(与狩猎同构);返回 acted 描述。 */
async function heroStep(sess) {
  const { evalIn, tap, tapTarget, page } = sess;
  const info = await evalIn('turnInfo()');
  if (!info.myTurn || info.phase !== 'playing') return { acted: false, info };
  const cards = await evalIn('handCards()');
  if (!cards.length) return { acted: false, info };
  const byRank = new Map();
  for (const c of cards) { const g = byRank.get(c.rank) ?? []; g.push(c); byRank.set(c.rank, g); }
  const bomb = [...byRank.values()].find((g) => g.length === 4);
  const jokers = [16, 17].every((r) => byRank.has(r)) ? [byRank.get(16)[0], byRank.get(17)[0]] : null;
  const leading = !info.top || info.top.seat === 0;

  const playCards = async (targets, kind) => {
    for (const c of targets) await tap({ x: c.x, y: c.y }, 240);
    const sel = await evalIn('turnInfo()');
    if (sel.selected !== targets.length) throw new Error(`selection mismatch: ${sel.selected}!=${targets.length} (${kind})`);
    await tapTarget('出牌', 200);
    return { acted: true, kind, count: targets.length };
  };

  if (leading) {
    if (bomb) return playCards(bomb, 'bomb');
    if (jokers) return playCards(jokers, 'rocket');
    return playCards([cards[0]], 'single');
  }
  if (info.top.count === 1) {
    const beat = cards.find((c) => c.rank > info.top.maxRank);
    if (beat) return playCards([beat], 'follow');
  }
  for (const label of ['要不起', '不要']) {
    const b = await evalIn(`btnPoint(${JSON.stringify(label)})`);
    if (b.ok) { await tap(b, 220); return { acted: true, kind: 'pass' }; }
  }
  await page.waitForTimeout(300);
  return { acted: false, info };
}

async function flowBombWin(seed) {
  const sess = await newSession(true);
  const { browser, page, evalIn, errors, tapTarget } = sess;
  const caps = [];
  const flow = { seed, captures: caps };
  await boot(sess, seed, true);
  await tapTarget('home-start-button', 800);
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, undefined, { timeout: 30000, polling: 250 });
  await page.waitForTimeout(1500);

  // 涟漪采证:第一次点「叫地主」时并行普查
  const ripplePromise = censusWindow(sess, 900);
  await bidToPlaying(sess);
  flow.rippleCensus = await ripplePromise;

  // 策略循环至炸弹时刻:炸弹步前起 screencast+普查
  let bombCaptured = false;
  for (let step = 0; step < 160; step += 1) {
    const info = await evalIn('turnInfo()');
    if (info.winner !== null || (await evalIn(`findSkeleton()?.runtime?.settlement?.() ? true : false`))) break;
    if (!info.myTurn) { await page.waitForTimeout(350); continue; }
    const cards = await evalIn('handCards()');
    const byRank = new Map();
    for (const c of cards) { const g = byRank.get(c.rank) ?? []; g.push(c); byRank.set(c.rank, g); }
    const hasBomb = [...byRank.values()].some((g) => g.length === 4);
    const leading = !info.top || info.top.seat === 0;
    if (hasBomb && leading && !bombCaptured) {
      const frames = [];
      sess.client.on('Page.screencastFrame', async (ev) => {
        frames.push({ t: Date.now(), data: ev.data });
        try { await sess.client.send('Page.screencastFrameAck', { sessionId: ev.sessionId }); } catch { /* stopped */ }
      });
      await sess.client.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
      const censusP = censusWindow(sess, 1400);
      const played = await heroStep(sess);
      flow.bombPlay = played;
      flow.bombCensus = await censusP;
      await page.waitForTimeout(300);
      await sess.client.send('Page.stopScreencast').catch(() => {});
      const anchor = flow.bombCensus.firstAt['fx-bomb-ring'] ?? (frames.length ? frames[frames.length - 1].t - 1200 : Date.now());
      [40, 170].forEach((off, i) => {
        let best = null; let bd = Infinity;
        for (const f of frames) { const d = Math.abs(f.t - (anchor + off)); if (d < bd) { best = f; bd = d; } }
        if (best) {
          const file = `bomb-burst-frame${i + 1}.png`;
          fs.writeFileSync(path.join(EVIDENCE, file), Buffer.from(best.data, 'base64'));
          caps.push({ file, sha256: sha(path.join(EVIDENCE, file)) });
        }
      });
      bombCaptured = true;
      continue;
    }
    await heroStep(sess);
  }
  if (!bombCaptured) throw new Error('bomb moment never reached');

  // 打到胜局结算:彩带+星光普查与双帧
  for (let step = 0; step < 200; step += 1) {
    const settled = await evalIn(`findSkeleton()?.runtime?.settlement?.() ? true : false`);
    if (settled) break;
    await heroStep(sess);
  }
  await page.waitForTimeout(900);
  const winCensus = await censusWindow(sess, 700);
  flow.winCensus = winCensus;
  const scores = await evalIn(`findSkeleton()?.runtime?.settlement?.()?.scores ?? null`);
  flow.settledScores = scores;
  if (!scores || scores[0] <= 0) throw new Error(`expected hero win, scores=${JSON.stringify(scores)}`);
  const f1 = path.join(EVIDENCE, 'win-confetti-frame1.png');
  await page.screenshot({ path: f1 });
  await page.waitForTimeout(650);
  const f2 = path.join(EVIDENCE, 'win-confetti-frame2.png');
  await page.screenshot({ path: f2 });
  caps.push({ file: 'win-confetti-frame1.png', sha256: sha(f1) }, { file: 'win-confetti-frame2.png', sha256: sha(f2) });
  flow.confettiFramesDiffer = sha(f1) !== sha(f2);

  // 跨局清理:再来一局 → fx 层应清空
  await tapTarget('再来一局', 900);
  await page.waitForTimeout(600);
  flow.fxAfterRestart = await evalIn('fxCensus()');
  const f3 = path.join(EVIDENCE, 'restart-fx-cleared.png');
  await page.screenshot({ path: f3 });
  caps.push({ file: 'restart-fx-cleared.png', sha256: sha(f3) });

  summary.flows.bombWin = flow;
  summary.pageErrorsByFlow.bombWin = errors;
  await browser.close();
}

async function flowRocket(seed) {
  const sess = await newSession(true);
  const { browser, page, evalIn, errors, tapTarget } = sess;
  const caps = [];
  const flow = { seed, captures: caps };
  await boot(sess, seed, true);
  await tapTarget('home-start-button', 800);
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, undefined, { timeout: 30000, polling: 250 });
  await page.waitForTimeout(1500);
  await bidToPlaying(sess);
  for (let i = 0; i < 30; i += 1) {
    if ((await evalIn('turnInfo()')).myTurn) break;
    await page.waitForTimeout(350);
  }
  const frames = [];
  sess.client.on('Page.screencastFrame', async (ev) => {
    frames.push({ t: Date.now(), data: ev.data });
    try { await sess.client.send('Page.screencastFrameAck', { sessionId: ev.sessionId }); } catch { /* stopped */ }
  });
  await sess.client.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  const censusP = censusWindow(sess, 1600);
  const played = await heroStep(sess);
  flow.rocketPlay = played;
  flow.rocketCensus = await censusP;
  await page.waitForTimeout(300);
  await sess.client.send('Page.stopScreencast').catch(() => {});
  const anchor = flow.rocketCensus.firstAt['fx-rocket-trail'] ?? (frames.length ? frames[frames.length - 1].t - 1500 : Date.now());
  [80, 360].forEach((off, i) => {
    let best = null; let bd = Infinity;
    for (const f of frames) { const d = Math.abs(f.t - (anchor + off)); if (d < bd) { best = f; bd = d; } }
    if (best) {
      const file = `rocket-burst-frame${i + 1}.png`;
      fs.writeFileSync(path.join(EVIDENCE, file), Buffer.from(best.data, 'base64'));
      caps.push({ file, sha256: sha(path.join(EVIDENCE, file)) });
    }
  });
  if (played.kind !== 'rocket') throw new Error(`expected rocket lead, got ${played.kind}`);
  summary.flows.rocket = flow;
  summary.pageErrorsByFlow.rocket = errors;
  await browser.close();
}

async function flowAnimationOff(seed) {
  const sess = await newSession(false);
  const { browser, page, evalIn, errors, tapTarget } = sess;
  const flow = { seed };
  await boot(sess, seed, false);
  await tapTarget('home-start-button', 800);
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, undefined, { timeout: 30000, polling: 250 });
  await page.waitForTimeout(1200);
  await bidToPlaying(sess);
  // 打到炸弹时刻并普查:动效关 → 不得出现任何 fx-bomb/涟漪节点
  let played = null;
  for (let step = 0; step < 60 && !played; step += 1) {
    const info = await evalIn('turnInfo()');
    if (!info.myTurn) { await page.waitForTimeout(300); continue; }
    const cards = await evalIn('handCards()');
    const byRank = new Map();
    for (const c of cards) { const g = byRank.get(c.rank) ?? []; g.push(c); byRank.set(c.rank, g); }
    const hasBomb = [...byRank.values()].some((g) => g.length === 4);
    const leading = !info.top || info.top.seat === 0;
    if (hasBomb && leading) {
      const censusP = censusWindow(sess, 900);
      played = await heroStep(sess);
      flow.offCensus = await censusP;
    } else {
      await heroStep(sess);
    }
  }
  if (!played) throw new Error('animation-off bomb moment never reached');
  const file = path.join(EVIDENCE, 'bomb-animation-off.png');
  await page.screenshot({ path: file });
  flow.capture = { file: 'bomb-animation-off.png', sha256: sha(file) };
  summary.flows.animationOff = flow;
  summary.pageErrorsByFlow.animationOff = errors;
  await browser.close();
}

async function main() {
  await flowBombWin(14);
  await flowRocket(15);
  await flowAnimationOff(14);

  const bombPeak = summary.flows.bombWin.bombCensus.peak;
  const rocketPeak = summary.flows.rocket.rocketCensus.peak;
  const winPeak = summary.flows.bombWin.winCensus.peak;
  const offPeak = summary.flows.animationOff.offCensus.peak;
  const errsTotal = Object.values(summary.pageErrorsByFlow).reduce((a, b) => a + b.length, 0);
  summary.verdict = {
    rippleSeen: (summary.flows.bombWin.rippleCensus.peak['fx-ripple'] ?? 0) >= 1,
    bombRing: (bombPeak['fx-bomb-ring'] ?? 0) >= 1,
    bombSparks6: (bombPeak['fx-bomb-spark'] ?? 0) === 6,
    rocketTrail: (rocketPeak['fx-rocket-trail'] ?? 0) >= 1,
    rocketStars4: (rocketPeak['fx-rocket-star'] ?? 0) === 4,
    confetti14: (winPeak['result-fx-confetti'] ?? 0) === 14,
    stars3: (winPeak['result-fx-star'] ?? 0) === 3,
    confettiFramesDiffer: summary.flows.bombWin.confettiFramesDiffer === true,
    restartCleared: (summary.flows.bombWin.fxAfterRestart ?? []).length === 0,
    animationOffZeroFx: Object.keys(offPeak).length === 0,
    pageErrorsTotal: errsTotal,
  };
  fs.writeFileSync(path.join(EVIDENCE, 'w3b-fx-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.verdict, null, 1));
  const v = summary.verdict;
  const pass = v.rippleSeen && v.bombRing && v.bombSparks6 && v.rocketTrail && v.rocketStars4
    && v.confetti14 && v.stars3 && v.confettiFramesDiffer && v.restartCleared && v.animationOffZeroFx
    && errsTotal === 0;
  console.log(pass ? 'PASS' : 'FAIL');
  if (!pass) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
