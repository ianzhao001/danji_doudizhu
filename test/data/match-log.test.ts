/**
 * sota2-R4 B1 种子（规划者预写红种子 · 2026-07-21 · sota2）：
 * data/match-log 对局记录纯内核——schema v1、环形淘汰、字节软上限、钉住、容错迁移、配额降级。
 *
 * 落位：Codex 逐字节复制到 test/data/match-log.test.ts，独立 seed commit（先红取证）。
 * 预期红（对当前 main，规划者已预验）：整文件红（data/match-log 模块不存在，import 失败）。
 *
 * 契约（B1 卡片同源）：
 *   - MATCH_LOG_VERSION=1、MATCH_LOG_MAX=30、MATCH_LOG_SOFT_BYTES=1_500_000、MATCH_LOG_PINNED_MAX=10。
 *   - STORAGE_KEYS.matchLog === 'doudizhu.matchlog'（storage-keys 单一事实源同步扩展）。
 *   - emptyMatchLog()/migrateMatchLog(raw)/appendEntry(state, entry)/setPinned(state, logId, pinned)
 *     纯函数不可变；loadMatchLog(storage)/saveMatchLog(storage, state) 为存取封套。
 *   - saveMatchLog 配额降级：setItem 抛错 → 淘汰最旧非钉住重试一次 → 仍失败返回 'dropped' 不上抛。
 *
 * 负向变异自证（实现后逐条自查，报告注明红几条）：
 *   ① 环形淘汰改成"淘汰最新"→ 用例② 红。
 *   ② 字节软上限不生效 → 用例③ 红。
 *   ③ 钉住条目被淘汰 → 用例④ 红。
 *   ④ migrate 对坏数据上抛 → 用例⑤ 红。
 *   ⑤ 配额降级去掉重试/改上抛 → 用例⑥ 红。
 */
import { describe, expect, it } from 'vitest';
import {
  MATCH_LOG_MAX,
  MATCH_LOG_PINNED_MAX,
  MATCH_LOG_SOFT_BYTES,
  MATCH_LOG_VERSION,
  appendEntry,
  emptyMatchLog,
  loadMatchLog,
  migrateMatchLog,
  saveMatchLog,
  setPinned,
  type MatchLogEntry,
} from '../../assets/scripts/data/match-log';
import { STORAGE_KEYS } from '../../assets/scripts/data/storage-keys';
import { memoryStorage } from '../../assets/scripts/runtime/storage-adapter';

function entry(id: string, padEvents = 0): MatchLogEntry {
  return {
    version: 1,
    logId: id,
    startedAt: 0,
    finishedAt: 1,
    seed: 7,
    resumed: false,
    difficulty: 'hard',
    heroSeat: 0,
    landlord: 0,
    bidMultiplier: 1,
    initialHands: [[], [], []],
    bottom: [],
    events: Array.from({ length: padEvents }, () => ({ type: 'pass' as const, seat: 0 as const })),
    settlement: null,
    pinned: false,
    ai: [],
  };
}

describe('sota2-R4 B1 对局记录纯内核', () => {
  it('① 常量与存储键：版本/容量/键名单一事实源', () => {
    expect(MATCH_LOG_VERSION).toBe(1);
    expect(MATCH_LOG_MAX).toBe(30);
    expect(MATCH_LOG_SOFT_BYTES).toBe(1_500_000);
    expect(MATCH_LOG_PINNED_MAX).toBe(10);
    expect((STORAGE_KEYS as Record<string, string>).matchLog).toBe('doudizhu.matchlog');
  });

  it('② 环形淘汰：超过 MATCH_LOG_MAX 淘汰最旧，保序 FIFO', () => {
    let state = emptyMatchLog();
    for (let index = 0; index < MATCH_LOG_MAX + 3; index += 1) {
      state = appendEntry(state, entry(`g${index}`));
    }
    expect(state.entries).toHaveLength(MATCH_LOG_MAX);
    expect(state.entries[0]!.logId).toBe('g3');
    expect(state.entries.at(-1)!.logId).toBe(`g${MATCH_LOG_MAX + 2}`);
  });

  it('③ 字节软上限：总序列化体积超 MATCH_LOG_SOFT_BYTES 时淘汰最旧非钉住直至达标', () => {
    let state = emptyMatchLog();
    for (let index = 0; index < 15; index += 1) {
      state = appendEntry(state, entry(`big${index}`, 6000)); // 每条 ≈ 12 万字节
    }
    expect(JSON.stringify(state).length).toBeLessThanOrEqual(MATCH_LOG_SOFT_BYTES);
    expect(state.entries.length).toBeLessThan(15);
    expect(state.entries.at(-1)!.logId).toBe('big14'); // 新条目必留
  });

  it('④ 钉住免淘汰：pinned 条目穿越环形存活；钉住数超 MATCH_LOG_PINNED_MAX 时最旧钉住降级', () => {
    let state = emptyMatchLog();
    state = appendEntry(state, entry('keep'));
    state = setPinned(state, 'keep', true);
    for (let index = 0; index < MATCH_LOG_MAX + 5; index += 1) {
      state = appendEntry(state, entry(`n${index}`));
    }
    expect(state.entries.some((item) => item.logId === 'keep' && item.pinned)).toBe(true);

    let pinnedFull = emptyMatchLog();
    for (let index = 0; index < MATCH_LOG_PINNED_MAX + 1; index += 1) {
      pinnedFull = appendEntry(pinnedFull, entry(`p${index}`));
      pinnedFull = setPinned(pinnedFull, `p${index}`, true);
    }
    expect(pinnedFull.entries.filter((item) => item.pinned)).toHaveLength(MATCH_LOG_PINNED_MAX);
  });

  it('⑤ 容错迁移与存取回环：坏数据回空不抛；save→load 逐位一致', () => {
    expect(migrateMatchLog('junk').entries).toHaveLength(0);
    expect(migrateMatchLog({ version: 99, entries: 'x' }).entries).toHaveLength(0);
    const storage = memoryStorage();
    let state = emptyMatchLog();
    state = appendEntry(state, entry('roundtrip'));
    expect(saveMatchLog(storage, state)).toBe('stored');
    expect(loadMatchLog(storage).entries[0]!.logId).toBe('roundtrip');
  });

  it('⑥ 配额降级：setItem 抛错 → 淘汰最旧非钉住重试一次；仍失败返回 dropped 不上抛', () => {
    let failures = 1;
    const flaky = {
      getItem: () => null,
      setItem: () => {
        if (failures > 0) {
          failures -= 1;
          throw new Error('QuotaExceededError');
        }
      },
      removeItem: () => {},
    };
    let state = emptyMatchLog();
    state = appendEntry(state, entry('a'));
    state = appendEntry(state, entry('b'));
    expect(saveMatchLog(flaky, state)).toBe('stored'); // 淘汰重试后成功

    const dead = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };
    expect(() => saveMatchLog(dead, state)).not.toThrow();
    expect(saveMatchLog(dead, state)).toBe('dropped');
  });
});
