/**
 * W-VISION S4R 全元素 zone 契约失败测试 v3（规划者预写种子 · 2026-07-15 · sota2）。
 *
 * 落位机制：Codex 开工 S4R 时将本文件**原样复制**到 `test/ui/table-zones.test.ts`（覆盖 v2），
 * 独立 commit「seed(W-VISION-S4R): relocate planner seeds」；内容一字不得改动，
 * 审查者对 seeds 源文件与落位文件做逐字节一致核。
 *
 * ── 版本沿革 ──
 *   v1（S2 首版）：二维布局契约，可见集含名牌漏项。
 *   v2（344721f，S4 复审补丁）：三名牌纳入可见集 + ④b「名牌不被功能元素压住」——
 *      main 上红出 turnTimer×heroNameplate −44/−42/−48/−36。
 *   v3（本版，用户视觉验收打回 2026-07-15）：构图重排契约——
 *      ② 按钮带右锚→**底部居中**（|centerX/w−0.5| ≤ 0.03）；
 *      ⑦ turnTimer 迁**按钮带左翼**（同带同高、右缘距按钮 8~24px）——④b 的 −44 由此转绿；
 *      ⑧ statusLine **上移托盘上方**（dock 之下、dropZoneHero 之上，两向 ≥8）；
 *      ⑨ heroHandLarge **左右对称**（中心≡画布中心 ≤2px，根除「墩牌相对手牌偏左」）；
 *      ⑩ 左右立绘**贴本席落点带**（右缘/左缘距 dropZone 0~12px、底边对齐 ≤4px）——
 *         用户标注「距离牌桌过远」的构图修正；立绘仍留强约束集外（可与桌面层叠）；
 *      ⑪ 名牌载字最小宽 ≥96（收窄让出 dropZone ≥8 间距的同时不许压垮文字）；
 *      ⑫ 名牌在宿主立绘**头顶**且分离 ≥8——2026-07-05 用户裁定「名牌不得贴附立绘」
 *         不可复辟（T-LAYOUT4 同款判据，随立绘贴桌重排一并锚死新落点）；
 *      可见集出集：legacy opponentLeft/Right 零渲染幽灵区移出（锚点关系由落点分区断言保留）。
 *      视口矩阵 +839×390（用户实际窗口 2.151 比例档）。
 *
 * ── 预期红因（S4R 实现前，main 上；规划者已验证）──
 *   ② 红：actionBar centerX/w=0.841；⑦ 红：timer 钉左下 x=8，距按钮 486px；
 *   ⑧ 红：statusLine 在托盘下方（y=263）；⑨ 红：手牌中心 473.5 vs 422（左槽不对称）;
 *   ⑩ 红：左立绘右缘 97 距 dropZoneLeft 25px、底差 59px（钉屏幕角）；
 *   ④b/playing 集续红：turnTimer×heroNameplate −44/−42/−48/−36（v2 既有）。
 *   新几何已由规划者五视口预验证全绿（含 780×360 垂直预算咽喉与 839×390 新档），转绿有解。
 */
import { describe, expect, it } from 'vitest';
import { tableLayout, type Rect } from '../../assets/scripts/ui/table-layout';
import { tableZones, type TableZones } from '../../assets/scripts/ui/table-zones';

const LANDSCAPE_RESOLUTIONS: Array<[number, number]> = [
  [844, 390],
  [812, 375],
  [915, 412],
  [780, 360],
  [839, 390],
];

const MIN_GAP = 8;
/** 得物 DW-A17：按钮 L 档高 44。与运行时交互热区门同一数字。 */
const MIN_TOUCH = 44;
/** 目标牌面 64×90（标准扑克 5:7 比例）——手牌区必须容得下。 */
const MIN_HAND_HEIGHT = 90;
/** 名牌载字最小宽（「左家 17张/农民」两行在 SHRINK 下的可读下限）。 */
const MIN_PLATE_WIDTH = 96;

/** 两矩形分离间距：任一轴向正向分离取最大；相交为负。 */
function rectGap(a: Rect, b: Rect): number {
  return Math.max(
    a.x - (b.x + b.width),
    b.x - (a.x + a.width),
    a.y - (b.y + b.height),
    b.y - (a.y + a.height),
  );
}

const centerX = (r: Rect): number => r.x + r.width / 2;
const centerY = (r: Rect): number => r.y + r.height / 2;
const bottom = (r: Rect): number => r.y + r.height;
const right = (r: Rect): number => r.x + r.width;

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/** a 被 b 覆盖的面积占 a 的比例。 */
function coverage(a: Rect, b: Rect): number {
  const ix = Math.max(0, Math.min(right(a), right(b)) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(bottom(a), bottom(b)) - Math.max(a.y, b.y));
  return (ix * iy) / (a.width * a.height);
}

function centerBox(w: number, h: number): Rect {
  return { x: w * 0.3, y: h * 0.3, width: w * 0.4, height: h * 0.4 };
}

type ZoneName = keyof TableZones;

/** 全部 zone：落屏内 + 正面积（含隐藏件，保留旧断言）。 */
const ALL_ZONES: ZoneName[] = [
  'infoStrip',
  'bottomCardsDock',
  'dropZoneLeft',
  'dropZoneRight',
  'dropZoneHero',
  'statusLine',
  'actionBar',
  'strengthMeter',
  'turnTimer',
  'memoryDock',
  'advisorDock',
  'heroBody',
  'opponentLeftBody',
  'opponentRightBody',
  'heroNameplate',
  'opponentLeftNameplate',
  'opponentRightNameplate',
  'heroHandLarge',
  'tableActionBar',
];

/** 叫抢相位真正渲染的功能元素。 */
const BIDDING_VISIBLE: ZoneName[] = [
  'topBar',
  // v3 出集(2026-07-15):legacy `opponentLeft/opponentRight` 是**零渲染的幽灵区**——
  // 运行时无任何元素画在这两个矩形里,它们只作 dropY/dropZone.x 的锚点(锚点关系由
  // 「落点分区」断言保留)。按 S4 事故方法论「载字或可点=必须在集内」的逆命题:
  // 两者皆非且零渲染=必须出集,否则立绘贴桌重排会被幽灵区卡死。
  'bottomCardsDock',
  'statusLine',
  'actionBar',
  'heroHandLarge',
  // S4 复审补入(2026-07-15):名牌是**载字的功能元素**,首版契约把它们和装饰性立绘一起排除在
  // 强约束集之外——直接导致 `turnTimer` 压住 `heroNameplate` 36~48px(四视口全中)漏到实机。
  // 「元素重叠」是用户点名的四类硬伤之首。立绘(*Body)仍留在集外(可与桌面层叠,是设计意图)。
  'heroNameplate',
  'opponentLeftNameplate',
  'opponentRightNameplate',
];

/** 出牌相位真正渲染的功能元素（+ 三处落点 + 计时）。 */
const PLAYING_VISIBLE: ZoneName[] = [
  ...BIDDING_VISIBLE,
  'dropZoneHero',
  'dropZoneLeft',
  'dropZoneRight',
  'turnTimer',
];

describe('W-VISION tableZones 横屏二维契约 v3（构图重排）', () => {
  for (const [w, h] of LANDSCAPE_RESOLUTIONS) {
    describe(`${w}x${h}`, () => {
      it('⑥ legacy 6 字段与 tableLayout 深相等（单一事实源）', () => {
        const zones = tableZones(w, h);
        const legacy = tableLayout(w, h);
        expect(zones.topBar).toEqual(legacy.topBar);
        expect(zones.opponentLeft).toEqual(legacy.opponentLeft);
        expect(zones.opponentRight).toEqual(legacy.opponentRight);
        expect(zones.playArea).toEqual(legacy.playArea);
        expect(zones.actionButtons).toEqual(legacy.actionButtons);
        expect(zones.playerHand).toEqual(legacy.playerHand);
      });

      it('全部 zone 落屏内且有正面积', () => {
        const zones = tableZones(w, h);
        for (const name of ALL_ZONES) {
          const r = zones[name];
          expect(r.width, `${name}.width`).toBeGreaterThan(0);
          expect(r.height, `${name}.height`).toBeGreaterThan(0);
          expect(r.x, `${name}.x`).toBeGreaterThanOrEqual(0);
          expect(r.y, `${name}.y`).toBeGreaterThanOrEqual(0);
          expect(right(r), `${name} 右缘`).toBeLessThanOrEqual(w);
          expect(bottom(r), `${name} 下缘`).toBeLessThanOrEqual(h);
        }
      });

      it(`bidding 可见集内两两间距 ≥${MIN_GAP}px`, () => {
        const zones = tableZones(w, h);
        for (let i = 0; i < BIDDING_VISIBLE.length; i++) {
          for (let j = i + 1; j < BIDDING_VISIBLE.length; j++) {
            const a = BIDDING_VISIBLE[i];
            const b = BIDDING_VISIBLE[j];
            expect(rectGap(zones[a], zones[b]), `${a} vs ${b}`).toBeGreaterThanOrEqual(MIN_GAP);
          }
        }
      });

      it(`playing 可见集内两两间距 ≥${MIN_GAP}px`, () => {
        const zones = tableZones(w, h);
        for (let i = 0; i < PLAYING_VISIBLE.length; i++) {
          for (let j = i + 1; j < PLAYING_VISIBLE.length; j++) {
            const a = PLAYING_VISIBLE[i];
            const b = PLAYING_VISIBLE[j];
            expect(rectGap(zones[a], zones[b]), `${a} vs ${b}`).toBeGreaterThanOrEqual(MIN_GAP);
          }
        }
      });

      it('① 出牌区 dropZoneHero 双轴居中，且覆盖中央盒 ≥55%', () => {
        const zones = tableZones(w, h);
        expect(Math.abs(centerX(zones.dropZoneHero) - w / 2), '横向居中').toBeLessThanOrEqual(16);
        expect(Math.abs(centerY(zones.dropZoneHero) - h / 2), '纵向居中').toBeLessThanOrEqual(h * 0.06);
        expect(coverage(centerBox(w, h), zones.dropZoneHero), '中央盒覆盖率').toBeGreaterThanOrEqual(0.55);
      });

      it('② 按钮条底部居中（用户打回：操作按钮应居中显示）+ 触控热区 + 不贴边', () => {
        const zones = tableZones(w, h);
        const bar = zones.actionBar;
        expect(Math.abs(centerX(bar) / w - 0.5), '水平居中').toBeLessThanOrEqual(0.03);
        expect(centerY(bar) / h, '靠下').toBeGreaterThan(0.58);
        expect(bar.height, '按钮条高').toBeGreaterThanOrEqual(MIN_TOUCH);
        expect(bar.width / 3, '三键单键宽').toBeGreaterThanOrEqual(MIN_TOUCH);
        expect(bar.x, '距左缘').toBeGreaterThanOrEqual(MIN_GAP);
        expect(w - right(bar), '距右缘').toBeGreaterThanOrEqual(MIN_GAP);
        expect(h - bottom(bar), '距下缘').toBeGreaterThanOrEqual(MIN_GAP);
      });

      it('③ actionBar ≡ tableActionBar（收敛死 zone）', () => {
        const zones = tableZones(w, h);
        expect(zones.tableActionBar).toEqual(zones.actionBar);
      });

      it('④ 三席立绘压扁（body 高 ≤0.30h），且 heroBody 不压 heroHandLarge', () => {
        const zones = tableZones(w, h);
        for (const name of ['heroBody', 'opponentLeftBody', 'opponentRightBody'] as ZoneName[]) {
          expect(zones[name].height, `${name} 高`).toBeLessThanOrEqual(h * 0.3);
        }
        expect(overlaps(zones.heroBody, zones.heroHandLarge), 'heroBody 压住手牌扇面').toBe(false);
      });

      it(`⑤ 手牌区容得下新牌面（heroHandLarge.height ≥ ${MIN_HAND_HEIGHT}）`, () => {
        const zones = tableZones(w, h);
        expect(zones.heroHandLarge.height).toBeGreaterThanOrEqual(MIN_HAND_HEIGHT);
      });

      it('④b 名牌不被任何功能元素压住（S4 复审补入：turnTimer 曾压 heroNameplate 36~48px）', () => {
        const zones = tableZones(w, h);
        const plates: ZoneName[] = ['heroNameplate', 'opponentLeftNameplate', 'opponentRightNameplate'];
        const functional: ZoneName[] = [
          'topBar',
          'bottomCardsDock',
          'dropZoneHero',
          'dropZoneLeft',
          'dropZoneRight',
          'statusLine',
          'actionBar',
          'turnTimer',
          'heroHandLarge',
        ];
        for (const plate of plates) {
          for (const other of functional) {
            expect(rectGap(zones[plate], zones[other]), `${plate} 被 ${other} 压住`).toBeGreaterThanOrEqual(MIN_GAP);
          }
        }
      });

      it('⑦ turnTimer 停靠按钮带左翼（同带同高，右缘距按钮 8~24px）——左下孤岛作废', () => {
        const zones = tableZones(w, h);
        expect(zones.turnTimer.y, '同带 y').toBe(zones.actionBar.y);
        expect(zones.turnTimer.height, '同带高').toBe(zones.actionBar.height);
        const adjacency = zones.actionBar.x - right(zones.turnTimer);
        expect(adjacency, '左邻间距下限').toBeGreaterThanOrEqual(MIN_GAP);
        expect(adjacency, '左邻间距上限（不许飘远）').toBeLessThanOrEqual(24);
      });

      it('⑧ statusLine 上移托盘上方（dock 之下、dropZoneHero 之上，两向 ≥8）', () => {
        const zones = tableZones(w, h);
        expect(zones.dropZoneHero.y - bottom(zones.statusLine), 'status→tray').toBeGreaterThanOrEqual(MIN_GAP);
        expect(zones.statusLine.y - bottom(zones.bottomCardsDock), 'dock→status').toBeGreaterThanOrEqual(MIN_GAP);
      });

      it('⑨ heroHandLarge 左右对称（中心≡画布中心 ≤2px，根除墩牌偏左感）', () => {
        const zones = tableZones(w, h);
        expect(Math.abs(centerX(zones.heroHandLarge) - w / 2)).toBeLessThanOrEqual(2);
      });

      it('⑩ 左右立绘贴本席落点带（用户打回：立绘距牌桌过远）', () => {
        const zones = tableZones(w, h);
        const leftGap = zones.dropZoneLeft.x - right(zones.opponentLeftBody);
        const rightGap = zones.opponentRightBody.x - right(zones.dropZoneRight);
        expect(leftGap, '左立绘→左落点带').toBeGreaterThanOrEqual(0);
        expect(leftGap, '左立绘贴邻').toBeLessThanOrEqual(12);
        expect(rightGap, '右落点带→右立绘').toBeGreaterThanOrEqual(0);
        expect(rightGap, '右立绘贴邻').toBeLessThanOrEqual(12);
        expect(Math.abs(bottom(zones.opponentLeftBody) - bottom(zones.dropZoneLeft)), '左立绘底对齐').toBeLessThanOrEqual(4);
        expect(Math.abs(bottom(zones.opponentRightBody) - bottom(zones.dropZoneRight)), '右立绘底对齐').toBeLessThanOrEqual(4);
      });

      it(`⑪ 名牌载字最小宽 ≥${MIN_PLATE_WIDTH}（收窄让间距不许压垮文字）`, () => {
        const zones = tableZones(w, h);
        for (const name of ['heroNameplate', 'opponentLeftNameplate', 'opponentRightNameplate'] as ZoneName[]) {
          expect(zones[name].width, `${name} 宽`).toBeGreaterThanOrEqual(MIN_PLATE_WIDTH);
        }
      });

      it('⑫ 名牌在宿主立绘头顶且分离 ≥8（2026-07-05 用户裁定：名牌不得贴附立绘，不可复辟）', () => {
        const zones = tableZones(w, h);
        expect(zones.opponentLeftBody.y - bottom(zones.opponentLeftNameplate), '左名牌→左立绘').toBeGreaterThanOrEqual(MIN_GAP);
        expect(zones.opponentRightBody.y - bottom(zones.opponentRightNameplate), '右名牌→右立绘').toBeGreaterThanOrEqual(MIN_GAP);
        expect(zones.heroBody.y - bottom(zones.heroNameplate), 'hero 名牌→hero 立绘').toBeGreaterThanOrEqual(MIN_GAP);
      });

      it('落点分区：左右贴座、底牌托居中且在上部', () => {
        const zones = tableZones(w, h);
        expect(zones.dropZoneLeft.x).toBeGreaterThanOrEqual(right(zones.opponentLeft) + MIN_GAP);
        expect(right(zones.dropZoneRight)).toBeLessThanOrEqual(zones.opponentRight.x - MIN_GAP);
        expect(Math.abs(centerX(zones.bottomCardsDock) - w / 2), '底牌托横向居中').toBeLessThanOrEqual(16);
        expect(bottom(zones.bottomCardsDock), '底牌托在上部').toBeLessThanOrEqual(h * 0.3);
        expect(zones.bottomCardsDock.y).toBeGreaterThanOrEqual(bottom(zones.topBar));
      });
    });
  }

  it('确定性：同宽高两次调用深相等', () => {
    expect(tableZones(844, 390)).toEqual(tableZones(844, 390));
  });
});
