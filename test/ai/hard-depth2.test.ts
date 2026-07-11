import { describe, expect, it } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { GamePhase, type GameEvent, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
import { Rank, recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const hard = strategyFor(AiLevel.Hard);
const rng = { next: () => 0 };

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [7, 7, 7],
    winner: null,
    viewerHand: cards('3 4 5 6 7 9 K'),
    ...over,
  };
}

function topPlay(seat: SeatIndex, spec: string): TopPlay {
  return { seat, pattern: recognize(cards(spec))! };
}

function played(seat: SeatIndex, spec: string): GameEvent {
  return { type: 'play', seat, pattern: recognize(cards(spec))! };
}

function playedRanks(action: ReturnType<typeof hard>): Rank[] {
  if (action.type !== 'play') return [];
  return action.cards.map((card) => card.rank).sort((a, b) => a - b);
}

describe('T-AI-DEPTH2 hard 纵深行为边界', () => {
  it('阵营化施压：农民不因队友报双而烧大牌（跟地主小牌仍打小）', () => {
    const s = snap({
      turn: 1,
      landlord: 0,
      top: topPlay(0, '3'),
      handCounts: [9, 3, 2], // 队友 seat2 剩 2；地主剩 9；手 3 张避开 chooseControlFollow 窗口
      viewerHand: cards('5 8 K'),
    });
    const a = hard(s, rng, []);
    expect(playedRanks(a)).toEqual([Rank.R5]); // 修改前旧逻辑会 pressing→pickLargest 烧 K
  });

  it('喂队友：队友报单且地主未濒临跑完时，农民领出最小单', () => {
    const s = snap({
      turn: 1,
      landlord: 0,
      top: null,
      handCounts: [5, 4, 1],
      viewerHand: cards('3 3 6 9'),
    });
    const a = hard(s, rng, []);
    expect(a.type).toBe('play');
    expect(playedRanks(a)).toEqual([Rank.R3]); // 单张 3 送牌权
  });

  it('地主上家顶张：跟地主小单用安全集最大顶上去', () => {
    const s = snap({
      turn: 1,
      landlord: 2,
      top: topPlay(2, '4'),
      handCounts: [7, 4, 7],
      viewerHand: cards('6 9 K 2'),
    });
    const a = hard(s, rng, []);
    expect(playedRanks(a)).toEqual([Rank.R2]);
  });

  it('终局必胜看破（lead）：外部无更大威胁时先出不可压中继而非塑形小牌', () => {
    // 外部把 A×4、2×4、双王全部出完 → 对 K 不可压、无炸弹/火箭威胁
    const history: GameEvent[] = [
      played(1, 'A A A A'),
      played(2, '2 2 2 2'),
      played(1, 'x X'),
    ];
    const s = snap({
      turn: 0,
      landlord: 0,
      top: null,
      handCounts: [3, 7, 7],
      viewerHand: cards('K K 3'),
    });
    const a = hard(s, rng, history);
    expect(playedRanks(a)).toEqual([Rank.K, Rank.K]); // 保证序列首手=对 K；旧塑形会先走小单 3
  });

  it('终局必胜看破（takeover）：跟牌用不可压候选夺权后收官', () => {
    const history: GameEvent[] = [
      played(1, 'A A A A'),
      played(2, 'x X'),
    ];
    const s = snap({
      turn: 0,
      landlord: 0,
      top: topPlay(1, '6'),
      handCounts: [3, 6, 7],
      viewerHand: cards('2 3 3'),
    });
    const a = hard(s, rng, history);
    expect(playedRanks(a)).toEqual([Rank.R2]); // 单 2 夺权（外部无王无炸），剩对 3 一手清
  });

  it('结构保护跟牌：优先出孤张而不拆对', () => {
    const s = snap({
      turn: 0,
      landlord: 0,
      top: topPlay(1, '4'),
      handCounts: [4, 7, 7],
      viewerHand: cards('5 5 7 9'),
    });
    const a = hard(s, rng, []);
    expect(playedRanks(a)).toEqual([Rank.R7]); // 孤张 7；旧 conservative 会拆对出 5
  });

  it('确定性守恒：全部新分支不消费 rng', () => {
    const s = snap({
      turn: 1,
      landlord: 2,
      top: topPlay(2, '4'),
      handCounts: [7, 4, 7],
      viewerHand: cards('6 9 K 2'),
    });
    expect(hard(s, { next: () => 0.99 }, [])).toEqual(hard(s, { next: () => 0 }, []));
  });
});
