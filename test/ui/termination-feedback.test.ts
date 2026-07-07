/**
 * T-TERM-FEEDBACK 失败测试（规划者种入·不可改）：runtime 异常终止 UI 反馈——
 * 钉纯岛 `deriveTerminationFeedback` 的正向清单判定 + toast-queue 复用目标。
 *
 * 契约见 coordination/tasks/T-TERM-FEEDBACK.md（2026-07-07 规划者种子期修订：+纯岛 +暂停接线骑士）。
 * 规则钉死：
 *   新纯岛 `ui/termination-feedback-view.ts`（禁 import 'cc'）export
 *     `deriveTerminationFeedback(args: { phase: string; reason: RuntimeTerminationReason | null;
 *        alreadyNotified: boolean }): { text: string } | null`——
 *     仅当 `phase==='disposed'` 且 `reason` ∈ {'redealExhausted','error'} 且未通知过时返回文案；
 *     redealExhausted→'重发次数耗尽，本局已终止'·error→'对局发生内部错误，已终止'；
 *     settled / null（玩家主动退出 dispose）/非 disposed 相/已通知 → 一律 null。
 *   判定必须是正向清单 `reason ∈ {'redealExhausted','error'}`，**不得写 `!== 'settled'`**：
 *     玩家主动退出（返回大厅 dispose）时 terminationReason() 为 null，宽松写法会在每次正常退局弹"异常终止"。
 *   skeleton 接线（update 轮询 → pushToast + 去重 flag + 返回大厅/重开按钮；暂停接线骑士 openPauseMenu→pause/
 *     退出暂停→resume/返回大厅·重开走 dispose·startGame 不调 resume）由审查者逐行核 + CDP 行为证据 +
 *     双层视觉预审兜底——cc 组件不可入 vitest，故种子经动态 import 钉纯岛本体；toast-queue 复用目标为绿锚。
 * 今日红因：ui/termination-feedback-view.ts 不存在 → 案例①②③④动态 import 失败；案例⑤为 toast-queue 既有语义绿锚。
 * pause-wiring 无 vitest 种子（接线是 cc 组件内一行调用·无纯缝·同 T-RESUME-REPLAY 先例）——改由 CDP 行为证据验收。
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
