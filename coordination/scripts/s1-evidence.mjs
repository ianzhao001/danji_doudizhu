#!/usr/bin/env node
/**
 * W-SHINE-S1 采证器(v1.6):P-BADGE-CLIP 12 图 + P-PUNCH 修后对照 + 结算态占位字验证。
 * 承 v10-verify:Playwright+CDP 全真实输入、fail-fast、零 pageErrors 门。
 * before 冻结件在 coordination/reports/UX-AUDIT-V16-evidence/(零改动);本脚本只写 W-SHINE-S1-evidence/。
 * 前置:build/web-mobile 为当前分支构建;7788 静态服务在线(仓根)。
 * 运行:cd coordination/scripts && node s1-evidence.mjs
 * 确定性:种子 14(纯逻辑狩猎产物:hero 地主+炸弹+胜局);合成战绩=真实一局的克隆,零 Math.random。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = path.resolve(ROOT, 'coordination/reports/W-SHINE-S1-evidence/shots');
const BASE = 'http://127.0.0.1:7788/build/web-mobile/';
const SEED_WIN = 14;
const VIEWPORTS = [
  { label: '844x390', width: 844, height: 390 },
  { label: '812x375', width: 812, height: 375 },
  { label: '915x412', width: 915, height: 412 },
  { label: '780x360', width: 780, height: 360 },
];
fs.mkdirSync(OUT, { recursive: true });

const HELPERS = fs.readFileSync(path.join(HERE, 'v10-verify.mjs'), 'utf8').match(/const HELPERS = `([\s\S]*?)`;/)[1];

let failures = 0;
const gate = (ok, msg) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) failures += 1;
};

async function session(viewport) {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const context = await browser.newContext({ viewport, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const evalIn = (expr) => page.evaluate(`(() => { ${HELPERS}; return (${expr}); })()`);
  const tap = async (point, settle = 480) => {
    const pt = { x: Math.round(point.x), y: Math.round(point.y), id: 0, radiusX: 1, radiusY: 1 };
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
    await page.waitForTimeout(60);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(settle);
  };
  const tapTarget = async (nameOrLabel, settle = 480) => {
    const p = await evalIn(`btnPoint(${JSON.stringify(nameOrLabel)})`);
    if (!p.ok) throw new Error(`button not found: ${nameOrLabel} @scene=${await evalIn('sceneName()')}`);
    await tap(p, settle);
    return p;
  };
  const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
  const boot = async (seed) => {
    await page.goto(`${BASE}?seed=${seed}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate(() => {
      localStorage.removeItem('doudizhu.save');
      localStorage.removeItem('doudizhu.records');
      localStorage.removeItem('doudizhu.stats');
      localStorage.setItem('doudizhu.settings', JSON.stringify({ sound: false, vibration: false, animation: true, difficulty: 'simple' }));
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, undefined, { timeout: 90000, polling: 300 });
    await page.waitForTimeout(1400);
  };
  return { browser, page, errors, evalIn, tap, tapTarget, shot, boot };
}

// ---- 第 1 段:四横屏 × 三难度角标 12 图 + 对局态暂停钮 4 图(P-BADGE-CLIP/PL-01/PL-07) ----
for (const vp of VIEWPORTS) {
  const s = await session(vp);
  await s.boot(SEED_WIN);
  await s.shot(`badge-simple-${vp.label}`);
  await s.tapTarget('difficulty-option-normal', 620);
  await s.shot(`badge-normal-${vp.label}`);
  await s.tapTarget('difficulty-option-hard', 620);
  await s.shot(`badge-hard-${vp.label}`);
  // 恢复 simple,进对局拍暂停钮新位(顶栏下一行右侧,不与徽标群叠压)
  await s.tapTarget('difficulty-option-simple', 620);
  await s.tapTarget('home-start-button', 900);
  await s.page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, undefined, { timeout: 30000, polling: 250 });
  await s.page.waitForTimeout(1500);
  const pauseBtn = await s.evalIn(`btnPoint('pause-open-button')`);
  gate(pauseBtn.ok, `${vp.label} 暂停钮可定位`);
  gate(pauseBtn.ok && pauseBtn.x < vp.width - 4 && pauseBtn.x > vp.width - 90, `${vp.label} 暂停钮中心在右缘内(${Math.round(pauseBtn.x)})`);
  await s.shot(`pause-position-${vp.label}`);
  gate(s.errors.length === 0, `${vp.label} pageErrors=0 (${JSON.stringify(s.errors)})`);
  await s.browser.close();
}

// ---- 第 2 段:@844 弹层修后对照 + 暂停链 + 种子 14 打满至胜局(PL-02/03/04/05/06/08) ----
{
  const vp = VIEWPORTS[0];
  const s = await session(vp);
  await s.boot(SEED_WIN);
  // 教程/帮助(修后:按钮 100 宽、页码内收、正文 30 字折行)
  await s.tapTarget('entry-tutorial-button', 700);
  await s.shot('panel-tutorial-after-844x390');
  await s.tapTarget('tutorial-skip-button', 600);
  await s.tapTarget('entry-help-button', 700);
  await s.shot('panel-help-after-844x390');
  await s.tapTarget('help-back-button', 600);
  // 战绩空态(修后:空态不再与零值行叠压)
  await s.tapTarget('entry-stats-button', 700);
  await s.shot('panel-stats-empty-after-844x390');
  await s.tapTarget('stats-records-button', 700);
  await s.shot('panel-records-empty-after-844x390');
  await s.tapTarget('records-back-button', 600);

  // 种子 14 真实打满一局至胜局:结算态验证 PL-08(底部无「玩家手牌」游离字)
  await s.tapTarget('home-start-button', 900);
  await s.page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, undefined, { timeout: 30000, polling: 250 });
  await s.page.waitForTimeout(1400);
  // 暂停链修后:菜单(六钮 92 宽)与确认层
  await s.tapTarget('pause-open-button', 700);
  await s.shot('pause-menu-after-844x390');
  await s.tapTarget('退出', 600);
  await s.shot('pause-confirm-after-844x390');
  await s.tapTarget('取消', 500);
  await s.tapTarget('继续', 700);
  // 叫抢到 playing(真实点击)
  for (let i = 0; i < 40; i += 1) {
    const phase = await s.evalIn(`findSkeleton()?.runtime?.phase?.() ?? null`);
    if (phase === 'playing') break;
    let acted = false;
    for (const t of ['叫地主', '抢地主', '抢']) {
      const b = await s.evalIn(`btnPoint(${JSON.stringify(t)})`);
      if (b.ok) { await s.tap(b); acted = true; break; }
    }
    if (!acted) await s.page.waitForTimeout(420);
  }
  // hero 策略打满(与 v10-verify heroStep 同构:领出打炸弹/王炸/最小单,跟牌压单/过)
  for (let step = 0; step < 220; step += 1) {
    const info = await s.evalIn('turnInfo()');
    if (info.settled) break;
    if (!info.myTurn || info.phase !== 'playing') { await s.page.waitForTimeout(320); continue; }
    const cards = await s.evalIn('handCards()');
    if (!cards.length) { await s.page.waitForTimeout(320); continue; }
    const byRank = new Map();
    for (const c of cards) { const g = byRank.get(c.rank) ?? []; g.push(c); byRank.set(c.rank, g); }
    const bomb = [...byRank.values()].find((g) => g.length === 4);
    const jokers = [16, 17].every((r) => byRank.has(r)) ? [byRank.get(16)[0], byRank.get(17)[0]] : null;
    const leading = !info.top || info.top.seat === 0;
    const play = async (targets) => {
      for (const c of targets) await s.tap({ x: c.x, y: c.y }, 220);
      await s.tapTarget('出牌', 200);
    };
    if (leading) {
      if (bomb) { await play(bomb); continue; }
      if (jokers) { await play(jokers); continue; }
      await play([cards[0]]);
      continue;
    }
    if (info.top.count === 1) {
      const beat = cards.find((c) => c.rank > info.top.maxRank);
      if (beat) { await play([beat]); continue; }
    }
    let passed = false;
    for (const label of ['要不起', '不要']) {
      const b = await s.evalIn(`btnPoint(${JSON.stringify(label)})`);
      if (b.ok) { await s.tap(b, 220); passed = true; break; }
    }
    if (!passed) await s.page.waitForTimeout(300);
  }
  const fin = await s.evalIn('turnInfo()');
  gate(fin.settled === true, `seed14 打满至结算(settled=${fin.settled})`);
  gate(Array.isArray(fin.scores) && fin.scores[0] > 0, `seed14 胜局(scores=${JSON.stringify(fin.scores)})`);
  await s.page.waitForTimeout(1600);
  const strayHandTitle = await s.evalIn(`(() => { const n = nodeByName('hand-title'); return Boolean(n && n.activeInHierarchy); })()`);
  gate(strayHandTitle === false, 'PL-08 结算态无「玩家手牌」游离字(hand-title 不在场)');
  await s.shot('settled-no-stray-after-844x390');

  // 返回大厅→战绩非空态;克隆真实战绩到 4 条拍历史 4 行(PL-02 几何验证,零随机)
  await s.tapTarget('返回大厅', 1200);
  await s.page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, undefined, { timeout: 30000, polling: 300 });
  await s.page.waitForTimeout(1200);
  await s.tapTarget('entry-stats-button', 700);
  await s.shot('panel-stats-nonempty-after-844x390');
  await s.tapTarget('stats-back-button', 600);
  const cloned = await s.page.evaluate(() => {
    const raw = localStorage.getItem('doudizhu.records');
    if (!raw) return 'no-records';
    const parsed = JSON.parse(raw);
    const arrKey = Array.isArray(parsed) ? null : Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
    const arr = arrKey === null ? parsed : parsed[arrKey];
    if (!arr.length) return 'empty-records';
    while (arr.length < 4) arr.push(JSON.parse(JSON.stringify(arr[0])));
    localStorage.setItem('doudizhu.records', JSON.stringify(parsed));
    return `cloned-to-${arr.length}`;
  });
  gate(/cloned-to-4/.test(cloned), `战绩克隆到 4 条(${cloned})`);
  await s.page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await s.page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, undefined, { timeout: 90000, polling: 300 });
  await s.page.waitForTimeout(1400);
  await s.tapTarget('entry-records-button', 700);
  await s.shot('panel-records-4rows-after-844x390');
  gate(s.errors.length === 0, `844x390 主链 pageErrors=0 (${JSON.stringify(s.errors)})`);
  await s.browser.close();
}

const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.png'));
console.log(`shots=${files.length} -> ${OUT}`);
gate(files.length >= 25, `截图齐(${files.length}>=25)`);
if (failures > 0) {
  console.error(`S1 EVIDENCE FAIL (${failures})`);
  process.exit(1);
}
console.log('S1 EVIDENCE PASS');
