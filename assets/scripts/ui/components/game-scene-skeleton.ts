import {
  _decorator,
  AudioClip,
  AudioSource,
  BlockInputEvents,
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
import { adviseAction } from '../../ai/insight';
import { commitFinishedRound, persistRound, restoreRound, type SessionKeys } from '../../data/session';
import { difficultyConfig } from '../../data/difficultyConfig';
import { defaultSettings, type Settings } from '../../data/settings';
import { loadSettings, saveSettings } from '../../data/settingsStorage';
import { startRoundRuntime, resumeRoundRuntime, type RoundRuntime } from '../../flow/round-runtime';
import { realClock } from '../../flow/clock';
import type { FlowEvent } from '../../flow/types';
import type { GameEvent, ResumeSnapshot, RoundFinishInput, SeatIndex, TopPlay } from '../../game';
import { type Card, Suit } from '../../rules';
import { cardKey } from '../../rules/guards';
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
import { deriveAiThinking } from '../ai-thinking-view';
import { deriveInsightView } from '../insight-view';
import { deriveLastActions, type SeatLastAction } from '../last-action-view';
import { askQuit, cancelQuit, closeMenu, initialPause, openMenu, type PauseState } from '../pause-menu';
import type { Rect, TableRegions } from '../table-layout';
import { toggleSetting, type ToggleKey } from '../settings-view';
import {
  RESOURCE_PATHS,
  cardAssetPath,
  cueAudioPath,
  suitAssetPath,
} from '../asset-keys';
import { addButton as addUiButton, addLabel as addUiLabel, addUiTransform, drawPanel, loadSprite } from './ui-helpers';

const { ccclass, property } = _decorator;

const HERO_SEAT: SeatIndex = 0;
const SETTINGS_KEY = 'doudizhu.settings';
const SESSION_KEYS: SessionKeys = {
  save: 'doudizhu.save',
  stats: 'doudizhu.stats',
  records: 'doudizhu.records',
};

const CARD_SIZE = { width: 52, height: 74 };
const CARD_SUIT_ICON_SIZE = 22;
const HAND_LIFT = 18;
const LANDSCAPE_CANVAS = { width: 844, height: 390 };
const GAME_TABLE_BACKGROUND_ASPECT = 1844 / 853;
const CARD_PRESS_SCALE = 0.96;
const CARD_PRESS_OPACITY = 214;
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

function cardsSignature(cards: Card[]): string {
  return cards.map(cardKey).join('|');
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

function seatName(seat: number): string {
  if (seat === 0) return '你';
  if (seat === 1) return '左家';
  if (seat === 2) return '右家';
  return `座位${seat + 1}`;
}

function seatNameWithRole(seat: number, isLandlord: boolean): string {
  return `${seatName(seat)}${isLandlord ? '（地主）' : ''}`;
}

function phaseText(phase: string): string {
  if (phase === 'bidding') return '叫地主';
  if (phase === 'playing') return '对局中';
  if (phase === 'settled') return '本局结算';
  return phase;
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
  private advisorEnabled = false;
  private pauseState: PauseState = initialPause;
  private renderedPauseStage: PauseState['stage'] = 'closed';
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
    if (this.background) this.background.node.active = false;
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
    const timerFrozen = this.isTurnTimerFrozen();
    const thinkingAnimating = this.settings.animation && this.isAiThinkingActive();
    if (timerActive && !timerFrozen) this.turnTimerElapsedMs = Math.min(TURN_TIMER_MS, this.turnTimerElapsedMs + deltaMs);
    if (((timerActive && !timerFrozen) || thinkingAnimating) && this.uiTickRenderMs >= UI_TICK_RENDER_MS) {
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
    this.advisorEnabled = false;
    this.pauseState = initialPause;
    this.renderedPauseStage = 'closed';
    this.submitting = false;
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
    this.renderPlaceholderBackground(canvas);
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
    this.renderSeatFeedback(vm.layout, canvas);
    this.renderPlayArea(snapshot?.top ?? null, vm.layout, canvas);
    this.renderHud(snapshot?.viewerHand ?? [], vm.layout, canvas);
    this.renderAdvisor(snapshot, vm.layout, canvas);
    this.renderBidding(bidding ? vm.bidding : undefined, vm.layout, canvas);
    this.renderHand(vm.hand, vm.layout, canvas);
    this.renderStatus(this.statusText, vm.layout, canvas);
    this.renderTurnTimer(vm.layout, canvas);
    this.renderActions(vm.actions.play, vm.actions.pass, vm.actions.hint, vm.layout, canvas);
    this.renderToasts(vm.layout, canvas);
    this.renderResult(vm.result, canvas);
    if (!vm.result) {
      this.renderPauseControl(vm.layout, canvas);
      this.renderPauseOverlay(canvas);
    }
    this.endRenderDiff();
  }

  private renderTopBar(
    phase: string,
    topBar: { multiplier: number; bombs: number; landlordSeat: number | null },
    handCount: number,
    layout: TableRegions,
    canvas: { width: number; height: number },
  ): void {
    const phasePos = this.rectPoint(layout.topBar, canvas, 0.5, 0.625);
    const infoY = layout.topBar.y + layout.topBar.height + 8;
    const landlordPos = this.screenPoint(canvas, canvas.width / 6, infoY);
    const multiplierPos = this.screenPoint(canvas, canvas.width / 2, infoY);
    const handPos = this.screenPoint(canvas, (canvas.width * 5) / 6, infoY);
    this.addLabel(phaseText(phase), phasePos.x, phasePos.y, 18, this.uiRoot!, 140, 30, 'top-phase');
    if (topBar.landlordSeat !== null) {
      this.addLabel(`地主：${seatName(topBar.landlordSeat)}`, landlordPos.x, landlordPos.y, 16, this.uiRoot!, 120, 30, 'top-landlord');
    }
    this.addLabel(`倍数 ×${topBar.multiplier}`, multiplierPos.x, multiplierPos.y, 16, this.uiRoot!, 110, 30, 'top-multiplier');
    this.addLabel(`手牌 ${handCount}`, handPos.x, handPos.y, 16, this.uiRoot!, 110, 30, 'top-hand-count');
  }

  private renderRuntimeSettings(layout: TableRegions, canvas: { width: number; height: number }): void {
    const settings = this.settings;
    const controls: { key: ToggleKey; label: string; on: boolean; fx: number }[] = [
      { key: 'sound', label: '音效', on: settings.sound, fx: 0.22 },
      { key: 'animation', label: '动效', on: settings.animation, fx: 0.5 },
      { key: 'vibration', label: '震动', on: settings.vibration, fx: 0.78 },
    ];
    const landscape = this.isLandscape(canvas);
    const y = landscape
      ? Math.max(
          layout.opponentLeft.y + layout.opponentLeft.height + 10,
          layout.playArea.y - 13,
        )
      : layout.opponentLeft.y + layout.opponentLeft.height * 0.35;
    const landscapeXs = [canvas.width / 2 - 96, canvas.width / 2, canvas.width / 2 + 96];
    for (const control of controls) {
      const index = controls.indexOf(control);
      const x = landscape ? landscapeXs[index] : canvas.width * control.fx;
      const pos = this.screenPoint(canvas, x, y);
      this.addButton(
        `${control.label}${control.on ? '开' : '关'}`,
        pos.x,
        pos.y,
        landscape ? 72 : 88,
        landscape ? 26 : 32,
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
    const left = this.rectPoint(layout.opponentLeft, canvas, 0.5, 0.5);
    const right = this.rectPoint(layout.opponentRight, canvas, 0.5, 0.5);
    this.addLabel(`左家\n${handCounts[1]}张${landlord === 1 ? '\n地主' : ''}`, left.x, left.y, 16, this.uiRoot!, 108, 64, 'seat-left');
    this.addLabel(`右家\n${handCounts[2]}张${landlord === 2 ? '\n地主' : ''}`, right.x, right.y, 16, this.uiRoot!, 108, 64, 'seat-right');
  }

  private renderSeatFeedback(layout: TableRegions, canvas: { width: number; height: number }): void {
    this.renderLastActions(layout, canvas);
    this.renderAiThinking(layout, canvas);
  }

  private renderLastActions(layout: TableRegions, canvas: { width: number; height: number }): void {
    const recentRoundEvents = this.recentEvents.flatMap((event) => (event.type === 'round' ? [event.event] : []));
    const rows = deriveLastActions(recentRoundEvents);
    rows.forEach((row) => {
      const pos = this.lastActionPosition(row.seat, layout, canvas);
      const label = this.addLabel(row.text, pos.x, pos.y, 12, this.uiRoot!, pos.width, 24, `last-action-${row.seat}`);
      label.color = row.text === '—' ? new Color(255, 255, 255, 120) : new Color(255, 244, 209, 230);
    });
  }

  private renderAiThinking(layout: TableRegions, canvas: { width: number; height: number }): void {
    const thinking = this.aiThinkingView();
    if (!thinking?.active || thinking.seat === null) {
      this.clearAiThinkingNodes();
      return;
    }
    const pos = this.aiThinkingPosition(thinking.seat, layout, canvas);
    const root = this.ensureNode(`ai-thinking-${thinking.seat}`, this.uiRoot!);
    root.setPosition(pos.x, pos.y, 0);
    addUiTransform(root, pos.width, 28);
    drawPanel(root, pos.width, 28, new Color(37, 42, 58, 176));

    const dots = this.settings.animation ? '.'.repeat(thinking.dots) : '';
    const label = this.addLabel(`${seatName(thinking.seat)}思考中${dots}`, 0, 1, 13, root, pos.width - 12, 24, 'ai-thinking-label');
    label.color = new Color(221, 242, 255, 255);
  }

  private clearAiThinkingNodes(): void {
    for (const seat of [0, 1, 2]) {
      const node = this.uiRoot?.getChildByName(`ai-thinking-${seat}`);
      if (!node) continue;
      node.removeFromParent();
      node.destroy();
    }
  }

  private renderPlayArea(top: TopPlay | null, layout: TableRegions, canvas: { width: number; height: number }): void {
    const area = this.ensureNode('play-area-runtime', this.uiRoot!);
    this.playAreaRoot = area;
    const pos = this.rectPoint(layout.playArea, canvas, 0.5, 0.78);
    const width = Math.min(250, Math.max(170, layout.playArea.width - 42));
    const height = Math.min(112, Math.max(86, layout.playArea.height * 0.62));
    area.setPosition(pos.x, pos.y, 0);
    addUiTransform(area, width, height);

    const labelText = top ? `${seatName(top.seat)}·已出牌` : '自由出牌';
    const label = this.addLabel(labelText, 0, 34, 18, area, 170, 34, 'play-area-label');
    label.lineHeight = 24;
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
    const landscape = this.isLandscape(canvas);
    const centerY = landscape
      ? layout.playArea.y + layout.playArea.height + Math.min(14, Math.max(10, (layout.actionButtons.y - (layout.playArea.y + layout.playArea.height)) * 0.36))
      : layout.actionButtons.y - 30;
    const pos = this.screenPoint(canvas, canvas.width / 2, centerY);
    const width = landscape ? Math.min(218, Math.max(194, canvas.width * 0.27)) : Math.min(260, Math.max(210, canvas.width - 96));
    const height = landscape ? 26 : 34;
    const root = this.ensureNode('hud-strength-meter', this.uiRoot!);
    root.setPosition(pos.x, pos.y, 0);
    addUiTransform(root, width, height);
    drawPanel(root, width, height, new Color(48, 40, 58, 178));

    const barWidth = width - 104;
    const barHeight = landscape ? 6 : 8;
    const barX = 30;
    const bar = this.ensureNode('hud-strength-bar', root);
    bar.setPosition(barX, landscape ? -5 : -7, 0);
    addUiTransform(bar, barWidth, barHeight);
    const graphics = bar.getComponent(Graphics) ?? bar.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(255, 255, 255, 42);
    graphics.roundRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 4);
    graphics.fill();
    graphics.fillColor = this.strengthColor(strength.tone);
    const filled = Math.round((barWidth * strength.pct) / 100);
    graphics.roundRect(-barWidth / 2, -barHeight / 2, filled, barHeight, 4);
    graphics.fill();

    this.addLabel('手牌强度', -width / 2 + 44, landscape ? 3 : 5, landscape ? 12 : 13, root, 82, 20, 'hud-strength-title');
    this.addLabel(`${strength.label} ${strength.pct}%`, width / 2 - 54, landscape ? 3 : 5, landscape ? 12 : 13, root, 102, 20, 'hud-strength-value');
  }

  private renderCardMemory(hand: Card[], layout: TableRegions, canvas: { width: number; height: number }): void {
    const memory = deriveCardMemoryView(trackPlayed(this.fullGameEvents, hand));
    const rows = this.memoryExpanded ? memory.rows : memory.rows.slice(0, 6);
    const landscape = this.isLandscape(canvas);
    const panelWidth = landscape
      ? (this.memoryExpanded ? 220 : 196)
      : Math.min(334, Math.max(286, canvas.width - 44));
    const panelHeight = landscape
      ? (this.memoryExpanded ? 104 : 72)
      : (this.memoryExpanded ? 112 : 58);
    const centerX = landscape
      ? Math.max(panelWidth / 2 + 12, layout.playArea.x - panelWidth / 2 - 14)
      : canvas.width / 2;
    const centerY = landscape
      ? layout.playArea.y + layout.playArea.height * 0.55
      : layout.actionButtons.y - (this.memoryExpanded ? 98 : 76);
    const pos = this.screenPoint(canvas, centerX, centerY);
    const root = this.ensureNode('hud-card-memory', this.uiRoot!);
    root.setPosition(pos.x, pos.y, 0);
    addUiTransform(root, panelWidth, panelHeight);
    drawPanel(root, panelWidth, panelHeight, new Color(42, 54, 62, 168));

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
      const y = panelHeight / 2 - (landscape ? 44 : 52) - line * (landscape ? 19 : 24);
      const text = `${row.rankLabel}${row.remaining}`;
      const item = this.addLabel(text, x, y, 12, root, cellWidth, 22, `hud-memory-${index}`);
      item.color = row.exhausted ? new Color(255, 255, 255, 112) : new Color(255, 250, 228, 255);
    });

    if (!this.memoryExpanded) {
      const more = memory.rows.length - rows.length;
      this.addLabel(`+${more}`, panelWidth / 2 - 22, landscape ? -20 : -11, 12, root, 34, 22, 'hud-memory-more');
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
    if (hand.length === 0) {
      const title = this.screenPoint(canvas, canvas.width / 2, layout.playerHand.y + Math.min(24, layout.playerHand.height * 0.15));
      this.addLabel('玩家手牌', title.x, title.y, 16, this.uiRoot!, 140, 30, 'hand-title');
    }
    const handSignature = cardsSignature(hand.map((slot) => slot.card));
    const animateDeal = this.settings.animation && handSignature !== this.lastHandSignature;
    const nextSelectedKeys = new Set<string>();
    const handTopY = layout.playerHand.y + Math.min(52, layout.playerHand.height * 0.33);
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
    const y = layout.actionButtons.y + layout.actionButtons.height * (this.isLandscape(canvas) ? 0.48 : 0.78);
    const playPos = this.screenPoint(canvas, layout.actionButtons.x + layout.actionButtons.width * 0.1, y);
    const passPos = this.screenPoint(canvas, layout.actionButtons.x + layout.actionButtons.width * 0.5, y);
    const hintPos = this.screenPoint(canvas, layout.actionButtons.x + layout.actionButtons.width * 0.9, y);
    this.addButton('出牌', playPos.x, playPos.y, 84, 38, play, () => void this.submitPlay(), this.uiRoot!, 'action-play');
    this.addButton('不要', passPos.x, passPos.y, 84, 38, pass, () => void this.submitPass(), this.uiRoot!, 'action-pass');
    this.addButton('提示', hintPos.x, hintPos.y, 84, 38, hint, () => this.applyHint(), this.uiRoot!, 'action-hint');
  }

  private renderStatus(text: string, layout: TableRegions, canvas: { width: number; height: number }): void {
    if (!text) return;
    const y = this.isLandscape(canvas) ? layout.actionButtons.y - 10 : layout.playerHand.y + 2;
    const pos = this.screenPoint(canvas, canvas.width / 2, y);
    this.addLabel(text, pos.x, pos.y, 18, this.uiRoot!, 180, 32, 'status-label');
  }

  private renderTurnTimer(layout: TableRegions, canvas: { width: number; height: number }): void {
    if (!this.syncTurnTimerKey()) return;
    const timer = deriveTurnTimer(TURN_TIMER_MS - this.turnTimerElapsedMs, TURN_TIMER_MS);
    const landscape = this.isLandscape(canvas);
    const width = landscape ? 126 : Math.min(188, Math.max(150, layout.actionButtons.width - 88));
    const height = landscape ? 20 : 22;
    const timerX = landscape ? Math.min(canvas.width - width / 2 - 18, canvas.width / 2 + 178) : canvas.width / 2;
    const timerY = landscape
      ? layout.playArea.y + layout.playArea.height + Math.min(14, Math.max(10, (layout.actionButtons.y - (layout.playArea.y + layout.playArea.height)) * 0.36))
      : layout.actionButtons.y + 13;
    const pos = this.screenPoint(canvas, timerX, timerY);
    const root = this.ensureNode('turn-timer-runtime', this.uiRoot!);
    root.setPosition(pos.x, pos.y, 0);
    addUiTransform(root, width, height);
    drawPanel(root, width, height, new Color(34, 39, 52, 166));

    const barWidth = width - (landscape ? 54 : 68);
    const barHeight = landscape ? 4 : 5;
    const bar = this.ensureNode('turn-timer-bar', root);
    bar.setPosition(landscape ? -10 : -14, landscape ? -3 : -3, 0);
    addUiTransform(bar, barWidth, barHeight);
    const graphics = bar.getComponent(Graphics) ?? bar.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(255, 255, 255, 42);
    graphics.roundRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 3);
    graphics.fill();
    graphics.fillColor = timer.urgent ? new Color(255, 114, 114, 235) : new Color(134, 206, 255, 230);
    graphics.roundRect(-barWidth / 2, -barHeight / 2, Math.round((barWidth * timer.pct) / 100), barHeight, 3);
    graphics.fill();

    const label = this.addLabel(`计时 ${timer.label}`, width / 2 - (landscape ? 31 : 35), 1, 12, root, landscape ? 56 : 60, 20, 'turn-timer-label');
    label.color = timer.urgent ? new Color(255, 196, 196, 255) : new Color(238, 248, 255, 255);
  }

  private renderAdvisor(
    snapshot: ReturnType<RoundRuntime['currentSnapshot']> | undefined,
    layout: TableRegions,
    canvas: { width: number; height: number },
  ): void {
    if (!snapshot?.viewerHand || !this.runtime?.isPlayerTurn() || this.runtime.phase() !== 'playing') return;
    const centerY = this.advisorCenterY(layout);
    const landscape = this.isLandscape(canvas);
    const toggleX = landscape ? Math.max(84, canvas.width / 2 - 178) : layout.actionButtons.x + 34;
    const togglePos = this.screenPoint(canvas, toggleX, centerY);
    this.addButton(
      this.advisorEnabled ? '建议开' : '建议关',
      togglePos.x,
      togglePos.y,
      landscape ? 64 : 70,
      landscape ? 24 : 30,
      true,
      () => this.toggleAdvisor(),
      this.uiRoot!,
      'advisor-toggle',
    );

    if (!this.advisorEnabled) return;
    const insight = deriveInsightView(adviseAction(snapshot.viewerHand, snapshot.top?.pattern ?? null));
    if (!insight.text) return;

    const width = landscape ? Math.min(190, Math.max(164, canvas.width * 0.22)) : Math.min(226, Math.max(188, canvas.width - 156));
    const height = landscape ? 24 : 30;
    const panelX = landscape
      ? Math.max(width / 2 + 18, canvas.width / 2 - 86)
      : Math.min(canvas.width - width / 2 - 24, layout.actionButtons.x + layout.actionButtons.width * 0.66);
    const panelPos = this.screenPoint(canvas, panelX, centerY);
    const root = this.ensureNode('advisor-panel', this.uiRoot!);
    root.setPosition(panelPos.x, panelPos.y, 0);
    addUiTransform(root, width, height);
    const color = insight.isPass
      ? new Color(43, 55, 75, 190)
      : insight.emphasize
        ? new Color(52, 86, 63, 192)
        : new Color(37, 42, 58, 184);
    drawPanel(root, width, height, color);

    const label = this.addLabel(insight.text, 0, 1, landscape ? 12 : 13, root, width - 18, height - 4, 'advisor-label');
    label.color = insight.emphasize ? new Color(221, 255, 224, 255) : new Color(255, 248, 226, 255);
  }

  private advisorCenterY(layout: TableRegions): number {
    if (layout.playArea.width > layout.playArea.height * 2) {
      return layout.playArea.y + layout.playArea.height + Math.min(14, Math.max(10, (layout.actionButtons.y - (layout.playArea.y + layout.playArea.height)) * 0.36));
    }
    const defaultY = layout.playArea.y + layout.playArea.height + 56;
    return this.memoryExpanded && this.advisorEnabled ? layout.playArea.y + layout.playArea.height + 24 : defaultY;
  }

  private renderToasts(layout: TableRegions, canvas: { width: number; height: number }): void {
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
      drawPanel(node, width, height, new Color(30, 32, 44, 190));
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
    const landscape = this.isLandscape(canvas);
    const panelWidth = landscape
      ? Math.min(360, Math.max(300, canvas.width * 0.42))
      : Math.min(330, Math.max(280, canvas.width - 60));
    const panelHeight = landscape
      ? Math.min(318, Math.max(278, canvas.height - 54))
      : Math.min(420, Math.max(360, canvas.height - 220));
    addUiTransform(panel, panelWidth, panelHeight);
    const sprite = panel.getComponent(Sprite) ?? panel.addComponent(Sprite);
    sprite.type = Sprite.Type.SIMPLE;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    loadSprite(RESOURCE_PATHS.settlementBg, sprite, this.spriteFrames);
    this.addLabel(result.resultText, 0, panelHeight * 0.36, 34, panel, 220, 72, 'result-title');
    this.addLabel(`倍数 ×${result.multiplier}  炸弹 ${result.bombs}`, 0, panelHeight * 0.22, 20, panel, 240, 40, 'result-multiplier');
    this.addLabel(result.springText || '本局结算', 0, panelHeight * 0.12, 18, panel, 240, 40, 'result-spring');
    const scoresHeight = landscape ? Math.min(98, panelHeight * 0.31) : 112;
    const buttonY = landscape ? -panelHeight * 0.31 : -panelHeight * 0.37;
    this.addLabel(
      result.scores.map((row) => `${seatNameWithRole(row.seat, row.isLandlord)}: ${row.score}`).join('\n'),
      0,
      landscape ? -panelHeight * 0.075 : -panelHeight * 0.08,
      18,
      panel,
      280,
      scoresHeight,
      'result-scores',
    );
    this.addButton('再来一局', -74, buttonY, 116, 42, true, () => this.startGame(true), panel, 'result-new');
    this.addButton('返回大厅', 74, buttonY, 116, 42, true, () => director.loadScene('lobby'), panel, 'result-lobby');
    if (this.settings.animation) this.animateScaleIn(panel, 0.92, 180);
  }

  private renderPauseControl(layout: TableRegions, canvas: { width: number; height: number }): void {
    const screenY = Math.max(28, layout.topBar.y + layout.topBar.height * 0.52);
    const pos = this.screenPoint(canvas, canvas.width - 42, screenY);
    const label = this.addButton(
      '暂停',
      pos.x,
      pos.y,
      64,
      30,
      true,
      () => this.openPauseMenu(),
      this.uiRoot!,
      'pause-open-button',
    );
    label.fontSize = 16;
    label.lineHeight = 20;
  }

  private renderPauseOverlay(canvas: { width: number; height: number }): void {
    if (this.pauseState.stage === 'closed') {
      this.renderedPauseStage = 'closed';
      return;
    }

    const root = this.ensureNode('pause-overlay-runtime', this.uiRoot!);
    root.setPosition(0, 0, 0);
    addUiTransform(root, canvas.width, canvas.height);
    this.drawDimOverlay(root, canvas.width, canvas.height);
    if (!root.getComponent(BlockInputEvents)) root.addComponent(BlockInputEvents);

    const panelWidth = Math.min(320, Math.max(286, canvas.width - 56));
    const panelHeight = this.pauseState.stage === 'confirm-quit' ? 232 : 270;
    const panel = this.ensureNode('pause-panel', root);
    panel.setPosition(0, 12, 0);
    panel.setScale(1, 1, 1);
    addUiTransform(panel, panelWidth, panelHeight);
    drawPanel(panel, panelWidth, panelHeight, new Color(34, 38, 52, 236));

    const shouldAnimate = this.settings.animation && this.renderedPauseStage !== this.pauseState.stage;
    if (this.pauseState.stage === 'menu') this.renderPauseMenu(panel, panelWidth, panelHeight);
    else this.renderPauseConfirm(panel, panelWidth, panelHeight);
    if (shouldAnimate) this.animateScaleIn(panel, 0.96, 130);
    this.renderedPauseStage = this.pauseState.stage;
  }

  private renderPauseMenu(panel: Node, panelWidth: number, panelHeight: number): void {
    this.addLabel('暂停', 0, panelHeight / 2 - 46, 26, panel, panelWidth - 48, 48, 'pause-title');
    const hint = this.addLabel('本局进度已保留', 0, panelHeight / 2 - 82, 14, panel, panelWidth - 58, 30, 'pause-hint');
    hint.color = new Color(225, 235, 255, 215);
    this.addButton('继续', 0, 28, 176, 42, true, () => this.closePauseMenu(), panel, 'pause-continue');
    this.addButton('重开', 0, -30, 176, 42, true, () => this.restartFromPause(), panel, 'pause-restart');
    this.addButton('退出', 0, -88, 176, 42, true, () => this.askPauseQuit(), panel, 'pause-quit');
  }

  private renderPauseConfirm(panel: Node, panelWidth: number, panelHeight: number): void {
    this.addLabel('退出对局？', 0, panelHeight / 2 - 48, 24, panel, panelWidth - 48, 48, 'pause-confirm-title');
    const hint = this.addLabel('确认后返回大厅', 0, 14, 16, panel, panelWidth - 58, 36, 'pause-confirm-hint');
    hint.color = new Color(225, 235, 255, 218);
    this.addButton('确认', -58, -64, 100, 42, true, () => director.loadScene('lobby'), panel, 'pause-confirm');
    this.addButton('取消', 58, -64, 100, 42, true, () => this.cancelPauseQuit(), panel, 'pause-cancel');
  }

  private openPauseMenu(): void {
    this.pauseState = openMenu(this.pauseState);
    this.render();
  }

  private closePauseMenu(): void {
    this.pauseState = closeMenu(this.pauseState);
    this.render();
  }

  private askPauseQuit(): void {
    this.pauseState = askQuit(this.pauseState);
    this.render();
  }

  private cancelPauseQuit(): void {
    this.pauseState = cancelQuit(this.pauseState);
    this.render();
  }

  private restartFromPause(): void {
    this.pauseState = closeMenu(this.pauseState);
    this.startGame(true);
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

  private toggleAdvisor(): void {
    this.advisorEnabled = !this.advisorEnabled;
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
    addUiTransform(node, CARD_SIZE.width, CARD_SIZE.height);
    const parentSprite = node.getComponent(Sprite);
    if (parentSprite) parentSprite.destroy();
    const view = cardView(card);
    const fillNode = this.ensureNode('card-fill', node);
    fillNode.setPosition(0, 0, 0);
    fillNode.setSiblingIndex(0);
    addUiTransform(fillNode, CARD_SIZE.width, CARD_SIZE.height);
    this.drawCardBase(fillNode, CARD_SIZE.width, CARD_SIZE.height);

    const bgNode = this.ensureNode('card-bg', node);
    bgNode.setPosition(0, 0, 0);
    bgNode.setSiblingIndex(1);
    addUiTransform(bgNode, CARD_SIZE.width, CARD_SIZE.height);
    const sprite = bgNode.getComponent(Sprite) ?? bgNode.addComponent(Sprite);
    this.configureCardSprite(sprite);
    loadSprite(cardAssetPath(view.assetKey) ?? RESOURCE_PATHS.cardTemplate, sprite, this.spriteFrames);
    node.off(Node.EventType.TOUCH_START);
    node.off(Node.EventType.TOUCH_END);
    node.off(Node.EventType.TOUCH_CANCEL);
    if (interactive) {
      node.on(Node.EventType.TOUCH_START, () => this.setCardPressed(node, true), this);
      node.on(Node.EventType.TOUCH_END, () => {
        this.setCardPressed(node, false);
        this.toggleCard(card);
      }, this);
      node.on(Node.EventType.TOUCH_CANCEL, () => this.setCardPressed(node, false), this);
    }

    const faceColor = this.cardFaceColor(view.suitKey);
    const cornerLabel = this.addLabel(
      `${view.rankLabel}${suitText(view.suitKey)}`,
      -14,
      24,
      view.suitKey === 'joker' ? 9 : 11,
      node,
      34,
      18,
      'card-rank-label',
    );
    cornerLabel.lineHeight = view.suitKey === 'joker' ? 12 : 14;
    cornerLabel.color = faceColor;

    if (view.suitKey !== 'joker') {
      const rankLabel = this.addLabel(view.rankLabel, 0, 7, 18, node, CARD_SIZE.width - 12, 24, 'card-face-rank');
      rankLabel.lineHeight = 21;
      rankLabel.color = faceColor;
      const suitPath = suitAssetPath(view.suitKey);
      if (suitPath) {
        const suitNode = this.ensureNode('card-suit-icon', node);
        suitNode.setPosition(0, -17, 0);
        addUiTransform(suitNode, CARD_SUIT_ICON_SIZE, CARD_SUIT_ICON_SIZE);
        const suitSprite = suitNode.getComponent(Sprite) ?? suitNode.addComponent(Sprite);
        this.configureCardSprite(suitSprite);
        loadSprite(suitPath, suitSprite, this.spriteFrames);
      }
    }
    return node;
  }

  private cardFaceColor(suit: Suit | 'joker'): Color {
    return suit === Suit.Heart || suit === Suit.Diamond
      ? new Color(204, 65, 92, 255)
      : new Color(54, 55, 66, 255);
  }

  private configureCardSprite(sprite: Sprite): void {
    sprite.type = Sprite.Type.SIMPLE;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  }

  private drawCardBase(parent: Node, width: number, height: number): void {
    const graphics = parent.getComponent(Graphics) ?? parent.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(255, 252, 245, 248);
    graphics.strokeColor = new Color(248, 143, 173, 230);
    graphics.lineWidth = 1.5;
    graphics.roundRect(-width / 2, -height / 2, width, height, 7);
    graphics.fill();
    graphics.stroke();
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
    return addUiButton(this.ensureNode.bind(this), {
      text,
      x,
      y,
      width,
      height,
      enabled,
      cb,
      parent,
      name: name ?? `button-${text}-${x}-${y}`,
      selected: false,
      fontSize: 20,
      lineHeight: 24,
      owner: this,
    });
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
    return addUiLabel(this.ensureNode.bind(this), {
      text,
      x,
      y,
      fontSize,
      parent,
      width,
      height,
      name: name ?? `label-${text}-${x}-${y}`,
      lineHeightOffset: 5,
    });
  }

  private showStatus(text: string): void {
    this.statusText = text;
  }

  private tickToastState(): boolean {
    const before = this.toasts.items.map((toast) => toast.id).join('|');
    this.toasts = tickToasts(this.toasts, this.toastClockMs);
    const activeIds = new Set(this.toasts.items.map((toast) => toast.id));
    this.animatedToastIds = new Set(Array.from(this.animatedToastIds).filter((id) => activeIds.has(id)));
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
      if (round.type === 'bomb') return `${seatName(round.seat)} 炸弹！`;
      if (round.type === 'rocket') return `${seatName(round.seat)} 火箭！`;
      if (round.type === 'pass') return `${seatName(round.seat)} 不要`;
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

  private isAiThinkingActive(): boolean {
    return this.aiThinkingView()?.active ?? false;
  }

  private aiThinkingView(): ReturnType<typeof deriveAiThinking> | null {
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

  private lastActionPosition(
    seat: SeatLastAction['seat'],
    layout: TableRegions,
    canvas: { width: number; height: number },
  ): { x: number; y: number; width: number } {
    if (seat === HERO_SEAT) {
      const pos = this.screenPoint(canvas, canvas.width / 2, layout.playArea.y + layout.playArea.height + 24);
      return { ...pos, width: 136 };
    }
    const rect = seat === 1 ? layout.opponentLeft : layout.opponentRight;
    const pos = this.screenPoint(canvas, rect.x + rect.width / 2, rect.y + rect.height + 22);
    return { ...pos, width: 112 };
  }

  private aiThinkingPosition(
    seat: SeatIndex,
    layout: TableRegions,
    canvas: { width: number; height: number },
  ): { x: number; y: number; width: number } {
    const rect = seat === 1 ? layout.opponentLeft : layout.opponentRight;
    const pos = this.screenPoint(canvas, rect.x + rect.width / 2, rect.y + rect.height + 52);
    return { ...pos, width: 126 };
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

  private isTurnTimerFrozen(): boolean {
    return this.pauseState.stage !== 'closed';
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
    const settings = this.settings;
    const decision = decideCuePlayback(settings, cue);
    const path = cueAudioPath(cue);
    if (decision.effect) this.playEffect(cue);
    if (decision.vibrate) this.vibrate();
    if (!decision.sound || !path || !this.audioSource) return;
    resources.load(path, AudioClip, (error, clip) => {
      if (!error && clip && this.audioSource && decideCuePlayback(this.settings, cue).sound) {
        this.audioSource.playOneShot(clip);
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

  private toggleRuntimeSetting(key: ToggleKey): void {
    const next = toggleSetting(this.settings, key);
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

  private renderPlaceholderBackground(canvas: { width: number; height: number }): void {
    if (this.background) this.background.node.active = false;
    const node = this.ensureNode('game-table-background-runtime', this.node);
    node.setSiblingIndex(0);
    node.setPosition(0, 0, 0);
    const width = Math.max(canvas.width, canvas.height * GAME_TABLE_BACKGROUND_ASPECT);
    const height = Math.max(canvas.height, canvas.width / GAME_TABLE_BACKGROUND_ASPECT);
    addUiTransform(node, width, height);
    node.getComponent(Graphics)?.clear();
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.type = Sprite.Type.SIMPLE;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    loadSprite(RESOURCE_PATHS.gameTableBg, sprite, this.spriteFrames);
  }

  private setCardPressed(node: Node, pressed: boolean): void {
    const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    opacity.opacity = pressed ? CARD_PRESS_OPACITY : 255;
    const scale = pressed ? CARD_PRESS_SCALE : 1;
    node.setScale(scale, scale, 1);
  }

  private isLandscape(canvas: { width: number; height: number }): boolean {
    return canvas.width >= canvas.height;
  }

  private drawDimOverlay(parent: Node, width: number, height: number): void {
    const graphics = parent.getComponent(Graphics) ?? parent.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(0, 0, 0, 132);
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
  }

  private strengthColor(tone: 'weak' | 'mid' | 'strong'): Color {
    if (tone === 'strong') return new Color(124, 218, 150, 230);
    if (tone === 'mid') return new Color(255, 210, 112, 230);
    return new Color(255, 134, 134, 230);
  }

  private canvasSize(): { width: number; height: number } {
    const size = this.node.getComponent(UITransform)?.contentSize;
    return {
      width: Math.max(1, size?.width ?? LANDSCAPE_CANVAS.width),
      height: Math.max(1, size?.height ?? LANDSCAPE_CANVAS.height),
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

}
