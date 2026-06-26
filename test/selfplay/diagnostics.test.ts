/**
 * M2-07-D 失败测试：runner 失败时应消费 HeadlessRoundError 的富诊断。
 * 架构种入，不可改。当前 catch 用空 partial `{}` → 诊断为 undefined/空 → 应先红。
 */
import { describe, it, expect } from 'vitest';
import { runSeeds } from './runner';

describe('M2-07-D selfplay 诊断消费', () => {
  it('runSeeds 失败消息含真实 seed/turns/landlord/lastEvents（非 undefined/空）', async () => {
    let message = '';
    try {
      await runSeeds([42], { maxTurns: 1 });
      message = 'EXPECTED_REJECTION_BUT_RESOLVED';
    } catch (e) {
      message = e instanceof Error ? e.message : String(e);
    }

    expect(message).toContain('seed=42');
    // 富诊断：不应再出现空/未定义占位
    expect(message).not.toContain('turns=undefined');
    expect(message).not.toContain('landlord=undefined');
    expect(message).not.toContain('lastEvents=[]');
  });
});
