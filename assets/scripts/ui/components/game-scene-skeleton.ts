import { _decorator, Component, Label, Sprite, SpriteFrame, resources } from 'cc';
import { GamePhase, type GameSnapshot, type SeatIndex } from '../../game';
import { Rank, Suit, type Card } from '../../rules';
import { deriveScreenVM } from '../screen-view';
import { RESOURCE_PATHS, cardAssetPath } from '../asset-keys';

const { ccclass, property } = _decorator;

interface MockRuntime {
  phase(): 'playing';
  currentSnapshot(): GameSnapshot;
  currentBidding(): null;
  settlement(): null;
}

const HERO_SEAT: SeatIndex = 0;

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

function createMockRuntime(): MockRuntime {
  const heroHand = [
    card(Rank.R3, Suit.Spade),
    card(Rank.R4, Suit.Heart),
    card(Rank.R5, Suit.Club),
    card(Rank.R6, Suit.Diamond),
    card(Rank.SmallJoker, Suit.Joker),
  ];

  return {
    phase: () => 'playing',
    currentSnapshot: () => ({
      phase: GamePhase.Playing,
      turn: HERO_SEAT,
      landlord: 1,
      top: null,
      handCounts: [heroHand.length, 17, 20],
      winner: null,
      viewerHand: heroHand.slice(),
    }),
    currentBidding: () => null,
    settlement: () => null,
  };
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

  private readonly runtime = createMockRuntime();

  onLoad(): void {
    this.loadSprite(RESOURCE_PATHS.gameTableBg, this.background);
    this.loadSprite(cardAssetPath('3-S') ?? RESOURCE_PATHS.cardTemplate, this.cardTemplate);
    this.render();
  }

  private render(): void {
    const snapshot = this.runtime.currentSnapshot();
    const vm = deriveScreenVM({
      snapshot,
      bidding: this.runtime.currentBidding() ?? undefined,
      heroSeat: HERO_SEAT,
      selectedCards: [],
      recentEvents: [{ type: 'deal' }],
      layoutOpts: { containerWidth: 390, cardWidth: 56, liftOffset: 18 },
      settlement: this.runtime.settlement() ?? undefined,
    });

    this.setText(this.phaseLabel, this.runtime.phase());
    this.setText(this.landlordLabel, `地主 ${vm.topBar.landlordSeat}`);
    this.setText(this.multiplierLabel, `倍数 ×${vm.topBar.multiplier}`);
    this.setText(this.handCountLabel, `手牌 ${vm.hand.length}`);
    this.setText(this.actionLabel, vm.actions.play ? '可出牌' : '等待');
  }

  private setText(label: Label | null, text: string): void {
    if (label) label.string = text;
  }

  private loadSprite(path: string, sprite: Sprite | null): void {
    if (!sprite) return;
    resources.load(path, SpriteFrame, (error, frame) => {
      if (!error && frame) sprite.spriteFrame = frame;
    });
  }
}
