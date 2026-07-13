#!/usr/bin/env node
/**
 * W2 重绘接线视觉采证:真实输入走 lobby→子页→开局→叫抢→playing→pause,逐面截图。
 * 前置:W2 worktree 已构建,worktree 根起 http://127.0.0.1:7789。
 * 运行:cd coordination/scripts && node w2-visual-probe.mjs [--vp 844x390] [--tag final]
 * 红线:全程真实输入(CDP 触摸真实按钮);settings 预写(animation=false 取确定性终态帧)。
 */
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const EVIDENCE = path.resolve(ROOT, 'coordination/reports/W-JUICE-W2-evidence');
const BASE = 'http://127.0.0.1:7789/build/web-mobile/';
const SEED = 20260705;
fs.mkdirSync(EVIDENCE, { recursive: true });

const argIdx = process.argv.indexOf('--vp');
const vpArg = argIdx > -1 ? process.argv[argIdx + 1] : '844x390';
const [VW, VH] = vpArg.split('x').map(Number);
const LABEL = vpArg;

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
`;

const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
const summary = { task: 'W2-visual', viewport: LABEL, base: BASE, seed: SEED, capturedAt: new Date().toISOString(), caps: [], pageErrors: [] };

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const context = await browser.newContext({ viewport: { width: VW, height: VH }, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', (e) => summary.pageErrors.push(e.message.slice(0, 160)));
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const evalIn = (expr) => page.evaluate(`(() => { ${HELPERS}; return (${expr}); })()`);
  const tap = async (point, settle = 550) => {
    const pt = { x: Math.round(point.x), y: Math.round(point.y), id: 0, radiusX: 1, radiusY: 1 };
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
    await page.waitForTimeout(70);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(settle);
  };
  const tapTarget = async (nameOrLabel, settle = 550) => {
    const p = await evalIn(`btnPoint(${JSON.stringify(nameOrLabel)})`);
    if (!p.ok) throw new Error(`button not found: ${nameOrLabel} @scene=${await evalIn('sceneName()')}`);
    await tap(p, settle);
  };
  const shot = async (name) => {
    const file = `${name}-${LABEL}.png`;
    await page.screenshot({ path: path.join(EVIDENCE, file) });
    summary.caps.push({ file, sha256: sha(path.join(EVIDENCE, file)) });
    console.log('shot', file);
  };

  await page.goto(`${BASE}?seed=${SEED}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(() => {
    localStorage.removeItem('doudizhu.save');
    localStorage.setItem('doudizhu.settings', JSON.stringify({ sound: false, vibration: false, animation: false, difficulty: 'simple' }));
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => { const c = document.getElementById('GameCanvas'); return c && c.width > 0; }, { timeout: 90000 });
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, { timeout: 90000, polling: 250 });
  await page.waitForTimeout(1600);
  await shot('a-lobby-home');

  await tapTarget('教程', 700);
  await shot('b-lobby-tutorial-panel');
  await tapTarget('跳过', 700).catch(async () => tapTarget('返回', 700));

  await tapTarget('home-start-button', 900);
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, { timeout: 30000, polling: 250 });
  await page.waitForTimeout(1600);
  await shot('c-bidding');

  for (let i = 0; i < 40; i += 1) {
    const phase = await evalIn(`findSkeleton()?.runtime?.phase?.() ?? null`);
    if (phase === 'playing') break;
    let acted = false;
    for (const t of ['叫地主', '抢地主', '抢']) {
      const b = await evalIn(`btnPoint(${JSON.stringify(t)})`);
      if (b.ok) { await tap(b); acted = true; break; }
    }
    if (!acted) await page.waitForTimeout(450);
  }
  for (let i = 0; i < 30; i += 1) {
    if (await evalIn(`Boolean(findSkeleton()?.runtime?.isPlayerTurn?.())`)) break;
    await page.waitForTimeout(400);
  }
  const cardPt = await evalIn('firstHandCardPoint()');
  if (cardPt.ok) await tap(cardPt, 350);
  await shot('d-playing-actions');

  const pause = await evalIn(`btnPoint('暂停')`);
  if (pause.ok) {
    await tap(pause, 700);
    await shot('e-pause-panel');
    const cont = await evalIn(`btnPoint('pause-continue')`);
    if (cont.ok) await tap(cont, 500);
  }

  fs.writeFileSync(path.join(EVIDENCE, `w2-visual-summary-${LABEL}.json`), JSON.stringify(summary, null, 2));
  console.log('pageErrors:', summary.pageErrors.length, summary.pageErrors.slice(0, 3));
  await browser.close();
  if (summary.pageErrors.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
