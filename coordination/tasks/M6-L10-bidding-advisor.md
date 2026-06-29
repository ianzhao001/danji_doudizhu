# M6-L10 玩家叫抢建议（第十一批·打磨）

- 状态：**ready**（依赖 `ai/bidding.ts:isStrongHand`、`game` 叫抢类型已在 main）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 纯 spec
- 分支：`task/M6-L10-bidding-advisor`（`git worktree add ../斗地主.worktrees/M6-L10 -b task/M6-L10-bidding-advisor main`）
- 文件域：`assets/scripts/ai/bidding-advisor.ts`（新）、`test/ai/bidding-advisor.test.ts`（新）、report
- **不改** `ai/bidding*.ts`（仅 import `isStrongHand`）

## 目标
给真人玩家在叫/抢地主阶段一个「建议」（叫/抢 or 过），复用 AI 的判强逻辑，单一真相源。纯函数。

## 接口
```ts
export interface BidAdvice { suggestion: 'call' | 'grab' | 'pass'; strong: boolean; }
export function adviseBid(hand: Card[], phase: 'calling' | 'grabbing'): BidAdvice;
```
- `strong = isStrongHand(hand, 2)`（与基线 `chooseBid` 同阈值，对齐单一真相源）。
- `strong===true` → calling 阶段建议 `call`、grabbing 阶段建议 `grab`；否则 `pass`。
- 纯函数、确定性、零 `cc`、不改 hand。

## 验收
- 测试：强手 calling→call、强手 grabbing→grab、弱手→pass；strong 字段与 isStrongHand 一致；同输入可复现。
- 全绿、typecheck 净、零 cc、report 落盘。
