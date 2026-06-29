import { type Card, type HandPattern, type Move, legalFollows, recognize } from '../rules';

export function canFinishInOneMove(hand: Card[]): boolean {
  return hand.length > 0 && recognize(hand) !== null;
}

export function finishingFollow(hand: Card[], top: HandPattern): Move | null {
  const follow = legalFollows(hand, top).find((move) => move.cards.length === hand.length);
  return follow ?? null;
}
