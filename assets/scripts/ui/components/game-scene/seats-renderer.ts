import { Color, Label, Node, Sprite, SpriteFrame } from 'cc';
import type { Settings } from '../../../data/settings';
import type { FlowEvent } from '../../../flow/types';
import type { RoundRuntime } from '../../../flow/round-runtime';
import type { GameEvent, SeatIndex } from '../../../game';
import { deriveAiThinking } from '../../ai-thinking-view';
import { deriveLastActions, type SeatLastAction } from '../../last-action-view';
import { RESOURCE_PATHS, type ResourcePath } from '../../asset-keys';
import type { Rect, TableRegions } from '../../table-layout';
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
  layout: TableRegions,
  canvas: { width: number; height: number },
): void {
  const left = ctx.rectPoint(layout.opponentLeft, canvas, 0.5, 0.5);
  const right = ctx.rectPoint(layout.opponentRight, canvas, 0.5, 0.5);
  renderSeatCard(ctx, 'seat-left', left.x, left.y, 1, handCounts[1], landlord, true);
  renderSeatCard(ctx, 'seat-right', right.x, right.y, 2, handCounts[2], landlord, false);
}

function renderSeatCard(
  ctx: GameSceneRendererContext,
  name: string,
  x: number,
  y: number,
  seat: SeatIndex,
  handCount: number,
  landlord: number | null,
  cheerful: boolean,
): void {
  const root = ctx.ensureNode(name, ctx.uiRoot);
  root.setPosition(x, y, 0);
  addUiTransform(root, 132, 64);
  const roleKnown = landlord !== null;
  const isLandlord = landlord === seat;
  const avatarPath = roleKnown
    ? (isLandlord ? RESOURCE_PATHS.landlordRoleAvatar : RESOURCE_PATHS.farmerRoleAvatar)
    : (cheerful ? RESOURCE_PATHS.aiCheerfulAvatar : RESOURCE_PATHS.aiCalmAvatar);
  ctx.addSprite(avatarPath, -40, 2, 44, 44, root, 'seat-avatar');
  ctx.addSprite(RESOURCE_PATHS.avatarFrame, -40, 2, 52, 52, root, 'seat-avatar-frame');
  ctx.addSprite(RESOURCE_PATHS.seatNameplate, 26, 5, 92, 34, root, 'seat-nameplate', true);
  const roleText = roleKnown ? (isLandlord ? '地主' : '农民') : '待定';
  ctx.addLabel(`${seatName(seat)}  ${handCount}张`, 26, 9, 13, root, 82, 18, 'seat-name-label', NAMEPLATE_TEXT);
  ctx.addLabel(roleText, 26, -8, 11, root, 78, 16, 'seat-role-label', NAMEPLATE_MUTED);
  if (roleKnown) {
    ctx.addSprite(isLandlord ? RESOURCE_PATHS.landlordRoleBadge : RESOURCE_PATHS.farmerRoleBadge, -58, -20, 24, 24, root, 'seat-role-badge');
  }
}

export function renderSeatFeedback(
  ctx: GameSceneRendererContext,
  layout: TableRegions,
  canvas: { width: number; height: number },
): void {
  renderLastActions(ctx, layout, canvas);
  renderAiThinking(ctx, layout, canvas);
}

function renderLastActions(
  ctx: GameSceneRendererContext,
  layout: TableRegions,
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
  layout: TableRegions,
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
  layout: TableRegions,
  canvas: { width: number; height: number },
): { x: number; y: number; width: number } {
  if (seat === HERO_SEAT) {
    const pos = ctx.screenPoint(canvas, canvas.width / 2, layout.playArea.y + layout.playArea.height + 24);
    return { ...pos, width: 136 };
  }
  const rect = seat === 1 ? layout.opponentLeft : layout.opponentRight;
  const pos = ctx.screenPoint(canvas, rect.x + rect.width / 2, rect.y + rect.height + 22);
  return { ...pos, width: 112 };
}

export function aiThinkingPosition(
  ctx: GameSceneRendererContext,
  seat: SeatIndex,
  layout: TableRegions,
  canvas: { width: number; height: number },
): { x: number; y: number; width: number } {
  const rect = seat === 1 ? layout.opponentLeft : layout.opponentRight;
  const pos = ctx.screenPoint(canvas, rect.x + rect.width / 2, rect.y + rect.height + 52);
  return { ...pos, width: 126 };
}
