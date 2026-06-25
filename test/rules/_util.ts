import { Card, Rank, Suit } from '../../assets/scripts/rules';

const RANK_MAP: Record<string, Rank | undefined> = {
  '3': Rank.R3,
  '4': Rank.R4,
  '5': Rank.R5,
  '6': Rank.R6,
  '7': Rank.R7,
  '8': Rank.R8,
  '9': Rank.R9,
  '10': Rank.R10,
  J: Rank.J,
  Q: Rank.Q,
  K: Rank.K,
  A: Rank.A,
  '2': Rank.R2,
  x: Rank.SmallJoker,
  X: Rank.BigJoker,
};

const SUITS = [Suit.Spade, Suit.Heart, Suit.Club, Suit.Diamond];

/**
 * 由紧凑记号构造手牌，如 `cards('3 3 3 4 10 J x X')`。
 * 花色不参与规则，按同点数出现次序轮配以避免重复牌。
 */
export function cards(spec: string): Card[] {
  const trimmed = spec.trim();
  const tokens = trimmed.length ? trimmed.split(/\s+/) : [];
  const seen = new Map<Rank, number>();
  return tokens.map((t) => {
    const rank = RANK_MAP[t];
    if (rank === undefined) throw new Error(`unknown rank token: ${t}`);
    const k = seen.get(rank) ?? 0;
    seen.set(rank, k + 1);
    const suit = rank >= Rank.SmallJoker ? Suit.Joker : SUITS[k % 4];
    return { rank, suit };
  });
}
