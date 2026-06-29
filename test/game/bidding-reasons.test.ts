/**
 * M6-L4 失败测试：bidding grabbing 阶段缺失 reason 护栏（架构种入·不可改）。
 * 规则见 coordination/tasks/M6-L4-round-runtime-exceptions.md（bidding 部分）。零 `cc` import（game 层）。
 *
 * 补 illegal-action-reasons.test.ts 未覆盖的两条 grabbing 阶段 reason：
 * - grab 队列顺序错误（非队首 grab）→ NOT_TURN（bidding.ts:105）
 * - 状态机内部不变量 caller===null 但处于 grabbing → CALLER_MISSING（bidding.ts:104，护栏锁死）
 *   （CALLER_MISSING 是不可达不变量护栏；此处以构造畸形状态断言其仍抛，锁死契约。）
 *
 * 注：这两条 reason 代码已抛，本测试为绿护栏锁死，防回归。若实现方在 L4 重构 bidding，
 *   必须保持这两条 reason 文本与抛出点不变。
 */
import { describe, expect, it } from 'vitest';
import { IllegalActionError } from '../../assets/scripts/game';
import { applyBid, createBidding, type BiddingState } from '../../assets/scripts/game/bidding';

function expectReason(fn: () => unknown, reason: string): void {
  try {
    fn();
    throw new Error('expected IllegalActionError');
  } catch (error) {
    expect(error).toBeInstanceOf(IllegalActionError);
    expect((error as IllegalActionError).reason).toBe(reason);
  }
}

describe('M6-L4 bidding grabbing 阶段 reason 护栏', () => {
  it('grabbing 阶段非队首座位 grab → NOT_TURN', () => {
    // seat 0 call → 进入 grabbing，grab 队首为下一个应行动座位
    const grabbing = applyBid(createBidding(0), { type: 'call', seat: 0 });
    expect(grabbing.phase).toBe('grabbing');

    // 找到非队首的座位来 grab。队首是 grabQueue[0]；其余座位 grab 应抛 NOT_TURN。
    const queueHead = grabbing.grabQueue[0];
    const offTurn = ([0, 1, 2] as const).find((s) => s !== queueHead)!;
    expectReason(() => applyBid(grabbing, { type: 'grab', seat: offTurn }), 'NOT_TURN');
  });

  it('CALLER_MISSING 不变量护栏：grabbing 且 caller===null 时 grab → CALLER_MISSING', () => {
    // 构造畸形 grabbing 态（caller 为 null）锁死护栏。正常流转不会产生此态，
    // 但 state 不可变更新若出 bug 可能漏 caller；此测试钉死该路径仍抛 CALLER_MISSING。
    const malformed: BiddingState = {
      ...applyBid(createBidding(0), { type: 'call', seat: 0 }),
      caller: null,
    };
    expectReason(() => applyBid(malformed, { type: 'grab', seat: 1 }), 'CALLER_MISSING');
  });
});
