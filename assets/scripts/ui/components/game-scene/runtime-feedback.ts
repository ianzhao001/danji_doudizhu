import { Color, Graphics, director } from 'cc';
import type { FlowEvent } from '../../../flow/types';
import { deriveAiThinking } from '../../ai-thinking-view';
import { deriveTerminationFeedback } from '../../termination-feedback-view';
import { t } from '../../strings';
import type { TableRegions } from '../../table-layout';
import { pushToast, tickToasts } from '../../toast-queue';
import { addUiTransform } from '../ui-helpers';
import { seatDisplayName } from './seat-display';
import { cardsSignature } from './card-node';

const HERO_SEAT = 0;
const TURN_TIMER_MS = 15_000;
const BRIGHT_PANEL_TEXT = new Color(108, 46, 76, 255);
const GAME_TEXT = {
  roundTerminated: t('game.roundTerminated'),
  backLobby: t('result.backLobby'),
  restartShort: t('common.restartShort'),
  bombToast: t('cue.bombToast'),
  rocketToast: t('cue.rocketToast'),
  pass: t('action.pass'),
  springToast: t('cue.springToast'),
  antiSpringToast: t('cue.antiSpringToast'),
};

export function renderToasts(this: any, layout: TableRegions, canvas: { width: number; height: number }): void {
  if (this.toasts.items.length === 0) return;
  const pos = this.screenPoint(canvas, canvas.width / 2, Math.max(148, layout.playArea.y - 10));
  const root = this.ensureNode('toast-layer-runtime', this.uiRoot!);
  root.setPosition(pos.x, pos.y, 0);
  addUiTransform(root, Math.min(260, canvas.width - 64), 112);

  this.toasts.items.forEach((toast, index) => {
    const width = Math.min(238, Math.max(174, canvas.width - 112));
    const height = 30;
    const node = this.ensureNode(`toast-${toast.id}`, root);
    node.setPosition(0, -index * 34, 0);
    addUiTransform(node, width, height);
    this.drawPanelSkin(node, width, Math.max(48, height), 'toast-skin');
    const label = this.addLabel(toast.text, 0, 0, 15, node, width - 22, height, 'toast-label', BRIGHT_PANEL_TEXT);
    label.color = BRIGHT_PANEL_TEXT;
    this.prepareToastAnimation(node, toast.id);
  });
}

export function renderTerminationFeedbackActions(this: any, _layout: TableRegions, canvas: { width: number; height: number }): void {
  if (!this.terminationFeedbackActionsVisible) return;
  const panelWidth = Math.min(340, Math.max(300, canvas.width - 96));
  const panelHeight = 110;
  const panelScreenY = Math.min(canvas.height - 78, Math.max(214, canvas.height * 0.58));
  const pos = this.screenPoint(canvas, canvas.width / 2, panelScreenY);
  const panel = this.ensureNode('termination-feedback-actions-runtime', this.uiRoot!);
  panel.setPosition(pos.x, pos.y, 0);
  panel.setScale(1, 1, 1);
  addUiTransform(panel, panelWidth, panelHeight);
  this.drawPanelSkin(panel, panelWidth, panelHeight);
  const backing = this.ensureNode('termination-feedback-backdrop', panel);
  backing.setPosition(0, 0, 0);
  addUiTransform(backing, panelWidth - 18, panelHeight - 16);
  const graphics = backing.getComponent(Graphics) ?? backing.addComponent(Graphics);
  graphics.clear();
  graphics.fillColor = new Color(255, 246, 250, 238);
  graphics.roundRect(-(panelWidth - 18) / 2, -(panelHeight - 16) / 2, panelWidth - 18, panelHeight - 16, 8);
  graphics.fill();
  backing.setSiblingIndex(1);
  this.addLabel(this.terminationFeedbackText ?? GAME_TEXT.roundTerminated, 0, 28, 16, panel, panelWidth - 38, 30, 'termination-feedback-title', BRIGHT_PANEL_TEXT);
  this.addButton(GAME_TEXT.backLobby, -72, -28, 126, 54, true, () => director.loadScene('lobby'), panel, 'termination-feedback-lobby');
  this.addButton(GAME_TEXT.restartShort, 72, -28, 126, 54, true, () => this.startGame(true), panel, 'termination-feedback-restart');
  panel.setSiblingIndex(this.uiRoot!.children.length - 1);
}

export function showStatus(this: any, text: string): void {
  this.statusText = text;
}

export function tickToastState(this: any): boolean {
  const before = this.toasts.items.map((toast) => toast.id).join('|');
  this.toasts = tickToasts(this.toasts, this.toastClockMs);
  const activeIds = new Set(this.toasts.items.map((toast) => toast.id));
  this.animatedToastIds = new Set(Array.from(this.animatedToastIds).filter((id) => activeIds.has(id)));
  return before !== this.toasts.items.map((toast) => toast.id).join('|');
}

export function pollTerminationFeedback(this: any): boolean {
  if (!this.runtime) return false;
  const feedback = deriveTerminationFeedback({
    phase: this.runtime.phase(),
    reason: this.runtime.terminationReason(),
    alreadyNotified: this.terminationFeedbackNotified,
  });
  if (!feedback) return false;
  this.terminationFeedbackNotified = true;
  this.terminationFeedbackActionsVisible = true;
  this.terminationFeedbackText = feedback.text;
  this.toasts = pushToast(this.toasts, feedback.text, this.toastClockMs);
  return true;
}

export function pushEventToast(this: any, event: FlowEvent): void {
  const text = this.eventToastText(event);
  if (!text) return;
  this.toasts = pushToast(this.toasts, text, this.toastClockMs);
}

export function eventToastText(this: any, event: FlowEvent): string | null {
  if (event.type === 'round') {
    const round = event.event;
    if (round.type === 'bomb') return `${seatDisplayName(round.seat)} ${GAME_TEXT.bombToast}`;
    if (round.type === 'rocket') return `${seatDisplayName(round.seat)} ${GAME_TEXT.rocketToast}`;
    if (round.type === 'pass') return `${seatDisplayName(round.seat)} ${GAME_TEXT.pass}`;
    return null;
  }
  if (event.type === 'settled') {
    if (event.settlement.spring === 'spring') return GAME_TEXT.springToast;
    if (event.settlement.spring === 'anti-spring') return GAME_TEXT.antiSpringToast;
  }
  return null;
}

export function resolveSeed(this: any): number {
  const fallback = Date.now() >>> 0;
  try {
    const search = (globalThis as { location?: { search?: string } }).location?.search ?? '';
    const raw = new URLSearchParams(search).get('seed');
    if (raw === null) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed >>> 0 : fallback;
  } catch {
    return fallback;
  }
}

export function currentPlayerTurnKey(this: any): string | null {
  if (!this.runtime?.isPlayerTurn()) return null;
  const phase = this.runtime.phase();
  if (phase === 'bidding') {
    const bidding = this.runtime.currentBidding();
    if (!bidding) return null;
    return [
      'bidding',
      bidding.phase,
      bidding.turn,
      bidding.provisional ?? 'none',
      bidding.multiplier,
      bidding.callingPasses,
      bidding.grabQueue.join(','),
      bidding.grabbed ? 'grabbed' : 'open',
    ].join(':');
  }
  if (phase === 'playing') {
    const snapshot = this.runtime.currentSnapshot();
    if (!snapshot) return null;
    const top = snapshot.top ? `${snapshot.top.seat}:${cardsSignature(snapshot.top.pattern.cards)}` : 'lead';
    return ['playing', snapshot.turn, top, snapshot.handCounts.join(',')].join(':');
  }
  return null;
}

export function isAiThinkingActive(this: any): boolean {
  return this.aiThinkingView()?.active ?? false;
}

export function aiThinkingView(this: any): ReturnType<typeof deriveAiThinking> | null {
  if (!this.runtime) return null;
  const phase = this.runtime.phase();
  if (phase === 'bidding') {
    const bidding = this.runtime.currentBidding();
    if (!bidding) return null;
    return deriveAiThinking(bidding.turn, HERO_SEAT, 'bidding', this.settings.animation ? this.toastClockMs : 0);
  }
  if (phase === 'playing') {
    const snapshot = this.runtime.currentSnapshot();
    if (!snapshot) return null;
    return deriveAiThinking(snapshot.turn, HERO_SEAT, 'playing', this.settings.animation ? this.toastClockMs : 0);
  }
  if (phase === 'settled') return deriveAiThinking(HERO_SEAT, HERO_SEAT, 'settled', 0);
  return null;
}

export function syncTurnTimerKey(this: any): boolean {
  const key = this.currentPlayerTurnKey();
  if (!key) {
    this.turnTimerKey = null;
    this.turnTimerElapsedMs = 0;
    return false;
  }
  if (key !== this.turnTimerKey) {
    this.turnTimerKey = key;
    this.turnTimerElapsedMs = 0;
    this.uiTickRenderMs = 0;
  }
  return true;
}

export function isTurnTimerFrozen(this: any): boolean {
  return this.pauseState.stage !== 'closed';
}
