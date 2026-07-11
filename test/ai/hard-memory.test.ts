/**
 * 验证困难档在公开历史足够充分时，会用绝对最大单接管牌权。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { Rank, createRng, recognize } from '../../assets/scripts/rules';
import { GamePhase, type GameEvent, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const hard = strategyFor(AiLevel.Hard);
// 宽化调用签名以覆盖 history 入参场景。
type Rng = ReturnType<typeof createRng>;
const hardWith = hard as unknown as (s: GameSnapshot, r: Rng, h?: GameEvent[]) => ReturnType<typeof hard>;

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [4, 17, 17],
    winner: null,
    viewerHand: cards('3 7 J K'),
    ...over,
  };
}

const topFrom = (seat: SeatIndex, spec: string): TopPlay => ({ seat, pattern: recognize(cards(spec))! });
const played = (seat: SeatIndex, spec: string): GameEvent => ({ type: 'play', seat, pattern: recognize(cards(spec))! });

/** A×4 + 2×4 + 双王全部现身 → 手中 K 即全场绝对最大单（Q 仍有 4 张未见，J 非绝对最大）。 */
const HIGH_CARDS_GONE: GameEvent[] = [played(1, 'A A A A'), played(2, '2 2 2 2'), played(1, 'x X')];

describe('T-MEMORY-REAL 困难档真记牌（绝对最大单接管）', () => {
  it('回归锚：空历史跟单 9 → 出最小可压 J（既有行为不变）', () => {
    const a = hardWith(snap({ top: topFrom(1, '9') }), createRng(7));
    expect(a.type).toBe('play');
    if (a.type === 'play') expect(a.cards.map((c) => c.rank)).toEqual([Rank.J]);
  });

  it('真记牌：A/2/王全部现身后跟单 9 → 出绝对最大单 K 接管（不再贴身 J）', () => {
    const a = hardWith(snap({ top: topFrom(1, '9') }), createRng(7), HIGH_CARDS_GONE);
    expect(a.type).toBe('play');
    if (a.type === 'play') expect(a.cards.map((c) => c.rank)).toEqual([Rank.K]);
  });

  it('守卫：队友顶牌时富历史仍让牌 pass（记牌不破坏农民配合）', () => {
    const a = hardWith(snap({ top: topFrom(1, '9'), landlord: 2 }), createRng(7), HIGH_CARDS_GONE);
    expect(a.type).toBe('pass');
  });

  it('守卫：历史中未见上位牌 → 不触发接管（Q 未现身时 K 非绝对最大，仍出 J）', () => {
    const partial: GameEvent[] = [played(1, 'A A A A'), played(2, 'x X')]; // 2 还有 4 张未见
    const a = hardWith(snap({ top: topFrom(1, '9') }), createRng(7), partial);
    expect(a.type).toBe('play');
    if (a.type === 'play') expect(a.cards.map((c) => c.rank)).toEqual([Rank.J]);
  });

  it('确定性：同快照同历史两次调用深相等', () => {
    const s = snap({ top: topFrom(1, '9') });
    const first = hardWith(s, createRng(7), HIGH_CARDS_GONE);
    const second = hardWith(s, createRng(7), HIGH_CARDS_GONE);
    expect(second).toEqual(first);
  });
});
