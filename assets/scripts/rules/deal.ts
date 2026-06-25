/**
 * 洗牌与发牌。三人各 17 张，留 3 张底牌。
 */

import { Card, createDeck } from './card';
import { Rng } from './rng';

export interface Deal {
  /** 三个座位的手牌，各 17 张。 */
  hands: [Card[], Card[], Card[]];
  /** 3 张底牌，归地主。 */
  bottom: Card[];
}

/** Fisher–Yates 洗牌，使用注入的随机源，不修改入参。 */
export function shuffle(deck: Card[], rng: Rng): Card[] {
  const arr = deck.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/** 洗一副新牌并发牌：17×3 + 3 底牌。 */
export function deal(rng: Rng): Deal {
  const shuffled = shuffle(createDeck(), rng);
  const hands: [Card[], Card[], Card[]] = [[], [], []];
  for (let i = 0; i < 51; i++) {
    hands[i % 3].push(shuffled[i]);
  }
  const bottom = shuffled.slice(51);
  return { hands, bottom };
}
