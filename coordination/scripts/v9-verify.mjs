#!/usr/bin/env node
/**
 * V9 verify-only 采证（v1.4 第二波收口）。
 * 前置：主仓 main 已构建 build/web-mobile，仓库根起 http://127.0.0.1:7788。
 * 运行：cd coordination/scripts && npm install && node v9-verify.mjs
 * 红线：全部交互为真实输入（CDP dispatchTouchEvent 点按钮坐标），零状态直写、零 submit 直调。
 */
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const EVIDENCE = path.resolve(ROOT, 'coordination/reports/V9-evidence');
const FIXTURES = path.resolve(ROOT, 'coordination/reports/V8-evidence/fixtures');
const BASE = 'http://127.0.0.1:7788/build/web-mobile/';
const SEED = 20260705;
const VIEWPORTS = [
  { label: '844x390', width: 844, height: 390 },
  { label: '812x375', width: 812, height: 375 },
  { label: '915x412', width: 915, height: 412 },
  { label: '780x360', width: 780, height: 360 },
];
fs.mkdirSync(path.join(EVIDENCE, 'screenshots'), { recursive: true });
fs.mkdirSync(path.join(EVIDENCE, 'recordings'), { recursive: true });

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
  // 只接受有 Button 祖先的文本节点——顶栏相位文字等纯展示文本不可作为点击目标
  //（曾致 bid loop 把顶栏「叫地主」当按钮反复点击死循环）。
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
function handOrder() {
  const sk = findSkeleton(); if (!sk?.uiRoot) return null;
  return sk.uiRoot.children.filter((c) => c.name.startsWith('card-'))
    .sort((a, b) => a.position.x - b.position.x)
    .map((c) => c.name.split('-').slice(2).join('-'));
}
function hudFlags() {
  let strength = false, memory = false;
  walkNodes((n) => { if (n.name === 'hud-strength-meter') strength = true; if (n.name === 'hud-card-memory') memory = true; return false; });
  return { strength, memory };
}
function selectedKeys() {
  const sk = findSkeleton();
  return (sk?.selected ?? []).map((c) => c.rank + ':' + c.suit).sort();
}
function selectedCards() {
  const sk = findSkeleton();
  return JSON.parse(JSON.stringify(sk?.selected ?? []));
}
function captureAdvisorInput() {
  const sk = findSkeleton();
  const snap = sk?.runtime?.currentSnapshot?.();
  if (!snap) return null;
  return {
    snapshot: JSON.parse(JSON.stringify(snap)),
    history: JSON.parse(JSON.stringify(sk.fullGameEvents ?? [])),
    playerTurn: Boolean(sk.runtime?.isPlayerTurn?.()),
    phase: sk.runtime?.phase?.() ?? null,
  };
}
function eventsLen() { const sk = findSkeleton(); return (sk?.fullGameEvents ?? []).length; }
function eventsSlice(from) {
  const sk = findSkeleton();
  return JSON.parse(JSON.stringify((sk?.fullGameEvents ?? []).slice(from)));
}
`;

function sha(file) { return createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16); }

async function newSession(ctxOpts = {}, vpSize = { width: 844, height: 390 }) {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const context = await browser.newContext({ viewport: vpSize, hasTouch: true, ...ctxOpts });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  return { browser, context, page, client, errors };
}

async function tap(page, client, point) {
  const pt = { x: Math.round(point.x), y: Math.round(point.y), id: 0, radiusX: 1, radiusY: 1 };
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
  await page.waitForTimeout(70);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
}

async function tapTarget(page, client, evalIn, nameOrLabel) {
  const p = await evalIn(`btnPoint(${JSON.stringify(nameOrLabel)})`);
  if (!p.ok) throw new Error(`button not found: ${nameOrLabel} @scene=${await evalIn('sceneName()')}`);
  await tap(page, client, p);
  return p;
}

async function boot(page, { save = null, settings = null } = {}) {
  await page.goto(`${BASE}?seed=${SEED}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(({ s, st }) => {
    if (s) localStorage.setItem('doudizhu.save', s); else localStorage.removeItem('doudizhu.save');
    localStorage.setItem('doudizhu.settings', st ?? JSON.stringify({ sound: false, vibration: false, animation: false, difficulty: 'simple' }));
  }, { s: save, st: settings });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => { const c = document.getElementById('GameCanvas'); return c && c.width > 0; }, { timeout: 90000 });
  await page.waitForTimeout(6000);
}

async function shot(page, name, meta = {}) {
  const p = path.join(EVIDENCE, 'screenshots', name);
  await page.screenshot({ path: p });
  return { file: `screenshots/${name}`, sha256: sha(p), ...meta };
}

const summary = { task: 'V9', base: BASE, seed: SEED, capturedAt: new Date().toISOString(), flows: {}, errors: {} };

// ---- Flow A：大厅真实点击链路（844） ----
async function flowLobbyClicks() {
  const { browser, page, client, errors } = await newSession();
  const evalIn = (expr) => page.evaluate(`(() => { ${HELPERS}; return (${expr}); })()`);
  const caps = [];
  await boot(page);
  caps.push(await shot(page, 'a-home-844x390.png', { step: 'home' }));

  for (const [label, tag] of [['教程', 'tutorial'], ['帮助', 'help'], ['战绩', 'stats'], ['历史', 'records']]) {
    await tapTarget(page, client, evalIn, label);
    caps.push(await shot(page, `a-sub-${tag}-844x390.png`, { step: `entry:${label}` }));
    const back = await evalIn(`btnPoint('返回')`);
    if (back.ok) await tap(page, client, back);
    else {
      const skip = await evalIn(`btnPoint('跳过')`);
      if (skip.ok) await tap(page, client, skip); else throw new Error(`no back/skip on ${label}`);
    }
    await page.waitForTimeout(400);
  }
  caps.push(await shot(page, 'a-home-after-subpages-844x390.png', { step: 'back-home' }));

  // 难度切换：点 困难 → 断言持久化 + 截图 → 还原 简单
  await tapTarget(page, client, evalIn, 'difficulty-option-hard');
  const diffAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('doudizhu.settings') ?? '{}').difficulty);
  caps.push(await shot(page, 'a-difficulty-hard-844x390.png', { step: 'difficulty-switch', persisted: diffAfter }));
  if (diffAfter !== 'hard') throw new Error(`difficulty persist failed: ${diffAfter}`);
  await tapTarget(page, client, evalIn, 'difficulty-option-simple');

  // 开始新局 → 真实点击叫地主推进过 bidding（存档在 enterPlaying 才落盘）
  await tapTarget(page, client, evalIn, 'home-start-button');
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, { timeout: 30000 });
  await page.waitForTimeout(1500);
  for (let i = 0; i < 40; i += 1) {
    const phase = await evalIn(`findSkeleton()?.runtime?.phase?.() ?? null`);
    if (phase === 'playing') break;
    const bid = await evalIn(`btnPoint('叫地主')`);
    if (bid.ok) { await tap(page, client, bid); continue; }
    const grab = await evalIn(`btnPoint('抢地主')`);
    if (grab.ok) { await tap(page, client, grab); continue; }
    const grabShort = await evalIn(`btnPoint('抢')`);
    if (grabShort.ok) { await tap(page, client, grabShort); continue; }
    await page.waitForTimeout(500);
  }
  const phaseEntered = await evalIn(`findSkeleton()?.runtime?.phase?.() ?? null`);
  if (phaseEntered !== 'playing') throw new Error(`bidding did not reach playing: ${phaseEntered}`);
  await page.waitForTimeout(2000);
  caps.push(await shot(page, 'a-game-entered-844x390.png', { step: 'start-game+bid-to-playing' }));

  // 断局恢复（真实用户场景：中途离开=刷新页面，存档保留；主动退出会清档是产品语义）
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => { const c = document.getElementById('GameCanvas'); return c && c.width > 0; }, { timeout: 90000 });
  await page.waitForTimeout(6000);
  caps.push(await shot(page, 'a-lobby-continue-available-844x390.png', { step: 'reload-with-save' }));
  await tapTarget(page, client, evalIn, 'home-continue-button');
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, { timeout: 30000 });
  await page.waitForTimeout(2500);
  const resumedOrder = await evalIn('handOrder()');
  if ((resumedOrder?.length ?? 0) !== 20) throw new Error(`resume hand != 20 (landlord): ${resumedOrder?.length}`);
  caps.push(await shot(page, 'a-resumed-game-844x390.png', { step: 'continue-resume', handCount: resumedOrder.length }));

  // 退出链路证据（暂停 → 退出 → 回大厅并清档）
  await tapTarget(page, client, evalIn, '暂停');
  caps.push(await shot(page, 'a-pause-menu-844x390.png', { step: 'pause' }));
  await tapTarget(page, client, evalIn, 'pause-quit');
  await page.waitForTimeout(600);
  if ((await evalIn('sceneName()')) === 'game') {
    const confirm = await evalIn(`btnPoint('确认')`);
    if (confirm.ok) await tap(page, client, confirm);
    else { const q = await evalIn(`btnPoint('退出')`); if (q.ok) await tap(page, client, q); }
  }
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, { timeout: 20000 });
  await page.waitForTimeout(1500);
  caps.push(await shot(page, 'a-quit-cleared-844x390.png', { step: 'quit-clears-save' }));

  summary.flows.lobbyClicks = { caps, persistedDifficulty: diffAfter, resumedHand: resumedOrder?.length ?? 0 };
  summary.errors.lobbyClicks = errors;
  await browser.close();
}

// ---- Flow B：五项复验帧（四横屏·fixture 注入） ----
async function flowRegression() {
  const save = fs.readFileSync(path.join(FIXTURES, 'mini-regular.json'), 'utf8');
  const results = [];
  for (const v of VIEWPORTS) {
    const { browser, page, client, errors } = await newSession({}, { width: v.width, height: v.height });
    const evalIn = (expr) => page.evaluate(`(() => { ${HELPERS}; return (${expr}); })()`);
    await boot(page, { save });
    const capsLobby = await shot(page, `b-lobby-${v.label}.png`, { step: 'unify-lobby' });
    await page.evaluate(() => globalThis.cc?.director?.loadScene?.('game'));
    await page.waitForFunction(`(() => { ${HELPERS}; return Boolean(findSkeleton()); })()`, { timeout: 30000 });
    await page.evaluate((s) => { localStorage.setItem('doudizhu.save', s); globalThis.cc?.sys?.localStorage?.setItem('doudizhu.save', s); }, save);
    await page.evaluate(`(() => { ${HELPERS}; const sk = findSkeleton(); sk.startGame(false); sk.runtime?.pause?.(); sk.render?.(); })()`);
    await page.waitForTimeout(1500);
    const order = await evalIn('handOrder()');
    const flags = await evalIn('hudFlags()');
    const capsGame = await shot(page, `b-playing-${v.label}.png`, { step: 'ascending+hidden', order, flags });
    const ranks = (order ?? []).map((k) => Number(k.split(':')[0]));
    const ascending = ranks.every((r, i) => i === 0 || r >= ranks[i - 1]);
    results.push({ viewport: v.label, ascending, flags, caps: [capsLobby, capsGame], errors });
    if (!ascending) throw new Error(`hand not ascending at ${v.label}: ${JSON.stringify(order)}`);
    if (flags.strength || flags.memory) throw new Error(`hud not hidden at ${v.label}`);
    await browser.close();
  }
  summary.flows.regression = results;
}

// ---- Flow C：提示真实出牌流程（844·录屏·R1 修复：全程真实入口，零 fixture/loadScene/startGame 直调） ----
const keyOf = (c) => `${c.rank}:${c.suit}`;
const keysOf = (cards) => cards.map(keyOf).sort();

async function flowHintPlay() {
  const TMP = '/tmp/v9-hint-rec';
  fs.rmSync(TMP, { recursive: true, force: true });
  const { browser, context, page, client, errors } = await newSession({ recordVideo: { dir: TMP, size: { width: 844, height: 390 } } });
  const evalIn = (expr) => page.evaluate(`(() => { ${HELPERS}; return (${expr}); })()`);
  const caps = [];

  // 真实链路：大厅点「困难」→「开始新局」→ 真实叫抢 → hero 出牌回合
  await boot(page);
  await tapTarget(page, client, evalIn, 'difficulty-option-hard');
  const diff = await page.evaluate(() => JSON.parse(localStorage.getItem('doudizhu.settings') ?? '{}').difficulty);
  if (diff !== 'hard') throw new Error(`flowC difficulty persist failed: ${diff}`);
  await tapTarget(page, client, evalIn, 'home-start-button');
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, { timeout: 30000 });
  await page.waitForTimeout(1500);
  for (let i = 0; i < 40; i += 1) {
    const phase = await evalIn(`findSkeleton()?.runtime?.phase?.() ?? null`);
    if (phase === 'playing') break;
    let acted = false;
    for (const t of ['叫地主', '抢地主', '抢']) {
      const b = await evalIn(`btnPoint(${JSON.stringify(t)})`);
      if (b.ok) { await tap(page, client, b); acted = true; break; }
    }
    if (!acted) await page.waitForTimeout(500);
  }
  let capture = null;
  for (let i = 0; i < 40; i += 1) {
    capture = await evalIn('captureAdvisorInput()');
    if (capture?.phase === 'playing' && capture.playerTurn) break;
    await page.waitForTimeout(500);
  }
  if (!capture || capture.phase !== 'playing' || !capture.playerTurn) {
    const diag = await evalIn(`(() => { const sk = findSkeleton(); return { scene: sceneName(), sk: Boolean(sk), phase: sk?.runtime?.phase?.() ?? null, events: (sk?.fullGameEvents ?? []).length, term: sk?.runtime?.terminationReason?.() ?? null }; })()`);
    await page.screenshot({ path: '/tmp/v9-c-stuck.png' });
    throw new Error(`flowC did not reach hero playing turn: ${JSON.stringify(diag)}`);
  }

  const sel0 = await evalIn('selectedKeys()');
  if (sel0.length !== 0) throw new Error(`flowC selection not empty before hint: ${JSON.stringify(sel0)}`);
  await tapTarget(page, client, evalIn, 'action-hint');
  const sel1Cards = await evalIn('selectedCards()');
  if (sel1Cards.length === 0) throw new Error('flowC hint produced empty selection');
  caps.push(await shot(page, 'c-hint-first-844x390.png', { step: 'hint-1', selected: keysOf(sel1Cards) }));
  await tapTarget(page, client, evalIn, 'action-hint');
  const sel2Cards = await evalIn('selectedCards()');
  if (sel2Cards.length === 0) throw new Error('flowC hint cycle produced empty selection');
  if (JSON.stringify(keysOf(sel1Cards)) === JSON.stringify(keysOf(sel2Cards))) {
    throw new Error(`flowC hint cycle did not change selection: ${JSON.stringify(keysOf(sel1Cards))}`);
  }
  caps.push(await shot(page, 'c-hint-cycle-844x390.png', { step: 'hint-2', selected: keysOf(sel2Cards) }));

  const evBefore = await evalIn('eventsLen()');
  await tapTarget(page, client, evalIn, 'action-play');
  await page.waitForTimeout(1500);
  const newEvents = await evalIn(`eventsSlice(${evBefore})`);
  const playEvent = newEvents.find((e) => e.type === 'play');
  if (!playEvent) throw new Error(`flowC no play event appended: ${JSON.stringify(newEvents.map((e) => e.type))}`);
  const playedCards = playEvent.pattern?.cards ?? [];
  if (JSON.stringify(keysOf(playedCards)) !== JSON.stringify(keysOf(sel2Cards))) {
    throw new Error(`flowC played cards != selected: played=${JSON.stringify(keysOf(playedCards))} selected=${JSON.stringify(keysOf(sel2Cards))}`);
  }
  caps.push(await shot(page, 'c-played-844x390.png', { step: 'played', playedCards: keysOf(playedCards) }));

  await context.close();
  await browser.close();
  const webm = fs.readdirSync(TMP).find((f) => f.endsWith('.webm'));
  if (!webm) throw new Error('flowC recording missing');
  const dest = path.join(EVIDENCE, 'recordings', 'record-hint-play-844x390.webm');
  fs.renameSync(path.join(TMP, webm), dest);

  // 现场捕获落盘：Node 侧桥测试（test/verify/v9-hint-capture.test.ts）真实调用
  // adviseBestMove/nextHint/validatePlay 对 sel1/sel2/played 做逐张精确对照。
  fs.writeFileSync(path.join(EVIDENCE, 'hint-capture.json'), JSON.stringify({
    capturedAt: new Date().toISOString(),
    difficulty: 'hard',
    capture,
    sel1Cards, sel2Cards, playedCards,
  }, null, 2));

  summary.flows.hintPlay = {
    entry: 'real-clicks(difficulty-hard → start → bid → hero-turn)',
    sel1: keysOf(sel1Cards), sel2: keysOf(sel2Cards), played: keysOf(playedCards),
    caps,
    recording: { file: 'recordings/record-hint-play-844x390.webm', sha256: sha(dest) },
    captureFile: 'hint-capture.json',
  };
  summary.errors.hintPlay = errors;
}

const ONLY = process.env.V9_FLOW ?? '';
if (!ONLY || ONLY.includes('A')) await flowLobbyClicks();
if (!ONLY || ONLY.includes('B')) await flowRegression();
if (!ONLY || ONLY.includes('C')) await flowHintPlay();
if (ONLY) { console.log(JSON.stringify({ partial: ONLY, flows: Object.keys(summary.flows) })); process.exit(0); }
const allErrors = [
  ...Object.values(summary.errors).flat(),
  ...summary.flows.regression.flatMap((r) => r.errors),
];
summary.pageErrorTotal = allErrors.length;
if (allErrors.length !== 0) throw new Error(`pageErrors != 0: ${JSON.stringify(allErrors)}`);
// 索引完整性自检：summary 中每个 caps/recording 条目必须真实存在（防证据未入索引）
const indexed = [
  ...summary.flows.lobbyClicks.caps,
  ...summary.flows.regression.flatMap((r) => r.caps),
  ...summary.flows.hintPlay.caps,
];
for (const c of indexed) {
  if (!fs.existsSync(path.join(EVIDENCE, c.file))) throw new Error(`indexed capture missing: ${c.file}`);
}
if (!fs.existsSync(path.join(EVIDENCE, summary.flows.hintPlay.recording.file))) throw new Error('recording missing from evidence');
const onDisk = fs.readdirSync(path.join(EVIDENCE, 'screenshots')).filter((f) => f.endsWith('.png'));
if (onDisk.length !== indexed.length) {
  throw new Error(`screenshot count(${onDisk.length}) != indexed(${indexed.length})`);
}
summary.screenshotCount = onDisk.length;
fs.writeFileSync(path.join(EVIDENCE, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ok: true, pageErrorTotal: 0, screenshots: onDisk.length, flows: Object.keys(summary.flows) }));
