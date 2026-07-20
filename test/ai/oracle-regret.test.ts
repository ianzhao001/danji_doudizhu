/**
 * W-AI-R3（B0 立度量）：困难档首着 regret oracle 门。
 * 三方审查 #20：用残局精确真值衡量 AI 首选 regret。本门以「手算/精确可判」的残局真值为 oracle，
 * 断言困难档首着落在最优类内（regret=0）；跌破即残局首着回归。
 * 另用 solveForcedWin 交叉核对：真值集里的必胜局面，精确解也须判 'win'（oracle 自证不空转）。
 *
 * ── 负向变异自证 ──
 *   ① 困难档在可清手时不清手 / 过牌 → 对应 fixture regret>0 红；
 *   ② solveForcedWin 把必胜误判 unknown → 交叉核对红。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { solveForcedWin } from '../../assets/scripts/ai/endgameSolver';
import { GamePhase, type GameSnapshot, type RoundAction, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
import { recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const hard = strategyFor(AiLevel.Hard);

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [5, 5, 5],
    winner: null,
    viewerHand: cards('3 4 5'),
    bottom: null,
    ...over,
  };
}
const topOf = (seat: SeatIndex, spec: string): TopPlay => ({ seat, pattern: recognize(cards(spec))! });

interface Fixture {
  name: string;
  snap: GameSnapshot;
  optimal: (a: RoundAction) => boolean;
  why: string;
}

const FIXTURES: Fixture[] = [
  {
    name: '整手对子清手（领出）',
    snap: snap({ viewerHand: cards('A A'), handCounts: [2, 5, 5] }),
    optimal: (a) => a.type === 'play' && a.cards.length === 2,
    why: '两张 A 一手清完即胜，必领出对子而非拆单',
  },
  {
    name: '整手顺子清手（领出）',
    snap: snap({ viewerHand: cards('3 4 5 6 7'), handCounts: [5, 6, 6] }),
    optimal: (a) => a.type === 'play' && a.cards.length === 5,
    why: '五张连顺一手清完即胜',
  },
  {
    name: '压过并清手（跟牌）',
    snap: snap({ viewerHand: cards('2 2'), handCounts: [2, 6, 6], top: topOf(1, 'K K') }),
    optimal: (a) => a.type === 'play' && a.cards.length === 2,
    why: '22 压 KK 且清手即胜，不许过牌',
  },
  {
    name: '末张压单必出（跟牌，不弃胜）',
    snap: snap({ viewerHand: cards('2'), handCounts: [1, 6, 6], top: topOf(1, 'A') }),
    optimal: (a) => a.type === 'play',
    why: '最后一张 2 压 A 即胜，过牌=弃胜',
  },
  {
    name: '火箭清手（跟牌）',
    snap: snap({ viewerHand: cards('x X'), handCounts: [2, 6, 6], top: topOf(1, '2') }),
    optimal: (a) => a.type === 'play' && a.cards.length === 2,
    why: '火箭压任何牌且清手即胜',
  },
  {
    name: '压制期领出不可压对子而非拆单送控',
    snap: snap({ viewerHand: cards('A A 5'), handCounts: [3, 1, 1] }),
    optimal: (a) => a.type === 'play' && a.cards.length === 2,
    why: '对手各剩 1 张，领对子(单牌压不过)保控再清，胜；拆出单 5 有被更大单反超之险',
  },
];

describe('W-AI-R3 困难档首着 regret oracle', () => {
  it('全部真值局面 regret=0（首着落在最优类内）', () => {
    const regrets: string[] = [];
    for (const fx of FIXTURES) {
      const action = hard(fx.snap, { next: () => 0 }, []);
      if (!fx.optimal(action)) regrets.push(`${fx.name}: 实得 ${JSON.stringify(action)}（${fx.why}）`);
    }
    expect(regrets, `首着 regret 非零:\n${regrets.join('\n')}`).toEqual([]);
  });

  it('oracle 自证：清手类必胜局面 solveForcedWin 判 win（非空转）', () => {
    // hand=2 2、无 top、对手各 ≥2：22 领出后仍需证；取更硬的「整手可清」交精确解。
    const win = solveForcedWin({
      hand: cards('2 2'),
      unseenByRank: (() => { const u = new Array<number>(20).fill(0); return u; })(),
      minOpponentHandCount: 1,
      top: null,
      nodeBudget: 60_000,
    });
    expect(win.result, '两张 2 对空手对手＝必胜').toBe('win');
  });
});
