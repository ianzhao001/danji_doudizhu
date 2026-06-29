# M3-41 历史明细视图模型（消费 M6-L8 · 第十一批·打磨）

- 状态：**ready**（依赖 M6-L8 入 main 后认领）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 纯 spec
- 分支：`task/M3-41-records-detail-view`（`git worktree add ../斗地主.worktrees/M3-41 -b task/M3-41-records-detail-view main`）
- 文件域：`assets/scripts/ui/records-detail-view.ts`（新）、`test/ui/records-detail-view.test.ts`（新）、report
- 依赖：**M6-L8**（`queryRecords`/`RecordQuery`）

## 目标
把过滤后的 `RecordEntry[]` 转成历史明细屏 VM：每行展示对局结果（胜/负、角色、净分±、倍数、炸弹、春天、时间），并暴露当前过滤器标签。

## 接口
```ts
export interface RecordDetailRow { outcomeLabel: string; roleLabel: string; scoreLabel: string; multiplierLabel: string; tags: string[]; }
export interface RecordsDetailView { rows: RecordDetailRow[]; filterLabel: string; empty: boolean; }
export function deriveRecordsDetailView(records: RecordsState, q?: RecordQuery): RecordsDetailView;
```
- 内部调用 `queryRecords(records, q)`，再映射为行；不自行重写筛选逻辑。
- `scoreLabel`：净分带符号（如 `+3`/`-2`）。`tags`：含「春天/反春天/炸弹×N」按需。
- `empty = rows.length===0`；`filterLabel` 概述当前过滤（如「全部·最新」）。
- 纯函数、保序、不可变；零 `cc`。

## 验收
- 测试覆盖：空、含 spring/bomb 行、各过滤组合的 filterLabel、score 符号。
- 全绿、typecheck 净、零 cc、report 落盘。
