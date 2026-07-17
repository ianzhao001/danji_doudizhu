import { Rank, Suit, enumerateMoves, legalFollows, type Card, type HandPattern, type Move } from '../rules';

export interface ForcedWinArgs {
  hand: Card[];
  unseenByRank: number[];
  minOpponentHandCount: number;
  top: HandPattern | null;
  nodeBudget?: number;
}

export interface ForcedWinVerdict {
  result: 'win' | 'unknown';
  move: Move | null;
}

type SearchResult = true | false | null;

const SUITS = [Suit.Spade, Suit.Heart, Suit.Club, Suit.Diamond];

function materialize(counts: readonly number[]): Card[] {
  const cards: Card[] = [];
  for (let rank = Rank.R3; rank <= Rank.R2; rank += 1) {
    for (let index = 0; index < (counts[rank] ?? 0); index += 1) cards.push({ rank, suit: SUITS[index] });
  }
  if ((counts[Rank.SmallJoker] ?? 0) > 0) cards.push({ rank: Rank.SmallJoker, suit: Suit.Joker });
  if ((counts[Rank.BigJoker] ?? 0) > 0) cards.push({ rank: Rank.BigJoker, suit: Suit.Joker });
  return cards;
}

function removeCards(hand: Card[], played: readonly Card[]): Card[] {
  const rest = hand.slice();
  for (const card of played) {
    const index = rest.findIndex((candidate) => candidate.rank === card.rank && candidate.suit === card.suit);
    if (index < 0) throw new Error('ENDGAME_MOVE_OVERDRAW');
    rest.splice(index, 1);
  }
  return rest;
}

function removeRanks(counts: number[], played: readonly Card[]): number[] {
  const rest = counts.slice();
  for (const card of played) {
    rest[card.rank] -= 1;
    if (rest[card.rank] < 0) throw new Error('ENDGAME_ADV_OVERDRAW');
  }
  return rest;
}

function rankState(hand: readonly Card[]): string {
  return hand.map((card) => card.rank).sort((a, b) => a - b).join('.');
}

export function solveForcedWin(args: ForcedWinArgs): ForcedWinVerdict {
  const budget = args.nodeBudget ?? 50_000;
  if (!Number.isInteger(budget) || budget < 1) return { result: 'unknown', move: null };
  const memo = new Map<string, SearchResult>();
  let expanded = 0;

  const search = (
    hand: Card[],
    adversary: number[],
    shed: number,
    top: HandPattern | null,
    myTurn: boolean,
  ): SearchResult => {
    if (hand.length === 0) return true;
    if (shed >= args.minOpponentHandCount) return false;
    if (++expanded > budget) return null;
    const key = `${rankState(hand)}|${adversary.join(',')}|${shed}|${top ? `${top.category}:${top.mainRank}:${top.length}` : '-'}|${myTurn ? 1 : 0}`;
    if (memo.has(key)) return memo.get(key)!;
    memo.set(key, null);

    if (myTurn) {
      const moves = top ? legalFollows(hand, top) : enumerateMoves(hand);
      let sawUnknown = false;
      for (const move of moves) {
        const rest = removeCards(hand, move.cards);
        if (rest.length === 0) {
          memo.set(key, true);
          return true;
        }
        const child = search(rest, adversary, shed, move.pattern, false);
        if (child === true) {
          memo.set(key, true);
          return true;
        }
        if (child === null) sawUnknown = true;
      }
      if (top) {
        const passed = search(hand, adversary, shed, null, false);
        if (passed === true) {
          memo.set(key, true);
          return true;
        }
        if (passed === null) sawUnknown = true;
      }
      const result: SearchResult = sawUnknown ? null : false;
      memo.set(key, result);
      return result;
    }

    const advHand = materialize(adversary);
    const moves = top ? legalFollows(advHand, top) : enumerateMoves(advHand);
    const options: Array<Move | null> = top ? [null, ...moves] : moves;
    if (options.length === 0) {
      const child = search(hand, adversary, shed, null, true);
      memo.set(key, child);
      return child;
    }
    let sawUnknown = false;
    for (const move of options) {
      const child = move === null
        ? search(hand, adversary, shed, null, true)
        : shed + move.cards.length >= args.minOpponentHandCount
          ? false
          : search(hand, removeRanks(adversary, move.cards), shed + move.cards.length, move.pattern, true);
      if (child === false) {
        memo.set(key, false);
        return false;
      }
      if (child === null) sawUnknown = true;
    }
    const result: SearchResult = sawUnknown ? null : true;
    memo.set(key, result);
    return result;
  };

  const rootMoves = args.top ? legalFollows(args.hand, args.top) : enumerateMoves(args.hand);
  if (++expanded > budget) return { result: 'unknown', move: null };
  for (const move of rootMoves) {
    const rest = removeCards(args.hand, move.cards);
    if (rest.length === 0) return { result: 'win', move };
    const child = search(rest, args.unseenByRank.slice(), 0, move.pattern, false);
    if (child === true) return { result: 'win', move };
  }
  return { result: 'unknown', move: null };
}
