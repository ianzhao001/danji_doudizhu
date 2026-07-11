/**
 * 验证 runtime 异常终止反馈的纯逻辑判定，以及 toast 队列复用语义。
 */
import { describe, expect, it } from 'vitest';
// 绿锚：toast-queue 既有语义钉死复用目标（静态 import · 已存在）
import { emptyToasts, pushToast, tickToasts } from '../../assets/scripts/ui/toast-queue';
// RuntimeTerminationReason 定义在 flow/round-runtime.ts（flow 桶不导出 round-runtime·纯 type 直引）
import type { RuntimeTerminationReason } from '../../assets/scripts/flow/round-runtime';

type FeedbackArgs = { phase: string; reason: RuntimeTerminationReason | null; alreadyNotified: boolean };
type FeedbackResult = { text: string } | null;

async function loadFeedback(): Promise<(args: FeedbackArgs) => FeedbackResult> {
  const mod = await import('../../assets/scripts/ui/termination-feedback-view');
  return mod.deriveTerminationFeedback;
}

describe('deriveTerminationFeedback — 异常终止正向清单', () => {
  it('redealExhausted → 重发耗尽文案', async () => {
    const fn = await loadFeedback();
    expect(fn({ phase: 'disposed', reason: 'redealExhausted', alreadyNotified: false })).toEqual({
      text: '重发次数耗尽，本局已终止',
    });
  });

  it('error → 内部错误文案', async () => {
    const fn = await loadFeedback();
    expect(fn({ phase: 'disposed', reason: 'error', alreadyNotified: false })).toEqual({
      text: '对局发生内部错误，已终止',
    });
  });

  it('不触发集：settled / null 玩家主动退出 / 非 disposed 相 → 一律 null', async () => {
    const fn = await loadFeedback();
    // settled 走既有结算覆盖层，本任务不碰
    expect(fn({ phase: 'disposed', reason: 'settled', alreadyNotified: false })).toBe(null);
    // 玩家主动退出（返回大厅 dispose）时 terminationReason() 为 null——不得弹"异常终止"
    expect(fn({ phase: 'disposed', reason: null, alreadyNotified: false })).toBe(null);
    // 非 disposed 相（bidding/playing 等运行中）不触发
    expect(fn({ phase: 'bidding', reason: null, alreadyNotified: false })).toBe(null);
    expect(fn({ phase: 'playing', reason: 'redealExhausted', alreadyNotified: false })).toBe(null);
  });

  it('去重：alreadyNotified=true → null（同一终止只反馈一次）', async () => {
    const fn = await loadFeedback();
    expect(fn({ phase: 'disposed', reason: 'redealExhausted', alreadyNotified: true })).toBe(null);
    expect(fn({ phase: 'disposed', reason: 'error', alreadyNotified: true })).toBe(null);
  });
});

describe('toast-queue 既有语义（复用目标绿锚）', () => {
  it('pushToast 上限 3（slice(-MAX)）', () => {
    let q = emptyToasts;
    q = pushToast(q, 'a', 0);
    q = pushToast(q, 'b', 0);
    q = pushToast(q, 'c', 0);
    q = pushToast(q, 'd', 0);
    expect(q.items.map((t) => t.text)).toEqual(['b', 'c', 'd']);
    expect(q.nextId).toBe(4);
  });

  it('tickToasts 过期剔除', () => {
    let q = emptyToasts;
    q = pushToast(q, 'keep', 100, 500); // expiresAt=600
    q = pushToast(q, 'gone', 100, 200); // expiresAt=300
    const ticked = tickToasts(q, 400);
    expect(ticked.items.map((t) => t.text)).toEqual(['keep']);
  });
});
