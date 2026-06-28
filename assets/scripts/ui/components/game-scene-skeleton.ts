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
  Vec3,
  director,
  resources,
  tween,
} from 'cc';
import { AiLevel } from '../../ai';
import { nextHint } from '../../ai/hint';
import { commitFinishedRound, persistRound, restoreRound, type SessionKeys } from '../../data/session';
import { difficultyConfig } from '../../data/difficultyConfig';
import { defaultSettings, type Settings } from '../../data/settings';
import { loadSettings } from '../../data/settingsStorage';
import { startRoundRuntime, resumeRoundRuntime, type RoundRuntime } from '../../flow/round-runtime';
import { realClock } from '../../flow/clock';
import type { FlowEvent } from '../../flow/types';
import type { ResumeSnapshot, RoundFinishInput, SeatIndex } from '../../game';
import { type Card, Suit } from '../../rules';
import { cocosStorage } from '../../runtime/cocos-storage';
import { cardView } from '../card-view';
import { cueForFlowEvent } from '../event-cues';
import { clearSelection, isSelected, toggle } from '../selection';
import { deriveScreenVM } from '../screen-view';
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
  private selected: Card[] = [];
  private recentEvents: FlowEvent[] = [];
  private settings: Settings = defaultSettings();
  private statusText = '';
  private submitting = false;
  private readonly spriteFrames = new Map<string, SpriteFrame>();

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

  private startGame(forceNew: boolean): void {
    this.unsubscribe?.();
    this.runtime?.dispose();
    this.unsubscribe = null;
    this.selected = clearSelection();
    this.recentEvents = [];
    this.statusText = '';

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

    this.runtime = resume ? resumeRoundRuntime(resume, config) : startRoundRuntime(config);
    this.unsubscribe = this.runtime.onEvent((event) => {
      this.recentEvents.push(event);
      this.recentEvents = this.recentEvents.slice(-12);
      this.playCue(event);
      this.render();
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

    const width = this.canvasSize().width;
    const handWidth = Math.max(1, width - 32);
    const vm = deriveScreenVM({
      snapshot,
      bidding,
      heroSeat: HERO_SEAT,
      selectedCards: this.selected,
      recentEvents: this.recentEvents,
      layoutOpts: { containerWidth: handWidth, cardWidth: CARD_SIZE.width, liftOffset: HAND_LIFT },
      settlement,
    });

    this.clearNode(this.uiRoot);

    this.renderTopBar(this.runtime.phase(), vm.topBar, snapshot?.viewerHand?.length ?? 0);
    this.renderSeats(snapshot?.handCounts ?? [0, 0, 0], snapshot?.landlord ?? null);
    this.renderPlayArea(snapshot?.top ? String(snapshot.top.pattern.category) : '自由出牌');
    this.renderBidding(bidding ? vm.bidding : undefined);
    this.renderHand(vm.hand, handWidth);
    this.renderStatus(this.statusText || (this.runtime.isPlayerTurn() ? '轮到你' : '等待'));
    this.renderActions(vm.actions.play, vm.actions.pass, vm.actions.hint);
    this.renderResult(vm.result);
  }

  private renderTopBar(phase: string, topBar: { multiplier: number; bombs: number; landlordSeat: number }, handCount: number): void {
    this.addLabel(phase, 0, 382, 18, this.uiRoot!, 140, 30);
    this.addLabel(`地主 ${topBar.landlordSeat + 1}`, -128, 350, 16, this.uiRoot!, 110, 30);
    this.addLabel(`倍数 ×${topBar.multiplier}`, 0, 350, 16, this.uiRoot!, 110, 30);
    this.addLabel(`手牌 ${handCount}`, 128, 350, 16, this.uiRoot!, 110, 30);
  }

  private renderSeats(handCounts: [number, number, number], landlord: number | null): void {
    this.addLabel(`AI 左家\n${handCounts[1]}张${landlord === 1 ? '\n地主' : ''}`, -132, 158, 16, this.uiRoot!, 108, 64);
    this.addLabel(`AI 右家\n${handCounts[2]}张${landlord === 2 ? '\n地主' : ''}`, 132, 158, 16, this.uiRoot!, 108, 64);
  }

  private renderPlayArea(text: string): void {
    const label = this.addLabel(`出牌区\n${text}`, 0, 62, 20, this.uiRoot!, 180, 64);
    label.lineHeight = 28;
  }

  private renderBidding(bidding: ReturnType<typeof deriveScreenVM>['bidding']): void {
    if (!bidding) return;
    this.addLabel(bidding.prompt, 0, -132, 18);
    bidding.buttons.forEach((button, index) => {
      const spacing = 118;
      const x = (index - (bidding.buttons.length - 1) / 2) * spacing;
      this.addButton(button.label, x, -180, 112, 42, button.enabled, () => {
        if (!button.enabled) return;
        void this.submitBid(button.id);
      });
    });
  }

  private renderHand(hand: ReturnType<typeof deriveScreenVM>['hand'], containerWidth: number): void {
    this.addLabel('玩家手牌', 0, -286, 16, this.uiRoot!, 140, 30);
    for (const slot of hand) {
      const x = slot.x + CARD_SIZE.width / 2 - containerWidth / 2;
      const y = -336 - slot.y;
      this.addCard(slot.card, x, y, slot.selected);
    }
  }

  private renderActions(play: boolean, pass: boolean, hint: boolean): void {
    this.addButton('出牌', -112, -232, 84, 38, play, () => void this.submitPlay());
    this.addButton('不要', 0, -232, 84, 38, pass, () => void this.submitPass());
    this.addButton('提示', 112, -232, 84, 38, hint, () => this.applyHint());
  }

  private renderStatus(text: string): void {
    this.addLabel(text, 0, -264, 18, this.uiRoot!, 180, 32);
  }

  private renderResult(result: ReturnType<typeof deriveScreenVM>['result']): void {
    if (!result) return;
    const panel = this.ensureNode('settlement-panel-runtime', this.uiRoot!);
    panel.setPosition(0, 4, 0);
    this.addUiTransform(panel, 330, 420);
    const sprite = panel.addComponent(Sprite);
    this.loadSprite(RESOURCE_PATHS.settlementBg, sprite);
    this.addLabel(result.resultText, 0, 150, 34, panel);
    this.addLabel(`倍数 ×${result.multiplier}  炸弹 ${result.bombs}`, 0, 92, 20, panel);
    this.addLabel(result.springText || '本局结算', 0, 50, 18, panel);
    this.addLabel(result.scores.map((row) => `座位${row.seat + 1}${row.isLandlord ? '(地主)' : ''}: ${row.score}`).join('\n'), 0, -34, 18, panel);
    this.addButton('再来一局', -74, -154, 116, 42, true, () => this.startGame(true), panel);
    this.addButton('返回大厅', 74, -154, 116, 42, true, () => director.loadScene('lobby'), panel);
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

  private addCard(card: Card, x: number, y: number, selected: boolean): void {
    const node = this.ensureNode(`card-${card.rank}-${card.suit}-${x}`, this.uiRoot!);
    node.setPosition(x, y + (selected ? 4 : 0), 0);
    this.addUiTransform(node, CARD_SIZE.width, CARD_SIZE.height);
    const sprite = node.addComponent(Sprite);
    const view = cardView(card);
    this.loadSprite(cardAssetPath(view.assetKey) ?? RESOURCE_PATHS.cardTemplate, sprite);
    node.on(Node.EventType.TOUCH_END, () => this.toggleCard(card), this);

    const label = this.addLabel(`${view.rankLabel}${suitText(view.suitKey)}`, -12, 18, 10, node, 30, 18);
    label.color =
      view.suitKey === Suit.Heart || view.suitKey === Suit.Diamond
        ? new Color(205, 96, 124, 255)
        : new Color(84, 74, 92, 255);
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
  ): Label {
    const node = this.ensureNode(`button-${text}-${x}-${y}`, parent);
    node.setPosition(x, y, 0);
    this.addUiTransform(node, width, height);
    const button = node.addComponent(Button);
    button.target = this.drawButtonBackground(node, width, height, enabled);
    button.transition = Button.Transition.COLOR;
    button.interactable = enabled;
    button.normalColor = enabled ? new Color(255, 255, 255, 70) : new Color(255, 255, 255, 30);
    button.pressedColor = new Color(255, 214, 226, 150);
    button.hoverColor = new Color(255, 255, 255, 100);
    button.disabledColor = new Color(255, 255, 255, 24);
    node.on(Button.EventType.CLICK, cb, this);

    const labelNode = this.ensureNode('button-label', node);
    this.addUiTransform(labelNode, width, height);
    const label = labelNode.addComponent(Label);
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
  ): Label {
    const node = this.ensureNode(`label-${text}-${x}-${y}`, parent);
    node.setPosition(x, y, 0);
    this.addUiTransform(node, width, height);
    const label = node.addComponent(Label);
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

  private playCue(event: FlowEvent): void {
    const cue = cueForFlowEvent(event);
    if (!cue) return;
    const path = cueAudioPath(cue);
    if (this.settings.animation) this.playEffect(cue);
    if (!this.settings.sound || !path || !this.audioSource) return;
    resources.load(path, AudioClip, (error, clip) => {
      if (!error && clip && this.audioSource) {
        this.audioSource.clip = clip;
        this.audioSource.play();
      }
    });
  }

  private playEffect(cue: string): void {
    if (!this.uiRoot || (cue !== 'bomb' && cue !== 'rocket' && cue !== 'deal' && cue !== 'play')) return;
    const scaleUp = cue === 'bomb' || cue === 'rocket' ? 1.12 : 1.04;
    tween(this.uiRoot)
      .to(0.1, { scale: new Vec3(scaleUp, scaleUp, 1) })
      .to(0.16, { scale: new Vec3(1, 1, 1) })
      .start();
  }

  private ensureNode(name: string, parent: Node): Node {
    const existing = parent.getChildByName(name);
    if (existing) {
      existing.active = true;
      existing.layer = parent.layer;
      existing.setSiblingIndex(parent.children.length - 1);
      return existing;
    }
    const node = new Node(name);
    node.parent = parent;
    node.layer = parent.layer;
    node.active = true;
    node.setSiblingIndex(parent.children.length - 1);
    return node;
  }

  private clearNode(node: Node): void {
    for (const child of node.children.slice()) {
      child.removeFromParent();
      child.destroy();
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
    const graphics = node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = enabled ? new Color(255, 255, 255, 70) : new Color(255, 255, 255, 30);
    graphics.roundRect(-width / 2, -height / 2, width, height, 8);
    graphics.fill();
    return node;
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
