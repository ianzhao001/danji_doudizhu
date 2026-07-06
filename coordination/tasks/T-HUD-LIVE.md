# T-HUD-LIVE — 顶栏实时倍数/炸弹数 HUD（消费 T-LIVE-MULT 口子）

- 状态：ready（2026-07-07 派发·C 波·UI 接线）
- 任务模式：seeded-red（UI 接线·复用纯层）
- 风险等级：常规（改 `screen-view.ts` + `game-scene-skeleton.ts` 顶栏渲染·非共享契约）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/screen-view.ts`（`topBar.multiplier`/`bombs` 取数改为：playing 相从 `snapshot.bidMultiplier`+`snapshot.bombsPlayed` 取；bidding 相从 `bidding.multiplier` 取；settled 相从 `settlement` 取——三相分别取数）
  - `assets/scripts/ui/components/game-scene-skeleton.ts`（顶栏渲染处·稿称 `:507-510` 消费新 VM 值；若需炸弹数 label 在顶栏显示，加 label——**F1 顶栏 bombs 显示是新增**，原顶栏不画 bombs）
  - `coordination/reports/T-HUD-LIVE.report.md`
  - **测试规划者种入不可改**：`test/ui/topbar-live-multiplier.test.ts`
- 依赖：T-LIVE-MULT（需 `GameSnapshot.bidMultiplier`/`bombsPlayed` 口子）；**与 T-RESUME-REPLAY 同改 skeleton** → 串行（T-RESUME-REPLAY → T-HUD-LIVE，或合并执行·文件域重叠）；**与 B 波 P-GS-SPLIT2 同改 skeleton** → 必须在 P-GS-SPLIT2 之前合
- 分支：`task/T-HUD-LIVE`（届时自含 T-RESUME-REPLAY 的 main 建）

## 行为要求（实现到种子绿）

1. **VM 取数分相**：`screen-view.ts:61-65` 的 `topBar.multiplier`/`bombs` 改为：
   - **bidding 相**：`multiplier = bidding?.multiplier ?? 1`（过程倍数·叫=1/每抢×2）；`bombs = 0`。
   - **playing 相**：`multiplier = snapshot?.bidMultiplier ?? 1`；`bombs = snapshot?.bombsPlayed ?? 0`。
   - **settled 相**：`multiplier = settlement?.multiplier ?? 1`；`bombs = settlement?.bombs ?? 0`（既有·不变）。
   - 三相取数源单一真相·不复用结算公式（`game/settlement.ts:44` 是结算态·不用于 live）。
2. **顶栏渲染**：`game-scene-skeleton.ts:507-510` 消费 VM 值；**新增 bombs label**（顶栏显示"炸弹×N"或并入倍数提示）——具体文案与布局对齐已批准 v1.2 顶栏风格（cream/gold·不破坏 T-LAYOUT4 契约）。
3. **不重算规则**：倍数/炸弹数**只**从纯层口子取（`snapshot.bidMultiplier`/`bombsPlayed`/`bidding.multiplier`/`settlement`），UI 不自行统计事件、不自行算 `2**bombs`。
4. **确定性**：纯取数，同输入同输出。

## 红线
- 不改 `game/`/`rules/`/`flow/`（纯层口子由 T-LIVE-MULT 提供·本任务只消费）；不改 `game-scene/seats-renderer.ts`/`result-overlay-renderer.ts`（结算覆盖层不动）；不改 `table-zones.ts`（顶栏 zone 不动）。
- 顶栏不重算结算公式；不伪造倍数（bidding 相用 bidding.multiplier·不用 1 占位）。
- 不破坏 T-LAYOUT4 顶栏契约（相位可见集·零重叠）。

## 验收
- 种子 `test/ui/topbar-live-multiplier.test.ts` 全绿（含 2 红转绿）：① bidding 叫抢后 multiplier=2 ② playing 出炸弹后 bombs=1 ③ settled 回到 settlement 值 ④ 顶栏 label 存在。
- 既有 `screen-view*`/`topbar*`/`T-LAYOUT4` 相关零回退；全量 vitest/typecheck 零回归。
- 双层视觉预审：四横屏×三相（bidding/playing/settled）顶栏截图·零重叠·文字包裹·对比度。
- 审查按 `tasks/R-WAVE9.md` R:T-HUD-LIVE（常规·双层视觉预审）。
