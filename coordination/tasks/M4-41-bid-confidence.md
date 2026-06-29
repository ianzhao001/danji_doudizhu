# M4-41 叫抢置信度（基于 M4-30 手牌强度 · 第十三批·AI 纵深）

- 状态：**blocked: 待 M4-30 merge**
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M4-41-bid-confidence`（M4-30 入 main 后建）
- 文件域：`assets/scripts/ai/bid-confidence.ts`（新）、`test/ai/bid-confidence.test.ts`（新）、report
- **不改** `ai/bidding*.ts`/`ai/bidding-advisor.ts`（additive·比 boolean 更细的 0..100 置信度）

## 目标
M6-L10 `adviseBid` 给的是 call/grab/pass（基于 boolean `isStrongHand`）。本任务用 M4-30 `evaluateHand` 给一个 0..100 叫抢置信度 + 档位，供 UI 更细呈现。纯函数。

## 接口
```ts
export interface BidConfidence { score: number; tier: 'low' | 'mid' | 'high'; recommendCall: boolean; }
export function bidConfidence(hand: Card[]): BidConfidence;
```
- `score = evaluateHand(hand).score`（0..100）；`tier` 按阈值分档；`recommendCall = tier!=='low'`。
- 与 `isStrongHand(hand,2)` 不必逐点一致（连续评分 vs 阈值布尔），但**高置信必为强手**（单调一致性：score 高→recommendCall=true）。
- 纯函数、确定性、不改入参；零 cc。

## 验收
- 测试：弱手 low/不建议、强手 high/建议、档位边界、score 来自 evaluateHand、可复现。
- 全绿、typecheck 净、零 cc、report 落盘。
