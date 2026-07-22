/**
 * sota2-R4 B2 种子（规划者预写红种子 · 2026-07-21 · sota2）：
 * ai/decision-log 安装式诊断 sink + hard 决策路径打标——无 sink 零操作、关断等价、时钟注入。
 *
 * 落位：Codex 逐字节复制到 test/ai/decision-log.test.ts，独立 seed commit（先红取证）。
 * 预期红（对当前 main，规划者已预验）：整文件红（ai/decision-log 模块不存在，import 失败）。
 *
 * 契约（B2 卡片同源）：
 *   - installDecisionSink({publish, now?}) / uninstallDecisionSink() / publishDecision(draft) / decisionNow()。
 *   - 纯层零时基：now 为注入闭包，源码不得出现 Date.now/performance.now 字面量（架构门扫描）。
 *   - hard 各 return 点发布 {seat, path, elapsedMs?}；path 标签硬编码字符串（B2 卡片有全量枚举）。
 *   - 无 sink 时 publishDecision 零操作；hard 行为与装 sink 前逐位一致（关断等价）。
 *
 * 负向变异自证（实现后逐条自查，报告注明红几条）：
 *   ① 装 sink 改变 hard 决策（如提前求值影响 rng/缓存）→ 用例① 红。
 *   ② finishing/no-legal-follow/teammate-top-pass/lead 任一打标错位 → 用例② 红。
 *   ③ now 未注入时 elapsedMs 不缺省（NaN/0 伪值）→ 用例③ 红。
 *   ④ uninstall 后仍发布 → 用例④ 红。
 */
import { afterEach, describe, expect, it } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import {
  installDecisionSink,
  uninstallDecisionSink,
  type AiDecisionDraft,
} from '../../assets/scripts/ai/decision-log';
import { GamePhase, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
import { recognize } from '../../assets/scripts/rules';
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

const SCENARIOS: Array<{ name: string; snapshot: GameSnapshot; expectPath: (path: string) => boolean }> = [
  {
    name: 'finishing',
    snapshot: snap({ handCounts: [1, 7, 7], viewerHand: cards('3') }),
    expectPath: (path) => path === 'finishing',
  },
  {
    name: 'no-legal-follow',
    snapshot: snap({ turn: 1, landlord: 2, top: topPlay(2, '2'), handCounts: [7, 2, 7], viewerHand: cards('3 4') }),
    expectPath: (path) => path === 'no-legal-follow',
  },
  {
    name: 'teammate-top-pass',
    snapshot: snap({ turn: 0, landlord: 2, top: topPlay(1, '3'), handCounts: [5, 4, 5], viewerHand: cards('5 5 5 5 A') }),
    expectPath: (path) => path === 'teammate-top-pass',
  },
  {
    name: 'lead-*',
    snapshot: snap({ handCounts: [7, 7, 7] }),
    expectPath: (path) => path.startsWith('lead'),
  },
];

afterEach(() => uninstallDecisionSink());

describe('sota2-R4 B2 决策诊断 sink', () => {
  it('① 关断等价：装 sink 前后 hard 输出逐位一致', () => {
    for (const scenario of SCENARIOS) {
      const before = hard(scenario.snapshot, rng, []);
      const seen: AiDecisionDraft[] = [];
      installDecisionSink({ publish: (draft) => seen.push(draft) });
      const during = hard(scenario.snapshot, rng, []);
      uninstallDecisionSink();
      const after = hard(scenario.snapshot, rng, []);
      expect(during).toEqual(before);
      expect(after).toEqual(before);
      expect(seen.length).toBeGreaterThan(0);
    }
  });

  it('② 决策路径打标：四类分支标签命中', () => {
    for (const scenario of SCENARIOS) {
      const seen: AiDecisionDraft[] = [];
      installDecisionSink({ publish: (draft) => seen.push(draft) });
      hard(scenario.snapshot, rng, []);
      uninstallDecisionSink();
      const last = seen.at(-1)!;
      expect(last.seat).toBe(scenario.snapshot.turn);
      expect(scenario.expectPath(last.path), `${scenario.name} got ${last.path}`).toBe(true);
    }
  });

  it('③ 时钟注入：带 now 时 elapsedMs 为有限数；不带 now 时缺省 undefined', () => {
    const timed: AiDecisionDraft[] = [];
    let tick = 0;
    installDecisionSink({ publish: (draft) => timed.push(draft), now: () => (tick += 5) });
    hard(SCENARIOS[0]!.snapshot, rng, []);
    uninstallDecisionSink();
    expect(Number.isFinite(timed.at(-1)!.elapsedMs)).toBe(true);

    const bare: AiDecisionDraft[] = [];
    installDecisionSink({ publish: (draft) => bare.push(draft) });
    hard(SCENARIOS[0]!.snapshot, rng, []);
    uninstallDecisionSink();
    expect(bare.at(-1)!.elapsedMs).toBeUndefined();
  });

  it('④ 卸载后零发布', () => {
    const seen: AiDecisionDraft[] = [];
    installDecisionSink({ publish: (draft) => seen.push(draft) });
    uninstallDecisionSink();
    hard(SCENARIOS[0]!.snapshot, rng, []);
    expect(seen).toHaveLength(0);
  });
});
