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
import { commitFinishedRound, persistRound, restoreRound, type SessionKeys } from '../../data/session';
import { difficultyConfig } from '../../data/difficultyConfig';
import { STORAGE_KEYS } from '../../data/storage-keys';
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
import { cueForFlowEvent, type CueId } from '../event-cues';
import { decideCuePlayback } from '../audio-gate';
import { dealCardDelay, playFlyFromTo, pulseParams } from '../animation-params';
import { clearSelection, isSelected, toggle } from '../selection';
import { deriveScreenVM } from '../screen-view';
import { emptyToasts, pushToast, tickToasts, type ToastQueue } from '../toast-queue';
import { deriveAiThinking } from '../ai-thinking-view';
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
import {
  renderActions as renderActionsSection,
  renderAdvisor as renderAdvisorSection,
  renderBidding as renderBiddingSection,
  renderStatus as renderStatusSection,
  renderTurnTimer as renderTurnTimerSection,
} from './game-scene/bid-actions-renderer';
import { renderCardMemory as renderCardMemorySection, renderHud as renderHudSection } from './game-scene/hud-renderer';
import { renderResult as renderResultSection } from './game-scene/result-overlay-renderer';
import {
  renderSeatFeedback as renderSeatFeedbackSection,
  renderSeats as renderSeatsSection,
  type GameSceneRendererContext,
} from './game-scene/seats-renderer';

const { ccclass, property } = _decorator;

const HERO_SEAT: SeatIndex = 0;
const SETTINGS_KEY = STORAGE_KEYS.settings;
const SESSION_KEYS: SessionKeys = {
  save: STORAGE_KEYS.save,
  stats: STORAGE_KEYS.stats,
  records: STORAGE_KEYS.records,
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

  private rendererContext(): GameSceneRendererContext {
    return {
      uiRoot: this.uiRoot!,
      settings: this.settings,
      runtime: this.runtime,
      recentEvents: this.recentEvents,
      fullGameEvents: this.fullGameEvents,
      memoryExpanded: this.memoryExpanded,
      advisorEnabled: this.advisorEnabled,
      turnTimerElapsedMs: this.turnTimerElapsedMs,
      turnTimerMs: TURN_TIMER_MS,
      spriteFrames: this.spriteFrames,
      isLandscape: this.isLandscape.bind(this),
      screenPoint: this.screenPoint.bind(this),
      rectPoint: this.rectPoint.bind(this),
      ensureNode: this.ensureNode.bind(this),
      addLabel: this.addLabel.bind(this),
      addButton: this.addButton.bind(this),
      render: this.render.bind(this),
      setMemoryExpanded: (value) => {
        this.memoryExpanded = value;
      },
      toggleAdvisor: this.toggleAdvisor.bind(this),
      submitBid: this.submitBid.bind(this),
      submitPlay: this.submitPlay.bind(this),
      submitPass: this.submitPass.bind(this),
      applyHint: this.applyHint.bind(this),
      syncTurnTimerKey: this.syncTurnTimerKey.bind(this),
      strengthColor: this.strengthColor.bind(this),
      aiThinkingView: this.aiThinkingView.bind(this),
      startGame: this.startGame.bind(this),
      animateScaleIn: this.animateScaleIn.bind(this),
    };
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
    renderSeatsSection(this.rendererContext(), handCounts, landlord, layout, canvas);
  }

  private renderSeatFeedback(layout: TableRegions, canvas: { width: number; height: number }): void {
    renderSeatFeedbackSection(this.rendererContext(), layout, canvas);
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
    renderHudSection(this.rendererContext(), hand, layout, canvas);
  }

  private renderCardMemory(hand: Card[], layout: TableRegions, canvas: { width: number; height: number }): void {
    renderCardMemorySection(this.rendererContext(), hand, layout, canvas);
  }

  private renderBidding(
    bidding: ReturnType<typeof deriveScreenVM>['bidding'],
    layout: TableRegions,
    canvas: { width: number; height: number },
  ): void {
    renderBiddingSection(this.rendererContext(), bidding, layout, canvas);
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
    renderActionsSection(this.rendererContext(), play, pass, hint, layout, canvas);
  }

  private renderStatus(text: string, layout: TableRegions, canvas: { width: number; height: number }): void {
    renderStatusSection(this.rendererContext(), text, layout, canvas);
  }

  private renderTurnTimer(layout: TableRegions, canvas: { width: number; height: number }): void {
    renderTurnTimerSection(this.rendererContext(), layout, canvas);
  }

  private renderAdvisor(
    snapshot: ReturnType<RoundRuntime['currentSnapshot']> | undefined,
    layout: TableRegions,
    canvas: { width: number; height: number },
  ): void {
    renderAdvisorSection(this.rendererContext(), snapshot, layout, canvas);
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
    renderResultSection(this.rendererContext(), result, canvas);
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
