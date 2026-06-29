import { describe, expect, it } from 'vitest';
import type { ReplayTrick } from '../../assets/scripts/game/trick-replay';
import { deriveReplayView } from '../../assets/scripts/ui/replay-view';

const tricks: ReplayTrick[] = [
  { index: 0, leader: 0, winnerSeat: 0, plays: [{ seat: 0, kind: 'play' }, { seat: 1, kind: 'pass' }] },
  { index: 1, leader: 0, winnerSeat: 2, plays: [{ seat: 2, kind: 'bomb' }] },
  { index: 2, leader: 2, winnerSeat: 2, plays: [{ seat: 2, kind: 'rocket' }] },
];

describe('deriveReplayView', () => {
  it('returns a safe empty view', () => {
    expect(deriveReplayView([], 0)).toEqual({
      trickLabel: '暂无回放',
      plays: [],
      hasPrev: false,
      hasNext: false,
      progressLabel: '0/0',
    });
  });

  it('marks first trick navigation state', () => {
    const view = deriveReplayView(tricks, 0);

    expect(view.hasPrev).toBe(false);
    expect(view.hasNext).toBe(true);
    expect(view.progressLabel).toBe('1/3');
    expect(view.plays).toEqual(['座位0 出牌', '座位1 不要']);
  });

  it('marks middle trick navigation state', () => {
    const view = deriveReplayView(tricks, 1);

    expect(view.trickLabel).toBe('第 2 墩');
    expect(view.hasPrev).toBe(true);
    expect(view.hasNext).toBe(true);
    expect(view.plays).toEqual(['座位2 炸弹']);
  });

  it('marks last trick navigation state', () => {
    const view = deriveReplayView(tricks, 2);

    expect(view.hasPrev).toBe(true);
    expect(view.hasNext).toBe(false);
    expect(view.progressLabel).toBe('3/3');
    expect(view.plays).toEqual(['座位2 火箭']);
  });

  it('clamps out-of-range indexes', () => {
    expect(deriveReplayView(tricks, -5).progressLabel).toBe('1/3');
    expect(deriveReplayView(tricks, 99).progressLabel).toBe('3/3');
  });
});
