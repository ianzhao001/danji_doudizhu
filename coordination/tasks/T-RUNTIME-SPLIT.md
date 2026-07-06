# T-RUNTIME-SPLIT — round-runtime 职责拆分（move-only）

- 状态：blocked（**串行于 T-MEMORY-REAL 落 main 后**——同文件，避免双写）
- 任务模式：pure-spec（纯逻辑重构·零行为变更）
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/round-runtime.ts`（收敛为编排壳）
  - 新 `assets/scripts/flow/runtime/*.ts`（建议三件：`bidding-driver.ts` 叫抢推进 / `persistence.ts` 逐手存档与 resume / `event-replay.ts` 订阅重放与 cue 序）
  - `coordination/reports/T-RUNTIME-SPLIT.report.md`
- 依赖：T-MEMORY-REAL done
- 分支：`task/T-RUNTIME-SPLIT`（届时自含 T-MEMORY-REAL 的 main 建）

## 行为要求
- **严格 move-only**：函数体原样搬迁、导出面向 round-runtime 内部收敛（新模块不进 `flow/index.ts` 桶——内部实现件）；`RoundRuntime` 公共接口一字不动。
- 既有 `runtime-*.test.ts`/`round-runtime-hardening`/`-diagnostics`/`resume-phases`/`bidding-visibility` **零改动全绿**（这是本任务唯一验收锚——测试即行为快照）。
- `git diff --color-moved=zebra` 呈纯搬移；发现顺手改=打回。

## 验收
- 全量 vitest/typecheck 零回归；`round-runtime.ts` 显著收敛（目标 <200 行编排壳）；报告附 diff --stat 与 color-moved 说明。
- 审查按 R-WAVE8 R:T-RUNTIME-SPLIT（常规·move-only 强化核）。
