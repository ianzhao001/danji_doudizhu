#!/usr/bin/env node
/**
 * W-SHINE-S4 采证器(v1.6 二次终审整改批·4 条 + 设计原则举一反三)。
 * 承 s3-evidence:真实 CDP 触控输入、fail-fast、零 pageErrors。
 *
 * 相对 S3 的新增(把「肉眼看」升级成「机检硬门」——用户已两次驳回文字问题):
 *   门 A 文字溢出(本脚本):全场 Label 断言 overflow=SHRINK(唯 NONE 会溢出),零例外;
 *   门 B 文字压线(s4-image-gates.py):文字盒必须落在底图「实测净区」内——阈值不拍脑袋,从皮的 PNG 量;
 *   门 C 文字可读(s4-image-gates.py):本脚本导出每个 Label 的「声明字色 + 视口矩形 + 底图盒」,
 *        Python 在真实截图上取该矩形的底色众数算对比度,门槛 AA 4.5:1。此门即为捕获
 *        「v15 深底皮→v18 浅底皮换肤后浅奶油字只剩 1.22:1」这一类回归而设。
 *   底图归属用「世界包围盒包含」判定,不用「最近的 Sprite」——后者会把文字旁边的小徽标当成底图。
 *   段 2/3 结算全链:补 mustPass('要不起')驱动,真正打到结算面板采证(S3 从未打到)。
 *
 * 前置:build/web-mobile 为当前分支构建;仓根起 http://127.0.0.1:7789。
 * 运行:cd coordination/scripts && node s4-evidence.mjs && python3 s4-image-gates.py
 * 种子 14(hero 地主 + 炸弹 + 胜局)。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = path.resolve(ROOT, 'coordination/reports/W-SHINE-S4-evidence/shots');
const META_OUT = path.resolve(ROOT, 'coordination/reports/W-SHINE-S4-evidence/labels');
const BASE = 'http://127.0.0.1:7789/build/web-mobile/';
const SEED = 14;
const VIEWPORTS = [
  { label: '844x390', width: 844, height: 390 },
  { label: '812x375', width: 812, height: 375 },
  { label: '915x412', width: 915, height: 412 },
  { label: '780x360', width: 780, height: 360 },
];
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(META_OUT, { recursive: true });
const HELPERS = fs.readFileSync(path.join(HERE, 'v11-verify.mjs'), 'utf8').match(/const HELPERS = `([\s\S]*?)`;/)[1];

let fails = 0;
const gate = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) fails += 1; };

/**
 * 全场 Label 快照:overflow 模式、文字盒、最近的皮肤底图盒、声明字色、视口矩形。
 * 视口矩形交给 Python 在截图上取底色众数——声明字色即字芯,矩形众数即底色,无需切字。
 */
const SNAP = `(() => {
  const cc = globalThis.cc;
  const OF = ['NONE', 'CLAMP', 'SHRINK', 'RESIZE_HEIGHT'];
  const TY = ['SIMPLE', 'SLICED', 'TILED', 'FILLED'];
  const canvasComp = cc.director.getScene().getComponentInChildren(cc.Canvas);
  const cam = canvasComp.cameraComponent;
  const domRect = document.getElementById('GameCanvas').getBoundingClientRect();
  const cs = cc.view.getCanvasSize();
  const kx = domRect.width / cs.width;
  const ky = domRect.height / cs.height;
  const canvasArea = cs.width * cs.height;
  const utOf = (n) => n._uiProps?.uiTransformComp ?? n.getComponent('cc.UITransform') ?? null;

  // 模态遮挡:暂停/结算面板的根(pause-overlay-runtime / settlement-overlay-runtime)自带压暗黑幕
  // (drawDimOverlay,overlayScrim α=218)。幕后 Label 的屏上字色已被黑幕压暗,「声明字色」不再等于
  // 实际字芯,拿去和(同样被压暗的)底色比会算出荒谬的低对比——对比度门必须跳过幕后的字。
  // 按节点名认模态:cc.BlockInputEvents 的类引用在构建包里 getComponent 取不到(同 cc.UITransform)。
  const MODAL_ROOTS = ['pause-overlay-runtime', 'settlement-overlay-runtime'];
  const modals = [];
  walkNodes((n) => { if (n.activeInHierarchy && MODAL_ROOTS.includes(n.name)) modals.push(n); return false; });
  const under = (n, root) => { let c = n; while (c) { if (c === root) return true; c = c.parent; } return false; };

  // 全量 Sprite:icon 变形门要的是「SIMPLE 精灵的 rect 长宽比 vs 真实显示框长宽比」——
  // SLICED 九宫格按设计就是要拉伸的,拿原图比例去卡它是错的判据。
  const sprites = [];
  walkNodes((n) => {
    if (!n.activeInHierarchy) return false;
    const sp = n.getComponent(cc.Sprite);
    if (!sp || !sp.spriteFrame) return false;
    const sut = utOf(n);
    if (!sut) return false;
    const rc = sp.spriteFrame.rect;
    sprites.push({
      node: n.name,
      spr: sp.spriteFrame.name || n.name,
      type: TY[sp.type],
      box: [Math.round(sut.width), Math.round(sut.height)],
      rect: [Math.round(rc.width), Math.round(rc.height)],
    });
    return false;
  });

  const out = [];
  walkNodes((n) => {
    if (!n.activeInHierarchy) return false;
    const lab = n.getComponent(cc.Label);
    if (!lab || !String(lab.string).trim()) return false;
    const ut = utOf(n);
    if (!ut) return false;
    const bb = ut.getBoundingBoxToWorld();
    const p0 = cam.worldToScreen(new cc.Vec3(bb.x, bb.y, 0));
    const p1 = cam.worldToScreen(new cc.Vec3(bb.x + bb.width, bb.y + bb.height, 0));
    const x0 = domRect.left + Math.min(p0.x, p1.x) * kx;
    const x1 = domRect.left + Math.max(p0.x, p1.x) * kx;
    const yTop = domRect.top + domRect.height - Math.max(p0.y, p1.y) * ky;
    const yBot = domRect.top + domRect.height - Math.min(p0.y, p1.y) * ky;

    // 底图 = 「世界包围盒真正框住这个文字盒」的最小 Sprite(祖先自身,或祖先的直系子——皮通常是 label 的兄弟)。
    // 不能只取「最近的 Sprite」:顶栏文字旁边就是 22×22 的小徽标,会被误判成底图(实测 ratio 5.09)。
    let sprName = null; let sprType = null; let sprW = null; let sprH = null; let sprFullBleed = false;
    let sprRect = null;
    let best = Infinity;
    const consider = (sp) => {
      if (!sp || !sp.spriteFrame) return;
      const sut = utOf(sp.node);
      if (!sut) return;
      const sb = sut.getBoundingBoxToWorld();
      if (!(sb.x <= bb.x && sb.y <= bb.y && sb.x + sb.width >= bb.x + bb.width && sb.y + sb.height >= bb.y + bb.height)) return;
      const area = sb.width * sb.height;
      if (area >= best) return;
      best = area;
      sprName = sp.spriteFrame.name || sp.node.name;
      sprType = TY[sp.type];
      sprW = Math.round(sut.width);
      sprH = Math.round(sut.height);
      sprFullBleed = area >= canvasArea * 0.6; // 满屏场景底图不是「盖字皮」,只是场景本身
      // 皮的视口矩形:门B 要做「位置包含」判定(偏置的文字盒即便更小,也可能压到某一侧的描边)。
      const s0 = cam.worldToScreen(new cc.Vec3(sb.x, sb.y, 0));
      const s1 = cam.worldToScreen(new cc.Vec3(sb.x + sb.width, sb.y + sb.height, 0));
      const sx0 = domRect.left + Math.min(s0.x, s1.x) * kx;
      const sx1 = domRect.left + Math.max(s0.x, s1.x) * kx;
      const syT = domRect.top + domRect.height - Math.max(s0.y, s1.y) * ky;
      const syB = domRect.top + domRect.height - Math.min(s0.y, s1.y) * ky;
      sprRect = [Math.round(sx0), Math.round(syT), Math.round(sx1 - sx0), Math.round(syB - syT)];
    };
    // Graphics 画的自备底板(如结算「本局结算」标题的深莓小牌):门B 的净区判据只对 PNG 皮成立,
    // 这类字并不落在皮上——须排除,否则误判成「压在面板边框」。可读性仍由门C(像素级)覆盖。
    let graphicsBackdrop = false;
    const considerGraphics = (node) => {
      if (!node || !node.activeInHierarchy || !node.getComponent(cc.Graphics)) return;
      const gut = utOf(node);
      if (!gut) return;
      const gb = gut.getBoundingBoxToWorld();
      if (gb.width * gb.height >= canvasArea * 0.6) return; // 满屏黑幕/背板不算「自备底板」
      if (gb.x <= bb.x && gb.y <= bb.y && gb.x + gb.width >= bb.x + bb.width && gb.y + gb.height >= bb.y + bb.height) {
        graphicsBackdrop = true;
      }
    };
    let cur = n.parent;
    for (let i = 0; i < 3 && cur; i += 1) {
      consider(cur.getComponent(cc.Sprite));
      considerGraphics(cur);
      for (const c of cur.children) { consider(c.getComponent(cc.Sprite)); considerGraphics(c); }
      cur = cur.parent;
    }
    const c = lab.color;
    const raw = String(lab.string);
    out.push({
      node: n.name,
      text: raw.replace(/\\n/g, ' ').slice(0, 24),
      overflow: OF[lab.overflow],
      fontSize: lab.fontSize,
      // 字形带 = min(盒高, 行高×行数):Label 垂直居中,盒子再高字也只占这么高;
      // 而 SHRINK 会把长文案铺满盒宽 → 宽度上盒子才是硬约束。门B 据此判「字会不会压到描边」。
      lineHeight: lab.lineHeight,
      lines: raw.split('\\n').length,
      w: Math.round(ut.width),
      h: Math.round(ut.height),
      ink: [c.r, c.g, c.b, c.a],
      rect: [Math.round(x0), Math.round(yTop), Math.round(x1 - x0), Math.round(yBot - yTop)],
      sprName, sprType, sprW, sprH, sprFullBleed, sprRect, graphicsBackdrop,
      occluded: modals.length > 0 && !modals.some((m) => under(n, m)),
    });
    return false;
  });
  return { labels: out, sprites };
})()`;

async function session(viewport, seed = SEED) {
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
  const snap = () => page.evaluate(`(() => { ${HELPERS}; return ${SNAP}; })()`);
  /** 采一屏:截图 + Label/Sprite 快照(同名成对,供 s4-image-gates.py 逐 rect 取底色算对比)。 */
  const capture = async (name) => {
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    const data = await snap();
    fs.writeFileSync(path.join(META_OUT, `${name}.json`), JSON.stringify(data, null, 1));
    return data.labels;
  };
  const boot = async () => {
    await page.goto(`${BASE}?seed=${seed}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate(() => {
      localStorage.removeItem('doudizhu.save');
      localStorage.setItem('doudizhu.settings', JSON.stringify({ sound: false, vibration: false, animation: true, difficulty: 'normal' }));
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, undefined, { timeout: 90000, polling: 300 });
    await page.waitForTimeout(1400);
  };
  const toGame = async () => {
    await tapTarget('home-start-button', 900);
    await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, undefined, { timeout: 30000, polling: 250 });
    await page.waitForTimeout(1500);
  };
  const bidToPlaying = async () => {
    for (let i = 0; i < 40; i += 1) {
      if ((await evalIn(`findSkeleton()?.runtime?.phase?.() ?? null`)) === 'playing') break;
      let acted = false;
      for (const t of ['叫地主', '抢地主', '抢']) {
        const b = await evalIn(`btnPoint(${JSON.stringify(t)})`);
        if (b.ok) { await tap(b); acted = true; break; }
      }
      if (!acted) await page.waitForTimeout(400);
    }
    await page.waitForTimeout(900);
  };
  /** 自动打到结算。'要不起'(mustPass)与 '不要'(pass) 是两个不同文案——S3 只试了后者,故从未打到结算。 */
  const playToSettled = async () => {
    for (let i = 0; i < 320; i += 1) {
      const info = await evalIn('turnInfo()');
      if (info.settled) return true;
      if (!info.myTurn) { await page.waitForTimeout(200); continue; }
      const must = await evalIn(`btnPoint('要不起')`);
      if (must.ok) { await tap(must, 240); continue; }
      const hint = await evalIn(`btnPoint('提示')`);
      if (hint.ok) await tap(hint, 240);
      const play = await evalIn(`btnPoint('出牌')`);
      if (play.ok) { await tap(play, 240); continue; }
      const pass = await evalIn(`btnPoint('不要')`);
      if (pass.ok) { await tap(pass, 240); continue; }
      await page.waitForTimeout(240);
    }
    return (await evalIn('turnInfo()')).settled === true;
  };
  return { browser, page, errors, evalIn, tap, tapTarget, has, snap, capture, boot, toGame, bidToPlaying, playToSettled };
}

/** 门 A:一屏 Label 溢出断言(门B/门C 需要 PNG 净区与截图像素,交 s4-image-gates.py)。 */
function assertLabels(tag, rows) {
  const noneOnes = rows.filter((r) => r.overflow === 'NONE');
  gate(noneOnes.length === 0, `${tag} 门A 文字不溢出:${rows.length} 个 Label 全 SHRINK(NONE=${noneOnes.length})${noneOnes.length ? ' ← ' + noneOnes.map((r) => r.node).join(',') : ''}`);
}

// ---- 段 1:大厅四横屏(④单区域布局 + ⑤四入口移除) ----
for (const v of VIEWPORTS) {
  const s = await session({ width: v.width, height: v.height });
  await s.boot();
  assertLabels(`大厅@${v.label}`, await s.capture(`lobby-${v.label}`));
  for (const entry of ['entry-tutorial-button', 'entry-help-button', 'entry-stats-button', 'entry-records-button']) {
    gate((await s.has(entry)) === false, `大厅@${v.label} 入口已移除:${entry}`);
  }
  gate(await s.has('home-difficulty-toggle'), `大厅@${v.label} 难度切换按钮在场`);
  gate(s.errors.length === 0, `大厅@${v.label} pageErrors=0`);
  await s.browser.close();
}

// ---- 段 2:对局全相位 @844(叫牌/暂停/出牌/结算)+ AI 节奏实测 ----
{
  const s = await session({ width: 844, height: 390 });
  await s.boot();

  // 难度三态循环
  const labelOf = () => s.evalIn(`(() => { const n = nodeByName('home-difficulty-toggle'); if (!n) return null; const l = n.children.find((c) => c.name === 'button-label'); return l ? l.getComponent(globalThis.cc.Label).string : null; })()`);
  const seq = [];
  for (let i = 0; i < 4; i += 1) { seq.push(await labelOf()); await s.tapTarget('home-difficulty-toggle', 600); }
  gate(new Set(seq).size === 3, `难度切换循环三态(实测 ${JSON.stringify(seq)})`);

  await s.toGame();
  assertLabels('叫牌@844x390', await s.capture('bidding-844x390'));
  await s.tapTarget('pause-open-button', 700);
  assertLabels('暂停@844x390', await s.capture('pause-844x390'));
  await s.tapTarget('继续', 600);

  await s.bidToPlaying();
  assertLabels('出牌@844x390', await s.capture('playing-844x390'));

  // AI 节奏:hero 出一手 → 再轮到 hero(两 AI 各 ≥1s ⇒ ≥1800ms)
  const cards = await s.evalIn('handCards()');
  if (cards.length) {
    await s.tap({ x: cards[0].x, y: cards[0].y }, 220);
    const t0 = Date.now();
    const played = await s.evalIn(`btnPoint('出牌')`);
    if (played.ok) {
      await s.tap(played, 200);
      let elapsed = 0;
      for (let i = 0; i < 120; i += 1) {
        const info = await s.evalIn('turnInfo()');
        if (info.settled) break;
        if (info.myTurn && info.phase === 'playing') { elapsed = Date.now() - t0; break; }
        await s.page.waitForTimeout(120);
      }
      gate(elapsed >= 1800, `AI 节奏:hero 出牌→再轮到 hero ${elapsed}ms ≥1800ms(两 AI 各 ≥1s 保底)`);
    }
  }

  gate(await s.playToSettled(), '打到结算(mustPass 驱动)');
  await s.page.waitForTimeout(2800);
  assertLabels('结算@844x390', await s.capture('settled-844x390'));
  gate(s.errors.length === 0, `844 主链 pageErrors=0 ${JSON.stringify(s.errors)}`);
  await s.browser.close();
}

// ---- 段 3:780 最窄档全相位复验(文字溢出高危档) ----
{
  const s = await session({ width: 780, height: 360 });
  await s.boot();
  await s.toGame();
  assertLabels('叫牌@780x360', await s.capture('bidding-780x360'));
  await s.tapTarget('pause-open-button', 700);
  assertLabels('暂停@780x360', await s.capture('pause-780x360'));
  await s.tapTarget('继续', 600);
  await s.bidToPlaying();
  assertLabels('出牌@780x360', await s.capture('playing-780x360'));
  gate(await s.playToSettled(), '780 打到结算');
  await s.page.waitForTimeout(2800);
  assertLabels('结算@780x360', await s.capture('settled-780x360'));
  gate(s.errors.length === 0, `780 主链 pageErrors=0 ${JSON.stringify(s.errors)}`);
  await s.browser.close();
}

// ---- 段 4:胜局结算(牌匾走 tertiary 暖金皮;seed 14 自动打法恒负,故逐 seed 找一局胜) ----
{
  let won = false;
  for (const seed of [3, 5, 7, 9, 11, 2, 6]) {
    const s = await session({ width: 844, height: 390 }, seed);
    await s.boot();
    await s.toGame();
    await s.bidToPlaying();
    if (await s.playToSettled()) {
      const heroWon = await s.evalIn(`(() => { const r = findSkeleton()?.runtime?.settlement?.(); return r ? r.winners?.includes(0) ?? (r.heroWon === true) : null; })()`);
      const txt = await s.evalIn(`(() => { const n = nodeByName('result-title'); return n ? n.getComponent(globalThis.cc.Label).string : null; })()`);
      if (txt === '胜利') {
        await s.page.waitForTimeout(2600);
        assertLabels(`胜局结算@seed${seed}`, await s.capture('settled-win-844x390'));
        gate(s.errors.length === 0, `胜局链 pageErrors=0 (seed ${seed})`);
        console.log(`      胜局 seed=${seed} heroWon=${heroWon}`);
        won = true;
        await s.browser.close();
        break;
      }
    }
    await s.browser.close();
  }
  gate(won, '采到胜局结算(牌匾 tertiary 暖金皮)');
}

const shots = fs.readdirSync(OUT).filter((f) => f.endsWith('.png'));
const metas = fs.readdirSync(META_OUT).filter((f) => f.endsWith('.json'));
gate(shots.length >= 13, `截图齐(${shots.length}>=13)`);
gate(shots.length === metas.length, `截图/Label 快照成对(${shots.length}=${metas.length})`);
console.log(`\nshots -> ${OUT}\nlabels -> ${META_OUT}`);
if (fails) { console.error(`S4 EVIDENCE FAIL (${fails})`); process.exit(1); }
console.log('S4 EVIDENCE PASS —— 下一步:python3 s4-image-gates.py(门C 对比度 + 门D 形状/线条/icon 比例)');
