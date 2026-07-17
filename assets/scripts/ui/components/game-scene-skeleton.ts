import {
  _decorator,
  AudioSource,
  Component,
  Node,
  SpriteFrame,
  resources,
} from 'cc';
import { AiLevel } from '../../ai';
import { pickHint, type HintSession } from '../hint-flow';
import { commitFinishedRound, persistRound, restoreRound, type SessionKeys } from '../../data/session';
import { difficultyConfig } from '../../data/difficultyConfig';
import { STORAGE_KEYS } from '../../data/storage-keys';
import { defaultSettings, type Settings } from '../../data/settings';
import { loadSettings } from '../../data/settingsStorage';
import { startRoundRuntime, resumeRoundRuntime, type RoundRuntime } from '../../flow/round-runtime';
import { realClock } from '../../flow/clock';
import type { FlowEvent } from '../../flow/types';
import type { GameEvent, ResumeSnapshot, RoundFinishInput, SeatIndex } from '../../game';
import type { Card } from '../../rules';
import { cocosStorage } from '../../runtime/cocos-storage';
import { clearSelection, toggle, type DragSelectionMode } from '../selection';
import { deriveFollowUx } from '../follow-ux';
import { rebuildRecentEvents } from '../resume-rebuild';
import { deriveScreenVM } from '../screen-view';
import { emptyToasts, pushToast, type ToastQueue } from '../toast-queue';
import { initialPause, type PauseState } from '../pause-menu';
import { tableZones, type TableZones } from '../table-zones';
import { deriveCardStage, type CardStage } from '../card-stage';
import {
  instant,
  planCardChoreography,
} from '../card-choreography';
import {
  RESOURCE_PATHS,
  spriteFrameResourcePath,
  type ResourcePath,
} from '../asset-keys';
import { t } from '../strings';
import { settlementReveal } from '../animation-params';
import { addRoundScores, emptySessionTotals, type SessionTotals } from '../session-score';
import {
  beginSettlementHold,
  isHoldingSettlement,
  tickSettlementHold,
  type SettlementHold,
} from '../settlement-reveal';
import {
  renderActions as renderActionsSection,
  renderAdvisor as renderAdvisorSection,
  renderBidding as renderBiddingSection,
  renderStatus as renderStatusSection,
  renderTurnTimer as renderTurnTimerSection,
} from './game-scene/bid-actions-renderer';
import { renderCardMemory as renderCardMemorySection, renderHud as renderHudSection } from './game-scene/hud-renderer';
import { fadeInOnLoad } from './scene-transition';
import { renderResult as renderResultSection } from './game-scene/result-overlay-renderer';
import {
  renderSeatFeedback as renderSeatFeedbackSection,
  renderSeats as renderSeatsSection,
  type GameSceneRendererContext,
} from './game-scene/seats-renderer';
import {
  CARD_SIZE,
  HAND_LIFT,
  addDisplayCard as addDisplayCardImpl,
  renderStageCard as renderStageCardImpl,
  cardFaceColor as cardFaceColorImpl,
  cardSpritePath as cardSpritePathImpl,
  suitSpritePath as suitSpritePathImpl,
  configureCardSprite as configureCardSpriteImpl,
  fitSpriteInBox as fitSpriteInBoxImpl,
  sameCard,
  setCardPressed as setCardPressedImpl,
} from './game-scene/card-node';
import {
  renderBottomCardsDock as renderBottomCardsDockImpl,
  renderCardStage as renderCardStageImpl,
  renderPlayAreaFxTarget as renderPlayAreaFxTargetImpl,
  renderHandPlaceholder as renderHandPlaceholderImpl,
  interactiveSlotsFromStage as interactiveSlotsFromStageImpl,
  bindHandDragHandlers as bindHandDragHandlersImpl,
} from './game-scene/play-area-renderer';
import {
  renderTopBar as renderTopBarImpl,
  renderRuntimeSettings as renderRuntimeSettingsImpl,
  renderPlaceholderBackground as renderPlaceholderBackgroundImpl,
  isLandscape as isLandscapeImpl,
} from './game-scene/top-bar-renderer';
import {
  renderPauseControl as renderPauseControlImpl,
  renderPauseOverlay as renderPauseOverlayImpl,
  renderPauseMenu as renderPauseMenuImpl,
  renderPauseConfirm as renderPauseConfirmImpl,
  openPauseMenu as openPauseMenuImpl,
  closePauseMenu as closePauseMenuImpl,
  askPauseQuit as askPauseQuitImpl,
  cancelPauseQuit as cancelPauseQuitImpl,
  restartFromPause as restartFromPauseImpl,
} from './game-scene/pause-overlay-renderer';
import {
  playCue as playCueImpl,
  playEffect as playEffectImpl,
  renderEmphasis as renderEmphasisImpl,
  toggleRuntimeSetting as toggleRuntimeSettingImpl,
  vibrate as vibrateImpl,
  playUiSound as playUiSoundImpl,
} from './game-scene/audio-vibration';
import {
  clearFxLayer as clearFxLayerImpl,
  renderBombBurst as renderBombBurstImpl,
  renderButtonRipple as renderButtonRippleImpl,
  renderLandlordCeremony as renderLandlordCeremonyImpl,
  renderPatternBurst as renderPatternBurstImpl,
  renderRocketBurst as renderRocketBurstImpl,
} from './game-scene/fx-program';
import {
  animateScaleIn as animateScaleInImpl,
  prepareToastAnimation as prepareToastAnimationImpl,
  drawDimOverlay as drawDimOverlayImpl,
} from './game-scene/tween-helpers';
import {
  renderToasts as renderToastsImpl,
  renderTerminationFeedbackActions as renderTerminationFeedbackActionsImpl,
  showStatus as showStatusImpl,
  tickToastState as tickToastStateImpl,
  pollTerminationFeedback as pollTerminationFeedbackImpl,
  pushEventToast as pushEventToastImpl,
  eventToastText as eventToastTextImpl,
  resolveSeed as resolveSeedImpl,
  currentPlayerTurnKey as currentPlayerTurnKeyImpl,
  isAiThinkingActive as isAiThinkingActiveImpl,
  aiThinkingView as aiThinkingViewImpl,
  syncTurnTimerKey as syncTurnTimerKeyImpl,
  isTurnTimerFrozen as isTurnTimerFrozenImpl,
} from './game-scene/runtime-feedback';
import {
  addButton as addButtonImpl,
  buttonSkinPath as buttonSkinPathImpl,
  buttonTextColor as buttonTextColorImpl,
  isPauseToggleButton as isPauseToggleButtonImpl,
  isPauseActionButton as isPauseActionButtonImpl,
  buttonIconPath as buttonIconPathImpl,
  addSprite as addSpriteImpl,
  addSpriteContain as addSpriteContainImpl,
  loadSprite as loadSpriteImpl,
  applySpriteFrame as applySpriteFrameImpl,
  drawPanelSkin as drawPanelSkinImpl,
  addLabel as addLabelImpl,
  ensureNode as ensureNodeImpl,
  beginRenderDiff as beginRenderDiffImpl,
  hideSettledTransientHud as hideSettledTransientHudImpl,
  hideSettlementSceneChrome as hideSettlementSceneChromeImpl,
  hideLiveSubtree as hideLiveSubtreeImpl,
  markLiveSubtree as markLiveSubtreeImpl,
  endRenderDiff as endRenderDiffImpl,
  pruneInactiveChildren as pruneInactiveChildrenImpl,
  hideSceneScaffold as hideSceneScaffoldImpl,
  strengthColor as strengthColorImpl,
  canvasSize as canvasSizeImpl,
  rectPoint as rectPointImpl,
  screenPoint as screenPointImpl,
} from './game-scene/ui-runtime-helpers';
import { CardAnimator, cardRuntimeNodeName } from './game-scene/card-animator';

const { ccclass } = _decorator;

const HERO_SEAT: SeatIndex = 0;
const SETTINGS_KEY = STORAGE_KEYS.settings;
const SESSION_KEYS: SessionKeys = {
  save: STORAGE_KEYS.save,
  stats: STORAGE_KEYS.stats,
  records: STORAGE_KEYS.records,
};

const TURN_TIMER_MS = 15_000;
const UI_TICK_RENDER_MS = 180;
const BID_FAILED_TEXT = t('game.bidFailed');
const PLAY_FAILED_TEXT = t('game.playFailed');
const PASS_FAILED_TEXT = t('game.passFailed');
const RUNTIME_PRELOAD_SPRITES: readonly ResourcePath[] = [
  RESOURCE_PATHS.gameTableBgC1,
  RESOURCE_PATHS.heroBodyV13,
  RESOURCE_PATHS.leftAiBodyV13,
  RESOURCE_PATHS.rightAiBodyV13,
  RESOURCE_PATHS.cardTemplateV13,
  RESOURCE_PATHS.cardBackV13,
  RESOURCE_PATHS.suitSpadeV13,
  RESOURCE_PATHS.suitHeartV13,
  RESOURCE_PATHS.suitClubV13,
  RESOURCE_PATHS.suitDiamondV13,
  RESOURCE_PATHS.jokerSmallV13,
  RESOURCE_PATHS.jokerBigV13,
  RESOURCE_PATHS.btnPrimaryC2,
  RESOURCE_PATHS.btnSecondaryC2,
  RESOURCE_PATHS.btnNeutralC2,
  RESOURCE_PATHS.infoPillC1,
  RESOURCE_PATHS.seatNameplateC1,
  RESOURCE_PATHS.bottomCardsDockV15,
  RESOURCE_PATHS.panelPopupV19,
  RESOURCE_PATHS.settlementPanelV19,
  RESOURCE_PATHS.countdownRingV19,
  RESOURCE_PATHS.landlordHatV19,
  RESOURCE_PATHS.farmerBadgeV19,
  RESOURCE_PATHS.patternLabelV19,
  RESOURCE_PATHS.fxSparkV19,
  RESOURCE_PATHS.fxRingV19,
  RESOURCE_PATHS.fxStarV19,
  RESOURCE_PATHS.fxTrailV19,
  RESOURCE_PATHS.fxConfettiV19,
  RESOURCE_PATHS.iconPlay,
  RESOURCE_PATHS.iconPass,
  RESOURCE_PATHS.iconHint,
  RESOURCE_PATHS.iconBid,
  RESOURCE_PATHS.iconBack,
  RESOURCE_PATHS.iconSettings,
  RESOURCE_PATHS.emphasisBomb,
  RESOURCE_PATHS.emphasisRocket,
];

function emptyCardStage(): CardStage {
  return { placements: [], byKey: new Map(), handHits: [] };
}

function cardStageFingerprint(stage: CardStage): string {
  return stage.placements.map((placement) => [
    placement.key,
    placement.zone,
    placement.x,
    placement.y,
    placement.scale,
    placement.angle,
    placement.z,
    placement.faceUp ? 1 : 0,
    placement.selected ? 1 : 0,
    placement.interactive ? 1 : 0,
  ].join(':')).join('|');
}

function flowEventCardId(event: FlowEvent, stage: CardStage): string {
  let eventKey = event.type;
  if (event.type === 'redeal') eventKey += `:${event.attempt}`;
  if (event.type === 'bottomRevealed') eventKey += `:${event.cards.map((card) => `${card.rank}:${card.suit}`).join(',')}`;
  if (event.type === 'round') {
    const round = event.event;
    eventKey += `:${round.type}`;
    if ('seat' in round) eventKey += `:${round.seat}`;
    if (round.type === 'play') eventKey += `:${round.pattern.cards.map((card) => `${card.rank}:${card.suit}`).join(',')}`;
  }
  return `${eventKey}|${cardStageFingerprint(stage)}`;
}

interface CardEventRender {
  readonly event: true;
  readonly startPrepared: boolean;
}

@ccclass('GameSceneSkeleton')
export class GameSceneSkeleton extends Component {
  private runtime: RoundRuntime | null = null;
  private unsubscribe: (() => void) | null = null;
  private audioSource: AudioSource | null = null;
  private uiRoot: Node | null = null;
  private cardLayer: Node | null = null;
  private playAreaRoot: Node | null = null;
  private cardStage: CardStage = emptyCardStage();
  private cardRenderGeneration = 0;
  private pendingPatternBurst: { seat: SeatIndex; cards: Card[] } | null = null;
  private sessionTotals: SessionTotals = emptySessionTotals();
  private settlementHold: SettlementHold = { remainingMs: 0 };
  private readonly cardAnimator = new CardAnimator(() => {
    this.flushPendingPatternBurst();
    void Promise.resolve().then(() => {
      if (this.node?.isValid) this.render();
    });
  });
  private selected: Card[] = [];
  private hintSession: HintSession | null = null;
  private recentEvents: FlowEvent[] = [];
  private fullGameEvents: GameEvent[] = [];
  private toasts: ToastQueue = emptyToasts;
  private toastClockMs = 0;
  private turnTimerKey: string | null = null;
  private turnTimerElapsedMs = 0;
  private uiTickRenderMs = 0;
  private memoryExpanded = false;
  private advisorEnabled = false;
  private biddingAdvisorEnabled = false;
  private revealedBottomCards: Card[] | null = null;
  private pauseState: PauseState = initialPause;
  private renderedPauseStage: PauseState['stage'] = 'closed';
  private settings: Settings = defaultSettings();
  private statusText = '';
  private submitting = false;
  private terminationFeedbackNotified = false;
  private terminationFeedbackActionsVisible = false;
  private terminationFeedbackText: string | null = null;
  private readonly spriteFrames = new Map<string, SpriteFrame>();
  private liveRenderNodes: Set<Node> | null = null;
  private displayHandSlots: ReturnType<typeof interactiveSlotsFromStageImpl> = [];
  private handDragActive = false;
  private handDragMoved = false;
  private handDragMode: DragSelectionMode | null = null;
  private handDragOriginCard: Card | null = null;
  private handDragStartX = 0;
  private handDragCurrentX = 0;

  onLoad(): void {
    this.hideSceneScaffold();
    this.audioSource = this.node.getComponent(AudioSource) ?? this.node.addComponent(AudioSource);
    this.uiRoot = this.ensureNode('runtime-ui', this.node);
    bindHandDragHandlersImpl.call(this);
    this.preloadRuntimeSprites();
    this.startGame(false);
    // v1.5 P-SCENE-FADE:入场自黑幕淡出(动效关闭时不铺幕);挂 this.node 不受 render prune 影响。
    fadeInOnLoad(this.node, this.settings.animation);
  }

  onDestroy(): void {
    this.cardRenderGeneration += 1;
    this.cardAnimator.reset();
    this.unsubscribe?.();
    this.runtime?.dispose();
    this.unsubscribe = null;
    this.runtime = null;
  }

  private preloadRuntimeSprites(): void {
    for (const path of RUNTIME_PRELOAD_SPRITES) {
      if (this.spriteFrames.has(path)) continue;
      resources.load(spriteFrameResourcePath(path), SpriteFrame, (error, frame) => {
        if (error || !frame) return;
        this.spriteFrames.set(path, frame);
      });
    }
  }

  update(dt: number): void {
    if (!this.runtime || !this.uiRoot) return;
    const deltaMs = Math.max(0, dt * 1000);
    this.toastClockMs += deltaMs;
    this.uiTickRenderMs += deltaMs;

    let shouldRender = this.tickToastState();
    const holdTick = tickSettlementHold(this.settlementHold, deltaMs);
    this.settlementHold = holdTick.hold;
    if (holdTick.justExpired) shouldRender = true;
    if (this.pollTerminationFeedback()) shouldRender = true;
    const timerActive = this.syncTurnTimerKey();
    const timerFrozen = this.isTurnTimerFrozen() || this.cardAnimator.isBusy();
    const thinkingAnimating = this.settings.animation && this.isAiThinkingActive();
    if (timerActive && !timerFrozen) this.turnTimerElapsedMs = Math.min(TURN_TIMER_MS, this.turnTimerElapsedMs + deltaMs);
    if (((timerActive && !timerFrozen) || thinkingAnimating) && this.uiTickRenderMs >= UI_TICK_RENDER_MS) {
      this.uiTickRenderMs = 0;
      shouldRender = true;
    }

    if (shouldRender) this.render();
  }

  private startGame(forceNew: boolean): void {
    this.cardRenderGeneration += 1;
    this.cardAnimator.reset();
    this.cardStage = emptyCardStage();
    this.pendingPatternBurst = null;
    this.settlementHold = { remainingMs: 0 };
    this.unsubscribe?.();
    this.runtime?.dispose();
    this.unsubscribe = null;
    this.selected = clearSelection();
    this.hintSession = null;
    this.recentEvents = [];
    this.fullGameEvents = [];
    this.toasts = emptyToasts;
    this.toastClockMs = 0;
    this.turnTimerKey = null;
    this.turnTimerElapsedMs = 0;
    this.uiTickRenderMs = 0;
    this.advisorEnabled = false;
    this.biddingAdvisorEnabled = false;
    this.revealedBottomCards = null;
    this.pauseState = initialPause;
    this.renderedPauseStage = 'closed';
    this.submitting = false;
    this.terminationFeedbackNotified = false;
    this.terminationFeedbackActionsVisible = false;
    this.terminationFeedbackText = null;
    this.statusText = '';
    // v1.5 W3-B:跨局清空 fx 层(彩带 repeatForever 等循环特效不能残留到新局)。
    this.clearFxLayer();

    const storage = cocosStorage();
    this.settings = loadSettings(storage, SETTINGS_KEY);
    const difficulty = difficultyConfig(this.settings.difficulty);
    // v1.6 终审整改③:AI 出牌节奏保底 1s(原困难档均值 375ms 偏快),各档均 ≥1000ms。
    const thinkingDelayMs = Math.max(1000, Math.round((difficulty.thinkDelayMs.min + difficulty.thinkDelayMs.max) / 2));
    const levels: [AiLevel, AiLevel, AiLevel] = [
      this.settings.difficulty,
      this.settings.difficulty,
      this.settings.difficulty,
    ];
    const config = {
      seed: this.resolveSeed(),
      heroSeat: HERO_SEAT,
      levels,
      thinkingDelayMs,
      clock: realClock,
      persist: (payload: Parameters<typeof persistRound>[2]) =>
        persistRound(storage, SESSION_KEYS, { ...payload, savedAt: Date.now() }),
      onSettled: (finish: RoundFinishInput) => {
        this.sessionTotals = addRoundScores(this.sessionTotals, finish.settlement.scores);
        commitFinishedRound(storage, SESSION_KEYS, { finish, heroSeat: HERO_SEAT, playedAt: Date.now() });
        // Runtime emits its settled event before this callback. Re-render so
        // animation-off sessions also replace the pre-accumulation result text.
        this.render();
      },
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
    this.recentEvents = rebuildRecentEvents(this.fullGameEvents);
    // v2(W-AUDIT-AI B3):断局恢复时底牌从存档公开字段直读——bottomRevealed 事件不会重放;
    // v1 旧档迁移后 bottom=null,维持既有牌背降级。
    if (resume?.state.bottom) this.revealedBottomCards = resume.state.bottom.slice();
    this.runtime = resume ? resumeRoundRuntime(resume, config) : startRoundRuntime(config);
    this.unsubscribe = this.runtime.onEvent((event) => {
      if (event.type === 'deal' || event.type === 'redeal') this.revealedBottomCards = null;
      if (event.type === 'bottomRevealed') this.revealedBottomCards = event.cards.slice();
      if (event.type === 'round') this.fullGameEvents.push(event.event);
      this.recentEvents.push(event);
      this.recentEvents = this.recentEvents.slice(-12);
      this.pushEventToast(event);
      const runtimeAtEvent = this.runtime;
      const generation = this.cardRenderGeneration;
      const renderEvent = (): void => {
        if (this.runtime !== runtimeAtEvent || this.cardRenderGeneration !== generation) return;
        try {
          // S3 contract: stage diff and ownership begin in the runtime event
          // callback. render() only refreshes authoritative content/nodes and
          // starts an already-prepared adapter after those nodes exist.
          const startPrepared = this.prepareCardEvent(event);
          this.render({ event: true, startPrepared });
          if (event.type === 'landlordDecided') this.showLandlordCeremony(event);
        } catch (error) {
          // RoundRuntime isolates subscriber errors. Fail safe to an idle,
          // authoritative render instead of leaving an invisible permanent lock.
          this.cardAnimator.settleAll(false);
          console.error('card choreography render failed', error);
          this.render();
        }
      };
      // Runtime emits bottomRevealed before createPlayingState/phase=playing.
      // Defer only this event so its stage sees the landlord's final 20 cards.
      if (event.type === 'bottomRevealed') void Promise.resolve().then(renderEvent);
      else renderEvent();
      this.playCue(event);
    });
    this.render();
  }

  private prepareCardEvent(event: FlowEvent): boolean {
    const nextCardStage = this.deriveCurrentCardStage();
    const choreography = planCardChoreography({
      id: flowEventCardId(event, nextCardStage),
      previous: this.cardStage,
      next: nextCardStage,
    });
    const prepared = this.cardAnimator.prepare(
      this.settings.animation ? choreography : instant(choreography),
    );
    // bomb/rocket/win 等跟随事件不会改变 CardStage，prepare 会按 R1 no-op。
    // 这类事件不得清掉前一个 play 已认领的标签，否则炸弹/王炸标签永远到不了 settle。
    if (prepared) {
      this.pendingPatternBurst = event.type === 'round' && event.event.type === 'play'
        ? { seat: event.event.seat, cards: event.event.pattern.cards.slice() }
        : null;
    }
    return prepared;
  }

  private flushPendingPatternBurst(): void {
    const pending = this.pendingPatternBurst;
    this.pendingPatternBurst = null;
    if (!pending || !this.uiRoot) return;
    if (this.runtime?.phase() === 'settled') {
      if (!this.settings.animation) return;
      this.settlementHold = beginSettlementHold(this.settings.animation, settlementReveal());
    }
    const canvas = this.canvasSize();
    renderPatternBurstImpl.call(
      this,
      pending.cards,
      pending.seat,
      tableZones(canvas.width, canvas.height),
      canvas,
    );
  }

  private showLandlordCeremony(event: Extract<FlowEvent, { type: 'landlordDecided' }>): void {
    const id = `landlord-ceremony:${event.landlord}:${event.bidMultiplier}`;
    if (!this.cardAnimator.claimAnimationId(id) || !this.uiRoot) return;
    const canvas = this.canvasSize();
    renderLandlordCeremonyImpl.call(
      this,
      event.landlord,
      tableZones(canvas.width, canvas.height),
      canvas,
    );
  }

  private deriveCurrentCardStage(): CardStage {
    if (!this.runtime || !this.uiRoot) return emptyCardStage();
    const snapshot = this.runtime.currentSnapshot() ?? undefined;
    const biddingDeal = this.runtime.biddingDeal() ?? undefined;
    const canvas = this.canvasSize();
    return deriveCardStage({
      zones: tableZones(canvas.width, canvas.height),
      canvas,
      heroSeat: HERO_SEAT,
      heroHand: snapshot?.viewerHand ?? biddingDeal?.viewerHand ?? [],
      selected: this.selected,
      top: snapshot?.top ?? null,
      bottomCards: this.runtime.phase() === 'bidding' ? null : this.revealedBottomCards,
      phase: this.runtime.phase(),
      cardBox: CARD_SIZE,
      liftOffset: HAND_LIFT,
    });
  }

  private render(cardRender?: CardEventRender): void {
    if (!this.runtime || !this.uiRoot) return;

    const snapshot = this.runtime.currentSnapshot() ?? undefined;
    const bidding = this.runtime.currentBidding() ?? undefined;
    const biddingDeal = this.runtime.biddingDeal() ?? undefined;
    const settlement = this.runtime.settlement() ?? undefined;
    if (snapshot?.viewerHand) {
      this.selected = this.selected.filter((selected) => snapshot.viewerHand?.some((card) => sameCard(card, selected)));
    }

    const canvas = this.canvasSize();
    this.renderPlaceholderBackground(canvas);
    const layout = tableZones(canvas.width, canvas.height);
    const phase = this.runtime.phase();
    const nextCardStage = this.deriveCurrentCardStage();

    if (!cardRender && (
      this.cardAnimator.isAnimating()
      && cardStageFingerprint(this.cardStage) !== cardStageFingerprint(nextCardStage)
    )) {
      // A non-event render must never let an old terminal outlive current VM.
      this.cardAnimator.settleAll(false);
    }
    this.cardStage = nextCardStage;

    const vm = deriveScreenVM({
      snapshot,
      bidding,
      heroSeat: HERO_SEAT,
      selectedCards: this.selected,
      recentEvents: this.recentEvents,
      layoutOpts: {
        containerWidth: layout.heroHandLarge.width,
        containerHeight: canvas.height,
        cardWidth: CARD_SIZE.width,
        liftOffset: HAND_LIFT,
      },
      settlement,
      biddingHand: biddingDeal?.viewerHand,
    });
    const handCounts = snapshot?.handCounts ?? biddingDeal?.handCounts ?? [0, 0, 0];
    const handCount = snapshot?.viewerHand?.length ?? biddingDeal?.viewerHand.length ?? 0;
    const followUx = snapshot ? deriveFollowUx({ snapshot, viewerSeat: HERO_SEAT }) : { mustPass: false, alerts: [] };
    const showTransientHud = phase !== 'settled';
    const visibleResult = this.cardAnimator.isBusy() || isHoldingSettlement(this.settlementHold) ? null : vm.result;

    this.beginRenderDiff();
    this.renderTopBar(phase, vm.topBar, handCount, layout, canvas);
    this.renderSeats(handCounts, snapshot?.landlord ?? null, layout, canvas, followUx.alerts);
    if (!showTransientHud) this.hideSettledTransientHud();
    // Keep scene chrome through the final card flight. Hide it in the same
    // render pass that makes the settlement scrim/panel visible.
    if (visibleResult) this.hideSettlementSceneChrome();
    if (showTransientHud) this.renderSeatFeedback(layout, canvas);
    this.renderBottomCardsDock(phase === 'bidding' ? null : this.revealedBottomCards, layout, canvas, nextCardStage);
    this.renderPlayAreaFxTarget(layout, canvas, nextCardStage, phase);
    this.renderCardStage(nextCardStage);
    if (showTransientHud) this.renderHud(snapshot?.viewerHand ?? [], layout, canvas);
    this.renderHandPlaceholder(nextCardStage, layout, canvas);
    if (showTransientHud) this.renderAdvisor(snapshot, layout, canvas);
    if (phase === 'bidding') this.renderBidding(vm.bidding, layout, canvas);
    if (showTransientHud && phase !== 'bidding') this.renderStatus(this.statusText, layout, canvas);
    if (showTransientHud) this.renderTurnTimer(layout, canvas);
    if (phase === 'playing') {
      const actions = vm.actions;
      const playEnabled = followUx.mustPass ? false : actions.play;
      const hintEnabled = followUx.mustPass ? false : actions.hint;
      this.renderActions(playEnabled, actions.pass, hintEnabled, layout, canvas, followUx.mustPass);
    }
    if (showTransientHud) this.renderToasts(layout, canvas);
    this.renderTerminationFeedbackActions(layout, canvas);
    // The final card owns transform/opacity until it reaches CardStage. Show
    // settlement only after that flight completes; otherwise the completion
    // render would overwrite the independent result entrance tween mid-flight.
    this.renderResult(visibleResult, handCounts, layout, canvas);
    if (!vm.result) {
      if (phase !== 'disposed') this.renderPauseControl(layout, canvas);
      this.renderPauseOverlay(canvas);
    }
    this.markLiveSubtree(this.ensureFxLayer());
    const busyNode = this.ensureNode('anim-busy-runtime', this.uiRoot);
    busyNode.active = this.cardAnimator.isBusy();
    this.endRenderDiff();

    if (cardRender?.startPrepared) {
      this.cardAnimator.startPrepared((key) =>
        this.cardLayer?.getChildByName(cardRuntimeNodeName(key)) ?? null);
    }
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
      biddingAdvisorEnabled: this.biddingAdvisorEnabled,
      turnTimerElapsedMs: this.turnTimerElapsedMs,
      turnTimerMs: TURN_TIMER_MS,
      spriteFrames: this.spriteFrames,
      sessionTotals: () => this.sessionTotals,
      isLandscape: this.isLandscape.bind(this),
      screenPoint: this.screenPoint.bind(this),
      rectPoint: this.rectPoint.bind(this),
      ensureNode: this.ensureNode.bind(this),
      addLabel: this.addLabel.bind(this),
      addButton: this.addButton.bind(this),
      addSprite: this.addSprite.bind(this),
      addSpriteContain: this.addSpriteContain.bind(this),
      loadSprite: this.loadSprite.bind(this),
      drawPanelSkin: this.drawPanelSkin.bind(this),
      render: this.render.bind(this),
      setMemoryExpanded: (value) => {
        this.memoryExpanded = value;
      },
      claimAnimationId: (id) => this.cardAnimator.claimAnimationId(id),
      hasAnimationId: (id) => this.cardAnimator.hasAnimationId(id),
      fxLayer: () => this.ensureFxLayer(),
      toggleAdvisor: this.toggleAdvisor.bind(this),
      toggleBiddingAdvisor: this.toggleBiddingAdvisor.bind(this),
      submitBid: this.submitBid.bind(this),
      submitPlay: this.submitPlay.bind(this),
      submitPass: this.submitPass.bind(this),
      applyHint: this.applyHint.bind(this),
      syncTurnTimerKey: this.syncTurnTimerKey.bind(this),
      strengthColor: this.strengthColor.bind(this),
      aiThinkingView: this.aiThinkingView.bind(this),
      startGame: this.startGame.bind(this),
      animateScaleIn: this.animateScaleIn.bind(this),
      drawDimOverlay: this.drawDimOverlay.bind(this),
      addDisplayCard: this.addDisplayCard.bind(this),
    };
  }

  private renderTopBar = renderTopBarImpl;

  private renderRuntimeSettings = renderRuntimeSettingsImpl;

  private renderSeats(
    handCounts: [number, number, number],
    landlord: number | null,
    layout: TableZones,
    canvas: { width: number; height: number },
    alerts: ReturnType<typeof deriveFollowUx>['alerts'] = [],
  ): void {
    renderSeatsSection(this.rendererContext(), handCounts, landlord, layout, canvas, alerts);
  }

  private renderSeatFeedback(layout: TableZones, canvas: { width: number; height: number }): void {
    renderSeatFeedbackSection(this.rendererContext(), layout, canvas);
  }

  private renderBottomCardsDock = renderBottomCardsDockImpl;

  private renderCardStage = renderCardStageImpl;

  private renderPlayAreaFxTarget = renderPlayAreaFxTargetImpl;

  private renderHandPlaceholder = renderHandPlaceholderImpl;

  private renderHud(hand: Card[], layout: TableZones, canvas: { width: number; height: number }): void {
    renderHudSection(this.rendererContext(), hand, layout, canvas);
  }

  private renderCardMemory(hand: Card[], layout: TableZones, canvas: { width: number; height: number }): void {
    renderCardMemorySection(this.rendererContext(), hand, layout, canvas);
  }

  private renderBidding(
    bidding: ReturnType<typeof deriveScreenVM>['bidding'],
    layout: TableZones,
    canvas: { width: number; height: number },
  ): void {
    renderBiddingSection(this.rendererContext(), bidding, layout, canvas);
  }

  private renderActions(
    play: boolean,
    pass: boolean,
    hint: boolean,
    layout: TableZones,
    canvas: { width: number; height: number },
    mustPass = false,
  ): void {
    renderActionsSection(this.rendererContext(), play, pass, hint, layout, canvas, mustPass);
  }

  private renderStatus(text: string, layout: TableZones, canvas: { width: number; height: number }): void {
    renderStatusSection(this.rendererContext(), text, layout, canvas);
  }

  private renderTurnTimer(layout: TableZones, canvas: { width: number; height: number }): void {
    renderTurnTimerSection(this.rendererContext(), layout, canvas);
  }

  private renderAdvisor(
    snapshot: ReturnType<RoundRuntime['currentSnapshot']> | undefined,
    layout: TableZones,
    canvas: { width: number; height: number },
  ): void {
    renderAdvisorSection(this.rendererContext(), snapshot, layout, canvas);
  }

  private renderToasts = renderToastsImpl;

  private renderTerminationFeedbackActions = renderTerminationFeedbackActionsImpl;

  private renderResult(
    result: ReturnType<typeof deriveScreenVM>['result'],
    handCounts: [number, number, number],
    layout: TableZones,
    canvas: { width: number; height: number },
  ): void {
    renderResultSection(this.rendererContext(), result, handCounts, layout, canvas);
  }

  private renderPauseControl = renderPauseControlImpl;

  private renderPauseOverlay = renderPauseOverlayImpl;

  private renderPauseMenu = renderPauseMenuImpl;

  private renderPauseConfirm = renderPauseConfirmImpl;

  private openPauseMenu = openPauseMenuImpl;

  private closePauseMenu = closePauseMenuImpl;

  private askPauseQuit = askPauseQuitImpl;

  private cancelPauseQuit = cancelPauseQuitImpl;

  private restartFromPause = restartFromPauseImpl;

  private async submitBid(id: 'call' | 'grab' | 'pass'): Promise<void> {
    if (!this.runtime || this.submitting) return;
    this.submitting = true;
    const type = id === 'call' ? 'call' : id === 'grab' ? 'grab' : 'pass';
    const result = await this.runtime.submitPlayerAction({ kind: 'bid', action: { type, seat: HERO_SEAT } });
    if (!result.ok) this.showStatus(result.error?.reason ?? BID_FAILED_TEXT);
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
    else this.showStatus(result.error?.reason ?? PLAY_FAILED_TEXT);
    if (result.ok) this.statusText = '';
    this.submitting = false;
    this.render();
  }

  private async submitPass(): Promise<void> {
    if (!this.runtime || this.submitting) return;
    this.submitting = true;
    const result = await this.runtime.submitPlayerAction({ kind: 'play', action: { type: 'pass', seat: HERO_SEAT } });
    if (!result.ok) this.showStatus(result.error?.reason ?? PASS_FAILED_TEXT);
    else this.statusText = '';
    this.submitting = false;
    this.render();
  }

  private applyHint(): void {
    if (!this.runtime) return;
    const snapshot = this.runtime.currentSnapshot();
    if (!snapshot?.viewerHand || !this.runtime.isPlayerTurn()) return;
    const verdict = pickHint({ snapshot, history: this.fullGameEvents, selected: this.selected, session: this.hintSession });
    if (verdict.kind === 'move') {
      this.hintSession = verdict.session;
      this.selected = verdict.move.cards.slice();
    } else {
      this.hintSession = null;
      this.selected = clearSelection();
      this.toasts = pushToast(this.toasts, t(verdict.kind === 'passAdvice' ? 'hint.passAdvice' : 'hint.none'), this.toastClockMs);
    }
    this.render();
  }

  private toggleAdvisor(): void {
    this.advisorEnabled = !this.advisorEnabled;
    this.render();
  }

  private toggleBiddingAdvisor(): void {
    this.biddingAdvisorEnabled = !this.biddingAdvisorEnabled;
    this.render();
  }

  private addDisplayCard = addDisplayCardImpl;

  private renderStageCard = renderStageCardImpl;

  private cardFaceColor = cardFaceColorImpl;

  private cardSpritePath = cardSpritePathImpl;

  private suitSpritePath = suitSpritePathImpl;

  private configureCardSprite = configureCardSpriteImpl;

  private fitSpriteInBox = fitSpriteInBoxImpl;

  private animateScaleIn = animateScaleInImpl;

  private toggleCard(card: Card): void {
    if (!this.runtime?.isPlayerTurn() || this.runtime.phase() !== 'playing') return;
    this.selected = toggle(this.selected, card);
    // v1.5 P-AUDIO-WIRE:选牌即时音(select.wav 接活,经 sound 开关)。
    this.playUiSound(RESOURCE_PATHS.audioSelect);
    this.render();
  }

  private addButton = addButtonImpl;

  private buttonSkinPath = buttonSkinPathImpl;

  private buttonTextColor = buttonTextColorImpl;

  private isPauseToggleButton = isPauseToggleButtonImpl;

  private isPauseActionButton = isPauseActionButtonImpl;

  private buttonIconPath = buttonIconPathImpl;

  private addSprite = addSpriteImpl;

  private addSpriteContain = addSpriteContainImpl;

  private loadSprite = loadSpriteImpl;

  private applySpriteFrame = applySpriteFrameImpl;

  private drawPanelSkin = drawPanelSkinImpl;

  private addLabel = addLabelImpl;

  private showStatus = showStatusImpl;

  private tickToastState = tickToastStateImpl;

  private pollTerminationFeedback = pollTerminationFeedbackImpl;

  private pushEventToast = pushEventToastImpl;

  private eventToastText = eventToastTextImpl;

  private resolveSeed = resolveSeedImpl;

  private currentPlayerTurnKey = currentPlayerTurnKeyImpl;

  private isAiThinkingActive = isAiThinkingActiveImpl;

  private aiThinkingView = aiThinkingViewImpl;

  private syncTurnTimerKey = syncTurnTimerKeyImpl;

  private isTurnTimerFrozen = isTurnTimerFrozenImpl;

  private prepareToastAnimation = prepareToastAnimationImpl;

  private playCue = playCueImpl;

  private playEffect = playEffectImpl;

  private renderEmphasis = renderEmphasisImpl;

  private renderButtonRipple = renderButtonRippleImpl;

  private renderBombBurst = renderBombBurstImpl;

  private renderRocketBurst = renderRocketBurstImpl;

  private clearFxLayer = clearFxLayerImpl;

  private toggleRuntimeSetting = toggleRuntimeSettingImpl;

  private vibrate = vibrateImpl;

  private playUiSound = playUiSoundImpl;

  private ensureNode = ensureNodeImpl;

  private beginRenderDiff = beginRenderDiffImpl;

  private hideSettledTransientHud = hideSettledTransientHudImpl;

  private hideSettlementSceneChrome = hideSettlementSceneChromeImpl;

  private hideLiveSubtree = hideLiveSubtreeImpl;

  private markLiveSubtree = markLiveSubtreeImpl;

  private endRenderDiff = endRenderDiffImpl;

  /**
   * v1.5 P-FX-LAYER:常驻特效层。瞬时特效(强调贴图/涟漪/爆点/彩带)一律挂此层——
   * render() 每 pass 将整棵子树 mark 进 liveRenderNodes 豁免 prune,
   * 修复既有「先 render 后 playCue,特效节点被下一次 render 剪除」的早剪 bug;
   * 特效节点由各自 tween 完成时自毁,不依赖 render 生命周期。
   */
  private ensureFxLayer(): Node {
    const layer = this.ensureNode('fx-layer-runtime', this.uiRoot!);
    layer.setSiblingIndex(this.uiRoot!.children.length - 1);
    return layer;
  }

  private pruneInactiveChildren = pruneInactiveChildrenImpl;

  private hideSceneScaffold = hideSceneScaffoldImpl;

  private renderPlaceholderBackground = renderPlaceholderBackgroundImpl;

  private setCardPressed = setCardPressedImpl;

  private isLandscape = isLandscapeImpl;

  private drawDimOverlay = drawDimOverlayImpl;

  private strengthColor = strengthColorImpl;

  private canvasSize = canvasSizeImpl;

  private rectPoint = rectPointImpl;

  private screenPoint = screenPointImpl;

}
