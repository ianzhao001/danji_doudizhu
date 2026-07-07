# T-VIEW-SEAT — ai-thinking-view 座位映射对齐逆时针

- 状态：ready（改种已验红：2 红/3 绿 `a89320f`·重建自最新 main `2ceaf2d`·旧基点 `7afd853` 落后 v1.3 全量已弃）
- 任务模式：seeded-red（纯 view·禁 import `cc`）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/ai-thinking-view.ts`（offset 1=右家/下家、offset 2=左家/上家）
  - `coordination/reports/T-VIEW-SEAT.report.md`
  - **测试规划者已改种不可再改**：`test/ui/ai-thinking-view.test.ts`
- 依赖：—
- 分支：`task/T-VIEW-SEAT`（种子在 `a89320f`·重建自最新 main `2ceaf2d`）

## 背景
v1.2 P-G7 逆时针座位映射（seat1=右/seat2=左）后，此纯 view 的 label 仍旧映射——渲染层未消费故零渲染影响（latent），本任务清账使 view 与 `game-scene/seat-display.ts` 语义一致。

## 验收
改种 5 用例全绿；全量 vitest/typecheck 零回归；审查按 R-WAVE8 R:T-VIEW-SEAT（常规）。
