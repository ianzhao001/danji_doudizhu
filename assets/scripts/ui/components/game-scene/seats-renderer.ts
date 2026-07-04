import { Color, Label, Node, SpriteFrame } from 'cc';
import type { Settings } from '../../../data/settings';
import type { FlowEvent } from '../../../flow/types';
import type { RoundRuntime } from '../../../flow/round-runtime';
import type { GameEvent, SeatIndex } from '../../../game';
import { deriveAiThinking } from '../../ai-thinking-view';
import { deriveLastActions, type SeatLastAction } from '../../last-action-view';
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
}

const HERO_SEAT: SeatIndex = 0;

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
  ctx.addLabel(`左家\n${handCounts[1]}张${landlord === 1 ? '\n地主' : ''}`, left.x, left.y, 16, ctx.uiRoot, 108, 64, 'seat-left');
  ctx.addLabel(`右家\n${handCounts[2]}张${landlord === 2 ? '\n地主' : ''}`, right.x, right.y, 16, ctx.uiRoot, 108, 64, 'seat-right');
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
