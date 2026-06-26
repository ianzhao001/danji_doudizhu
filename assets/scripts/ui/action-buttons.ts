/**
 * M3-00 操作按钮状态模型（出牌/过牌/提示）。架构落桩——实现方实现函数体，使 test/ui/action-buttons.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-action-buttons.md。纯函数、确定性，禁止 import `cc`。
 * 复用 rules 的 validatePlay/legalFollows/enumerateMoves。
 */

import { enumerateMoves, legalFollows, validatePlay, type Card } from '../rules';
import { type GameSnapshot, type SeatIndex } from '../game';

export interface ActionButtonsState {
  play: boolean;
  pass: boolean;
  hint: boolean;
}

function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

function selectedCardsAreInHand(selectedCards: Card[], hand: Card[] | undefined): boolean {
  return hand === undefined || selectedCards.every((selected) => hand.some((card) => sameCard(card, selected)));
}

export function deriveActionButtons(args: {
  snapshot: GameSnapshot;
  selectedCards: Card[];
  viewerSeat?: SeatIndex;
}): ActionButtonsState {
  const { snapshot, selectedCards } = args;
  const viewerSeat = args.viewerSeat ?? snapshot.turn;
  if (snapshot.turn !== viewerSeat) return { play: false, pass: false, hint: false };

  const current = snapshot.top?.pattern ?? null;
  const hand = snapshot.viewerHand ?? [];
  const hasHint = snapshot.top === null
    ? enumerateMoves(hand).length > 0
    : legalFollows(hand, snapshot.top.pattern).length > 0;

  return {
    play:
      selectedCards.length > 0 &&
      selectedCardsAreInHand(selectedCards, snapshot.viewerHand) &&
      validatePlay(selectedCards, current).ok,
    pass: snapshot.top !== null,
    hint: hasHint,
  };
}
