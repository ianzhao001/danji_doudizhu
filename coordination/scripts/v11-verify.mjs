#!/usr/bin/env node
/**
 * V11 收口采证(v1.6 W-SHINE 终验)。fork 自 v10-verify(原件零改保 provenance),五处改造:
 * ① 音频门 9:9→12:12 + cueAudioPath 三 case(redeal/reset/landlordDecided)非 null 源码断言;
 * ② 四横屏×四相位 16 图保留 + 增结算特写胜/败对(seed 14/1)+ lobby 三难度角标 3 图 → 21 PNG;
 * ③ before 不重采:v13↔v15 与 punch 前后对比引用 V10-evidence/UX-AUDIT-V16-evidence 冻结件(本脚本零触碰);
 * ④ 录屏 8+2 原样复跑 +1 段 lobby 难度行交互 → 11 WebM;⑤ mediaGate 双向集合 21+11、audio 12:12。
 * 前置:已构建 build/web-mobile,仓根起 http://127.0.0.1:7789(采证用;用户签收另起 7788)。
 * 运行:cd coordination/scripts && node v11-verify.mjs [--only screens|closeups|recordings|audio]
 * 种子(纯逻辑狩猎产物,策略与 w3b-fx-seed-hunt 同构):14=hero 地主+炸弹+胜局;15=首出王炸;1=hero 地主败局。
 * 春天态披露:狩猎种子库无春天局,特写只采胜/败两态(任务书允许披露跳过)。
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const EVIDENCE = path.resolve(ROOT, 'coordination/reports/V11-evidence');
const SHOTS = path.join(EVIDENCE, 'screenshots');
const RECS = path.join(EVIDENCE, 'recordings');
const BASE = 'http://127.0.0.1:7789/build/web-mobile/';
const VIEWPORTS = [
  { label: '844x390', width: 844, height: 390 },
  { label: '812x375', width: 812, height: 375 },
  { label: '915x412', width: 915, height: 412 },
  { label: '780x360', width: 780, height: 360 },
];
const SEED_WIN_BOMB = 14;
const SEED_ROCKET = 15;
const SEED_LOSE = 1;
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(RECS, { recursive: true });
const CALIB = path.join(EVIDENCE, 'import-calibration');
fs.mkdirSync(CALIB, { recursive: true });

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
    settled: Boolean(sk?.runtime?.settlement?.()),
    scores: sk?.runtime?.settlement?.()?.scores ?? null,
    selected: (sk?.selected ?? []).length,
  };
}
function fxCensus() {
  const layer = nodeByName('fx-layer-runtime');
  return layer ? layer.children.filter((c) => c.isValid).map((c) => c.name) : [];
}
`;

const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
const SUMMARY_PATH = () => path.join(EVIDENCE, 'v11-summary.json');
function loadOrInitSummary() {
  // Codex R1 阻断 1 修复:分段运行合并进既有 summary,不再从空覆盖。
  const fresh = { task: 'V11', base: BASE, capturedAt: new Date().toISOString(), seeds: { winBomb: SEED_WIN_BOMB, rocket: SEED_ROCKET, lose: SEED_LOSE }, screens: {}, loseScreens: [], closeups: [], badges: [], calibration: null, recordings: {}, audio: null, pageErrors: {} };
  try {
    const prev = JSON.parse(fs.readFileSync(SUMMARY_PATH(), 'utf8'));
    return { ...fresh, ...prev, capturedAt: fresh.capturedAt, seeds: fresh.seeds };
  } catch {
    return fresh;
  }
}
const summary = loadOrInitSummary();

async function newSession({ viewport = { width: 844, height: 390 }, record = null, animation = true, sound = false } = {}) {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const ctxOpts = { viewport, hasTouch: true };
  if (record) ctxOpts.recordVideo = { dir: RECS, size: viewport };
  const context = await browser.newContext(ctxOpts);
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
  const sess = { browser, context, page, client, errors, evalIn, tap, tapTarget, animation, sound };
  sess.boot = async (seed) => {
    await page.goto(`${BASE}?seed=${seed}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate(({ anim, snd }) => {
      localStorage.removeItem('doudizhu.save');
      localStorage.setItem('doudizhu.settings', JSON.stringify({ sound: snd, vibration: false, animation: anim, difficulty: 'simple' }));
    }, { anim: animation, snd: sound });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => { const c = document.getElementById('GameCanvas'); return c && c.width > 0; }, undefined, { timeout: 90000 });
    await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, undefined, { timeout: 90000, polling: 300 });
    await page.waitForTimeout(1500);
  };
  sess.enterGame = async () => {
    await tapTarget('home-start-button', 800);
    await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, undefined, { timeout: 30000, polling: 250 });
    await page.waitForTimeout(1400);
  };
  sess.bidToPlaying = async () => {
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
  };
  // hero 策略一步(与狩猎同构)
  sess.heroStep = async () => {
    const info = await evalIn('turnInfo()');
    if (info.settled) return { done: true, info };
    if (!info.myTurn || info.phase !== 'playing') { await page.waitForTimeout(320); return { acted: false, info }; }
    const cards = await evalIn('handCards()');
    if (!cards.length) { await page.waitForTimeout(320); return { acted: false, info }; }
    const byRank = new Map();
    for (const c of cards) { const g = byRank.get(c.rank) ?? []; g.push(c); byRank.set(c.rank, g); }
    const bomb = [...byRank.values()].find((g) => g.length === 4);
    const jokers = [16, 17].every((r) => byRank.has(r)) ? [byRank.get(16)[0], byRank.get(17)[0]] : null;
    const leading = !info.top || info.top.seat === 0;
    const play = async (targets, kind) => {
      for (const c of targets) await tap({ x: c.x, y: c.y }, 220);
      await tapTarget('出牌', 200);
      return { acted: true, kind };
    };
    if (leading) {
      if (bomb) return play(bomb, 'bomb');
      if (jokers) return play(jokers, 'rocket');
      return play([cards[0]], 'single');
    }
    if (info.top.count === 1) {
      const beat = cards.find((c) => c.rank > info.top.maxRank);
      if (beat) return play([beat], 'follow');
    }
    for (const label of ['要不起', '不要']) {
      const b = await evalIn(`btnPoint(${JSON.stringify(label)})`);
      if (b.ok) { await tap(b, 220); return { acted: true, kind: 'pass' }; }
    }
    await page.waitForTimeout(300);
    return { acted: false, info };
  };
  sess.playUntil = async (predicate, maxSteps = 220) => {
    for (let i = 0; i < maxSteps; i += 1) {
      const info = await evalIn('turnInfo()');
      if (await predicate(info)) return info;
      if (info.settled) return info;
      await sess.heroStep();
    }
    throw new Error('playUntil exceeded maxSteps');
  };
  return sess;
}

async function shot(page, name, meta = {}) {
  const p = path.join(SHOTS, name);
  await page.screenshot({ path: p });
  return { file: `screenshots/${name}`, sha256: sha(p), ...meta };
}

async function saveVideo(sess, name) {
  const video = sess.page.video();
  await sess.context.close();
  const target = path.join(RECS, name);
  await video.saveAs(target);
  await video.delete().catch(() => {});
  await sess.browser.close();
  return { file: `recordings/${name}`, sha256: sha(target), bytes: fs.statSync(target).size };
}


async function censusDuring(sess, ms) {
  const seen = new Set();
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const names = await sess.evalIn('fxCensus()');
      names.forEach((n) => seen.add(n));
    } catch { /* transitioning */ }
  }
  return [...seen];
}

// ---- Flow A:四横屏 × {lobby, bidding, playing, settled(win)} ----
async function flowScreens() {
  for (const v of VIEWPORTS) {
    const sess = await newSession({ viewport: { width: v.width, height: v.height } });
    const caps = [];
    await sess.boot(SEED_WIN_BOMB);
    caps.push(await shot(sess.page, `a-lobby-${v.label}.png`, { step: 'lobby' }));
    await sess.enterGame();
    caps.push(await shot(sess.page, `b-bidding-${v.label}.png`, { step: 'bidding' }));
    await sess.bidToPlaying();
    await sess.playUntil(async (info) => info.myTurn, 30);
    caps.push(await shot(sess.page, `c-playing-${v.label}.png`, { step: 'playing' }));
    const end = await sess.playUntil(async (info) => info.settled);
    await sess.page.waitForTimeout(1100);
    caps.push(await shot(sess.page, `d-settled-${v.label}.png`, { step: 'settled-win', scores: end.scores }));
    if (!end.scores || end.scores[0] <= 0) throw new Error(`expected win at ${v.label}: ${JSON.stringify(end.scores)}`);
    summary.screens[v.label] = caps;
    summary.pageErrors[`screens-${v.label}`] = sess.errors;
    if (sess.errors.length) throw new Error(`pageErrors at ${v.label}: ${sess.errors[0]}`);
    await sess.browser.close();
    console.log('screens done', v.label);
  }
}

// ---- Flow A2:结算特写胜/败(clip 到面板区) + lobby 三难度角标(844) ----
async function flowCloseups() {
  summary.closeups = [];
  summary.badges = [];
  // 特写 clip:844×390 下结算面板居中,取中央 640×360 区
  const CLIP = { x: 102, y: 12, width: 640, height: 366 };
  {
    const sess = await newSession({});
    await sess.boot(SEED_WIN_BOMB);
    await sess.enterGame();
    await sess.bidToPlaying();
    const end = await sess.playUntil(async (info) => info.settled);
    if (!end.scores || end.scores[0] <= 0) throw new Error('closeup-win expected win');
    await sess.page.waitForTimeout(1600);
    const p = path.join(SHOTS, 'e-settle-close-win-844x390.png');
    await sess.page.screenshot({ path: p, clip: CLIP });
    summary.closeups.push({ file: 'screenshots/e-settle-close-win-844x390.png', sha256: sha(p), scores: end.scores });
    summary.pageErrors['closeup-win'] = sess.errors;
    if (sess.errors.length) throw new Error('closeup-win pageErrors');
    await sess.browser.close();
  }
  {
    const sess = await newSession({});
    await sess.boot(SEED_LOSE);
    await sess.enterGame();
    await sess.bidToPlaying();
    const end = await sess.playUntil(async (info) => info.settled);
    if (!end.scores || end.scores[0] >= 0) throw new Error('closeup-lose expected lose');
    await sess.page.waitForTimeout(1400);
    const p = path.join(SHOTS, 'e-settle-close-lose-844x390.png');
    await sess.page.screenshot({ path: p, clip: CLIP });
    summary.closeups.push({ file: 'screenshots/e-settle-close-lose-844x390.png', sha256: sha(p), scores: end.scores });
    summary.pageErrors['closeup-lose'] = sess.errors;
    if (sess.errors.length) throw new Error('closeup-lose pageErrors');
    await sess.browser.close();
  }
  {
    const sess = await newSession({});
    await sess.boot(SEED_WIN_BOMB);
    for (const level of ['simple', 'normal', 'hard']) {
      if (level !== 'simple') await sess.tapTarget(`difficulty-option-${level}`, 650);
      const p = path.join(SHOTS, `f-badge-${level}-844x390.png`);
      await sess.page.screenshot({ path: p });
      summary.badges.push({ file: `screenshots/f-badge-${level}-844x390.png`, sha256: sha(p), level });
    }
    await sess.tapTarget('difficulty-option-simple', 500);
    summary.pageErrors['closeup-badges'] = sess.errors;
    if (sess.errors.length) throw new Error('badges pageErrors');
    await sess.browser.close();
  }
  console.log('closeups done: 2 settle + 3 badge');
}

// ---- Flow A3:败局四横屏结算(seed 1·补 P-RESULT-SKIN 胜/败两态×四横屏) ----
async function flowScreensLose() {
  summary.loseScreens = [];
  for (const v of VIEWPORTS) {
    const sess = await newSession({ viewport: { width: v.width, height: v.height } });
    await sess.boot(SEED_LOSE);
    await sess.enterGame();
    await sess.bidToPlaying();
    const end = await sess.playUntil(async (info) => info.settled);
    if (!end.scores || end.scores[0] >= 0) throw new Error(`expected lose at ${v.label}: ${JSON.stringify(end.scores)}`);
    await sess.page.waitForTimeout(1100);
    const cap = await shot(sess.page, `g-settled-lose-${v.label}.png`, { step: 'settled-lose', scores: end.scores });
    summary.loseScreens.push(cap);
    summary.pageErrors[`lose-screens-${v.label}`] = sess.errors;
    if (sess.errors.length) throw new Error(`lose pageErrors at ${v.label}: ${sess.errors[0]}`);
    await sess.browser.close();
    console.log('lose screens done', v.label);
  }
}

// ---- Flow A4:9-slice 三档拉伸对照(320/560/760·capInsets 56) ----
// 与引擎 SLICED 同算法:先按 meta 有效 rect(trimX/Y+width/height,剔除透明安全边)裁切,再对 rect 套四向 capInsets 做九宫。
// R2 修正(Codex R2 阻断):原版对原始 760×380 整图切,把 8px 透明边计入固定边带,与引擎不符——引擎九宫基于 trim 后 rect。
// 纯 PIL 离线渲染——引擎内动态挂 SLICED 节点会撞 Cocos Error 3804(渲染管线),离线九宫按同 rect+capInsets 算法等价且稳定可复现。
function flowStretch() {
  const png = path.join(ROOT, 'assets/resources/art/ui/settlement-panel-v15.png');
  const meta = path.join(ROOT, 'assets/resources/art/ui/settlement-panel-v15.png.meta');
  const out = path.join(CALIB, 'panel-v15-9slice-stretch-320-560-760.png');
  const py = [
    'from PIL import Image, ImageDraw',
    'import json',
    `u = json.load(open(${JSON.stringify(meta)}))["subMetas"]["f9941"]["userData"]`,
    'tx, ty, rw, rh = u["trimX"], u["trimY"], u["width"], u["height"]',
    'bl, bt, br, bb = u["borderLeft"], u["borderTop"], u["borderRight"], u["borderBottom"]',
    `full = Image.open(${JSON.stringify(png)}).convert("RGBA")`,
    'src = full.crop((tx, ty, tx + rw, ty + rh))  # 有效 rect(与引擎 SLICED 一致,不含透明安全边)',
    'w, h = src.size',
    'def nine(tw, th):',
    '    out = Image.new("RGBA", (tw, th), (0, 0, 0, 0))',
    '    xs, ys = [0, bl, w - br, w], [0, bt, h - bb, h]',
    '    xd, yd = [0, bl, tw - br, tw], [0, bt, th - bb, th]',
    '    for i in range(3):',
    '        for j in range(3):',
    '            dw, dh = xd[i + 1] - xd[i], yd[j + 1] - yd[j]',
    '            if dw > 0 and dh > 0:',
    '                p = src.crop((xs[i], ys[j], xs[i + 1], ys[j + 1])).resize((dw, dh))',
    '                out.paste(p, (xd[i], yd[j]))',
    '    return out',
    'specs = [(320, 240), (560, 380), (760, 380)]',
    'W = max(s[0] for s in specs) + 24',
    'H = sum(s[1] + 26 for s in specs)',
    'canvas = Image.new("RGBA", (W, H), (255, 240, 247, 255))',
    'd = ImageDraw.Draw(canvas)',
    'y = 0',
    'for tw, th in specs:',
    '    d.rectangle([0, y, W, y + 22], fill=(184, 51, 106, 255))',
    '    d.text((8, y + 6), f"{tw}x{th}  9-slice(rect {rw}x{rh}, capInsets {bl}, border 固定/中央自适应)", fill=(255, 255, 255, 255))',
    '    canvas.alpha_composite(nine(tw, th), (12, y + 26))',
    '    y += th + 26',
    `canvas.convert("RGB").save(${JSON.stringify(out)})`,
    'print(f"STRETCH_9SLICE_OK rect={rw}x{rh} border={bl}")',
  ].join('\n');
  const pyFile = path.join(CALIB, '_stitch.py');
  fs.writeFileSync(pyFile, py);
  execSync(`python3 ${JSON.stringify(pyFile)}`, { stdio: 'inherit' });
  fs.rmSync(pyFile);
  summary.calibration = { stretch: { file: 'import-calibration/panel-v15-9slice-stretch-320-560-760.png', sha256: sha(out), sizes: ['320x240', '560x380', '760x380'], method: 'PIL 9-slice capInsets 56(与引擎 SLICED 同九宫算法)' } };
  console.log('stretch calibration done: PIL 9-slice 320/560/760 竖拼');
}

// ---- Flow B:录屏组 8+2(844) ----
async function recDeal() {
  const sess = await newSession({ record: true });
  await sess.boot(SEED_WIN_BOMB);
  await sess.enterGame();
  await sess.page.waitForTimeout(2600);
  summary.pageErrors['rec-deal'] = sess.errors;
  return saveVideo(sess, 'rec-1-deal.webm');
}
async function recFlight() {
  const sess = await newSession({ record: true });
  await sess.boot(SEED_WIN_BOMB);
  await sess.enterGame();
  await sess.bidToPlaying();
  await sess.playUntil(async (info) => info.myTurn, 30);
  await sess.heroStep();
  await sess.page.waitForTimeout(900);
  summary.pageErrors['rec-flight'] = sess.errors;
  return saveVideo(sess, 'rec-2-flight.webm');
}
async function recBomb() {
  const sess = await newSession({ record: true });
  await sess.boot(SEED_WIN_BOMB);
  await sess.enterGame();
  await sess.bidToPlaying();
  let census = null;
  for (let i = 0; i < 160; i += 1) {
    const info = await sess.evalIn('turnInfo()');
    if (info.settled) break;
    if (!info.myTurn) { await sess.page.waitForTimeout(320); continue; }
    const cards = await sess.evalIn('handCards()');
    const byRank = new Map();
    for (const c of cards) { const g = byRank.get(c.rank) ?? []; g.push(c); byRank.set(c.rank, g); }
    const bomb = [...byRank.values()].find((g) => g.length === 4);
    const leading = !info.top || info.top.seat === 0;
    if (bomb && leading) {
      const censusP = censusDuring(sess, 1500);
      const r = await sess.heroStep();
      if (r.kind !== 'bomb') throw new Error(`expected bomb, got ${r.kind}`);
      census = await censusP;
      await sess.page.waitForTimeout(400);
      break;
    }
    await sess.heroStep();
  }
  if (!census || !census.some((n) => n.startsWith('fx-bomb-ring'))) throw new Error(`bomb fx not observed: ${JSON.stringify(census)}`);
  summary.recordings.bombCensus = census.filter((n) => n.startsWith('fx-bomb')).length;
  summary.pageErrors['rec-bomb'] = sess.errors;
  return saveVideo(sess, 'rec-3-bomb.webm');
}
async function recRocket() {
  const sess = await newSession({ record: true });
  await sess.boot(SEED_ROCKET);
  await sess.enterGame();
  await sess.bidToPlaying();
  await sess.playUntil(async (info) => info.myTurn, 30);
  const censusP = censusDuring(sess, 1600);
  const r = await sess.heroStep();
  if (r.kind !== 'rocket') throw new Error(`expected rocket lead, got ${r.kind}`);
  const census = await censusP;
  if (!census.some((n) => n.startsWith('fx-rocket-trail'))) throw new Error(`rocket fx not observed: ${JSON.stringify(census)}`);
  await sess.page.waitForTimeout(500);
  summary.recordings.rocketCensus = census.filter((n) => n.startsWith('fx-rocket')).length;
  summary.pageErrors['rec-rocket'] = sess.errors;
  return saveVideo(sess, 'rec-4-rocket.webm');
}
async function recWin() {
  const sess = await newSession({ record: true });
  await sess.boot(SEED_WIN_BOMB);
  await sess.enterGame();
  await sess.bidToPlaying();
  const end = await sess.playUntil(async (info) => info.settled);
  if (!end.scores || end.scores[0] <= 0) throw new Error('expected win');
  await sess.page.waitForTimeout(2500);
  const census = await sess.evalIn('fxCensus()');
  const confetti = census.filter((n) => n.startsWith('result-fx-confetti')).length;
  if (confetti !== 14) throw new Error(`confetti != 14: ${confetti}`);
  summary.recordings.winConfetti = confetti;
  summary.pageErrors['rec-win'] = sess.errors;
  return saveVideo(sess, 'rec-5-win-confetti.webm');
}
async function recLose() {
  const sess = await newSession({ record: true });
  await sess.boot(SEED_LOSE);
  await sess.enterGame();
  await sess.bidToPlaying();
  const end = await sess.playUntil(async (info) => info.settled);
  if (!end.scores || end.scores[0] >= 0) throw new Error(`expected lose, scores=${JSON.stringify(end.scores)}`);
  await sess.page.waitForTimeout(1600);
  const census = await sess.evalIn('fxCensus()');
  if (census.some((n) => n.startsWith('result-fx-confetti'))) throw new Error('lose must not spawn confetti');
  summary.recordings.loseNoConfetti = true;
  summary.pageErrors['rec-lose'] = sess.errors;
  return saveVideo(sess, 'rec-6-lose-vignette.webm');
}
async function recTransitions() {
  const sess = await newSession({ record: true });
  await sess.boot(SEED_WIN_BOMB);
  await sess.tapTarget('教程', 700);
  await sess.tapTarget('跳过', 700).catch(() => sess.tapTarget('返回', 700));
  await sess.enterGame();
  await sess.tapTarget('暂停', 700);
  await sess.tapTarget('pause-quit', 600);
  if ((await sess.evalIn('sceneName()')) === 'game') {
    for (const t of ['确认', '退出']) {
      const b = await sess.evalIn(`btnPoint(${JSON.stringify(t)})`);
      if (b.ok) { await sess.tap(b, 600); break; }
    }
  }
  await sess.page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, undefined, { timeout: 20000, polling: 250 });
  await sess.page.waitForTimeout(900);
  summary.pageErrors['rec-transitions'] = sess.errors;
  return saveVideo(sess, 'rec-7-transitions.webm');
}
async function recRipple() {
  const sess = await newSession({ record: true });
  await sess.boot(SEED_WIN_BOMB);
  for (const label of ['战绩', '返回', '帮助', '返回']) {
    await sess.tapTarget(label, 620).catch(() => {});
  }
  await sess.enterGame();
  const b = await sess.evalIn(`btnPoint('叫地主')`);
  if (b.ok) await sess.tap(b, 700);
  summary.pageErrors['rec-ripple'] = sess.errors;
  return saveVideo(sess, 'rec-8-ripple.webm');
}
async function recAnimationOff() {
  const sess = await newSession({ record: true, animation: false });
  await sess.boot(SEED_WIN_BOMB);
  await sess.enterGame();
  await sess.bidToPlaying();
  await sess.playUntil(async (info) => info.myTurn, 30);
  await sess.heroStep();
  await sess.page.waitForTimeout(700);
  const census = await sess.evalIn('fxCensus()');
  if (census.length) throw new Error(`animation=off must keep fx layer empty: ${JSON.stringify(census)}`);
  summary.recordings.animationOffFxEmpty = true;
  summary.pageErrors['rec-animation-off'] = sess.errors;
  return saveVideo(sess, 'rec-9-animation-off.webm');
}
async function recSoundOff() {
  const sess = await newSession({ record: true, sound: false });
  await sess.boot(SEED_WIN_BOMB);
  await sess.enterGame();
  await sess.bidToPlaying();
  await sess.playUntil(async (info) => info.myTurn, 30);
  await sess.heroStep();
  await sess.page.waitForTimeout(700);
  summary.pageErrors['rec-sound-off'] = sess.errors;
  return saveVideo(sess, 'rec-10-sound-off.webm');
}

async function recLobbyDifficulty() {
  const sess = await newSession({ record: true });
  await sess.boot(SEED_WIN_BOMB);
  for (const level of ['normal', 'hard', 'simple']) {
    await sess.tapTarget(`difficulty-option-${level}`, 700);
  }
  summary.pageErrors['rec-lobby-difficulty'] = sess.errors;
  return saveVideo(sess, 'rec-11-lobby-difficulty.webm');
}

async function flowRecordings() {
  for (const f of fs.readdirSync(RECS)) fs.rmSync(path.join(RECS, f));
  for (const k of Object.keys(summary.pageErrors)) if (k.startsWith('rec-')) delete summary.pageErrors[k];
  const jobs = [
    ['rec-1-deal', recDeal], ['rec-2-flight', recFlight], ['rec-3-bomb', recBomb], ['rec-4-rocket', recRocket],
    ['rec-5-win-confetti', recWin], ['rec-6-lose-vignette', recLose], ['rec-7-transitions', recTransitions],
    ['rec-8-ripple', recRipple], ['rec-9-animation-off', recAnimationOff], ['rec-10-sound-off', recSoundOff],
    ['rec-11-lobby-difficulty', recLobbyDifficulty],
  ];
  summary.recordings.files = [];
  for (const [name, job] of jobs) {
    const r = await job();
    summary.recordings.files.push(r);
    const errs = Object.entries(summary.pageErrors).filter(([k, v]) => k.startsWith('rec-') && v.length);
    if (errs.length) throw new Error(`pageErrors in ${errs[0][0]}: ${errs[0][1][0]}`);
    console.log('recorded', name, r.bytes, 'bytes');
  }
}

// ---- Flow C:音效映射终表(静态核对:键→文件存在;wav 全被引用;死资产清零) ----
function flowAudio() {
  const src2 = fs.readFileSync(path.join(ROOT, 'assets/scripts/ui/asset-keys.ts'), 'utf8');
  const audioKeys = [...src2.matchAll(/(audio\w+): '(audio\/[\w-]+)'/g)].map((m) => ({ key: m[1], path: m[2] }));
  const audioDir = path.join(ROOT, 'assets/resources/audio');
  const wavs = fs.readdirSync(audioDir).filter((f) => f.endsWith('.wav') || f.endsWith('.mp3'));
  const missing = audioKeys.filter((k) => !wavs.some((w) => w.startsWith(k.path.split('/')[1] + '.')));
  const unreferenced = wavs.filter((w) => !audioKeys.some((k) => w.startsWith(k.path.split('/')[1] + '.')));
  summary.audio = { keys: audioKeys.length, files: wavs.length, missing, unreferenced, table: audioKeys.map((k) => k.path) };
  // v1.6 T-CUE-AUDIO:12:12 精确门 + cueAudioPath 三补音 case 非 null 源码断言。
  if (audioKeys.length !== 12 || wavs.length !== 12) throw new Error(`audio 12:12 gate failed: keys=${audioKeys.length} files=${wavs.length}`);
  if (missing.length || unreferenced.length) throw new Error(`audio map mismatch: missing=${JSON.stringify(missing)} unreferenced=${JSON.stringify(unreferenced)}`);
  for (const [cue, key] of [['redeal', 'audioRedeal'], ['reset', 'audioReset'], ['landlordDecided', 'audioLandlord']]) {
    const caseRe = new RegExp(`case '${cue}':\\s*return RESOURCE_PATHS\\.${key};`);
    if (!caseRe.test(src2)) throw new Error(`cueAudioPath missing non-null case for ${cue}`);
  }
  summary.audio.filledCues = ['redeal', 'reset', 'landlordDecided'];
  console.log('audio map ok:', audioKeys.length, 'keys /', wavs.length, 'files; 三补音 case 断言过');
}

function mediaGate() {
  // V11 R1:磁盘恰 25 PNG(16 四相位胜+4 四相位败+2 特写+3 角标) + 11 WebM,与 summary 双向一致;
  // 引擎内三档拉伸对照图单列 import-calibration 并磁盘存在断言(Codex R1 阻断:证据未交+签收页死链)。
  const pngs = fs.readdirSync(SHOTS).filter((f) => f.endsWith('.png')).sort();
  const webms = fs.readdirSync(RECS).filter((f) => f.endsWith('.webm')).sort();
  const idxShots = [
    ...Object.values(summary.screens).flat().map((c) => c.file.replace('screenshots/', '')),
    ...(summary.loseScreens ?? []).map((c) => c.file.replace('screenshots/', '')),
    ...(summary.closeups ?? []).map((c) => c.file.replace('screenshots/', '')),
    ...(summary.badges ?? []).map((c) => c.file.replace('screenshots/', '')),
  ].sort();
  const idxRecs = (summary.recordings.files ?? []).map((r) => r.file.replace('recordings/', '')).sort();
  const problems = [];
  if (pngs.length !== 25) problems.push(`png count ${pngs.length} != 25`);
  if (webms.length !== 11) problems.push(`webm count ${webms.length} != 11`);
  if (JSON.stringify(pngs) !== JSON.stringify(idxShots)) problems.push(`png set != summary index: disk=${JSON.stringify(pngs)} idx=${JSON.stringify(idxShots)}`);
  if (JSON.stringify(webms) !== JSON.stringify(idxRecs)) problems.push(`webm set != summary.recordings: disk=${JSON.stringify(webms)} idx=${JSON.stringify(idxRecs)}`);
  for (const [vp, caps] of Object.entries(summary.screens)) if (caps.length !== 4) problems.push(`screens[${vp}] caps=${caps.length}!=4`);
  if ((summary.loseScreens ?? []).length !== 4) problems.push('loseScreens != 4');
  if ((summary.closeups ?? []).length !== 2) problems.push('closeups != 2');
  if ((summary.badges ?? []).length !== 3) problems.push('badges != 3');
  const stretchPng = path.join(CALIB, 'panel-v15-9slice-stretch-320-560-760.png');
  if (!summary.calibration || !summary.calibration.stretch) problems.push('calibration.stretch missing in summary');
  if (!fs.existsSync(stretchPng)) problems.push('stretch composite not on disk');
  if (!summary.audio || summary.audio.keys !== 12 || summary.audio.files !== 12) problems.push('summary.audio missing or not 12:12');
  summary.mediaGate = { pngs: pngs.length, webms: webms.length, stretch: fs.existsSync(stretchPng), problems };
  if (problems.length) throw new Error(`media gate failed: ${problems.join(' | ')}`);
  console.log('media gate ok: 25 png + 11 webm + stretch composite, summary 双向一致, audio 12:12');
}

async function main() {
  const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
  flowAudio(); // 每次运行都产出非空 audio 证据(Codex R1 阻断 3)
  if (!only || only === 'screens') await flowScreens();
  if (!only || only === 'lose') await flowScreensLose();
  if (!only || only === 'closeups') { await flowCloseups(); flowStretch(); }
  else if (only === 'stretch') flowStretch(); // R2:仅重产拉伸图(纯 PIL,不重录),用既有 summary 跑 mediaGate 校验
  if (!only || only === 'recordings') await flowRecordings();
  const errsTotal = Object.values(summary.pageErrors).reduce((a, b) => a + b.length, 0);
  summary.pageErrorsTotal = errsTotal;
  mediaGate();
  fs.writeFileSync(SUMMARY_PATH(), JSON.stringify(summary, null, 2));
  console.log('pageErrorsTotal:', errsTotal);
  if (errsTotal) process.exit(1);
  console.log('V11 VERIFY PASS');
}

main().catch((e) => { console.error(e); process.exit(1); });
