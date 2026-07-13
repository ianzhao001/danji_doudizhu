#!/usr/bin/env node
/**
 * W-SHINE-S3 采证器(v1.6 用户终审整改批·6 条)。承 s1-evidence/v11-verify:真实 CDP 输入、fail-fast、零 pageErrors。
 * 覆盖:①规则按钮(v17 四态,无异形/无切角) ②文字不溢出(SHRINK) ③AI 节奏≥1s(实测) ④大厅单区域+难度切换 ⑤四入口移除(断言)
 * 前置:build/web-mobile 为当前分支构建;仓根起 http://127.0.0.1:7789。
 * 运行:cd coordination/scripts && node s3-evidence.mjs
 * 种子 14(纯逻辑狩猎产物:hero 地主+炸弹+胜局)。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = path.resolve(ROOT, 'coordination/reports/W-SHINE-S3-evidence/shots');
const BASE = 'http://127.0.0.1:7789/build/web-mobile/';
const SEED = 14;
const VIEWPORTS = [
  { label: '844x390', width: 844, height: 390 },
  { label: '812x375', width: 812, height: 375 },
  { label: '915x412', width: 915, height: 412 },
  { label: '780x360', width: 780, height: 360 },
];
fs.mkdirSync(OUT, { recursive: true });
const HELPERS = fs.readFileSync(path.join(HERE, 'v11-verify.mjs'), 'utf8').match(/const HELPERS = `([\s\S]*?)`;/)[1];

let fails = 0;
const gate = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) fails += 1; };

async function session(viewport) {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const context = await browser.newContext({ viewport, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const evalIn = (expr) => page.evaluate(`(() => { ${HELPERS}; return (${expr}); })()`);
  const tap = async (p, settle = 450) => {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(p.x), y: Math.round(p.y), id: 0 }] });
    await page.waitForTimeout(60);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(settle);
  };
  const tapTarget = async (name, settle = 450) => {
    const p = await evalIn(`btnPoint(${JSON.stringify(name)})`);
    if (!p.ok) throw new Error(`button not found: ${name}`);
    await tap(p, settle);
    return p;
  };
  const has = async (name) => (await evalIn(`btnPoint(${JSON.stringify(name)})`)).ok;
  const shot = (n) => page.screenshot({ path: path.join(OUT, `${n}.png`) });
  const boot = async () => {
    await page.goto(`${BASE}?seed=${SEED}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate(() => {
      localStorage.removeItem('doudizhu.save');
      localStorage.setItem('doudizhu.settings', JSON.stringify({ sound: false, vibration: false, animation: true, difficulty: 'normal' }));
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, undefined, { timeout: 90000, polling: 300 });
    await page.waitForTimeout(1400);
  };
  return { browser, page, errors, evalIn, tap, tapTarget, has, shot, boot };
}

// ---- 段 1:大厅四横屏(④单区域布局) + ⑤四入口移除断言 ----
for (const v of VIEWPORTS) {
  const s = await session({ width: v.width, height: v.height });
  await s.boot();
  await s.shot(`lobby-${v.label}`);
  // ⑤ 去教程/帮助 + 隐藏战绩/历史:四入口按钮均不存在
  for (const entry of ['entry-tutorial-button', 'entry-help-button', 'entry-stats-button', 'entry-records-button']) {
    gate((await s.has(entry)) === false, `${v.label} ⑤ 入口已移除:${entry}`);
  }
  // ④ 难度切换按钮存在
  gate(await s.has('home-difficulty-toggle'), `${v.label} ④ 难度切换按钮在场`);
  gate(s.errors.length === 0, `${v.label} 大厅 pageErrors=0`);
  await s.browser.close();
}

// ---- 段 2:难度切换三态循环(④) + 对局/暂停/结算(①②) + AI 节奏实测(③) @844 ----
{
  const s = await session({ width: 844, height: 390 });
  await s.boot();
  // ④ 难度循环:普通→困难→简单→普通(按钮 label 随当前档变)
  const labelOf = () => s.evalIn(`(() => { const n = nodeByName('home-difficulty-toggle'); if (!n) return null; const l = n.children.find((c) => c.name === 'button-label'); const cc = globalThis.cc; return l ? l.getComponent(cc.Label).string : null; })()`);
  const seq = [];
  for (let i = 0; i < 4; i += 1) {
    seq.push(await labelOf());
    await s.shot(`difficulty-${i}-844x390`);
    await s.tapTarget('home-difficulty-toggle', 600);
  }
  console.log('难度循环序列:', JSON.stringify(seq));
  gate(new Set(seq).size === 3, `④ 难度切换循环三态(实测 ${JSON.stringify(seq)})`);

  // 进对局:① 按钮规则形状 + ② 文字不溢出
  await s.tapTarget('home-start-button', 900);
  await s.page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, undefined, { timeout: 30000, polling: 250 });
  await s.page.waitForTimeout(1400);
  await s.shot('game-bidding-844x390');
  await s.tapTarget('pause-open-button', 700);
  await s.shot('pause-menu-844x390');
  await s.tapTarget('继续', 600);

  // 叫抢到 playing
  for (let i = 0; i < 40; i += 1) {
    const ph = await s.evalIn(`findSkeleton()?.runtime?.phase?.() ?? null`);
    if (ph === 'playing') break;
    let acted = false;
    for (const t of ['叫地主', '抢地主', '抢']) {
      const b = await s.evalIn(`btnPoint(${JSON.stringify(t)})`);
      if (b.ok) { await s.tap(b); acted = true; break; }
    }
    if (!acted) await s.page.waitForTimeout(400);
  }
  await s.page.waitForTimeout(800);
  await s.shot('game-playing-844x390');

  // ③ AI 节奏实测:hero 出一手后,量到再次轮到 hero 的时长(两个 AI 各 ≥1s → 应 ≥1800ms)
  const cards = await s.evalIn('handCards()');
  if (cards.length) {
    await s.tap({ x: cards[0].x, y: cards[0].y }, 220);
    const t0 = Date.now();
    const played = await s.evalIn(`btnPoint('出牌')`);
    if (played.ok) {
      await s.tap(played, 200);
      // 轮询等到再次 myTurn(两个 AI 各行动一次)
      let elapsed = 0;
      for (let i = 0; i < 120; i += 1) {
        const info = await s.evalIn('turnInfo()');
        if (info.settled) break;
        if (info.myTurn && info.phase === 'playing') { elapsed = Date.now() - t0; break; }
        await s.page.waitForTimeout(120);
      }
      console.log(`AI 两步耗时 ${elapsed}ms`);
      gate(elapsed >= 1800, `③ AI 节奏:hero 出牌→再轮到 hero 耗时 ${elapsed}ms ≥1800ms(两 AI 各 ≥1s)`);
    }
  }
  gate(s.errors.length === 0, `844 主链 pageErrors=0 (${JSON.stringify(s.errors)})`);
  await s.browser.close();
}

// ---- 段 3:780 窄档暂停面板(①②窄档复验) ----
{
  const s = await session({ width: 780, height: 360 });
  await s.boot();
  await s.tapTarget('home-start-button', 900);
  await s.page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, undefined, { timeout: 30000, polling: 250 });
  await s.page.waitForTimeout(1300);
  await s.tapTarget('pause-open-button', 700);
  await s.shot('pause-menu-780x360');
  gate(s.errors.length === 0, '780 pageErrors=0');
  await s.browser.close();
}

const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.png'));
console.log(`shots=${files.length} -> ${OUT}`);
gate(files.length >= 11, `截图齐(${files.length}>=11)`);
if (fails) { console.error(`S3 EVIDENCE FAIL (${fails})`); process.exit(1); }
console.log('S3 EVIDENCE PASS');
