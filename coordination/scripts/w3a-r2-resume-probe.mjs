#!/usr/bin/env node
/**
 * W3-A R2 恢复路径行为冒烟:断局恢复首帧必须走旧式竖直淡入(无方向弧线)。
 * 前置:W3-A worktree 已构建 build/web-mobile,worktree 根起 http://127.0.0.1:7789。
 * 运行:cd coordination/scripts && node w3a-r2-resume-probe.mjs
 * 红线:全程真实输入(CDP dispatchTouchEvent 点真实按钮),零状态直写、零 loadScene/startGame 直调;
 *      localStorage 仅预写 settings(动效开,与 v8/v9 同口径);存档为真实对局落盘产物。
 * 判据(数值,采样自真实渲染节点,只读):
 *   - 出牌段(方向弧线):∃ 样本 angle≠0 或 y>final+2(liftY 过冲);
 *   - 恢复段(旧淡入):∀ 样本 angle=0 且 y≤final+2,且 ∃ 透明度/位置中间态(渐显被捕获)。
 */
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const EVIDENCE = path.resolve(ROOT, 'coordination/reports/W-JUICE-W3A-evidence');
const BASE = 'http://127.0.0.1:7789/build/web-mobile/';
const SEED = 20260705;
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
function firstHandCardPoint() {
  const sk = findSkeleton(); if (!sk?.uiRoot) return { ok: false };
  const cards = sk.uiRoot.children.filter((c) => c.name.startsWith('card-')).sort((a, b) => a.position.x - b.position.x);
  if (!cards.length) return { ok: false };
  const p = vp(cards[0]);
  return { ok: true, name: cards[0].name, x: p.x, y: p.y };
}
function samplePlayCard() {
  const cc = globalThis.cc;
  const area = nodeByName('play-area-runtime');
  const n = area?.children?.find((c) => c.name.startsWith('play-card-'));
  if (!n) return null;
  const op = n.getComponent(cc.UIOpacity) ?? n.getComponent('cc.UIOpacity');
  return { x: Math.round(n.position.x * 10) / 10, y: Math.round(n.position.y * 10) / 10, angle: Math.round(n.angle * 100) / 100, opacity: op ? op.opacity : -1 };
}
`;

const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
const summary = { task: 'W3A-R2-resume', base: BASE, seed: SEED, capturedAt: new Date().toISOString() };

async function pollSamples(evalIn, ms, label) {
  const t0 = Date.now();
  const out = [];
  while (Date.now() - t0 < ms) {
    try {
      const s = await evalIn('samplePlayCard()');
      if (s) out.push({ t: Date.now() - t0, at: Date.now(), ...s });
    } catch { /* scene switching */ }
  }
  summary[label] = { count: out.length, samples: out.filter((_, i) => i % 2 === 0).slice(0, 60).map(({ at, ...rest }) => rest) };
  return out;
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const evalIn = (expr) => page.evaluate(`(() => { ${HELPERS}; return (${expr}); })()`);
  const tap = async (point, settle = 500) => {
    const pt = { x: Math.round(point.x), y: Math.round(point.y), id: 0, radiusX: 1, radiusY: 1 };
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
    await page.waitForTimeout(70);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(settle);
  };
  const tapTarget = async (nameOrLabel, settle = 500) => {
    const p = await evalIn(`btnPoint(${JSON.stringify(nameOrLabel)})`);
    if (!p.ok) throw new Error(`button not found: ${nameOrLabel} @scene=${await evalIn('sceneName()')}`);
    await tap(p, settle);
  };

  // boot:动效开(settings 预写与 v8/v9 同口径;非游戏状态)
  await page.goto(`${BASE}?seed=${SEED}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(() => {
    localStorage.removeItem('doudizhu.save');
    localStorage.setItem('doudizhu.settings', JSON.stringify({ sound: false, vibration: false, animation: true, difficulty: 'simple' }));
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => { const c = document.getElementById('GameCanvas'); return c && c.width > 0; }, { timeout: 90000 });
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, { timeout: 90000 });
  await page.waitForTimeout(2000);

  // 真实链路进对局:开始新局 → 真实叫抢到 playing
  await tapTarget('home-start-button', 900);
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, { timeout: 30000 });
  await page.waitForTimeout(1800);
  for (let i = 0; i < 40; i += 1) {
    const phase = await evalIn(`findSkeleton()?.runtime?.phase?.() ?? null`);
    if (phase === 'playing') break;
    let acted = false;
    for (const t of ['叫地主', '抢地主', '抢']) {
      const b = await evalIn(`btnPoint(${JSON.stringify(t)})`);
      if (b.ok) { await tap(b); acted = true; break; }
    }
    if (!acted) await page.waitForTimeout(500);
  }
  if ((await evalIn(`findSkeleton()?.runtime?.phase?.() ?? null`)) !== 'playing') throw new Error('bidding did not reach playing');
  for (let i = 0; i < 30; i += 1) {
    if (await evalIn(`Boolean(findSkeleton()?.runtime?.isPlayerTurn?.())`)) break;
    await page.waitForTimeout(400);
  }

  // hero 真实出一手:点最左手牌 → 点「出牌」;并行高频采样出牌段(方向弧线中间态)
  const cardPt = await evalIn('firstHandCardPoint()');
  if (!cardPt.ok) throw new Error('no hand card found');
  await tap(cardPt, 350);
  const playBtn = await evalIn(`btnPoint('出牌')`);
  if (!playBtn.ok) throw new Error('play button not found');
  const playPoll = (async () => pollSamples(evalIn, 1600, 'playPhasePoll'))();
  await tap(playBtn, 60);
  const playSamples = await playPoll;
  await page.waitForTimeout(900);
  const played = await evalIn(`(nodeByName('play-area-runtime')?.children ?? []).filter((c) => c.name.startsWith('play-card-')).length`);
  if (!played) throw new Error('hero play did not land');
  await page.screenshot({ path: path.join(EVIDENCE, 'r2-play-before-reload.png') });

  // 真实中断:刷新页面(存档为真实对局产物)→ 大厅「继续对局」;screencast+高频采样恢复段
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => { const c = document.getElementById('GameCanvas'); return c && c.width > 0; }, { timeout: 90000 });
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, { timeout: 90000 });
  await page.waitForTimeout(2000);
  const frames = [];
  client.on('Page.screencastFrame', async (ev) => {
    frames.push({ tRecv: Date.now(), data: ev.data });
    try { await client.send('Page.screencastFrameAck', { sessionId: ev.sessionId }); } catch { /* stopped */ }
  });
  await client.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  const resumePollPromise = (async () => {
    // 等 game 场景出现后立即进入高频采样(采样窗覆盖 fadeInOnLoad+legacy 180ms 淡入)
    await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(nodeByName('play-area-runtime')); })()`, { timeout: 30000 });
    return pollSamples(evalIn, 2600, 'resumePoll');
  })();
  await tapTarget('home-continue-button', 60);
  const resumeSamples = await resumePollPromise;
  await page.waitForTimeout(800);
  await client.send('Page.stopScreencast').catch(() => {});
  await page.screenshot({ path: path.join(EVIDENCE, 'r2-resume-settled.png') });

  // 判据
  const finalOf = (samples) => samples[samples.length - 1];
  const pFinal = finalOf(playSamples);
  const rFinal = finalOf(resumeSamples);
  if (!pFinal || !rFinal) throw new Error(`empty samples: play=${playSamples.length} resume=${resumeSamples.length}`);
  const playArc = playSamples.some((s) => Math.abs(s.angle) > 0.5 || s.y > pFinal.y + 2);
  const resumeNoArc = resumeSamples.every((s) => Math.abs(s.angle) < 0.01 && s.y <= rFinal.y + 2);
  const resumeTransient = resumeSamples.some((s) => (s.opacity >= 0 && s.opacity < 255) || s.y < rFinal.y - 2);
  summary.verdict = {
    playArcObserved: playArc,
    resumeNoDirectionalArc: resumeNoArc,
    resumeFadeTransientObserved: resumeTransient,
    playFinal: pFinal, resumeFinal: rFinal,
    playSampleCount: playSamples.length, resumeSampleCount: resumeSamples.length,
  };

  // 帧证(R3 修正):以「首个 resume play-card 采样」的墙钟时刻为锚,
  // 在 [锚-150ms, 锚+900ms] 窗内取 淡入起点/中间态/近终/终态 四帧;四帧 SHA 必须互异。
  const anchorAt = resumeSamples.length ? resumeSamples[0].at : null;
  if (!anchorAt) throw new Error('no resume samples to anchor frames');
  // 锚点二次校准:screencast 有接收滞后,首个采样时刻附近可能还是场景切换前的残留帧——
  // 以「与切换前末帧 SHA 不同的首个新内容帧」为真锚(=game 场景首绘),保证 frame1 是淡入起点而非 lobby 残影。
  const shaOfFrame = (f) => createHash('sha256').update(Buffer.from(f.data, 'base64')).digest('hex').slice(0, 16);
  const preFrames = frames.filter((f) => f.tRecv < anchorAt - 60);
  const preSha = preFrames.length ? shaOfFrame(preFrames[preFrames.length - 1]) : null;
  const firstNew = frames.find((f) => f.tRecv >= anchorAt - 60 && shaOfFrame(f) !== preSha);
  const anchor2 = firstNew ? firstNew.tRecv : anchorAt;
  const windowFrames = frames.filter((f) => f.tRecv >= anchor2 && f.tRecv <= anchor2 + 900);
  const offsets = [0, 60, 120, 420, 30, 90, 160, 260, 600, 800];
  const kept = [];
  const usedSha = new Set();
  const usedFrame = new Set();
  for (const off of offsets) {
    if (kept.length >= 4) break;
    let best = null; let bestDist = Infinity;
    for (const f of windowFrames) {
      const d = Math.abs(f.tRecv - (anchor2 + off));
      if (d < bestDist && !usedFrame.has(f)) { best = f; bestDist = d; }
    }
    if (!best) continue;
    const buf = Buffer.from(best.data, 'base64');
    const digest = createHash('sha256').update(buf).digest('hex').slice(0, 16);
    if (usedSha.has(digest)) { usedFrame.add(best); continue; }
    usedFrame.add(best);
    usedSha.add(digest);
    kept.push({ frame: best, digest, dt: best.tRecv - anchor2 });
  }
  kept.sort((a, b) => a.dt - b.dt);
  kept.forEach((k, i) => {
    const name = `resume-fade-frame${i + 1}.png`;
    fs.writeFileSync(path.join(EVIDENCE, name), Buffer.from(k.frame.data, 'base64'));
    k.file = name;
  });
  const framesOk = kept.length === 4 && new Set(kept.map((k) => k.digest)).size === 4;
  summary.frames = kept.map((k) => ({ file: k.file, sha256: k.digest, dtFromAnchorMs: k.dt }));
  summary.framesNote = `screencast 共 ${frames.length} 帧,窗内 ${windowFrames.length} 帧;锚=场景切换后首个新内容帧(采样墙钟二次校准 ${anchor2 - anchorAt}ms);framesOk=${framesOk}`;
  summary.pageErrors = errors;
  summary.verdict.framesOk = framesOk;
  summary.verdict.distinctFrameShaCount = new Set(kept.map((k) => k.digest)).size;
  fs.writeFileSync(path.join(EVIDENCE, 'w3a-r2-resume-summary.json'), JSON.stringify(summary, null, 2));

  await browser.close();
  // R3 fail-fast:五条判据全绿才 PASS(transient 与帧证均为硬条件)。
  const pass = playArc && resumeNoArc && resumeTransient && errors.length === 0 && framesOk;
  console.log(JSON.stringify(summary.verdict, null, 2));
  console.log(`pageErrors=${errors.length} transient=${resumeTransient} framesOk=${framesOk} => ${pass ? 'PASS' : 'FAIL'}`);
  if (!pass) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
