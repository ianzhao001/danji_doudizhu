export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  highlight?: string;
}

export const TUTORIAL_HIGHLIGHTS = [
  'playerHand',
  'biddingPanel',
  'playArea',
  'actionButtons',
  'scorePanel',
] as const;

export type TutorialHighlight = (typeof TUTORIAL_HIGHLIGHTS)[number];

const STEPS: ReadonlyArray<TutorialStep> = [
  {
    id: 'deal-hand',
    title: '先看手牌',
    body: '每局发牌后，先观察自己的牌型、2 和王的数量，以及是否有顺子或炸弹。',
    highlight: 'playerHand',
  },
  {
    id: 'bidding',
    title: '叫抢地主',
    body: '手牌强时可以叫地主或抢地主；不想承担地主压力时可以不叫或不抢。',
    highlight: 'biddingPanel',
  },
  {
    id: 'play-patterns',
    title: '按牌型出牌',
    body: '可以出单张、对子、三带、顺子、连对、飞机、炸弹或火箭等合法牌型。',
    highlight: 'playArea',
  },
  {
    id: 'follow-pass',
    title: '跟牌或不要',
    body: '别人出牌后，需要用同牌型更大的牌压过；没有合适牌时可以选择不要。',
    highlight: 'actionButtons',
  },
  {
    id: 'bomb-rocket',
    title: '炸弹与火箭',
    body: '炸弹和火箭可以压过普通牌型，并会让本局倍数翻倍。',
    highlight: 'playArea',
  },
  {
    id: 'settlement',
    title: '结算倍数',
    body: '任一方先出完手牌后结算胜负；叫抢、炸弹、火箭、春天都会影响最终倍数。',
    highlight: 'scorePanel',
  },
];

export function tutorialSteps(): TutorialStep[] {
  return STEPS.map((step) => ({ ...step }));
}

export function nextStep(steps: TutorialStep[], index: number): number {
  if (steps.length === 0) return 0;
  return Math.max(0, Math.min(steps.length - 1, Math.trunc(index + 1)));
}
