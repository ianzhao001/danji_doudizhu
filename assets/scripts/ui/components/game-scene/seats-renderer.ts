import { Color, Graphics, Label, Node, Sprite, SpriteFrame } from 'cc';
import type { Settings } from '../../../data/settings';
import type { FlowEvent } from '../../../flow/types';
import type { RoundRuntime } from '../../../flow/round-runtime';
import type { Card } from '../../../rules';
import type { GameEvent, SeatIndex } from '../../../game';
import { deriveAiThinking } from '../../ai-thinking-view';
import type { SeatAlert } from '../../follow-ux';
import type { SeatLastAction } from '../../last-action-view';
import { deriveLastPlays, type SeatLastPlay } from '../../last-play-view';
import { RESOURCE_PATHS, type ResourcePath } from '../../asset-keys';
import type { Rect } from '../../table-layout';
import type { TableZones } from '../../table-zones';
import type { TypographyRole } from '../../theme';
import { t } from '../../strings';
import { UI_TEXT_COLORS } from '../../ui-text-colors';
import type { SessionTotals } from '../../session-score';
import { THEME, addUiTransform, drawPanel, toColor } from '../ui-helpers';
import { dropZoneForSeat, seatDisplayName } from './seat-display';

export interface GameSceneRendererContext {
  uiRoot: Node;
  settings: Settings;
  runtime: RoundRuntime | null;
  recentEvents: FlowEvent[];
  fullGameEvents: GameEvent[];
  memoryExpanded: boolean;
  advisorEnabled: boolean;
  biddingAdvisorEnabled: boolean;
  turnTimerElapsedMs: number;
  turnTimerMs: number;
  spriteFrames: Map<string, SpriteFrame>;
  sessionTotals(): SessionTotals;
  isLandscape(canvas: { width: number; height: number }): boolean;
  screenPoint(canvas: { width: number; height: number }, screenX: number, screenY: number): { x: number; y: number };
  rectPoint(rect: Rect, canvas: { width: number; height: number }, fx: number, fy: number): { x: number; y: number };
  ensureNode(name: string, parent: Node): Node;
  addLabel(
    text: string,
    x: number,
    y: number,
    role: TypographyRole,
    parent?: Node,
    width?: number,
    height?: number,
    name?: string,
    color?: Color,
  ): Label;
  addButton(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    enabled: boolean,
    cb: () => void,
    parent?: Node,
    name?: string,
  ): Label;
  addSprite(path: ResourcePath, x: number, y: number, width: number, height: number, parent: Node, name: string, sliced?: boolean): Node;
  addSpriteContain(path: ResourcePath, x: number, y: number, width: number, height: number, parent: Node, name: string): Node;
  loadSprite(path: ResourcePath, sprite: Sprite | null): SpriteFrame | null;
  drawPanelSkin(parent: Node, width: number, height: number, name?: string): Node;
  render(): void;
  setMemoryExpanded(value: boolean): void;
  /** Unified R1 id gate shared by card, toast and result animation entrypoints. */
  claimAnimationId(id: string): boolean;
  hasAnimationId(id: string): boolean;
  /** v1.5 W3-B:常驻特效层(prune 豁免),胜局彩带/星光等跨 render 生命周期特效挂点。 */
  fxLayer(): Node;
  toggleAdvisor(): void;
  toggleBiddingAdvisor(): void;
  submitBid(id: 'call' | 'grab' | 'pass'): Promise<void>;
  submitPlay(): Promise<void>;
  submitPass(): Promise<void>;
  applyHint(): void;
  syncTurnTimerKey(): boolean;
  strengthColor(tone: 'weak' | 'mid' | 'strong'): Color;
  aiThinkingView(): ReturnType<typeof deriveAiThinking> | null;
  startGame(forceNew: boolean): void;
  animateScaleIn(node: Node, fromScale: number, durationMs: number): void;
  drawDimOverlay(parent: Node, width: number, height: number): void;
  addDisplayCard(card: Card, x: number, y: number, parent: Node, name: string, animate: boolean): Node;
}

const HERO_SEAT: SeatIndex = 0;
// W-VISION S4:换皮必须同步换字色。v19 名牌是亮粉底,旧 secondary 莓色实景仅 2.92:1；
// 名称与角色说明统一用 ART-V19 推荐深莓 #6C2E4C,仍以字号/字重表达层级,不拿低对比当“弱化”。
const NAMEPLATE_TEXT = toColor(UI_TEXT_COLORS.primary);
export const PILL_TEXT = toColor(UI_TEXT_COLORS.primary);
export const PILL_TEXT_MUTED = toColor(THEME.palette.textSecondary);
const NAMEPLATE_MUTED = NAMEPLATE_TEXT;
const ALERT_TEXT_ON_DARK = toColor(THEME.palette.textOnAccent); // 白 on danger 深红 = 5.4:1
const ALERT_TEXT_ON_LIGHT = toColor(THEME.palette.brandDark); // 深莓 on warning 浅金 = 6.9:1

export function renderSeats(
  ctx: GameSceneRendererContext,
  handCounts: [number, number, number],
  landlord: number | null,
  layout: TableZones,
  canvas: { width: number; height: number },
  alerts: SeatAlert[] = [],
): void {
  const heroBody = layout.heroBody;
  const leftBody = layout.opponentLeftBody;
  const rightBody = layout.opponentRightBody;
  const leftSeat: SeatIndex = 2;
  const rightSeat: SeatIndex = 1;
  renderSeatCard(ctx, 'seat-hero', heroBody, canvas, RESOURCE_PATHS.heroBodyV13);
  renderSeatCard(ctx, 'seat-left', leftBody, canvas, RESOURCE_PATHS.leftAiBodyV13);
  renderSeatCard(ctx, 'seat-right', rightBody, canvas, RESOURCE_PATHS.rightAiBodyV13);
  renderSeatNameplate(
    ctx,
    'seat-hero-nameplate',
    layout.heroNameplate,
    canvas,
    0,
    handCounts[0],
    landlord,
    alerts,
  );
  renderSeatNameplate(
    ctx,
    'seat-left-nameplate',
    layout.opponentLeftNameplate,
    canvas,
    leftSeat,
    handCounts[leftSeat],
    landlord,
    alerts,
  );
  renderSeatNameplate(
    ctx,
    'seat-right-nameplate',
    layout.opponentRightNameplate,
    canvas,
    rightSeat,
    handCounts[rightSeat],
    landlord,
    alerts,
  );
}

function renderSeatCard(
  ctx: GameSceneRendererContext,
  name: string,
  body: Rect,
  canvas: { width: number; height: number },
  bodyPath: ResourcePath,
): void {
  const root = ctx.ensureNode(name, ctx.uiRoot);
  const center = ctx.rectPoint(body, canvas, 0.5, 0.5);
  root.setPosition(center.x, center.y, 0);
  addUiTransform(root, body.width, body.height);

  // v1.6 二次终审整改②:立绘等比内接,不拉伸(席位框比例 ≠ 图源裁后比例,直接给宽高会变形——
  // 门E 实测 hero 偏 10.2%、右家 7.5%;三张立绘裁后比例还各不相同,一个框喂不平)。
  const bodyNode = ctx.addSpriteContain(bodyPath, 0, 0, body.width, body.height, root, 'seat-body');
  bodyNode.setSiblingIndex(0);
}

function renderSeatNameplate(
  ctx: GameSceneRendererContext,
  name: string,
  nameplate: Rect,
  canvas: { width: number; height: number },
  seat: SeatIndex,
  handCount: number,
  landlord: number | null,
  alerts: SeatAlert[],
): void {
  const roleKnown = landlord !== null;
  const isLandlord = landlord === seat;
  const nameplateCenter = ctx.rectPoint(nameplate, canvas, 0.5, 0.5);
  const root = ctx.ensureNode(name, ctx.uiRoot);
  root.setPosition(nameplateCenter.x, nameplateCenter.y, 0);
  addUiTransform(root, nameplate.width, nameplate.height);
  const plate = ctx.addSprite(
    RESOURCE_PATHS.seatNameplateC1,
    0,
    0,
    nameplate.width,
    nameplate.height,
    root,
    'seat-nameplate',
    true,
  );
  plate.setSiblingIndex(root.children.length - 1);

  const roleText = roleKnown ? (isLandlord ? '地主' : '农民') : '待定';
  const compactHero = seat === HERO_SEAT && nameplate.width < 80;
  const labelWidth = Math.max(40, nameplate.width - THEME.spacing.section);
  const roleTypography = compactHero ? THEME.typography.assistive : THEME.typography.secondary;
  // 门B:33px 名牌实测净高约 28px。两行按彼此行高推中心，让字形带恰好相接且整体居中，
  // 避免按高度比例取整后出现 0.5–1px 的行间相撞。
  const nameY = roleTypography.lineHeight / 2;
  const roleY = -THEME.typography.meta.lineHeight / 2 + 1;
  ctx.addLabel(
    compactHero ? seatDisplayName(seat) : `${seatDisplayName(seat)}  ${handCount}张`,
    0,
    nameY,
    'meta',
    root,
    labelWidth,
    Math.max(THEME.typography.meta.lineHeight, Math.round(nameplate.height * 0.40)),
    'seat-name-label',
    NAMEPLATE_TEXT,
  );
  ctx.addLabel(roleText, 0, roleY, compactHero ? 'assistive' : 'secondary', root, labelWidth,
    Math.max(roleTypography.lineHeight, Math.round(nameplate.height * 0.34)), 'seat-role-label', NAMEPLATE_MUTED);
  if (roleKnown) {
    const roleIcon = ctx.addSpriteContain(
      isLandlord ? RESOURCE_PATHS.landlordHatV19 : RESOURCE_PATHS.farmerBadgeV19,
      ctx.isLandscape(canvas) ? nameplate.width / 2 - 18 : nameplate.width / 2 - 11,
      0,
      20,
      18,
      root,
      'seat-role-icon',
    );
    roleIcon.setSiblingIndex(root.children.length - 1);
  }
  const alert = alerts.find((item) => item.seat === seat);
  if (alert) renderSeatAlertBadge(ctx, root, nameplate, alert);
}

function renderSeatAlertBadge(
  ctx: GameSceneRendererContext,
  parent: Node,
  nameplate: Rect,
  alert: SeatAlert,
): void {
  const text = alert.kind === 'lastOne' ? t('seat.lastOne') : t('seat.lastTwo');
  const backdrop = alert.kind === 'lastOne' ? toColor(THEME.palette.danger) : toColor(THEME.palette.warning);
  const width = 44;
  const height = 18;
  const badge = ctx.ensureNode('seat-alert-badge', parent);
  badge.setPosition(nameplate.width / 2 - width / 2 - 2, nameplate.height / 2 + 8, 0);
  addUiTransform(badge, width, height);
  drawPanel(badge, width, height, backdrop);
  ctx.addLabel(text, 0, 0, 'assistive', badge, width, height, 'seat-alert-label',
    alert.kind === 'lastOne' ? ALERT_TEXT_ON_DARK : ALERT_TEXT_ON_LIGHT);
}

/** W-VISION-COLOR:信息药丸换 c1 象牙白底+细粉边；清残留 Graphics 防叠影。 */
export function applyPillSkin(ctx: GameSceneRendererContext, root: Node, width: number, height: number): void {
  root.getComponent(Graphics)?.clear();
  const skin = ctx.addSprite(RESOURCE_PATHS.infoPillC1, 0, 0, width, height, root, 'pill-skin', true);
  skin.setSiblingIndex(0);
}

export function renderSeatFeedback(
  ctx: GameSceneRendererContext,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  renderLastActions(ctx, layout, canvas);
  renderAiThinking(ctx, layout, canvas);
}

function renderLastActions(
  ctx: GameSceneRendererContext,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  const recentRoundEvents = ctx.recentEvents.flatMap((event) => (event.type === 'round' ? [event.event] : []));
  const rows = deriveLastPlays(recentRoundEvents);
  const thinking = ctx.aiThinkingView();
  const occupiedSeat = thinking?.active ? thinking.seat : null;
  rows.forEach((row) => {
    if (row.seat !== occupiedSeat) renderLastPlayRow(ctx, row, layout, canvas);
  });
}

function renderLastPlayRow(
  ctx: GameSceneRendererContext,
  row: SeatLastPlay,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  // v1.6 用户追加②「玩家旁边的气泡,在没有消息时不要常驻,有消息时才展示」:
  // 无消息时 deriveLastPlays 返回 kind=null / text='—',原先照样铺一个空药丸常驻三席。
  // 此处直接不渲染——未 ensureNode 的旧药丸由 render prune 自动销毁。
  // view-model(deriveLastPlays)与其测试零改动:'—' 仍是它的空值语义,只是视图层不再展示。
  if (row.kind === null) return;
  // hero 名牌贴左屏边；气泡既要与名牌同心，也必须连同强调皮完整落屏。
  // 直接吃名牌宽度，文字交给既有 SHRINK 适配，不另造偏心或裁切特例。
  const width = row.seat === HERO_SEAT ? layout.heroNameplate.width : 124;
  const pos = lastActionPosition(ctx, row.seat, layout, canvas, width);
  const root = ctx.ensureNode(`last-action-pill-${row.seat}`, ctx.uiRoot);
  root.setPosition(pos.x, pos.y, 0);
  addUiTransform(root, width, 30);

  // kind=null 已在入口挡掉,此处必有真实消息('不要' 或牌型文案)——空值('—')分支随之消失。
  const text = row.kind === 'pass' ? (row.text || t('action.pass')) : (row.text || '已出牌');
  applyPillSkin(ctx, root, width, 28);
  if (row.emphasis) {
    const path = row.emphasis === 'bomb' ? RESOURCE_PATHS.emphasisBomb : RESOURCE_PATHS.emphasisRocket;
    // 强调图是装饰而非第二块功能皮：等比内接、居中垫在药丸下方，既不拉伸也不制造“皮吃皮”。
    const emphasis = ctx.addSpriteContain(path, 0, 0, width + 14, 30, root, 'last-play-emphasis');
    emphasis.setSiblingIndex(0);
  }
  // 门B:y 归 0(原 +1 让字形带上缘越出净区顶)+ 盒宽收到 -24(原 -16 越出净区右缘 1px)。
  ctx.addLabel(text, 0, 0, 'assistive', root, width - THEME.spacing.wide, 20, `last-action-${row.seat}`, PILL_TEXT);
}

function renderAiThinking(
  ctx: GameSceneRendererContext,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  const thinking = ctx.aiThinkingView();
  if (!thinking?.active || thinking.seat === null) {
    clearAiThinkingNodes(ctx);
    return;
  }
  const pos = aiThinkingPosition(ctx, thinking.seat, layout, canvas);
  const root = ctx.ensureNode(`ai-thinking-${thinking.seat}`, ctx.uiRoot);
  root.setPosition(pos.x, pos.y, 0);
  addUiTransform(root, pos.width, 28);
  applyPillSkin(ctx, root, pos.width, 28);

  const dots = ctx.settings.animation ? '.'.repeat(thinking.dots) : '';
  const label = ctx.addLabel(`${seatDisplayName(thinking.seat)}思考中${dots}`, 0, 0, 'meta', root, pos.width - THEME.spacing.comfortable, 24, 'ai-thinking-label');
  label.color = toColor(UI_TEXT_COLORS.activeAccent);
}

function clearAiThinkingNodes(ctx: GameSceneRendererContext): void {
  for (const seat of [0, 1, 2]) {
    const node = ctx.uiRoot.getChildByName(`ai-thinking-${seat}`);
    if (!node) continue;
    node.removeFromParent();
    node.destroy();
  }
}

export function lastActionPosition(
  ctx: GameSceneRendererContext,
  seat: SeatLastAction['seat'],
  layout: TableZones,
  canvas: { width: number; height: number },
  width = seat === HERO_SEAT ? layout.heroNameplate.width : 124,
): { x: number; y: number; width: number } {
  return feedbackPillPosition(ctx, seat, layout, canvas, width);
}

export function aiThinkingPosition(
  ctx: GameSceneRendererContext,
  seat: SeatIndex,
  layout: TableZones,
  canvas: { width: number; height: number },
): { x: number; y: number; width: number } {
  return feedbackPillPosition(ctx, seat, layout, canvas, 126);
}

function feedbackPillPosition(
  ctx: GameSceneRendererContext,
  seat: SeatIndex,
  layout: TableZones,
  canvas: { width: number; height: number },
  width: number,
): { x: number; y: number; width: number } {
  const pillHeight = 28;
  const anchorGap = THEME.spacing.default;
  if (seat === HERO_SEAT) {
    const plate = layout.heroNameplate;
    const pos = ctx.screenPoint(
      canvas,
      plate.x + plate.width / 2,
      plate.y - anchorGap - pillHeight / 2,
    );
    return { ...pos, width };
  }
  const rect = dropZoneForSeat(layout, seat);
  const dropCenterX = rect.x + rect.width / 2;
  const inward = Math.sign(canvas.width / 2 - dropCenterX) * 10;
  const pos = ctx.screenPoint(
    canvas,
    dropCenterX + inward,
    rect.y + rect.height + anchorGap + pillHeight / 2,
  );
  return { ...pos, width };
}
