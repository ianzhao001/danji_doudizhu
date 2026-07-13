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
import { t } from '../../strings';
import { THEME, addUiTransform, drawPanel, toColor } from '../ui-helpers';
import { CARD_SIZE } from './card-node';
import { dropZoneForSeat, seatDisplayName, visualSideForSeat } from './seat-display';

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
  isLandscape(canvas: { width: number; height: number }): boolean;
  screenPoint(canvas: { width: number; height: number }, screenX: number, screenY: number): { x: number; y: number };
  rectPoint(rect: Rect, canvas: { width: number; height: number }, fx: number, fy: number): { x: number; y: number };
  ensureNode(name: string, parent: Node): Node;
  addLabel(
    text: string,
    x: number,
    y: number,
    fontSize: number,
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
  loadSprite(path: ResourcePath, sprite: Sprite | null): void;
  drawPanelSkin(parent: Node, width: number, height: number, name?: string): Node;
  render(): void;
  setMemoryExpanded(value: boolean): void;
  /** v1.5 P-RESULT-CINE:结算入场动画防重播签名(startGame 时重置)。 */
  animatedResultKey(): string | null;
  setAnimatedResultKey(key: string | null): void;
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
// v1.6 二次终审(用户设计原则「盖字底图要简洁」的可读性推论):v18 皮全族是浅底
// (info-pill 浅粉 249,220,232 / nameplate 奶油 255,242,229),而 v15 深底时代留下的
// 浅奶油/金/白字压上去只剩 ~1.2:1,近乎隐形。凡压 v18 皮的字一律深莓,弱化档也守 AA 4.5:1。
const NAMEPLATE_TEXT = toColor(THEME.palette.brandDark); // 深莓 on 奶油名牌 = 8.9:1(截图实测)
export const PILL_TEXT = toColor(THEME.palette.brandDark); // 深莓 on 浅粉药丸 = 7.7:1
export const PILL_TEXT_MUTED = toColor(THEME.palette.textSecondary); // 弱化档:药丸 4.9:1 / 名牌 5.7:1
const NAMEPLATE_MUTED = PILL_TEXT_MUTED;
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
  const heroBody = seatBodyVisualRect('seat-hero', layout.heroBody, canvas);
  const leftBody = seatBodyVisualRect('seat-left', layout.opponentLeftBody, canvas);
  const rightBody = seatBodyVisualRect('seat-right', layout.opponentRightBody, canvas);
  const leftSeat: SeatIndex = 2;
  const rightSeat: SeatIndex = 1;
  renderSeatCard(ctx, 'seat-hero', heroBody, canvas, RESOURCE_PATHS.heroBodyV13);
  renderSeatCard(ctx, 'seat-left', leftBody, canvas, RESOURCE_PATHS.leftAiBodyV13);
  renderSeatCard(ctx, 'seat-right', rightBody, canvas, RESOURCE_PATHS.rightAiBodyV13);
  renderSeatNameplate(
    ctx,
    'seat-hero-nameplate',
    seatNameplateRect(0, layout.heroNameplate, heroBody, layout, canvas),
    canvas,
    0,
    handCounts[0],
    landlord,
    alerts,
  );
  renderSeatNameplate(
    ctx,
    'seat-left-nameplate',
    seatNameplateRect(leftSeat, layout.opponentLeftNameplate, leftBody, layout, canvas),
    canvas,
    leftSeat,
    handCounts[leftSeat],
    landlord,
    alerts,
  );
  renderSeatNameplate(
    ctx,
    'seat-right-nameplate',
    seatNameplateRect(rightSeat, layout.opponentRightNameplate, rightBody, layout, canvas),
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

function seatBodyVisualRect(
  name: string,
  body: Rect,
  canvas: { width: number; height: number },
): Rect {
  let visualWidth = body.width;
  let visualHeight = body.height;
  let screenX = body.x + visualWidth / 2;
  let screenY = body.y + visualHeight / 2;
  if (name === 'seat-hero') {
    visualWidth = Math.round(body.width * 0.92);
    visualHeight = Math.round(body.height * 0.9);
    screenX = body.x + visualWidth / 2;
    screenY = body.y + body.height - visualHeight / 2;
  }
  if (name === 'seat-left' || name === 'seat-right') {
    visualWidth = Math.round(body.width * 0.9);
    visualHeight = Math.round(body.height * 0.92);
    const outward = Math.round(body.width * 0.03);
    screenX += name === 'seat-left' ? -outward : outward;
    screenY -= Math.round(body.height * 0.08);
  }
  return {
    x: clamp(Math.round(screenX - visualWidth / 2), 0, canvas.width - visualWidth),
    y: clamp(Math.round(screenY - visualHeight / 2), 0, canvas.height - visualHeight),
    width: visualWidth,
    height: visualHeight,
  };
}

function seatNameplateRect(
  seat: SeatIndex,
  nameplate: Rect,
  body: Rect,
  layout: TableZones,
  canvas: { width: number; height: number },
): Rect {
  const gap = 8;
  const width = nameplate.width;
  const height = nameplate.height;
  if (seat === 0) {
    const leftHudX = Math.min(layout.strengthMeter.x, layout.memoryDock.x);
    const outsideBodyX = body.x + body.width + gap;
    const availableWidth = Math.max(46, Math.min(width, leftHudX - gap - outsideBodyX));
    const compactWidth = Math.min(width, availableWidth);
    const x = clamp(outsideBodyX, gap, leftHudX - gap - compactWidth);
    const y = clamp(
      Math.min(body.y + Math.round(body.height * 0.08), layout.heroHandLarge.y - gap - height - 12),
      gap,
      canvas.height - gap - height,
    );
    return { x, y, width: compactWidth, height };
  }
  const side = visualSideForSeat(seat);
  if (side === 'left') {
    const x = clamp(body.x + Math.round(body.width * 0.04), gap, canvas.width - gap - width);
    const y = clamp(body.y + body.height + gap, gap, layout.tableActionBar.y - gap - height);
    return { x, y, width, height };
  }
  const x = clamp(body.x + body.width - width - Math.round(body.width * 0.04), gap, canvas.width - gap - width);
  const y = clamp(body.y + body.height + gap, gap, layout.tableActionBar.y - gap - height);
  return { x, y, width, height };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
    RESOURCE_PATHS.seatNameplateV18,
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
  const labelWidth = Math.max(40, nameplate.width - 16);
  // 门B:名牌净区高 ≈ 81.4%,两行(名 + 角色)必须一起塞进去——原偏移在 33 高的 hero 紧凑板上撑爆。
  // 按板高按比例排:名行居上 18%、角色行居下 21%,行高压到净区内。
  const nameY = Math.round(nameplate.height * 0.18);
  const roleY = -Math.round(nameplate.height * 0.21);
  const label = ctx.addLabel(
    compactHero ? seatDisplayName(seat) : `${seatDisplayName(seat)}  ${handCount}张`,
    0,
    nameY,
    13,
    root,
    labelWidth,
    Math.max(13, Math.round(nameplate.height * 0.40)),
    'seat-name-label',
    NAMEPLATE_TEXT,
  );
  label.lineHeight = 15;
  const role = ctx.addLabel(roleText, 0, roleY, compactHero ? 10 : 12, root, labelWidth,
    Math.max(12, Math.round(nameplate.height * 0.34)), 'seat-role-label', NAMEPLATE_MUTED);
  role.lineHeight = compactHero ? 12 : 13;
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
  const label = ctx.addLabel(text, 0, 0, 10, badge, width, height, 'seat-alert-label',
    alert.kind === 'lastOne' ? ALERT_TEXT_ON_DARK : ALERT_TEXT_ON_LIGHT);
  label.lineHeight = 12;
}

/** v1.6 二次终审:信息药丸统一 v18 皮肤(浅粉单一填充+一条细描边),取代 v15 异形深底;清残留 Graphics 防叠影。 */
export function applyPillSkin(ctx: GameSceneRendererContext, root: Node, width: number, height: number): void {
  root.getComponent(Graphics)?.clear();
  const skin = ctx.addSprite(RESOURCE_PATHS.infoPillV18, 0, 0, width, height, root, 'pill-skin', true);
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
  rows.forEach((row) => renderLastPlayRow(ctx, row, layout, canvas));
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
  const maxWidth = row.seat === HERO_SEAT ? 146 : 124;
  const width = row.kind === 'play' && row.cards.length > 0
    ? lastPlayCardsWidth(row.cards.length, maxWidth)
    : maxWidth;
  const pos = lastActionPosition(ctx, row.seat, layout, canvas, width);
  const root = ctx.ensureNode(`last-action-pill-${row.seat}`, ctx.uiRoot);
  root.setPosition(pos.x, pos.y, 0);
  addUiTransform(root, width, 30);

  if (row.kind === 'play' && row.cards.length > 0) {
    renderMiniPlayCards(ctx, root, row.cards, width, row.emphasis);
    return;
  }

  // kind=null 已在入口挡掉,此处必有真实消息('不要' 或牌型文案)——空值('—')分支随之消失。
  const text = row.kind === 'pass' ? (row.text || t('action.pass')) : row.text;
  applyPillSkin(ctx, root, width, 28);
  // 门B:y 归 0(原 +1 让字形带上缘越出净区顶)+ 盒宽收到 -24(原 -16 越出净区右缘 1px)。
  ctx.addLabel(text, 0, 0, THEME.typography.xs, root, width - 24, 20, `last-action-${row.seat}`, PILL_TEXT);
}

function miniCardMetrics(cardCount: number, maxWidth: number): { scale: number; spacing: number } {
  const baseWidth = CARD_SIZE.width;
  if (cardCount <= 1) return { scale: 0.34, spacing: 0 };
  if (cardCount <= 5) {
    const scale = 0.34;
    return { scale, spacing: baseWidth * scale + 2 };
  }
  const scale = 0.28;
  const span = maxWidth - 8;
  const spacing = Math.max(2, (span - baseWidth * scale) / Math.max(1, cardCount - 1));
  return { scale, spacing };
}

function lastPlayCardsWidth(cardCount: number, maxWidth: number): number {
  const { scale, spacing } = miniCardMetrics(cardCount, maxWidth);
  if (cardCount <= 1) return Math.min(maxWidth, Math.round(baseCardWidth(scale) + 8));
  return Math.min(maxWidth, Math.round(spacing * (cardCount - 1) + baseCardWidth(scale) + 8));
}

function baseCardWidth(scale: number): number {
  return CARD_SIZE.width * scale;
}

function renderMiniPlayCards(
  ctx: GameSceneRendererContext,
  root: Node,
  cards: Card[],
  maxWidth: number,
  emphasis: SeatLastPlay['emphasis'],
): void {
  const { scale, spacing } = miniCardMetrics(cards.length, maxWidth);
  const totalWidth = cards.length <= 1
    ? baseCardWidth(scale)
    : spacing * (cards.length - 1) + baseCardWidth(scale);

  if (emphasis) {
    const path = emphasis === 'bomb' ? RESOURCE_PATHS.emphasisBomb : RESOURCE_PATHS.emphasisRocket;
    ctx.addSprite(path, 0, 0, totalWidth + 14, 30, root, 'last-play-emphasis', true);
  }

  const startX = -totalWidth / 2 + baseCardWidth(scale) / 2;
  cards.forEach((card, index) => {
    const x = startX + index * spacing;
    const node = ctx.addDisplayCard(card, x, 0, root, `last-play-card-${index}`, false);
    node.setScale(scale, scale, 1);
  });
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
  const label = ctx.addLabel(`${seatDisplayName(thinking.seat)}思考中${dots}`, 0, 1, THEME.typography.sm, root, pos.width - 12, 24, 'ai-thinking-label');
  label.color = PILL_TEXT;
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
  width = seat === HERO_SEAT ? 146 : 124,
): { x: number; y: number; width: number } {
  if (seat === HERO_SEAT) {
    const minY = layout.playArea.y + layout.playArea.height + 12;
    const maxY = layout.heroHandLarge.y - 30;
    const screenY = clamp(layout.tableActionBar.y - 24, minY, maxY);
    const pos = ctx.screenPoint(canvas, canvas.width / 2, screenY);
    return { ...pos, width };
  }
  const rect = dropZoneForSeat(layout, seat);
  const pos = ctx.screenPoint(canvas, rect.x + rect.width / 2, Math.max(22, rect.y - 32));
  return { ...pos, width };
}

export function aiThinkingPosition(
  ctx: GameSceneRendererContext,
  seat: SeatIndex,
  layout: TableZones,
  canvas: { width: number; height: number },
): { x: number; y: number; width: number } {
  const rect = dropZoneForSeat(layout, seat);
  const pos = ctx.screenPoint(canvas, rect.x + rect.width / 2, Math.max(24, rect.y - 36));
  return { ...pos, width: 126 };
}
