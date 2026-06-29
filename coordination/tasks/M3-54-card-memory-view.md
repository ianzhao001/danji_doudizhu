# M3-54 已出牌 HUD 视图模型（消费 M4-31 · 第十二批·打磨）

- 状态：**ready**（依赖 M4-31 入 main 后认领）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M3-54-card-memory-view`（`git worktree add ../斗地主.worktrees/M3-54 -b task/M3-54-card-memory-view main`）
- 文件域：`assets/scripts/ui/card-memory-view.ts`（新）、`test/ui/card-memory-view.test.ts`（新）、report
- 依赖：**M4-31**（`trackPlayed`/`CardMemory`）

## 目标
把 `CardMemory` 转成「已出牌/剩余」HUD 的 VM：按点数从大到小列出每个点数剩余张数 + 是否已出尽。纯函数。

## 接口
```ts
export interface CardMemoryRow { rankLabel: string; remaining: number; exhausted: boolean; }
export interface CardMemoryView { rows: CardMemoryRow[]; }
export function deriveCardMemoryView(memory: CardMemory): CardMemoryView;
```
- 行按点数降序（大王→小王→2→A→…→3）；`rankLabel` 复用既有 RANK_LABEL 口径；`exhausted = remaining===0`。
- 纯函数、确定性、保序、不可变；零 cc。

## 验收
- 测试：行序降序、exhausted 标记、rankLabel 与 RANK_LABEL 一致、remaining 透传。
- 全绿、typecheck 净、零 cc、report 落盘。
