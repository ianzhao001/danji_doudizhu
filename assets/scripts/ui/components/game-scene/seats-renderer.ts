import { Color, Label, Node, Sprite, SpriteFrame } from 'cc';
import type { Settings } from '../../../data/settings';
import type { FlowEvent } from '../../../flow/types';
import type { RoundRuntime } from '../../../flow/round-runtime';
import type { GameEvent, SeatIndex } from '../../../game';
import { deriveAiThinking } from '../../ai-thinking-view';
import { deriveLastActions, type SeatLastAction } from '../../last-action-view';
import { RESOURCE_PATHS, type ResourcePath } from '../../asset-keys';
import type { Rect } from '../../table-layout';
import type { TableZones } from '../../table-zones';
import { addUiTransform, drawPanel } from '../ui-helpers';

export interface GameSceneRendererContext {
  uiRoot: Node;
  settings: Settings;
  runtime: RoundRuntime | null;
  recentEvents: FlowEvent[];
  fullGameEvents: GameEvent[];
  memoryExpanded: boolean;
  advisorEnabled: boolean;
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
  loadSprite(path: ResourcePath, sprite: Sprite | null): void;
  drawPanelSkin(parent: Node, width: number, height: number, name?: string): Node;
  render(): void;
  setMemoryExpanded(value: boolean): void;
  toggleAdvisor(): void;
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
}

const HERO_SEAT: SeatIndex = 0;
const NAMEPLATE_TEXT = new Color(108, 46, 76, 255);
const NAMEPLATE_MUTED = new Color(142, 88, 108, 235);

function seatName(seat: number): string {
  if (seat === 0) return '你';
  if (seat === 1) return '左家';
  if (seat === 2) return '右家';
  return `座位${seat + 1}`;
}

export function renderSeats(
  ctx: GameSceneRendererContext,
  handCounts: [number, number, number],
  landlord: number | null,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  renderSeatCard(ctx, 'seat-hero', layout.heroBody, canvas, RESOURCE_PATHS.heroBodyV13);
  renderSeatCard(ctx, 'seat-left', layout.opponentLeftBody, canvas, RESOURCE_PATHS.leftAiBodyV13);
  renderSeatCard(ctx, 'seat-right', layout.opponentRightBody, canvas, RESOURCE_PATHS.rightAiBodyV13);
  renderSeatNameplate(ctx, 'seat-hero-nameplate', layout.heroNameplate, canvas, 0, handCounts[0], landlord);
  renderSeatNameplate(ctx, 'seat-left-nameplate', layout.opponentLeftNameplate, canvas, 1, handCounts[1], landlord);
  renderSeatNameplate(ctx, 'seat-right-nameplate', layout.opponentRightNameplate, canvas, 2, handCounts[2], landlord);
}

function renderSeatCard(
  ctx: GameSceneRendererContext,
  name: string,
  body: Rect,
  canvas: { width: number; height: number },
  bodyPath: ResourcePath,
): void {
  const root = ctx.ensureNode(name, ctx.uiRoot);
  const center = seatBodyVisualCenter(ctx, name, body, canvas);
  root.setPosition(center.x, center.y, 0);
  addUiTransform(root, body.width, body.height);

  const bodyNode = ctx.addSprite(bodyPath, 0, 0, body.width, body.height, root, 'seat-body');
  bodyNode.setSiblingIndex(0);
}

function seatBodyVisualCenter(
  ctx: GameSceneRendererContext,
  name: string,
  body: Rect,
  canvas: { width: number; height: number },
): { x: number; y: number } {
  let screenX = body.x + body.width / 2;
  let screenY = body.y + body.height / 2;
  if (name === 'seat-left' || name === 'seat-right') {
    const inward = Math.round(body.width * 0.22);
    screenX += name === 'seat-left' ? inward : -inward;
    screenY += Math.round(body.height * 0.045);
  }
  return ctx.screenPoint(canvas, screenX, screenY);
}

function renderSeatNameplate(
  ctx: GameSceneRendererContext,
  name: string,
  nameplate: Rect,
  canvas: { width: number; height: number },
  seat: SeatIndex,
  handCount: number,
  landlord: number | null,
): void {
  const roleKnown = landlord !== null;
  const isLandlord = landlord === seat;
  const nameplateCenter = ctx.rectPoint(nameplate, canvas, 0.5, 0.5);
  const root = ctx.ensureNode(name, ctx.uiRoot);
  root.setPosition(nameplateCenter.x, nameplateCenter.y, 0);
  addUiTransform(root, nameplate.width, nameplate.height);
  const plate = ctx.addSprite(
    RESOURCE_PATHS.seatNameplateV13,
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
  const labelWidth = Math.max(82, nameplate.width - 22);
  const label = ctx.addLabel(`${seatName(seat)}  ${handCount}张`, 0, 4, 13, root, labelWidth, 18, 'seat-name-label', NAMEPLATE_TEXT);
  label.lineHeight = 16;
  const role = ctx.addLabel(roleText, 0, -10, 11, root, labelWidth, 16, 'seat-role-label', NAMEPLATE_MUTED);
  role.lineHeight = 14;
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
  const rows = deriveLastActions(recentRoundEvents);
  rows.forEach((row) => {
    const pos = lastActionPosition(ctx, row.seat, layout, canvas);
    const label = ctx.addLabel(row.text, pos.x, pos.y, 12, ctx.uiRoot, pos.width, 24, `last-action-${row.seat}`);
    label.color = row.text === '—' ? new Color(255, 255, 255, 120) : new Color(255, 244, 209, 230);
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
  drawPanel(root, pos.width, 28, new Color(37, 42, 58, 176));

  const dots = ctx.settings.animation ? '.'.repeat(thinking.dots) : '';
  const label = ctx.addLabel(`${seatName(thinking.seat)}思考中${dots}`, 0, 1, 13, root, pos.width - 12, 24, 'ai-thinking-label');
  label.color = new Color(221, 242, 255, 255);
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
): { x: number; y: number; width: number } {
  if (seat === HERO_SEAT) {
    const pos = ctx.screenPoint(canvas, canvas.width / 2, Math.max(layout.tableActionBar.y - 18, layout.heroHandLarge.y - 42));
    return { ...pos, width: 146 };
  }
  const rect = seat === 1 ? layout.dropZoneLeft : layout.dropZoneRight;
  const pos = ctx.screenPoint(canvas, rect.x + rect.width / 2, Math.max(22, rect.y - 12));
  return { ...pos, width: 124 };
}

export function aiThinkingPosition(
  ctx: GameSceneRendererContext,
  seat: SeatIndex,
  layout: TableZones,
  canvas: { width: number; height: number },
): { x: number; y: number; width: number } {
  const rect = seat === 1 ? layout.dropZoneLeft : layout.dropZoneRight;
  const pos = ctx.screenPoint(canvas, rect.x + rect.width / 2, Math.max(24, rect.y - 16));
  return { ...pos, width: 126 };
}
