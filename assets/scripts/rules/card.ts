/**
 * 牌模型与牌组。纯逻辑，禁止 import `cc`。
 * 点数强度由枚举数值直接表达：3 最小 … 大王最大；花色不参与大小比较。
 */

export enum Suit {
  Spade = 'S',
  Heart = 'H',
  Club = 'C',
  Diamond = 'D',
  Joker = 'J',
}

/** 点数：枚举值即强度，便于直接用 `>`/`<` 比较。 */
export enum Rank {
  R3 = 3,
  R4 = 4,
  R5 = 5,
  R6 = 6,
  R7 = 7,
  R8 = 8,
  R9 = 9,
  R10 = 10,
  J = 11,
  Q = 12,
  K = 13,
  A = 14,
  R2 = 15,
  SmallJoker = 16,
  BigJoker = 17,
}

/** ARCHITECTURE 中记为 `CardRank` 的概念即 `Rank`。 */
export type CardRank = Rank;

export interface Card {
  rank: Rank;
  suit: Suit;
}

export function isJoker(rank: Rank): boolean {
  return rank === Rank.SmallJoker || rank === Rank.BigJoker;
}

/** 顺子/连对/飞机连续段允许的点数：3..A（排除 2 和大小王）。 */
export const SEQUENCE_MIN: Rank = Rank.R3;
export const SEQUENCE_MAX: Rank = Rank.A;

export function isSequenceable(rank: Rank): boolean {
  return rank >= SEQUENCE_MIN && rank <= SEQUENCE_MAX;
}

const NORMAL_SUITS: Suit[] = [Suit.Spade, Suit.Heart, Suit.Club, Suit.Diamond];
const NORMAL_RANKS: Rank[] = [
  Rank.R3, Rank.R4, Rank.R5, Rank.R6, Rank.R7, Rank.R8, Rank.R9, Rank.R10,
  Rank.J, Rank.Q, Rank.K, Rank.A, Rank.R2,
];

/** 一副 54 张：13 点数 × 4 花色 + 小王 + 大王。 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of NORMAL_RANKS) {
    for (const suit of NORMAL_SUITS) {
      deck.push({ rank, suit });
    }
  }
  deck.push({ rank: Rank.SmallJoker, suit: Suit.Joker });
  deck.push({ rank: Rank.BigJoker, suit: Suit.Joker });
  return deck;
}

/** 调试/展示用点数标签（实际 UI 文本由 Cocos 渲染）。 */
export const RANK_LABEL: Record<Rank, string> = {
  [Rank.R3]: '3',
  [Rank.R4]: '4',
  [Rank.R5]: '5',
  [Rank.R6]: '6',
  [Rank.R7]: '7',
  [Rank.R8]: '8',
  [Rank.R9]: '9',
  [Rank.R10]: '10',
  [Rank.J]: 'J',
  [Rank.Q]: 'Q',
  [Rank.K]: 'K',
  [Rank.A]: 'A',
  [Rank.R2]: '2',
  [Rank.SmallJoker]: 'x',
  [Rank.BigJoker]: 'X',
};
