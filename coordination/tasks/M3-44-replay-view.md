# M3-44 回放视图模型（消费 M6-L11 · 第十一批·打磨）

- 状态：**ready**（依赖 M6-L11 入 main 后认领）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 纯 spec
- 分支：`task/M3-44-replay-view`（`git worktree add ../斗地主.worktrees/M3-44 -b task/M3-44-replay-view main`）
- 文件域：`assets/scripts/ui/replay-view.ts`（新）、`test/ui/replay-view.test.ts`（新）、report
- 依赖：**M6-L11**（`buildTricks`/`ReplayTrick`）

## 目标
把 `ReplayTrick[]` + 当前墩索引转成回放屏 VM（当前墩文案 + 上一墩/下一墩可用性 + 进度）。纯函数。

## 接口
```ts
export interface ReplayView { trickLabel: string; plays: string[]; hasPrev: boolean; hasNext: boolean; progressLabel: string; }
export function deriveReplayView(tricks: ReplayTrick[], index: number): ReplayView;
```
- `index` 钳制到 `[0, tricks.length-1]`；空 tricks → 安全空 VM（plays 空、hasPrev/hasNext=false、progressLabel `0/0`）。
- `plays`：当前墩每手的中文短描述（座位 + 动作）。`progressLabel` 形如 `2/5`。
- 纯函数、确定性、不可变；零 `cc`。

## 验收
- 测试：首墩 hasPrev=false、末墩 hasNext=false、中间双向可用、index 越界钳制、空 tricks。
- 全绿、typecheck 净、零 cc、report 落盘。
