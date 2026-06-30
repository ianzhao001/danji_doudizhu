import {
  _decorator,
  AudioClip,
  AudioSource,
  Button,
  Color,
  Component,
  Graphics,
  Label,
  Node,
  Sprite,
  SpriteFrame,
  UITransform,
  UIOpacity,
  Vec3,
  director,
  resources,
  sys,
  tween,
} from 'cc';
import { AiLevel } from '../../ai';
import { nextHint } from '../../ai/hint';
import { evaluateHand } from '../../ai/handStrength';
import { trackPlayed } from '../../ai/cardMemory';
import { commitFinishedRound, persistRound, restoreRound, type SessionKeys } from '../../data/session';
import { difficultyConfig } from '../../data/difficultyConfig';
import { defaultSettings, type Settings } from '../../data/settings';
import { loadSettings, saveSettings } from '../../data/settingsStorage';
import { startRoundRuntime, resumeRoundRuntime, type RoundRuntime } from '../../flow/round-runtime';
import { realClock } from '../../flow/clock';
import type { FlowEvent } from '../../flow/types';
import type { GameEvent, ResumeSnapshot, RoundFinishInput, SeatIndex, TopPlay } from '../../game';
import { type Card, Suit } from '../../rules';
import { cocosStorage } from '../../runtime/cocos-storage';
import { cardView } from '../card-view';
import { deriveCardMemoryView } from '../card-memory-view';
import { cueForFlowEvent, type CueId } from '../event-cues';
import { decideCuePlayback } from '../audio-gate';
import { dealCardDelay, playFlyFromTo, pulseParams } from '../animation-params';
import { clearSelection, isSelected, toggle } from '../selection';
import { deriveScreenVM } from '../screen-view';
import { deriveStrengthMeter } from '../strength-meter-view';
import { deriveTurnTimer } from '../turn-timer';
import { emptyToasts, pushToast, tickToasts, type ToastQueue } from '../toast-queue';
import type { Rect, TableRegions } from '../table-layout';
import { toggleSetting, type ToggleKey } from '../settings-view';
import { RESOURCE_PATHS, cardAssetPath, cueAudioPath } from '../asset-keys';

const { ccclass, property } = _decorator;

const HERO_SEAT: SeatIndex = 0;
const SETTINGS_KEY = 'doudizhu.settings';
const SESSION_KEYS: SessionKeys = {
  save: 'doudizhu.save',
  stats: 'doudizhu.stats',
  records: 'doudizhu.records',
};

const CARD_SIZE = { width: 46, height: 64 };
const HAND_LIFT = 18;
const TURN_TIMER_MS = 15_000;
const UI_TICK_RENDER_MS = 180;
const SCAFFOLD_NODE_NAMES = [
  'phase-label',
  'landlord-label',
  'multiplier-label',
  'hand-count-label',
  'action-label',
  'bottom-cards-label',
  'ai-left-label',
  'ai-right-label',
  'table-area-label',
  'hero-hand-label',
  'card-template-001',
  'card-template-002',
  'card-template-003',
  'card-template-004',
];

function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

function cardKey(card: Card): string {
  return `${card.rank}-${card.suit}`;
}

function cardsSignature(cards: Card[]): string {
  return cards.map(cardKey).join('|');
}

function labelColor(enabled: boolean): Color {
  return enabled ? new Color(255, 255, 255, 255) : new Color(255, 255, 255, 120);
}

function suitText(suit: Suit | 'joker'): string {
  switch (suit) {
    case Suit.Spade:
      return '♠';
    case Suit.Heart:
      return '♥';
    case Suit.Club:
      return '♣';
    case Suit.Diamond:
      return '♦';
    default:
      return '★';
  }
}

@ccclass('GameSceneSkeleton')
export class GameSceneSkeleton extends Component {
  @property(Sprite)
  background: Sprite | null = null;

  @property(Sprite)
  cardTemplate: Sprite | null = null;

  @property(Label)
  phaseLabel: Label | null = null;

  @property(Label)
  landlordLabel: Label | null = null;

  @property(Label)
  multiplierLabel: Label | null = null;

  @property(Label)
  handCountLabel: Label | null = null;

  @property(Label)
  actionLabel: Label | null = null;

  private runtime: RoundRuntime | null = null;
  private unsubscribe: (() => void) | null = null;
  private audioSource: AudioSource | null = null;
  private uiRoot: Node | null = null;
  private playAreaRoot: Node | null = null;
  private selected: Card[] = [];
  private recentEvents: FlowEvent[] = [];
  private fullGameEvents: GameEvent[] = [];
  private toasts: ToastQueue = emptyToasts;
  private toastClockMs = 0;
  private turnTimerKey: string | null = null;
  private turnTimerElapsedMs = 0;
  private uiTickRenderMs = 0;
  private memoryExpanded = false;
  private settings: Settings = defaultSettings();
  private statusText = '';
  private submitting = false;
  private readonly spriteFrames = new Map<string, SpriteFrame>();
  private lastHandSignature = '';
  private lastPlayAreaSignature = '';
  private renderedSelectedCardKeys = new Set<string>();
  private animatedToastIds = new Set<number>();
  private liveRenderNodes: Set<Node> | null = null;

  onLoad(): void {
    this.loadSprite(RESOURCE_PATHS.gameTableBg, this.background);
    if (this.cardTemplate) this.cardTemplate.node.active = false;
    this.hideSceneScaffold();
    this.audioSource = this.node.getComponent(AudioSource) ?? this.node.addComponent(AudioSource);
    this.uiRoot = this.ensureNode('runtime-ui', this.node);
    this.startGame(false);
  }

  onDestroy(): void {
    this.unsubscribe?.();
    this.runtime?.dispose();
    this.unsubscribe = null;
    this.runtime = null;
  }

  update(dt: number): void {
    if (!this.runtime || !this.uiRoot) return;
    const deltaMs = Math.max(0, dt * 1000);
    this.toastClockMs += deltaMs;
    this.uiTickRenderMs += deltaMs;

    let shouldRender = this.tickToastState();
    const timerActive = this.syncTurnTimerKey();
    if (timerActive) this.turnTimerElapsedMs = Math.min(TURN_TIMER_MS, this.turnTimerElapsedMs + deltaMs);
    if (timerActive && this.uiTickRenderMs >= UI_TICK_RENDER_MS) {
      this.uiTickRenderMs = 0;
      shouldRender = true;
    }

    if (shouldRender) this.render();
  }

  private startGame(forceNew: boolean): void {
    this.unsubscribe?.();
    this.runtime?.dispose();
    this.unsubscribe = null;
    this.selected = clearSelection();
    this.recentEvents = [];
    this.fullGameEvents = [];
    this.toasts = emptyToasts;
    this.toastClockMs = 0;
    this.turnTimerKey = null;
    this.turnTimerElapsedMs = 0;
    this.uiTickRenderMs = 0;
    this.animatedToastIds.clear();
    this.statusText = '';
    this.lastHandSignature = '';
    this.lastPlayAreaSignature = '';
    this.renderedSelectedCardKeys.clear();

    const storage = cocosStorage();
    this.settings = loadSettings(storage, SETTINGS_KEY);
    const difficulty = difficultyConfig(this.settings.difficulty);
    const thinkingDelayMs = Math.round((difficulty.thinkDelayMs.min + difficulty.thinkDelayMs.max) / 2);
    const levels: [AiLevel, AiLevel, AiLevel] = [
      this.settings.difficulty,
      this.settings.difficulty,
      this.settings.difficulty,
    ];
    const config = {
      seed: Date.now() >>> 0,
      heroSeat: HERO_SEAT,
      levels,
      thinkingDelayMs,
      clock: realClock,
      persist: (payload: Parameters<typeof persistRound>[2]) =>
        persistRound(storage, SESSION_KEYS, { ...payload, savedAt: Date.now() }),
      onSettled: (finish: RoundFinishInput) =>
        commitFinishedRound(storage, SESSION_KEYS, { finish, heroSeat: HERO_SEAT, playedAt: Date.now() }),
    };

    let resume: ResumeSnapshot | null = null;
    if (!forceNew) {
      try {
        resume = restoreRound(storage, SESSION_KEYS);
      } catch (error) {
        console.warn('restoreRound failed, starting a new round', error);
      }
    } else {
      storage.removeItem(SESSION_KEYS.save);
    }

    this.fullGameEvents = resume?.events.slice() ?? [];
    this.runtime = resume ? resumeRoundRuntime(resume, config) : startRoundRuntime(config);
    this.unsubscribe = this.runtime.onEvent((event) => {
      if (event.type === 'round') this.fullGameEvents.push(event.event);
      this.recentEvents.push(event);
      this.recentEvents = this.recentEvents.slice(-12);
      this.pushEventToast(event);
      this.render();
      this.playCue(event);
    });
    this.render();
  }

  private render(): void {
    if (!this.runtime || !this.uiRoot) return;

    const snapshot = this.runtime.currentSnapshot() ?? undefined;
    const bidding = this.runtime.currentBidding() ?? undefined;
    const settlement = this.runtime.settlement() ?? undefined;
    if (snapshot?.viewerHand) {
      this.selected = this.selected.filter((selected) => snapshot.viewerHand?.some((card) => sameCard(card, selected)));
    }

    const canvas = this.canvasSize();
    const vm = deriveScreenVM({
      snapshot,
      bidding,
      heroSeat: HERO_SEAT,
      selectedCards: this.selected,
      recentEvents: this.recentEvents,
      layoutOpts: {
        containerWidth: canvas.width,
        containerHeight: canvas.height,
        cardWidth: CARD_SIZE.width,
        liftOffset: HAND_LIFT,
      },
      settlement,
    });

    this.beginRenderDiff();
    this.renderTopBar(this.runtime.phase(), vm.topBar, snapshot?.viewerHand?.length ?? 0, vm.layout, canvas);
    this.renderRuntimeSettings(vm.layout, canvas);
    this.renderSeats(snapshot?.handCounts ?? [0, 0, 0], snapshot?.landlord ?? null, vm.layout, canvas);
    this.renderPlayArea(snapshot?.top ?? null, vm.layout, canvas);
    this.renderHud(snapshot?.viewerHand ?? [], vm.layout, canvas);
    this.renderBidding(bidding ? vm.bidding : undefined, vm.layout, canvas);
    this.renderHand(vm.hand, vm.layout, canvas);
    this.renderStatus(this.statusText || (this.runtime.isPlayerTurn() ? '轮到你' : '等待'), vm.layout, canvas);
    this.renderTurnTimer(vm.layout, canvas);
    this.renderActions(vm.actions.play, vm.actions.pass, vm.actions.hint, vm.layout, canvas);
    this.renderToasts(vm.layout, canvas);
    this.renderResult(vm.result, canvas);
    this.endRenderDiff();
  }

  private renderTopBar(
    phase: string,
    topBar: { multiplier: number; bombs: number; landlordSeat: number },
    handCount: number,
    layout: TableRegions,
    canvas: { width: number; height: number },
  ): void {
    const phasePos = this.rectPoint(layout.topBar, canvas, 0.5, 0.625);
    const infoY = layout.topBar.y + layout.topBar.height + 8;
    const landlordPos = this.screenPoint(canvas, canvas.width / 6, infoY);
    const multiplierPos = this.screenPoint(canvas, canvas.width / 2, infoY);
    const handPos = this.screenPoint(canvas, (canvas.width * 5) / 6, infoY);
    this.addLabel(phase, phasePos.x, phasePos.y, 18, this.uiRoot!, 140, 30, 'top-phase');
    this.addLabel(`地主 ${topBar.landlordSeat + 1}`, landlordPos.x, landlordPos.y, 16, this.uiRoot!, 110, 30, 'top-landlord');
    this.addLabel(`倍数 ×${topBar.multiplier}`, multiplierPos.x, multiplierPos.y, 16, this.uiRoot!, 110, 30, 'top-multiplier');
    this.addLabel(`手牌 ${handCount}`, handPos.x, handPos.y, 16, this.uiRoot!, 110, 30, 'top-hand-count');
  }

  private renderRuntimeSettings(layout: TableRegions, canvas: { width: number; height: number }): void {
    const settings = this.reloadSettings();
    const controls: { key: ToggleKey; label: string; on: boolean; fx: number }[] = [
      { key: 'sound', label: '音效', on: settings.sound, fx: 0.22 },
      { key: 'animation', label: '动效', on: settings.animation, fx: 0.5 },
      { key: 'vibration', label: '震动', on: settings.vibration, fx: 0.78 },
    ];
    const y = layout.opponentLeft.y + layout.opponentLeft.height * 0.35;
    for (const control of controls) {
      const pos = this.screenPoint(canvas, canvas.width * control.fx, y);
      this.addButton(
        `${control.label}${control.on ? '开' : '关'}`,
        pos.x,
        pos.y,
        88,
        32,
        true,
        () => this.toggleRuntimeSetting(control.key),
        this.uiRoot!,
        `setting-${control.key}`,
      );
    }
  }

  private renderSeats(
    handCounts: [number, number, number],
    landlord: number | null,
    layout: TableRegions,
    canvas: { width: number; height: number },
  ): void {
    const left = this.rectPoint(layout.playArea, canvas, 0.06, 0.24);
    const right = this.rectPoint(layout.playArea, canvas, 0.94, 0.24);
    this.addLabel(`AI 左家\n${handCounts[1]}张${landlord === 1 ? '\n地主' : ''}`, left.x, left.y, 16, this.uiRoot!, 108, 64, 'seat-left');
    this.addLabel(`AI 右家\n${handCounts[2]}张${landlord === 2 ? '\n地主' : ''}`, right.x, right.y, 16, this.uiRoot!, 108, 64, 'seat-right');
  }

  private renderPlayArea(top: TopPlay | null, layout: TableRegions, canvas: { width: number; height: number }): void {
    const area = this.ensureNode('play-area-runtime', this.uiRoot!);
    this.playAreaRoot = area;
    const pos = this.rectPoint(layout.playArea, canvas, 0.5, 0.78);
    const width = Math.min(250, Math.max(170, layout.playArea.width - 42));
    const height = Math.min(112, Math.max(86, layout.playArea.height * 0.62));
    area.setPosition(pos.x, pos.y, 0);
    this.addUiTransform(area, width, height);

    const labelText = top ? `座位${top.seat + 1}` : '自由出牌';
    const label = this.addLabel(`出牌区\n${labelText}`, 0, 34, 18, area, 170, 48, 'play-area-label');
    label.lineHeight = 28;
    if (!top) {
      this.lastPlayAreaSignature = '';
      return;
    }

    const cards = top.pattern.cards;
    const signature = `${top.seat}:${cardsSignature(cards)}`;
    const animate = this.settings.animation && signature !== this.lastPlayAreaSignature;
    this.lastPlayAreaSignature = signature;
    const maxWidth = Math.max(120, width - 26);
    const spacing = cards.length <= 1 ? 0 : Math.min(34, (maxWidth - CARD_SIZE.width) / (cards.length - 1));
    const startX = -((cards.length - 1) * spacing) / 2;
    cards.forEach((card, index) => {
      const x = startX + index * spacing;
      this.addDisplayCard(card, x, -22, area, `play-card-${index}`, animate);
    });
  }

  private renderHud(hand: Card[], layout: TableRegions, canvas: { width: number; height: number }): void {
    if (hand.length === 0) return;
    this.renderStrengthMeter(hand, layout, canvas);
    this.renderCardMemory(hand, layout, canvas);
  }

  private renderStrengthMeter(hand: Card[], layout: TableRegions, canvas: { width: number; height: number }): void {
    const strength = deriveStrengthMeter(evaluateHand(hand));
    const centerY = layout.actionButtons.y - 30;
    const pos = this.screenPoint(canvas, canvas.width / 2, centerY);
    const width = Math.min(260, Math.max(210, canvas.width - 96));
    const height = 34;
    const root = this.ensureNode('hud-strength-meter', this.uiRoot!);
    root.setPosition(pos.x, pos.y, 0);
    this.addUiTransform(root, width, height);
    this.drawHudPanel(root, width, height, new Color(48, 40, 58, 178));

    const barWidth = width - 104;
    const barHeight = 8;
    const barX = 30;
    const bar = this.ensureNode('hud-strength-bar', root);
    bar.setPosition(barX, -7, 0);
    this.addUiTransform(bar, barWidth, barHeight);
    const graphics = bar.getComponent(Graphics) ?? bar.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(255, 255, 255, 42);
    graphics.roundRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 4);
    graphics.fill();
    graphics.fillColor = this.strengthColor(strength.tone);
    const filled = Math.round((barWidth * strength.pct) / 100);
    graphics.roundRect(-barWidth / 2, -barHeight / 2, filled, barHeight, 4);
    graphics.fill();

    this.addLabel('手牌强度', -width / 2 + 46, 5, 13, root, 86, 22, 'hud-strength-title');
    this.addLabel(`${strength.label} ${strength.pct}%`, width / 2 - 56, 5, 13, root, 104, 22, 'hud-strength-value');
  }

  private renderCardMemory(hand: Card[], layout: TableRegions, canvas: { width: number; height: number }): void {
    const memory = deriveCardMemoryView(trackPlayed(this.fullGameEvents, hand));
    const rows = this.memoryExpanded ? memory.rows : memory.rows.slice(0, 6);
    const panelWidth = Math.min(334, Math.max(286, canvas.width - 44));
    const panelHeight = this.memoryExpanded ? 112 : 58;
    const centerY = layout.actionButtons.y - (this.memoryExpanded ? 98 : 76);
    const pos = this.screenPoint(canvas, canvas.width / 2, centerY);
    const root = this.ensureNode('hud-card-memory', this.uiRoot!);
    root.setPosition(pos.x, pos.y, 0);
    this.addUiTransform(root, panelWidth, panelHeight);
    this.drawHudPanel(root, panelWidth, panelHeight, new Color(42, 54, 62, 168));

    this.addLabel('剩牌', -panelWidth / 2 + 24, panelHeight / 2 - 18, 13, root, 42, 24, 'hud-memory-title');
    const toggleLabel = this.memoryExpanded ? '收起' : '展开';
    const toggle = this.addButton(toggleLabel, -panelWidth / 2 + 76, panelHeight / 2 - 18, 56, 28, true, () => {
      this.memoryExpanded = !this.memoryExpanded;
      this.render();
    }, root, 'hud-memory-toggle');
    toggle.fontSize = 14;
    toggle.lineHeight = 18;

    const cols = this.memoryExpanded ? 5 : 6;
    const cellWidth = Math.floor((panelWidth - 28) / cols);
    rows.forEach((row, index) => {
      const col = index % cols;
      const line = Math.floor(index / cols);
      const x = -panelWidth / 2 + 16 + cellWidth / 2 + col * cellWidth;
      const y = panelHeight / 2 - 52 - line * 24;
      const text = `${row.rankLabel}${row.remaining}`;
      const item = this.addLabel(text, x, y, 12, root, cellWidth, 22, `hud-memory-${index}`);
      item.color = row.exhausted ? new Color(255, 255, 255, 112) : new Color(255, 250, 228, 255);
    });

    if (!this.memoryExpanded) {
      const more = memory.rows.length - rows.length;
      this.addLabel(`+${more}`, panelWidth / 2 - 22, -11, 12, root, 34, 22, 'hud-memory-more');
    }
  }

  private renderBidding(
    bidding: ReturnType<typeof deriveScreenVM>['bidding'],
    layout: TableRegions,
    canvas: { width: number; height: number },
  ): void {
    if (!bidding) return;
    const promptY = Math.max(layout.playArea.y + layout.playArea.height + 16, layout.actionButtons.y - 50);
    const prompt = this.screenPoint(canvas, canvas.width / 2, promptY);
    this.addLabel(bidding.prompt, prompt.x, prompt.y, 18, this.uiRoot!, 220, 72, 'bidding-prompt');
    bidding.buttons.forEach((button, index) => {
      const spacing = Math.min(118, layout.actionButtons.width / Math.max(1, bidding.buttons.length));
      const screenX = layout.actionButtons.x + layout.actionButtons.width / 2 + (index - (bidding.buttons.length - 1) / 2) * spacing;
      const screenY = layout.actionButtons.y + Math.min(12, layout.actionButtons.height * 0.2);
      const pos = this.screenPoint(canvas, screenX, screenY);
      this.addButton(button.label, pos.x, pos.y, 112, 42, button.enabled, () => {
        if (!button.enabled) return;
        void this.submitBid(button.id);
      }, this.uiRoot!, `bid-${button.id}`);
    });
  }

  private renderHand(
    hand: ReturnType<typeof deriveScreenVM>['hand'],
    layout: TableRegions,
    canvas: { width: number; height: number },
  ): void {
    const title = this.screenPoint(canvas, canvas.width / 2, layout.playerHand.y + Math.min(24, layout.playerHand.height * 0.15));
    this.addLabel('玩家手牌', title.x, title.y, 16, this.uiRoot!, 140, 30, 'hand-title');
    const handSignature = cardsSignature(hand.map((slot) => slot.card));
    const animateDeal = this.settings.animation && handSignature !== this.lastHandSignature;
    const nextSelectedKeys = new Set<string>();
    const containerWidth = Math.max(1, layout.playerHand.width);
    const handTopY = layout.playerHand.y + Math.min(74, layout.playerHand.height * 0.46);
    hand.forEach((slot, index) => {
      const screenX = layout.playerHand.x + slot.x + CARD_SIZE.width / 2;
      const screenY = handTopY + slot.y;
      const { x, y } = this.screenPoint(canvas, screenX, screenY);
      this.addCard(slot.card, x, y, slot.selected, index, hand.length, animateDeal);
      if (slot.selected) nextSelectedKeys.add(cardKey(slot.card));
    });
    this.lastHandSignature = handSignature;
    this.renderedSelectedCardKeys = nextSelectedKeys;
  }

  private renderActions(
    play: boolean,
    pass: boolean,
    hint: boolean,
    layout: TableRegions,
    canvas: { width: number; height: number },
  ): void {
    const y = layout.actionButtons.y + layout.actionButtons.height * 0.78;
    const playPos = this.screenPoint(canvas, layout.actionButtons.x + layout.actionButtons.width * 0.1, y);
    const passPos = this.screenPoint(canvas, layout.actionButtons.x + layout.actionButtons.width * 0.5, y);
    const hintPos = this.screenPoint(canvas, layout.actionButtons.x + layout.actionButtons.width * 0.9, y);
    this.addButton('出牌', playPos.x, playPos.y, 84, 38, play, () => void this.submitPlay(), this.uiRoot!, 'action-play');
    this.addButton('不要', passPos.x, passPos.y, 84, 38, pass, () => void this.submitPass(), this.uiRoot!, 'action-pass');
    this.addButton('提示', hintPos.x, hintPos.y, 84, 38, hint, () => this.applyHint(), this.uiRoot!, 'action-hint');
  }

  private renderStatus(text: string, layout: TableRegions, canvas: { width: number; height: number }): void {
    const pos = this.screenPoint(canvas, canvas.width / 2, layout.playerHand.y + 2);
    this.addLabel(text, pos.x, pos.y, 18, this.uiRoot!, 180, 32, 'status-label');
  }

  private renderTurnTimer(layout: TableRegions, canvas: { width: number; height: number }): void {
    if (!this.syncTurnTimerKey()) return;
    const timer = deriveTurnTimer(TURN_TIMER_MS - this.turnTimerElapsedMs, TURN_TIMER_MS);
    const width = Math.min(188, Math.max(150, layout.actionButtons.width - 88));
    const height = 22;
    const pos = this.screenPoint(canvas, canvas.width / 2, layout.actionButtons.y + 13);
    const root = this.ensureNode('turn-timer-runtime', this.uiRoot!);
    root.setPosition(pos.x, pos.y, 0);
    this.addUiTransform(root, width, height);
    this.drawHudPanel(root, width, height, new Color(34, 39, 52, 166));

    const barWidth = width - 68;
    const barHeight = 5;
    const bar = this.ensureNode('turn-timer-bar', root);
    bar.setPosition(-14, -3, 0);
    this.addUiTransform(bar, barWidth, barHeight);
    const graphics = bar.getComponent(Graphics) ?? bar.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(255, 255, 255, 42);
    graphics.roundRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 3);
    graphics.fill();
    graphics.fillColor = timer.urgent ? new Color(255, 114, 114, 235) : new Color(134, 206, 255, 230);
    graphics.roundRect(-barWidth / 2, -barHeight / 2, Math.round((barWidth * timer.pct) / 100), barHeight, 3);
    graphics.fill();

    const label = this.addLabel(`计时 ${timer.label}`, width / 2 - 35, 1, 12, root, 60, 20, 'turn-timer-label');
    label.color = timer.urgent ? new Color(255, 196, 196, 255) : new Color(238, 248, 255, 255);
  }

  private renderToasts(layout: TableRegions, canvas: { width: number; height: number }): void {
    if (this.toasts.items.length === 0) return;
    const pos = this.screenPoint(canvas, canvas.width / 2, Math.max(148, layout.playArea.y - 10));
    const root = this.ensureNode('toast-layer-runtime', this.uiRoot!);
    root.setPosition(pos.x, pos.y, 0);
    this.addUiTransform(root, Math.min(260, canvas.width - 64), 112);

    this.toasts.items.forEach((toast, index) => {
      const width = Math.min(238, Math.max(174, canvas.width - 112));
      const height = 30;
      const node = this.ensureNode(`toast-${toast.id}`, root);
      node.setPosition(0, -index * 34, 0);
      this.addUiTransform(node, width, height);
      this.drawHudPanel(node, width, height, new Color(30, 32, 44, 190));
      const label = this.addLabel(toast.text, 0, 0, 15, node, width - 22, height, 'toast-label');
      label.color = new Color(255, 248, 225, 255);
      this.prepareToastAnimation(node, toast.id);
    });
  }

  private renderResult(result: ReturnType<typeof deriveScreenVM>['result'], canvas: { width: number; height: number }): void {
    if (!result) return;
    const panel = this.ensureNode('settlement-panel-runtime', this.uiRoot!);
    panel.setPosition(0, Math.round(canvas.height * 0.005), 0);
    panel.setScale(1, 1, 1);
    const panelWidth = Math.min(330, Math.max(280, canvas.width - 60));
    const panelHeight = Math.min(420, Math.max(360, canvas.height - 220));
    this.addUiTransform(panel, panelWidth, panelHeight);
    const sprite = panel.getComponent(Sprite) ?? panel.addComponent(Sprite);
    this.loadSprite(RESOURCE_PATHS.settlementBg, sprite);
    this.addLabel(result.resultText, 0, panelHeight * 0.36, 34, panel, 220, 72, 'result-title');
    this.addLabel(`倍数 ×${result.multiplier}  炸弹 ${result.bombs}`, 0, panelHeight * 0.22, 20, panel, 240, 40, 'result-multiplier');
    this.addLabel(result.springText || '本局结算', 0, panelHeight * 0.12, 18, panel, 240, 40, 'result-spring');
    this.addLabel(result.scores.map((row) => `座位${row.seat + 1}${row.isLandlord ? '(地主)' : ''}: ${row.score}`).join('\n'), 0, -panelHeight * 0.08, 18, panel, 260, 120, 'result-scores');
    this.addButton('再来一局', -74, -panelHeight * 0.37, 116, 42, true, () => this.startGame(true), panel, 'result-new');
    this.addButton('返回大厅', 74, -panelHeight * 0.37, 116, 42, true, () => director.loadScene('lobby'), panel, 'result-lobby');
    if (this.settings.animation) this.animateScaleIn(panel, 0.92, 180);
  }

  private async submitBid(id: 'call' | 'grab' | 'pass'): Promise<void> {
    if (!this.runtime || this.submitting) return;
    this.submitting = true;
    const type = id === 'call' ? 'call' : id === 'grab' ? 'grab' : 'pass';
    const result = await this.runtime.submitPlayerAction({ kind: 'bid', action: { type, seat: HERO_SEAT } });
    if (!result.ok) this.showStatus(result.error?.reason ?? '叫抢失败');
    else this.statusText = '';
    this.submitting = false;
    this.render();
  }

  private async submitPlay(): Promise<void> {
    if (!this.runtime || this.submitting || this.selected.length === 0) return;
    this.submitting = true;
    const result = await this.runtime.submitPlayerAction({
      kind: 'play',
      action: { type: 'play', seat: HERO_SEAT, cards: this.selected },
    });
    if (result.ok) this.selected = clearSelection();
    else this.showStatus(result.error?.reason ?? '出牌失败');
    if (result.ok) this.statusText = '';
    this.submitting = false;
    this.render();
  }

  private async submitPass(): Promise<void> {
    if (!this.runtime || this.submitting) return;
    this.submitting = true;
    const result = await this.runtime.submitPlayerAction({ kind: 'play', action: { type: 'pass', seat: HERO_SEAT } });
    if (!result.ok) this.showStatus(result.error?.reason ?? '不能过牌');
    else this.statusText = '';
    this.submitting = false;
    this.render();
  }

  private applyHint(): void {
    if (!this.runtime) return;
    const snapshot = this.runtime.currentSnapshot();
    if (!snapshot?.viewerHand || !this.runtime.isPlayerTurn()) return;
    const move = nextHint(snapshot.viewerHand, snapshot.top?.pattern ?? null, this.selected.length > 0 ? this.selected : undefined);
    if (!move) return;
    this.selected = move.cards.slice();
    this.render();
  }

  private addCard(
    card: Card,
    x: number,
    y: number,
    selected: boolean,
    index: number,
    total: number,
    animateDeal: boolean,
  ): void {
    const node = this.addCardNode(card, x, y, this.uiRoot!, `card-${index}`, true);
    const key = cardKey(card);
    const wasSelected = this.renderedSelectedCardKeys.has(key);
    if (this.settings.animation && animateDeal) {
      this.animateCardDeal(node, x, y, index, total);
    } else if (this.settings.animation && wasSelected !== selected) {
      const fromY = selected ? y - HAND_LIFT : y + HAND_LIFT;
      node.setPosition(x, fromY, 0);
      tween(node).to(0.12, { position: new Vec3(x, y, 0) }).start();
    } else {
      node.setPosition(x, y, 0);
    }
  }

  private addDisplayCard(card: Card, x: number, y: number, parent: Node, name: string, animate: boolean): void {
    const node = this.addCardNode(card, x, y, parent, name, false);
    if (this.settings.animation && animate) this.animateCardPlay(node, x, y);
  }

  private addCardNode(card: Card, x: number, y: number, parent: Node, name: string, interactive: boolean): Node {
    const node = this.ensureNode(`${name}-${cardKey(card)}`, parent);
    node.setPosition(x, y, 0);
    node.setScale(1, 1, 1);
    const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    opacity.opacity = 255;
    this.addUiTransform(node, CARD_SIZE.width, CARD_SIZE.height);
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    const view = cardView(card);
    this.loadSprite(cardAssetPath(view.assetKey) ?? RESOURCE_PATHS.cardTemplate, sprite);
    node.off(Node.EventType.TOUCH_END);
    if (interactive) node.on(Node.EventType.TOUCH_END, () => this.toggleCard(card), this);

    const label = this.addLabel(`${view.rankLabel}${suitText(view.suitKey)}`, -12, 18, 10, node, 30, 18, 'card-rank-label');
    label.color =
      view.suitKey === Suit.Heart || view.suitKey === Suit.Diamond
        ? new Color(205, 96, 124, 255)
        : new Color(84, 74, 92, 255);
    return node;
  }

  private animateCardDeal(node: Node, x: number, y: number, index: number, total: number): void {
    const delay = dealCardDelay(index, total) / 1000;
    const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    opacity.opacity = 0;
    node.setPosition(x, y - 42, 0);
    tween(node).delay(delay).to(0.18, { position: new Vec3(x, y, 0) }).start();
    tween(opacity).delay(delay).to(0.12, { opacity: 255 }).start();
  }

  private animateCardPlay(node: Node, x: number, y: number): void {
    const fly = playFlyFromTo();
    const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    opacity.opacity = 0;
    node.setPosition(x, y + fly.fromY, 0);
    tween(node).to(fly.durationMs / 1000, { position: new Vec3(x, y + fly.toY, 0) }).start();
    tween(opacity).to(Math.min(0.14, fly.durationMs / 1000), { opacity: 255 }).start();
  }

  private animateScaleIn(node: Node, fromScale: number, durationMs: number): void {
    const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    opacity.opacity = 0;
    node.setScale(fromScale, fromScale, 1);
    tween(node).to(durationMs / 1000, { scale: new Vec3(1, 1, 1) }).start();
    tween(opacity).to(Math.min(0.16, durationMs / 1000), { opacity: 255 }).start();
  }

  private toggleCard(card: Card): void {
    if (!this.runtime?.isPlayerTurn() || this.runtime.phase() !== 'playing') return;
    this.selected = toggle(this.selected, card);
    this.render();
  }

  private addButton(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    enabled: boolean,
    cb: () => void,
    parent: Node = this.uiRoot!,
    name?: string,
  ): Label {
    const node = this.ensureNode(name ?? `button-${text}-${x}-${y}`, parent);
    node.setPosition(x, y, 0);
    this.addUiTransform(node, width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.target = this.drawButtonBackground(node, width, height, enabled);
    button.transition = Button.Transition.COLOR;
    button.interactable = enabled;
    button.normalColor = enabled ? new Color(255, 255, 255, 70) : new Color(255, 255, 255, 30);
    button.pressedColor = new Color(255, 214, 226, 150);
    button.hoverColor = new Color(255, 255, 255, 100);
    button.disabledColor = new Color(255, 255, 255, 24);
    node.off(Button.EventType.CLICK);
    node.on(Button.EventType.CLICK, cb, this);

    const labelNode = this.ensureNode('button-label', node);
    this.addUiTransform(labelNode, width, height);
    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = 20;
    label.lineHeight = 24;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.color = labelColor(enabled);
    return label;
  }

  private addLabel(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    parent: Node = this.uiRoot!,
    width = 220,
    height = 72,
    name?: string,
  ): Label {
    const node = this.ensureNode(name ?? `label-${text}-${x}-${y}`, parent);
    node.setPosition(x, y, 0);
    this.addUiTransform(node, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 5;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.color = new Color(255, 255, 255, 255);
    return label;
  }

  private showStatus(text: string): void {
    this.statusText = text;
  }

  private tickToastState(): boolean {
    const before = this.toasts.items.map((toast) => toast.id).join('|');
    this.toasts = tickToasts(this.toasts, this.toastClockMs);
    const activeIds = new Set(this.toasts.items.map((toast) => toast.id));
    this.animatedToastIds = new Set([...this.animatedToastIds].filter((id) => activeIds.has(id)));
    return before !== this.toasts.items.map((toast) => toast.id).join('|');
  }

  private pushEventToast(event: FlowEvent): void {
    const text = this.eventToastText(event);
    if (!text) return;
    this.toasts = pushToast(this.toasts, text, this.toastClockMs);
  }

  private eventToastText(event: FlowEvent): string | null {
    if (event.type === 'round') {
      const round = event.event;
      if (round.type === 'bomb') return `座位${round.seat + 1} 炸弹！`;
      if (round.type === 'rocket') return `座位${round.seat + 1} 火箭！`;
      if (round.type === 'pass') return `座位${round.seat + 1} 不要`;
      return null;
    }
    if (event.type === 'settled') {
      if (event.settlement.spring === 'spring') return '春天！';
      if (event.settlement.spring === 'anti-spring') return '反春天！';
    }
    return null;
  }

  private currentPlayerTurnKey(): string | null {
    if (!this.runtime?.isPlayerTurn()) return null;
    const phase = this.runtime.phase();
    if (phase === 'playing') {
      const snapshot = this.runtime.currentSnapshot();
      if (!snapshot) return null;
      const top = snapshot.top ? `${snapshot.top.seat}:${cardsSignature(snapshot.top.pattern.cards)}` : 'lead';
      return ['playing', snapshot.turn, top, snapshot.handCounts.join(',')].join(':');
    }
    return null;
  }

  private syncTurnTimerKey(): boolean {
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

  private prepareToastAnimation(node: Node, id: number): void {
    const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    if (!this.settings.animation) {
      opacity.opacity = 255;
      node.setScale(1, 1, 1);
      return;
    }
    if (this.animatedToastIds.has(id)) {
      opacity.opacity = 255;
      node.setScale(1, 1, 1);
      return;
    }
    this.animatedToastIds.add(id);
    opacity.opacity = 0;
    node.setScale(0.96, 0.96, 1);
    tween(opacity).to(0.14, { opacity: 255 }).start();
    tween(node).to(0.14, { scale: new Vec3(1, 1, 1) }).start();
  }

  private playCue(event: FlowEvent): void {
    const cue = cueForFlowEvent(event);
    if (!cue) return;
    const settings = this.reloadSettings();
    const decision = decideCuePlayback(settings, cue);
    const path = cueAudioPath(cue);
    if (decision.effect) this.playEffect(cue);
    if (decision.vibrate) this.vibrate();
    if (!decision.sound || !path || !this.audioSource) return;
    resources.load(path, AudioClip, (error, clip) => {
      if (!error && clip && this.audioSource) {
        this.audioSource.clip = clip;
        this.audioSource.play();
      }
    });
  }

  private playEffect(cue: CueId): void {
    if (!this.uiRoot) return;
    const params = pulseParams(cue);
    if (!params) return;
    const target = cue === 'bomb' || cue === 'rocket' || cue === 'play' ? this.playAreaRoot ?? this.uiRoot : this.uiRoot;
    tween(target)
      .to(params.upMs / 1000, { scale: new Vec3(params.scaleUp, params.scaleUp, 1) })
      .to(params.downMs / 1000, { scale: new Vec3(1, 1, 1) })
      .start();
    if (cue === 'bomb' || cue === 'rocket') {
      const origin = target.position.clone();
      tween(target)
        .by(0.04, { position: new Vec3(5, 0, 0) })
        .by(0.08, { position: new Vec3(-10, 0, 0) })
        .by(0.04, { position: new Vec3(5, 0, 0) })
        .call(() => target.setPosition(origin))
        .start();
    }
  }

  private reloadSettings(): Settings {
    this.settings = loadSettings(cocosStorage(), SETTINGS_KEY);
    return this.settings;
  }

  private toggleRuntimeSetting(key: ToggleKey): void {
    const next = toggleSetting(this.reloadSettings(), key);
    try {
      saveSettings(cocosStorage(), SETTINGS_KEY, next);
      this.settings = next;
    } catch (error) {
      console.warn('saveSettings failed', error);
    }
    this.render();
  }

  private vibrate(): void {
    try {
      const navigatorLike = (globalThis as { navigator?: { vibrate?: (pattern: number | number[]) => boolean } }).navigator;
      if (navigatorLike?.vibrate) {
        navigatorLike.vibrate(30);
        return;
      }
      (sys as unknown as { vibrate?: () => void }).vibrate?.();
    } catch {
      // Vibration is optional across platforms; unsupported targets should stay silent.
    }
  }

  private ensureNode(name: string, parent: Node): Node {
    const existing = parent.getChildByName(name);
    if (existing) {
      existing.active = true;
      existing.layer = parent.layer;
      existing.setSiblingIndex(parent.children.length - 1);
      this.liveRenderNodes?.add(existing);
      return existing;
    }
    const node = new Node(name);
    node.parent = parent;
    node.layer = parent.layer;
    node.active = true;
    node.setSiblingIndex(parent.children.length - 1);
    this.liveRenderNodes?.add(node);
    return node;
  }

  private beginRenderDiff(): void {
    this.liveRenderNodes = new Set<Node>();
  }

  private endRenderDiff(): void {
    if (this.uiRoot && this.liveRenderNodes) this.pruneInactiveChildren(this.uiRoot);
    this.liveRenderNodes = null;
  }

  private pruneInactiveChildren(parent: Node): void {
    const live = this.liveRenderNodes;
    if (!live) return;
    for (const child of parent.children.slice()) {
      if (!live.has(child)) {
        child.removeFromParent();
        child.destroy();
      } else {
        this.pruneInactiveChildren(child);
      }
    }
  }

  private hideSceneScaffold(): void {
    for (const name of SCAFFOLD_NODE_NAMES) {
      const child = this.node.getChildByName(name);
      if (child) child.active = false;
    }
  }

  private drawButtonBackground(parent: Node, width: number, height: number, enabled: boolean): Node {
    const node = this.ensureNode('button-bg', parent);
    this.addUiTransform(node, width, height);
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = enabled ? new Color(255, 255, 255, 70) : new Color(255, 255, 255, 30);
    graphics.roundRect(-width / 2, -height / 2, width, height, 8);
    graphics.fill();
    return node;
  }

  private drawHudPanel(parent: Node, width: number, height: number, fill: Color): void {
    const graphics = parent.getComponent(Graphics) ?? parent.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = fill;
    graphics.roundRect(-width / 2, -height / 2, width, height, 8);
    graphics.fill();
  }

  private strengthColor(tone: 'weak' | 'mid' | 'strong'): Color {
    if (tone === 'strong') return new Color(124, 218, 150, 230);
    if (tone === 'mid') return new Color(255, 210, 112, 230);
    return new Color(255, 134, 134, 230);
  }

  private addUiTransform(node: Node, width: number, height: number): UITransform {
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return transform;
  }

  private canvasSize(): { width: number; height: number } {
    const size = this.node.getComponent(UITransform)?.contentSize;
    return {
      width: Math.max(1, size?.width ?? 390),
      height: Math.max(1, size?.height ?? 844),
    };
  }

  private rectPoint(rect: Rect, canvas: { width: number; height: number }, fx: number, fy: number): { x: number; y: number } {
    return this.screenPoint(canvas, rect.x + rect.width * fx, rect.y + rect.height * fy);
  }

  private screenPoint(canvas: { width: number; height: number }, screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: Math.round(screenX - canvas.width / 2),
      y: Math.round(canvas.height / 2 - screenY),
    };
  }

  private loadSprite(path: string, sprite: Sprite | null): void {
    if (!sprite) return;
    const cached = this.spriteFrames.get(path);
    if (cached) {
      sprite.spriteFrame = cached;
      return;
    }
    resources.load(path, SpriteFrame, (error, frame) => {
      if (!error && frame) {
        this.spriteFrames.set(path, frame);
        sprite.spriteFrame = frame;
      }
    });
  }
}
