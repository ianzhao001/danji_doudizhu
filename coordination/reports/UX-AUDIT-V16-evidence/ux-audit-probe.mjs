#!/usr/bin/env node
// 规划者 v1.6 开版体验走查临时探针(用后即删)。借 v10-verify 的 HELPERS 思路,只截图不断言。
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.env.UX_OUT || '/tmp/ux-audit';
const BASE = 'http://127.0.0.1:7788/build/web-mobile/';
fs.mkdirSync(OUT, { recursive: true });

const HELPERS = fs.readFileSync(new URL('./v10-verify.mjs', import.meta.url), 'utf8').match(/const HELPERS = `([\s\S]*?)`;/)[1];

async function run(viewport, tag) {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const context = await browser.newContext({ viewport, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const evalIn = (expr) => page.evaluate(`(() => { ${HELPERS}; return (${expr}); })()`);
  const tap = async (point, settle = 500) => {
    const pt = { x: Math.round(point.x), y: Math.round(point.y), id: 0, radiusX: 1, radiusY: 1 };
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
    await page.waitForTimeout(60);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(settle);
  };
  const tapTarget = async (nameOrLabel, settle = 500) => {
    const p = await evalIn(`btnPoint(${JSON.stringify(nameOrLabel)})`);
    if (!p.ok) { console.log(`  [miss] ${nameOrLabel}`); return false; }
    await tap(p, settle);
    return true;
  };
  const shot = (name) => page.screenshot({ path: `${OUT}/${tag}-${name}.png` });
  const boot = async () => {
    await page.goto(`${BASE}?seed=1`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate(() => {
      localStorage.removeItem('doudizhu.save');
      localStorage.setItem('doudizhu.settings', JSON.stringify({ sound: false, vibration: false, animation: true, difficulty: 'simple' }));
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, undefined, { timeout: 90000, polling: 300 });
    await page.waitForTimeout(1500);
  };

  await boot();
  // 1) lobby 四弹层
  for (const label of ['教程', '帮助', '战绩', '历史']) {
    if (await tapTarget(label, 700)) {
      await shot(`lobby-panel-${label}`);
      // 尝试关闭:常见关闭词
      let closed = false;
      for (const c of ['关闭', '返回', '知道了', '我知道了', '完成', '确定', '✕', 'X']) {
        if (await tapTarget(c, 500)) { closed = true; break; }
      }
      if (!closed) { await boot(); }
    }
  }
  // 2) 进对局→暂停面板两级
  await tapTarget('home-start-button', 900);
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, undefined, { timeout: 30000, polling: 250 });
  await page.waitForTimeout(1600);
  await shot('game-bidding-raw');
  if (await tapTarget('pause-open-button', 700)) {
    await shot('pause-menu');
    if (await tapTarget('退出', 600)) await shot('pause-confirm-quit');
    await tapTarget('取消', 500);
    await tapTarget('继续', 600);
  }
  // 3) 叫地主进 playing,存档恢复流
  for (let i = 0; i < 40; i += 1) {
    const phase = await evalIn(`findSkeleton()?.runtime?.phase?.() ?? null`);
    if (phase === 'playing') break;
    let acted = false;
    for (const t of ['叫地主', '抢地主', '抢']) {
      const b = await evalIn(`btnPoint(${JSON.stringify(t)})`);
      if (b.ok) { await tap(b); acted = true; break; }
    }
    if (!acted) await page.waitForTimeout(420);
  }
  await page.waitForTimeout(800);
  await shot('game-playing');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, undefined, { timeout: 90000, polling: 300 });
  await page.waitForTimeout(1500);
  await shot('lobby-with-save');
  if (await tapTarget('继续对局', 1200)) {
    await page.waitForTimeout(1200);
    await shot('game-resumed');
  }
  console.log(`[${tag}] pageErrors=${JSON.stringify(errors)}`);
  await browser.close();
}

await run({ width: 844, height: 390 }, 'a844');
await run({ width: 780, height: 360 }, 'b780');
console.log('UX AUDIT SHOTS DONE ->', OUT);
