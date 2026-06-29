# M3-40 扩展战绩视图模型（消费 M6-L7 · 第十一批·打磨）

- 状态：**ready**（依赖 M6-L7 `digestRecords`/`StatsDigest` 入 main；可在 L7 merge 后认领）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 纯 spec
- 分支：`task/M3-40-stats-detail-view`（`git worktree add ../斗地主.worktrees/M3-40 -b task/M3-40-stats-detail-view main`）
- 文件域：`assets/scripts/ui/stats-detail-view.ts`（新）、`test/ui/stats-detail-view.test.ts`（新）、report
- 依赖：**M6-L7**（须先入 main）

## 目标
把 `StatsDigest` 转成扩展战绩屏的纯展示 VM（带中文标签、格式化字符串），不重算逻辑。

## 接口
```ts
export interface StatsDetailRow { label: string; value: string; }
export interface StatsDetailView { rows: StatsDetailRow[]; empty: boolean; }
export function deriveStatsDetailView(digest: StatsDigest): StatsDetailView;
```
- rows 至少含：总局数/胜/负/胜率%/当前连胜(负显示连败)/最高连胜/最佳净分/最差净分/炸弹数/春天数/地主局(胜)/农民局(胜)。
- `empty = digest.total===0`。
- 纯函数、确定性、保序、不可变；零 `cc`。

## 验收
- 测试覆盖：空 digest（empty:true）、典型 digest 各行标签/值。
- 全绿、typecheck 净、零 cc、report 落盘。
