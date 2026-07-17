/**
 * W-AUDIT-AI 运行时提示探针(Codex R6 裁决 (b):静态门原理上无法闭合,须运行时证据)。
 * 真实链路:大厅 → 循环点难度切到「困难」→ 开始新局 → 真实叫抢 → hero 出牌回合 →
 * **CDP 真点击 action-hint** 三次 → 录下榜单会话轮换；另注入一个合法的
 * 「仅炸弹可压但不值得炸」运行时局面，真点击提示并捕获 passAdvice toast。
 * node 侧 test/verify/hint-runtime-capture.test.ts 用 pickHint 会话链复算并逐张对照。
 *
 * 前置:main 已冷构建 build/web-mobile;仓库根起 http://127.0.0.1:7788。
 * 用法:cd coordination/scripts && node w-audit-hint-probe.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const EVIDENCE = path.resolve(ROOT, 'coordination/reports/W-AUDIT-AI-evidence');
const SHOTS = path.join(EVIDENCE, 'shots');
const BASE = 'http://127.0.0.1:7788/build/web-mobile/';
const VIEWPORT = { width: 844, height: 390 };

fs.mkdirSync(SHOTS, { recursive: true });

const HELPERS = `
function walkNodes(cb) {
  const cc = globalThis.cc; const scene = cc?.director?.getScene?.(); if (!scene) return null;
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
function nodeByName(name) {
  let f = null;
  walkNodes((n) => { if (n.name === name && n.activeInHierarchy) { f = n; return true; } return false; });
  return f;
}
function vp(node) {
  const t = node._uiProps?.uiTransformComp;
  const w = t?.contentSize?.width ?? 0;
  const h = t?.contentSize?.height ?? 0;
  const wp = node.worldPosition;
  const canvas = globalThis.cc?.view?.getVisibleSize?.() ?? { width: 844, height: 390 };
  return { x: wp.x, y: canvas.height - wp.y, w, h };
}
function btnPoint(name) {
  const n = nodeByName(name);
  if (!n) return { ok: false };
  const r = vp(n);
  return { ok: true, x: Math.round(r.x), y: Math.round(r.y) };
}
function difficultyText() {
  const n = nodeByName('home-difficulty-toggle');
  if (!n) return null;
  let text = null;
  const stack = [n];
  while (stack.length) {
    const cur = stack.pop();
    const label = (cur._components || []).find((c) => c && typeof c.string === 'string');
    if (label?.string) { text = label.string; break; }
    for (const c of (cur.children ?? [])) stack.push(c);
  }
  return text;
}
function storedDifficulty() {
  try { return JSON.parse(localStorage.getItem('doudizhu.settings') ?? '{}').difficulty ?? null; } catch (e) { return null; }
}
function selectedCards() {
  const sk = findSkeleton();
  return JSON.parse(JSON.stringify(sk?.selected ?? []));
}
function captureAdvisorInput() {
  const sk = findSkeleton();
  const snapshot = sk?.runtime?.currentSnapshot?.() ?? null;
  return {
    phase: sk?.runtime?.phase?.() ?? null,
    playerTurn: Boolean(sk?.runtime?.isPlayerTurn?.()),
    snapshot: snapshot ? JSON.parse(JSON.stringify(snapshot)) : null,
    history: JSON.parse(JSON.stringify(sk?.fullGameEvents ?? [])),
  };
}
function latestToastText() {
  const items = findSkeleton()?.toasts?.items ?? [];
  return items.length > 0 ? items[items.length - 1].text ?? null : null;
}
function installPassAdviceFixture() {
  const sk = findSkeleton(); const rt = sk?.runtime;
  if (!sk || !rt) return false;
  const card = (rank, suit) => ({ rank, suit });
  const topCard = card(13, 'S');
  rt.currentPhase = 'playing';
  rt.state = {
    phase: 'playing', landlord: 0, turn: 0, passesInARow: 0, winner: null,
    bombsPlayed: 0, bottom: [card(6, 'H'), card(7, 'C'), card(8, 'D')],
    top: { seat: 1, pattern: { category: 0, mainRank: 13, length: 1, cards: [topCard] } },
    seats: [
      { index: 0, hand: [card(3, 'S'), card(3, 'H'), card(3, 'C'), card(3, 'D'), card(5, 'S')] },
      { index: 1, hand: [card(4, 'S'), card(6, 'S'), card(7, 'S'), card(8, 'S'), card(9, 'S')] },
      { index: 2, hand: [card(4, 'H'), card(6, 'D'), card(7, 'H'), card(8, 'C'), card(9, 'D')] },
    ],
  };
  rt.gameEvents = [];
  rt.currentSettlement = null;
  rt.currentTerminationReason = null;
  rt.currentTerminationDetail = null;
  rt.settledNotified = false;
  rt.paused = false;
  rt.pauseRequested = false;
  sk.fullGameEvents = [];
  sk.selected = [];
  sk.hintSession = null;
  sk.toasts = { items: [], nextId: 1 };
  sk.submitting = false;
  sk.statusText = '';
  sk.render();
  return true;
}
function eventsLen() { return (findSkeleton()?.fullGameEvents ?? []).length; }
function eventsSlice(from) { return JSON.parse(JSON.stringify((findSkeleton()?.fullGameEvents ?? []).slice(from))); }
`;

const keysOf = (cards) => cards.map((c) => `${c.rank}:${c.suit}`).sort();

async function tap(page, client, point) {
  const pt = { x: Math.round(point.x), y: Math.round(point.y), id: 0, radiusX: 1, radiusY: 1 };
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
  await page.waitForTimeout(70);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
}

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
const context = await browser.newContext({ viewport: VIEWPORT, hasTouch: true });
const page = await context.newPage();
const client = await context.newCDPSession(page);
await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

const evalIn = (expr) => page.evaluate(`(() => { ${HELPERS}; return (${expr}); })()`);
const tapNamed = async (name) => {
  const p = await evalIn(`btnPoint(${JSON.stringify(name)})`);
  if (!p.ok) throw new Error(`button not found: ${name} @scene=${await evalIn('sceneName()')}`);
  await tap(page, client, p);
};

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.evaluate(() => {
  localStorage.removeItem('doudizhu.save');
  localStorage.setItem('doudizhu.settings', JSON.stringify({ sound: false, vibration: false, animation: false, difficulty: 'simple' }));
});
await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => { const c = document.getElementById('GameCanvas'); return c && c.width > 0; }, null, { timeout: 90000 });
await page.waitForTimeout(6000);

// ① 难度循环切到 hard(v1.6 终审整改④:三行钮 → 单切换按钮,点击循环)
let difficulty = await evalIn('storedDifficulty()');
for (let i = 0; i < 4 && difficulty !== 'hard'; i += 1) {
  await tapNamed('home-difficulty-toggle');
  difficulty = await evalIn('storedDifficulty()');
}
if (difficulty !== 'hard') throw new Error(`difficulty toggle failed: ${difficulty} (label=${await evalIn('difficultyText()')})`);
await page.screenshot({ path: path.join(SHOTS, 'a-lobby-hard.png') });

// ② 开始新局 → 真实叫抢直到出牌阶段
await tapNamed('home-start-button');
await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, null, { timeout: 60000 });
await page.waitForTimeout(1500);
for (let i = 0; i < 60; i += 1) {
  const phase = await evalIn('findSkeleton()?.runtime?.phase?.() ?? null');
  if (phase === 'playing') break;
  let acted = false;
  for (const name of ['bid-call', 'bid-grab', 'bid-pass']) {
    const p = await evalIn(`btnPoint(${JSON.stringify(name)})`);
    if (p.ok) { await tap(page, client, p); acted = true; break; }
  }
  if (!acted) await page.waitForTimeout(500);
}

// ③ 等 hero 出牌回合,捕获推荐输入面(快照 + 完整历史)
let capture = null;
for (let i = 0; i < 60; i += 1) {
  capture = await evalIn('captureAdvisorInput()');
  if (capture?.phase === 'playing' && capture.playerTurn && capture.snapshot) break;
  await page.waitForTimeout(500);
}
if (!capture?.playerTurn || capture.phase !== 'playing') {
  await page.screenshot({ path: path.join(SHOTS, 'stuck.png') });
  throw new Error(`did not reach hero playing turn: ${JSON.stringify({ phase: capture?.phase, turn: capture?.playerTurn })}`);
}
const sel0 = await evalIn('selectedCards()');
if (sel0.length !== 0) throw new Error(`selection not empty before hint: ${JSON.stringify(keysOf(sel0))}`);

// ④ CDP 真点击 action-hint → 首点推荐
await tapNamed('action-hint');
const sel1Cards = await evalIn('selectedCards()');
if (sel1Cards.length === 0) throw new Error('hint produced empty selection');
await page.screenshot({ path: path.join(SHOTS, 'b-hint-first.png') });

// ⑤ 第二、三按 → 榜单会话内轮换
await tapNamed('action-hint');
const sel2Cards = await evalIn('selectedCards()');
if (sel2Cards.length === 0) throw new Error('hint cycle produced empty selection');
if (JSON.stringify(keysOf(sel1Cards)) === JSON.stringify(keysOf(sel2Cards))) {
  throw new Error(`hint cycle did not change selection: ${JSON.stringify(keysOf(sel1Cards))}`);
}
await page.screenshot({ path: path.join(SHOTS, 'c-hint-cycle.png') });

await tapNamed('action-hint');
const sel3Cards = await evalIn('selectedCards()');
if (sel3Cards.length === 0) throw new Error('third hint produced empty selection');
await page.screenshot({ path: path.join(SHOTS, 'd-hint-third.png') });

// ⑥ 出牌 === 第三按所选
const evBefore = await evalIn('eventsLen()');
await tapNamed('action-play');
await page.waitForTimeout(1500);
const newEvents = await evalIn(`eventsSlice(${evBefore})`);
const playEvent = newEvents.find((e) => e.type === 'play');
if (!playEvent) throw new Error(`no play event appended: ${JSON.stringify(newEvents.map((e) => e.type))}`);
const playedCards = playEvent.pattern?.cards ?? [];
if (JSON.stringify(keysOf(playedCards)) !== JSON.stringify(keysOf(sel3Cards))) {
  throw new Error(`played != selected: ${JSON.stringify(keysOf(playedCards))} vs ${JSON.stringify(keysOf(sel3Cards))}`);
}
await page.screenshot({ path: path.join(SHOTS, 'e-played.png') });

// ⑦ 构造合法的「仅炸弹可压但不值得炸」局面，真点击提示捕获 passAdvice toast。
const installed = await evalIn('installPassAdviceFixture()');
if (!installed) throw new Error('failed to install passAdvice runtime fixture');
await page.waitForTimeout(300);
const passCapture = await evalIn('captureAdvisorInput()');
if (!passCapture?.playerTurn || passCapture.phase !== 'playing' || !passCapture.snapshot) {
  throw new Error(`invalid passAdvice capture: ${JSON.stringify(passCapture)}`);
}
await tapNamed('action-hint');
const passSelected = await evalIn('selectedCards()');
if (passSelected.length !== 0) throw new Error(`passAdvice selected cards: ${JSON.stringify(keysOf(passSelected))}`);
const toastText = await evalIn('latestToastText()');
if (toastText !== '建议不出，保留手牌') throw new Error(`unexpected passAdvice toast: ${JSON.stringify(toastText)}`);
await page.screenshot({ path: path.join(SHOTS, 'f-pass-advice-toast.png') });
const passAdvice = { snapshot: passCapture.snapshot, history: passCapture.history, toastText };

fs.writeFileSync(
  path.join(EVIDENCE, 'hint-capture.json'),
  JSON.stringify({ capturedAt: new Date().toISOString(), base: BASE, difficulty, capture, sel1Cards, sel2Cards, sel3Cards, playedCards, passAdvice, pageErrors }, null, 2),
);

await context.close();
await browser.close();
console.log(JSON.stringify({
  ok: true,
  difficulty,
  handCounts: capture.snapshot.handCounts,
  historyLen: capture.history.length,
  hasBottom: Array.isArray(capture.snapshot.bottom) ? capture.snapshot.bottom.length : null,
  sel1: keysOf(sel1Cards),
  sel2: keysOf(sel2Cards),
  sel3: keysOf(sel3Cards),
  played: keysOf(playedCards),
  passAdvice: { toastText, handCounts: passAdvice.snapshot.handCounts },
  pageErrors: pageErrors.length,
}, null, 2));
