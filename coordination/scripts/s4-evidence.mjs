#!/usr/bin/env node
/**
 * W-VISION-S4R 采证器(v1.7 视觉门重建)。
 * 承 s3-evidence:真实 CDP 触控输入、fail-fast、零 pageErrors。
 *
 * 相对 S3 的新增(把「肉眼看」升级成「机检硬门」——用户已两次驳回文字问题):
 *   门 A 文字溢出(本脚本):全场 Label 断言 overflow !== NONE(0),零例外;
 *   门 B 文字压线(s4-image-gates.py):文字盒必须落在底图「实测净区」内——阈值不拍脑袋,从皮的 PNG 量;
 *   门 C 文字可读(s4-image-gates.py):本脚本导出每个 Label 的「声明字色 + 视口矩形 + 底图盒」,
 *        Python 在真实截图上取该矩形的底色众数算对比度,门槛 AA 4.5:1。此门即为捕获
 *        「v15 深底皮→v18 浅底皮换肤后浅奶油字只剩 1.22:1」这一类回归而设。
 *   底图归属用「世界包围盒包含」判定,不用「最近的 Sprite」——后者会把文字旁边的小徽标当成底图。
 *   五视口均覆盖大厅、叫牌、出牌、暂停、结算;目录运行前清空,末尾按精确文件集合验收。
 *
 * 前置:build/web-mobile 为当前分支构建;仓根起 HTTP 服务(可用 S4_BASE 覆盖地址)。
 * 运行:cd coordination/scripts && node s4-evidence.mjs && python3 s4-image-gates.py
 * 种子 14(hero 地主 + 炸弹 + 胜局)。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = path.resolve(ROOT, 'coordination/reports/W-VISION-S4R-evidence/shots');
const META_OUT = path.resolve(ROOT, 'coordination/reports/W-VISION-S4R-evidence/labels');
const LINE_MANIFEST = path.resolve(ROOT, 'coordination/reports/W-VISION-COLOR-line-manifest.json');
const BASE = process.env.S4_BASE ?? 'http://127.0.0.1:7789/build/web-mobile/';
const SEED = 14;
const DPR_VALUES = [1, 2];
const VIEWPORTS = [
  { label: '844x390', width: 844, height: 390 },
  { label: '839x390', width: 839, height: 390 },
  { label: '812x375', width: 812, height: 375 },
  { label: '915x412', width: 915, height: 412 },
  { label: '780x360', width: 780, height: 360 },
];
// 整目录先删再建:不允许历史截图/快照替本轮补齐缺口,也不容许额外陈旧文件混进证据包。
fs.rmSync(OUT, { recursive: true, force: true });
fs.rmSync(META_OUT, { recursive: true, force: true });
fs.rmSync(LINE_MANIFEST, { force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(META_OUT, { recursive: true });
const CARD_FLIGHT_MID = path.join(OUT, 'card-flight-mid-844x390.png');
const HELPERS = fs.readFileSync(path.join(HERE, 'v11-verify.mjs'), 'utf8').match(/const HELPERS = `([\s\S]*?)`;/)[1] + `
function runtimeHandCards() {
  const sk = findSkeleton();
  const layer = nodeByName('card-layer-runtime');
  if (!layer) return [];
  return layer.children
    .filter((c) => c.activeInHierarchy && c.name.startsWith('card:') && c.__cardStageZone === 'hand')
    .sort((a, b) => a.position.x - b.position.x)
    .map((c) => {
      const key = c.name.slice('card:'.length);
      const p = vp(c);
      const placement = sk?.cardStage?.byKey?.get?.(key) ?? null;
      return {
        name: c.name,
        key,
        rank: Number(key.split(':')[0]),
        x: p.x,
        y: p.y,
        localX: c.position.x,
        localY: c.position.y,
        selected: placement?.selected === true,
      };
    });
}
function markCardNode(key, marker) {
  const layer = nodeByName('card-layer-runtime');
  const node = layer?.children?.find((c) => c.name === 'card:' + key) ?? null;
  if (!node) return false;
  node.__s3EvidenceMarker = marker;
  return true;
}
function cardMotionSample(key) {
  const sk = findSkeleton();
  const layer = nodeByName('card-layer-runtime');
  const node = layer?.children?.find((c) => c.name === 'card:' + key) ?? null;
  const terminal = sk?.cardStage?.byKey?.get?.(key) ?? null;
  if (!node || !terminal) return null;
  return {
    current: { x: node.position.x, y: node.position.y, scale: node.scale.x, angle: node.angle },
    terminal: { x: terminal.x, y: terminal.y, scale: terminal.scale, angle: terminal.angle },
    zone: node.__cardStageZone ?? null,
    marker: node.__s3EvidenceMarker ?? null,
  };
}
function cardLayerCensus() {
  const sk = findSkeleton();
  const layer = nodeByName('card-layer-runtime');
  if (!layer) return { totalChildren: 0, count: 0, expected: sk?.cardStage?.placements?.length ?? 0, names: [], invalid: [], duplicates: [] };
  const cards = layer.children.filter((c) => c.name.startsWith('card:'));
  const names = cards.map((c) => c.name).sort();
  return {
    totalChildren: layer.children.length,
    count: cards.length,
    expected: sk?.cardStage?.placements?.length ?? 0,
    names,
    invalid: cards.filter((c) => !c.isValid).map((c) => c.name),
    duplicates: names.filter((name, index) => names.indexOf(name) !== index),
  };
}
function nodeViewportRect(node) {
  const cc = globalThis.cc;
  const ut = node?._uiProps?.uiTransformComp ?? node?.getComponent?.(cc.UITransform) ?? null;
  if (!ut) return null;
  const canvasComp = cc.director.getScene().getComponentInChildren(cc.Canvas);
  const cam = canvasComp.cameraComponent;
  const domRect = document.getElementById('GameCanvas').getBoundingClientRect();
  const cs = cc.view.getCanvasSize();
  const bb = ut.getBoundingBoxToWorld();
  const p0 = cam.worldToScreen(new cc.Vec3(bb.x, bb.y, 0));
  const p1 = cam.worldToScreen(new cc.Vec3(bb.x + bb.width, bb.y + bb.height, 0));
  const x0 = domRect.left + Math.min(p0.x, p1.x) * (domRect.width / cs.width);
  const x1 = domRect.left + Math.max(p0.x, p1.x) * (domRect.width / cs.width);
  const y0 = domRect.top + domRect.height - Math.max(p0.y, p1.y) * (domRect.height / cs.height);
  const y1 = domRect.top + domRect.height - Math.min(p0.y, p1.y) * (domRect.height / cs.height);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}
function lastPlayMiniCensus() {
  // 三席「上一手」均只许文字药丸;禁令覆盖整棵场景树,不只查 hero。
  let pills = 0;
  const offending = [];
  const bounds = [];
  const outOfViewport = [];
  const viewport = document.getElementById('GameCanvas').getBoundingClientRect();
  walkNodes((node) => {
    if (node.name.startsWith('last-action-pill-') || node.name === 'last-play-emphasis') {
      if (node.name.startsWith('last-action-pill-')) pills += 1;
      const rect = nodeViewportRect(node);
      if (rect) {
        const row = { node: node.name, rect };
        bounds.push(row);
        if (rect.x < viewport.left - 0.5 || rect.y < viewport.top - 0.5
          || rect.x + rect.width > viewport.right + 0.5
          || rect.y + rect.height > viewport.bottom + 0.5) outOfViewport.push(row);
      }
    }
    if (node.name.startsWith('last-play-card-')) offending.push(node.name);
    return false;
  });
  return { pills, offending: offending.sort(), bounds, outOfViewport };
}
function enabledButtonPoint(nameOrLabel) {
  const node = nodeByName(nameOrLabel) ?? nodeByLabel(nameOrLabel);
  if (!node) return { ok: false, enabled: false, target: nameOrLabel };
  const point = btnPoint(nameOrLabel);
  const button = node.getComponent(globalThis.cc.Button);
  return { ...point, enabled: Boolean(button?.interactable) };
}
`;

let fails = 0;
const gate = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) fails += 1; };
const runtimeSpritesSeen = new Set();
const lineManifestByIdentity = new Map();
const rememberRuntimeSprites = (snapshot) => {
  for (const row of snapshot.sprites ?? []) runtimeSpritesSeen.add(row.spr);
};
const lineType = (sprite) => {
  if (/^btn-(?:primary|secondary|neutral)-c2$/.test(sprite)) return 'button';
  if (sprite === 'panel-popup-v19' || sprite === 'settlement-panel-v19') return 'panel';
  if (sprite === 'info-pill-c1' || sprite === 'pattern-label-v19') return 'pill';
  if (sprite === 'seat-nameplate-c1') return 'nameplate';
  return null;
};
const rememberLineManifest = (snapshot, viewport, dpr, state) => {
  for (const row of snapshot.sprites ?? []) {
    const type = lineType(row.spr);
    if (!type || !Array.isArray(row.vpRect)) continue;
    const [x, y, w, h] = row.vpRect;
    const entry = {
      viewport,
      dpr,
      state,
      key: row.spr,
      type,
      bbox: { x, y, w, h },
    };
    const identity = JSON.stringify(entry);
    lineManifestByIdentity.set(identity, entry);
  }
};

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
  const dpr = window.devicePixelRatio || 1;
  const cs = cc.view.getCanvasSize();
  const kx = domRect.width / cs.width;
  const ky = domRect.height / cs.height;
  const canvasArea = cs.width * cs.height;
  const utOf = (n) => n._uiProps?.uiTransformComp ?? n.getComponent('cc.UITransform') ?? null;
  const interactableOf = (n) => {
    let cur = n;
    while (cur) {
      const button = cur.getComponent(cc.Button);
      if (button) return button.interactable === false ? false : true;
      cur = cur.parent;
    }
    return undefined;
  };

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
    const sbb = sut.getBoundingBoxToWorld();
    const q0 = cam.worldToScreen(new cc.Vec3(sbb.x, sbb.y, 0));
    const q1 = cam.worldToScreen(new cc.Vec3(sbb.x + sbb.width, sbb.y + sbb.height, 0));
    const qx0 = domRect.left + Math.min(q0.x, q1.x) * kx;
    const qx1 = domRect.left + Math.max(q0.x, q1.x) * kx;
    const qyT = domRect.top + domRect.height - Math.max(q0.y, q1.y) * ky;
    const qyB = domRect.top + domRect.height - Math.min(q0.y, q1.y) * ky;
    const row = {
      node: n.name,
      owner: n.parent?.name ?? null,
      spr: sp.spriteFrame.name || n.name,
      type: TY[sp.type],
      box: [Math.round(sut.width), Math.round(sut.height)],
      world: [Math.round(sbb.width), Math.round(sbb.height)],
      vpRect: [
        Math.round(qx0 * dpr),
        Math.round(qyT * dpr),
        Math.round((qx1 - qx0) * dpr),
        Math.round((qyB - qyT) * dpr),
      ],
      rect: [Math.round(rc.width), Math.round(rc.height)],
      colorA: sp.color.a,
      occluded: modals.length > 0 && !modals.some((m) => under(n, m)),
    };
    const interactable = interactableOf(n);
    if (interactable !== undefined) row.interactable = interactable;
    sprites.push(row);
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
      sprW = Math.round(sb.width);
      sprH = Math.round(sb.height);
      sprFullBleed = area >= canvasArea * 0.6; // 满屏场景底图不是「盖字皮」,只是场景本身
      // 皮的视口矩形:门B 要做「位置包含」判定(偏置的文字盒即便更小,也可能压到某一侧的描边)。
      const s0 = cam.worldToScreen(new cc.Vec3(sb.x, sb.y, 0));
      const s1 = cam.worldToScreen(new cc.Vec3(sb.x + sb.width, sb.y + sb.height, 0));
      const sx0 = domRect.left + Math.min(s0.x, s1.x) * kx;
      const sx1 = domRect.left + Math.max(s0.x, s1.x) * kx;
      const syT = domRect.top + domRect.height - Math.max(s0.y, s1.y) * ky;
      const syB = domRect.top + domRect.height - Math.min(s0.y, s1.y) * ky;
      sprRect = [
        Math.round(sx0 * dpr),
        Math.round(syT * dpr),
        Math.round((sx1 - sx0) * dpr),
        Math.round((syB - syT) * dpr),
      ];
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
    const row = {
      node: n.name,
      text: raw.replace(/\\n/g, ' ').slice(0, 24),
      overflow: OF[lab.overflow],
      overflowValue: lab.overflow,
      fontSize: lab.fontSize,
      // 字形带 = min(盒高, 行高×行数):Label 垂直居中,盒子再高字也只占这么高;
      // 而 SHRINK 会把长文案铺满盒宽 → 宽度上盒子才是硬约束。门B 据此判「字会不会压到描边」。
      lineHeight: lab.lineHeight,
      lines: raw.split('\\n').length,
      w: Math.round(ut.width),
      h: Math.round(ut.height),
      ink: [c.r, c.g, c.b, c.a],
      rect: [
        Math.round(x0 * dpr),
        Math.round(yTop * dpr),
        Math.round((x1 - x0) * dpr),
        Math.round((yBot - yTop) * dpr),
      ],
      sprName, sprType, sprW, sprH, sprFullBleed, sprRect, graphicsBackdrop,
      occluded: modals.length > 0 && !modals.some((m) => under(n, m)),
    };
    const interactable = interactableOf(n);
    if (interactable !== undefined) row.interactable = interactable;
    out.push(row);
    return false;
  });
  return { labels: out, sprites };
})()`;

async function session(viewport, seed = SEED, deviceScaleFactor = 1) {
  const viewportLabel = `${viewport.width}x${viewport.height}`;
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
  const context = await browser.newContext({ viewport, hasTouch: true, deviceScaleFactor });
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
  const waitForAnimationIdle = async (timeout = 5000) => {
    const deadline = Date.now() + timeout;
    while (await has('anim-busy-runtime')) {
      if (Date.now() >= deadline) throw new Error(`anim-busy-runtime did not become idle within ${timeout}ms`);
      await page.waitForTimeout(20);
    }
  };
  const waitForAnimationBusy = async (timeout = 800) => {
    const deadline = Date.now() + timeout;
    while (!(await has('anim-busy-runtime'))) {
      if (Date.now() >= deadline) return false;
      await page.waitForTimeout(10);
    }
    return true;
  };
  const waitForCardFlightMid = async (key, origin, marker, timeout = 800) => {
    const deadline = Date.now() + timeout;
    // 只接受同一节点已经进 table、离开起点且尚未到终点的真中段；busy
    // 一旦结束就说明本轮中段已经错过，必须返回 null，不能拿最后一帧冒充。
    while (Date.now() < deadline) {
      if (!(await has('anim-busy-runtime'))) return null;
      const sample = await evalIn(`cardMotionSample(${JSON.stringify(key)})`);
      const movedFromOrigin = sample
        ? Math.hypot(sample.current.x - origin.x, sample.current.y - origin.y) > 2
        : false;
      const notAtTerminal = sample
        ? Math.hypot(sample.current.x - sample.terminal.x, sample.current.y - sample.terminal.y) > 2
        : false;
      if (sample?.marker === marker && sample.zone === 'table' && movedFromOrigin && notAtTerminal) return sample;
      await page.waitForTimeout(10);
    }
    return null;
  };
  const snap = () => page.evaluate(`(() => { ${HELPERS}; return ${SNAP}; })()`);
  const settleCompositor = async () => {
    await page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
    await page.waitForTimeout(120);
  };
  /** 采一屏:截图 + Label/Sprite 快照(同名成对,供 s4-image-gates.py 逐 rect 取底色算对比)。 */
  const capture = async (name) => {
    await waitForAnimationIdle();
    await settleCompositor();
    // WebGL 首张截图偶发拿到未完成合成的黑块帧；先无落盘预热一次，再等双 RAF
    // 写正式证据。预热图永不进入证据目录，精确集合门仍只认最终文件。
    await page.screenshot({ captureBeyondViewport: false });
    await settleCompositor();
    await page.screenshot({ path: path.join(OUT, `${name}.png`), captureBeyondViewport: false });
    const data = await snap();
    rememberRuntimeSprites(data);
    const state = name.replace(/-\d+x\d+(?:-dpr\d+)?$/, '');
    rememberLineManifest(data, viewportLabel, deviceScaleFactor, state);
    fs.writeFileSync(path.join(META_OUT, `${name}.json`), JSON.stringify(data, null, 1));
    return data;
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
    if ((await evalIn(`findSkeleton()?.runtime?.phase?.() ?? null`)) !== 'playing') {
      throw new Error('bidToPlaying did not reach playing within 40 attempts');
    }
    await page.waitForTimeout(900);
  };
  /** 自动打到结算。禁用按钮仍常驻于节点树，必须按 Button.interactable 选择动作。 */
  const playToSettled = async () => {
    for (let i = 0; i < 320; i += 1) {
      const info = await evalIn('turnInfo()');
      if (info.settled) {
        await waitForAnimationIdle();
        return true;
      }
      if (!info.myTurn) { await page.waitForTimeout(200); continue; }
      await waitForAnimationIdle();
      const must = await evalIn(`enabledButtonPoint('action-must-pass')`);
      if (must.enabled) { await tap(must, 240); continue; }
      const hint = await evalIn(`enabledButtonPoint('action-hint')`);
      if (hint.enabled) await tap(hint, 240);
      const play = await evalIn(`enabledButtonPoint('action-play')`);
      if (play.enabled) { await tap(play, 240); continue; }
      const pass = await evalIn(`enabledButtonPoint('action-pass')`);
      if (pass.enabled) { await tap(pass, 240); continue; }
      await page.waitForTimeout(240);
    }
    const settled = (await evalIn('turnInfo()')).settled === true;
    if (settled) await waitForAnimationIdle();
    return settled;
  };
  /** 让出牌签收态展示“选中牌 + 可点击主行动”，不把禁用按钮伪装成亮色。 */
  const selectRightmostCard = async () => {
    await waitForAnimationIdle();
    let cards = await evalIn('runtimeHandCards()');
    let selected = cards.filter((card) => card.selected);
    if (selected.length === 1) return selected[0];
    const candidate = cards.at(-1);
    if (!candidate) return null;
    await tap({ x: candidate.x, y: candidate.y }, 220);
    cards = await evalIn('runtimeHandCards()');
    selected = cards.filter((card) => card.selected);
    return selected.length === 1 ? selected[0] : null;
  };
  return {
    browser, page, errors, evalIn, tap, tapTarget, has,
    waitForAnimationIdle, waitForAnimationBusy, waitForCardFlightMid,
    snap, capture, boot, toGame, bidToPlaying, playToSettled, selectRightmostCard,
  };
}

/** 门 A:一屏 Label 溢出断言(门B/门C 需要 PNG 净区与截图像素,交 s4-image-gates.py)。 */
function assertLabels(tag, rows) {
  const noneOnes = rows.filter((r) => r.overflowValue === 0);
  gate(noneOnes.length === 0, `${tag} 门A 文字不溢出:${rows.length} 个 Label 均 overflow !== NONE(0), NONE=${noneOnes.length}${noneOnes.length ? ' ← ' + noneOnes.map((r) => r.node).join(',') : ''}`);
}

/**
 * 运行时资源消费门。期望值故意写成 SpriteFrame 名字面量,不读取 RESOURCE_PATHS/产品常量,
 * 防止「实现把路径改坏、门跟着同一个函数一起变绿」的自指门。
 */
function assertRuntimeSprites(tag, snapshot, expected) {
  const actual = new Set(snapshot.sprites.map((row) => row.spr));
  const missing = expected.filter((name) => !actual.has(name));
  gate(missing.length === 0,
    `${tag} 资源实际消费:${expected.length - missing.length}/${expected.length}${missing.length ? `, 缺 ${missing.join(',')}` : ''}`);
}

/** 节点到皮肤的精确归属门；期望仍是独立字面量，不从产品常量读取。 */
function assertButtonSkin(tag, snapshot, owner, expected) {
  const matches = snapshot.sprites.filter((row) => row.owner === owner && row.node === 'button-bg');
  gate(matches.length === 1 && matches[0].spr === expected,
    `${tag} 按钮皮:${owner}=${matches.map((row) => row.spr).join(',') || 'missing'} === ${expected}`);
}

/** 用真实按钮 SpriteFrame 证明：大按钮只有黄/绿两皮，银白只准顶部小暂停消费。 */
function assertTwoColorBigButtons(tag, snapshot) {
  const buttons = snapshot.sprites.filter((row) => row.node === 'button-bg');
  const bigButtons = buttons.filter((row) => row.owner !== 'pause-open-button');
  const allowed = new Set(['btn-primary-c2', 'btn-secondary-c2']);
  const actual = [...new Set(bigButtons.map((row) => row.spr))].sort();
  const invalid = bigButtons.filter((row) => !allowed.has(row.spr));
  const neutralViolations = buttons.filter((row) => row.spr === 'btn-neutral-c2' && row.owner !== 'pause-open-button');
  gate(actual.length === 2 && invalid.length === 0 && neutralViolations.length === 0,
    `${tag} 大按钮双色:${JSON.stringify(actual)} count=${actual.length}; 银白越界=${neutralViolations.map((row) => row.owner).join(',') || '0'}`);
}

// ---- 段 1:五视口 × DPR1/2 完整主链(大厅 + 叫牌 + 暂停 + 出牌 + 结算) ----
for (const dpr of DPR_VALUES) {
for (const v of VIEWPORTS) {
  const suffix = dpr === 1 ? '' : `-dpr${dpr}`;
  const runtimeTag = `${v.label}@DPR${dpr}`;
  const s = await session({ width: v.width, height: v.height }, SEED, dpr);
  await s.boot();

  const lobby = await s.capture(`lobby-${v.label}${suffix}`);
  assertLabels(`大厅@${runtimeTag}`, lobby.labels);
  assertRuntimeSprites(`大厅@${runtimeTag}`, lobby, ['btn-primary-c2', 'btn-secondary-c2']);
  assertTwoColorBigButtons(`大厅@${runtimeTag}`, lobby);
  for (const entry of ['entry-tutorial-button', 'entry-help-button', 'entry-stats-button', 'entry-records-button']) {
    gate((await s.has(entry)) === false, `大厅@${runtimeTag} 入口已移除:${entry}`);
  }
  gate(await s.has('home-difficulty-toggle'), `大厅@${runtimeTag} 难度切换按钮在场`);

  // 交互语义只需在基准视口跑一次;视觉相位仍在五视口逐一采齐。
  if (dpr === 1 && v.label === '844x390') {
    const labelOf = () => s.evalIn(`(() => { const n = nodeByName('home-difficulty-toggle'); if (!n) return null; const l = n.children.find((c) => c.name === 'button-label'); return l ? l.getComponent(globalThis.cc.Label).string : null; })()`);
    const seq = [];
    for (let i = 0; i < 4; i += 1) { seq.push(await labelOf()); await s.tapTarget('home-difficulty-toggle', 600); }
    gate(new Set(seq).size === 3, `难度切换循环三态(实测 ${JSON.stringify(seq)})`);
  }

  await s.toGame();
  const bidding = await s.capture(`bidding-${v.label}${suffix}`);
  assertLabels(`叫牌@${runtimeTag}`, bidding.labels);
  assertRuntimeSprites(`叫牌@${runtimeTag}`, bidding, [
    'card-template-v13', 'card-back-v13',
    'suit-spade-v13', 'suit-heart-v13', 'suit-club-v13', 'suit-diamond-v13',
    'info-pill-c1', 'seat-nameplate-c1', 'countdown-ring-v19',
    'btn-primary-c2', 'btn-secondary-c2', 'btn-neutral-c2',
  ]);
  assertTwoColorBigButtons(`叫牌@${runtimeTag}`, bidding);
  assertButtonSkin(`叫牌@${runtimeTag}`, bidding, 'bid-call', 'btn-primary-c2');
  assertButtonSkin(`叫牌@${runtimeTag}`, bidding, 'bid-pass', 'btn-secondary-c2');
  assertButtonSkin(`叫牌@${runtimeTag}`, bidding, 'pause-open-button', 'btn-neutral-c2');
  gate(!bidding.sprites.some((row) => row.spr === 'play-tray-c1' || row.node === 'play-tray-skin')
      && !bidding.labels.some((row) => row.node === 'play-tray-empty-label'),
    `叫牌@${runtimeTag} 中央托盘与空态文字皆不在场`);

  await s.tapTarget('pause-open-button', 700);
  const pause = await s.capture(`pause-${v.label}${suffix}`);
  assertLabels(`暂停@${runtimeTag}`, pause.labels);
  assertRuntimeSprites(`暂停@${runtimeTag}`, pause, ['panel-popup-v19', 'btn-primary-c2', 'btn-secondary-c2', 'btn-neutral-c2']);
  assertTwoColorBigButtons(`暂停@${runtimeTag}`, pause);
  assertButtonSkin(`暂停@${runtimeTag}`, pause, 'pause-continue', 'btn-primary-c2');
  assertButtonSkin(`暂停@${runtimeTag}`, pause, 'pause-restart', 'btn-secondary-c2');
  assertButtonSkin(`暂停@${runtimeTag}`, pause, 'pause-quit', 'btn-secondary-c2');
  await s.tapTarget('继续', 600);

  await s.bidToPlaying();
  const hierarchyCard = await s.selectRightmostCard();
  gate(Boolean(hierarchyCard), `出牌@${runtimeTag} 签收态恰选一张牌、主行动可展示`);
  const playing = await s.capture(`playing-${v.label}${suffix}`);
  assertLabels(`出牌@${runtimeTag}`, playing.labels);
  assertRuntimeSprites(`出牌@${runtimeTag}`, playing, [
    'btn-primary-c2', 'btn-secondary-c2', 'btn-neutral-c2', 'landlord-hat-v19', 'farmer-badge-v19',
  ]);
  assertTwoColorBigButtons(`出牌@${runtimeTag}`, playing);
  assertButtonSkin(`出牌@${runtimeTag}`, playing, 'action-play', 'btn-primary-c2');
  assertButtonSkin(`出牌@${runtimeTag}`, playing, 'action-pass', 'btn-secondary-c2');
  assertButtonSkin(`出牌@${runtimeTag}`, playing, 'action-hint', 'btn-secondary-c2');
  assertButtonSkin(`出牌@${runtimeTag}`, playing, 'pause-open-button', 'btn-neutral-c2');
  gate(!playing.sprites.some((row) => row.spr === 'play-tray-c1' || row.node === 'play-tray-skin')
      && !playing.labels.some((row) => row.node === 'play-tray-empty-label'),
    `出牌@${runtimeTag} 中央托盘与空态文字皆不在场`);
  if (dpr === 2 && v.label === '844x390') {
    const png = fs.readFileSync(path.join(OUT, `playing-${v.label}${suffix}.png`));
    const pngWidth = png.readUInt32BE(16);
    const pngHeight = png.readUInt32BE(20);
    gate(pngWidth === 1688 && pngHeight === 780,
      `DPR2 出牌大图尺寸 ${pngWidth}x${pngHeight} === 1688x780`);
  }

  if (dpr === 1 && v.label === '844x390') {
    // S3 飞行硬证据 + S4R 三席「上一手」去迷你牌门。
    const cards = await s.evalIn('runtimeHandCards()');
    gate(cards.length > 0, `hero 飞行中段:存在可选手牌(${cards.length})`);
    if (cards.length) {
      // 签收截图前已经从 CardStage 裸字段确认恰选一张；飞行证据直接复用该牌，
      // 避免再次点击把它取消选中。
      rememberRuntimeSprites(await s.snap());
      const selectedCards = (await s.evalIn('runtimeHandCards()')).filter((card) => card.selected);
      gate(selectedCards.length === 1,
        `hero 飞行中段:CardStage 裸字段确认恰好一张已选中 ${JSON.stringify(selectedCards.map((card) => card.key))}`);
      const selected = selectedCards.length === 1 ? selectedCards[0] : null;
      const marker = `s3-card-node-${Date.now()}`;
      const marked = selected
        ? await s.evalIn(`markCardNode(${JSON.stringify(selected.key)}, ${JSON.stringify(marker)})`)
        : false;
      gate(marked, `hero 飞行中段:出牌前真实 Node 可标记 key=${selected?.key ?? 'none'}`);
      await s.waitForAnimationIdle();
      gate((await s.has('anim-busy-runtime')) === false, 'hero 飞行中段:点击出牌前处于 idle');
      const t0 = Date.now();
      const played = await s.evalIn(`enabledButtonPoint('action-play')`);
      gate(played.ok && played.enabled, `hero 飞行中段:出牌按钮存在且 enabled ${JSON.stringify(played)}`);
      if (played.ok && played.enabled && selected) {
        await s.tap(played, 0);
        const busySeen = await s.waitForAnimationBusy();
        gate(busySeen, 'hero 飞行中段:anim-busy-runtime 已进入 busy');
        const mid = busySeen
          ? await s.waitForCardFlightMid(
              selected.key,
              { x: selected.localX, y: selected.localY },
              marker,
            )
          : null;
        const movedFromHand = selected && mid
          ? Math.hypot(mid.current.x - selected.localX, mid.current.y - selected.localY) > 2
          : false;
        const notAtTerminal = mid
          ? Math.hypot(mid.current.x - mid.terminal.x, mid.current.y - mid.terminal.y) > 2
          : false;
        const sameNodeInFlight = Boolean(mid && mid.marker === marker && mid.zone === 'table'
          && movedFromHand && notAtTerminal);
        if (sameNodeInFlight) await s.page.screenshot({ path: CARD_FLIGHT_MID });
        gate(sameNodeInFlight,
          `hero 飞行中段:同一 Node 标记保留、已离手牌且未到出牌终点 ${JSON.stringify(mid)}`);

        const lastPlayNow = await s.evalIn('lastPlayMiniCensus()');
        gate(lastPlayNow.pills > 0 && lastPlayNow.offending.length === 0
          && lastPlayNow.outOfViewport.length === 0,
        `全场上一手气泡只留文字、完整落屏、无 last-play-card-* 节点:${JSON.stringify(lastPlayNow)}`);

        await s.waitForAnimationIdle();
        gate((await s.has('anim-busy-runtime')) === false, 'anim-busy-runtime 观测到 true→false');
        let elapsed = 0;
        for (let i = 0; i < 120; i += 1) {
          const info = await s.evalIn('turnInfo()');
          if (info.settled) break;
          if (info.myTurn && info.phase === 'playing') { elapsed = Date.now() - t0; break; }
          await s.page.waitForTimeout(120);
        }
        gate(elapsed >= 1800, `AI 节奏:hero 出牌→再轮到 hero ${elapsed}ms ≥1800ms(两 AI 各 ≥1s 保底)`);
        const lastPlayAfterAi = await s.evalIn('lastPlayMiniCensus()');
        gate(lastPlayAfterAi.offending.length === 0 && lastPlayAfterAi.outOfViewport.length === 0,
          `AI 回合后全场气泡完整落屏且无 last-play-card-* 节点:${JSON.stringify(lastPlayAfterAi)}`);
      }
    }
  }

  gate(await s.playToSettled(), `${runtimeTag} 打到结算(mustPass 驱动)`);
  await s.page.waitForTimeout(2800);
  const settled = await s.capture(`settled-${v.label}${suffix}`);
  assertLabels(`结算@${runtimeTag}`, settled.labels);
  assertRuntimeSprites(`结算@${runtimeTag}`, settled, [
    'settlement-panel-v19', 'pattern-label-v19', 'btn-primary-c2', 'btn-secondary-c2',
  ]);
  assertTwoColorBigButtons(`结算@${runtimeTag}`, settled);
  assertButtonSkin(`结算@${runtimeTag}`, settled, 'result-new', 'btn-primary-c2');
  assertButtonSkin(`结算@${runtimeTag}`, settled, 'result-lobby', 'btn-secondary-c2');
  gate(s.errors.length === 0, `${runtimeTag} 主链 pageErrors=0 ${JSON.stringify(s.errors)}`);
  await s.browser.close();
}
}

// ---- 段 2:胜局结算(seed 14 自动打法恒负,故逐 seed 找一局胜) ----
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
        const settledWin = await s.capture('settled-win-844x390');
        assertLabels(`胜局结算@seed${seed}`, settledWin.labels);
        assertRuntimeSprites(`胜局结算@seed${seed}`, settledWin, ['settlement-panel-v19', 'pattern-label-v19', 'fx-star-v19']);
        gate(s.errors.length === 0, `胜局链 pageErrors=0 (seed ${seed})`);
        console.log(`      胜局 seed=${seed} heroWon=${heroWon}`);
        won = true;
        await s.browser.close();
        break;
      }
    }
    await s.browser.close();
  }
  gate(won, '采到胜局结算');
}

// ---- 段 3:S3 保留牌层泄漏门(同一场景真实连打 3 局) ----
{
  const s = await session({ width: 844, height: 390 }, SEED);
  await s.boot();
  await s.toGame();
  const steady = [];
  for (let round = 0; round < 3; round += 1) {
    await s.bidToPlaying();
    await s.waitForAnimationIdle();
    steady.push(await s.evalIn('cardLayerCensus()'));
    gate(await s.playToSettled(), `S3 泄漏门:第 ${round + 1} 局打到结算`);
    if (round < 2) await s.tapTarget('再来一局', 900);
  }
  await s.tapTarget('再来一局', 900);
  await s.bidToPlaying();
  await s.waitForAnimationIdle();
  const after = await s.evalIn('cardLayerCensus()');
  const baseline = steady[0]?.count ?? -1;
  const stable = (row) => row.count > 0 && row.totalChildren === row.count && row.count === row.expected
    && row.invalid.length === 0 && row.duplicates.length === 0;
  gate(baseline > 0 && steady.every((row) => stable(row) && row.count === baseline)
    && stable(after) && after.count === baseline,
  `card-layer-runtime 三局后回稳态 count=${baseline}, total=${steady.map((row) => row.totalChildren)}, starts=${steady.map((row) => row.count)}, after=${after.count}/${after.totalChildren}`);
  gate((await s.evalIn('fxCensus()')).length === 0, '三局后重开 fx-layer-runtime 为空');
  gate(s.errors.length === 0, `S3 三局泄漏链 pageErrors=0 ${JSON.stringify(s.errors)}`);
  await s.browser.close();
}

// W-VISION-COLOR 消费总门:卡面=v13、按钮=c2、药丸/名牌=c1、中央托盘零消费、其余皮相=v19。
const requiredRuntime = [
  'card-template-v13', 'card-back-v13',
  'suit-spade-v13', 'suit-heart-v13', 'suit-club-v13', 'suit-diamond-v13',
  'joker-small-v13', 'joker-big-v13',
  'btn-primary-c2', 'btn-secondary-c2', 'btn-neutral-c2',
  'info-pill-c1', 'seat-nameplate-c1', 'panel-popup-v19', 'settlement-panel-v19',
  'countdown-ring-v19', 'landlord-hat-v19', 'farmer-badge-v19',
  'pattern-label-v19', 'fx-star-v19',
];
const missingRuntime = requiredRuntime.filter((name) => !runtimeSpritesSeen.has(name));
gate(missingRuntime.length === 0,
  `R2 运行时消费总门:${requiredRuntime.length - missingRuntime.length}/${requiredRuntime.length}${missingRuntime.length ? `, 缺 ${missingRuntime.join(',')}` : ''}`);

const terminalBases = [
  ...DPR_VALUES.flatMap((dpr) => VIEWPORTS.flatMap((v) => (
    ['lobby', 'bidding', 'playing', 'pause', 'settled']
      .map((phase) => `${phase}-${v.label}${dpr === 1 ? '' : `-dpr${dpr}`}`)
  ))),
  'settled-win-844x390',
].sort();
const expectedShots = [
  ...terminalBases.map((name) => `${name}.png`),
  path.basename(CARD_FLIGHT_MID),
].sort();
const expectedMetas = terminalBases.map((name) => `${name}.json`).sort();
const shots = fs.readdirSync(OUT).sort();
const metas = fs.readdirSync(META_OUT).sort();
const setDelta = (actual, expected) => ({
  missing: expected.filter((name) => !actual.includes(name)),
  unexpected: actual.filter((name) => !expected.includes(name)),
});
const shotDelta = setDelta(shots, expectedShots);
const metaDelta = setDelta(metas, expectedMetas);
gate(shotDelta.missing.length === 0 && shotDelta.unexpected.length === 0,
  `截图精确集合 ${shots.length}/${expectedShots.length}:missing=${JSON.stringify(shotDelta.missing)}, unexpected=${JSON.stringify(shotDelta.unexpected)}`);
gate(metaDelta.missing.length === 0 && metaDelta.unexpected.length === 0,
  `Label 快照精确集合 ${metas.length}/${expectedMetas.length}:missing=${JSON.stringify(metaDelta.missing)}, unexpected=${JSON.stringify(metaDelta.unexpected)}`);
const lineManifest = [...lineManifestByIdentity.values()].sort((a, b) => (
  a.viewport.localeCompare(b.viewport)
  || a.dpr - b.dpr
  || a.type.localeCompare(b.type)
  || a.key.localeCompare(b.key)
  || a.bbox.y - b.bbox.y
  || a.bbox.x - b.bbox.x
));
fs.writeFileSync(LINE_MANIFEST, `${JSON.stringify(lineManifest, null, 2)}\n`);
const missingLineGroups = [];
for (const dpr of DPR_VALUES) {
  for (const viewport of VIEWPORTS.map((v) => v.label)) {
    const rows = lineManifest.filter((row) => row.viewport === viewport && row.dpr === dpr);
    for (const type of ['button', 'panel', 'pill', 'nameplate']) {
      if (!rows.some((row) => row.type === type)) missingLineGroups.push(`${viewport}@DPR${dpr}:${type}`);
    }
  }
}
gate(lineManifest.length > 0 && missingLineGroups.length === 0
    && lineManifest.every((row) => row.key !== 'play-tray-c1'),
  `线条 manifest ${lineManifest.length} 条，五视口×DPR1/2×4类齐全，托盘条目=0; missing=${JSON.stringify(missingLineGroups)}`);
console.log(`\nshots -> ${OUT}\nlabels -> ${META_OUT}\nline manifest -> ${LINE_MANIFEST}`);
if (fails) { console.error(`S4R EVIDENCE FAIL (${fails})`); process.exit(1); }
console.log('S4R EVIDENCE PASS —— 下一步:python3 s4-image-gates.py(门B/C/D/E/F)');
