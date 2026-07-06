# T-RESUME-REPLAY — 断局恢复画面重建（recentEvents + 倍数·底牌留存档升版）

- 状态：ready（2026-07-07 派发·C 波·UI 接线）
- 任务模式：seeded-red（UI 接线·复用纯层·禁重算规则）
- 风险等级：常规（改 `game-scene-skeleton.ts` 单文件 + 种子 UI 测试·非共享契约文件）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`（恢复路径从 `fullGameEvents` 重建 `recentEvents`；顶栏倍数取数改实时源——**见 T-HUD-LIVE**·本任务只做 recentEvents 重建 + 底牌保守显示）
  - `coordination/reports/T-RESUME-REPLAY.report.md`
  - **测试规划者种入不可改**：`test/ui/resume-replay-rebuild.test.ts`
- 依赖：T-LIVE-MULT（需 `GameSnapshot.bidMultiplier` 口子在 snapshot 上·recentEvents 重建是纯 UI 不依赖该口子，但同改 skeleton → **串行**）；**与 B 波 P-GS-SPLIT2 后续同改 skeleton** → 必须在 P-GS-SPLIT2 之前合（否则 skeleton 已拆为 `game-scene/*`，文件域漂移）
- 分支：`task/T-RESUME-REPLAY`（届时自含 T-LIVE-MULT 的 main 建）

## 行为要求（实现到种子绿）

1. **recentEvents 重建**：`game-scene-skeleton.ts` 恢复路径（`startGame` 中 `resume?.events.slice()` 重建 `fullGameEvents` 处·稿称 `:376-377`）**同时**从 `fullGameEvents` 重建 `recentEvents`：取每席**最近一次** `play`/`pass` 事件（按 seat 分组取末次），填入 `recentEvents`，使三席"最近出牌"在恢复后立即显示（而非等新出牌）。**重建逻辑用纯函数** `deriveLastActions(fullGameEvents)`（已存在 `game-scene/seats-renderer.ts:261-262`·复用·不重算规则）。
2. **底牌保守显示**：恢复后 `revealedBottomCards` 为 `null`（存档未存底牌面值·`flow/runtime/event-replay.ts:44-46` 白名单只 deal·`bottomRevealed` 不落档）→ **保持 3 张牌背显示**（保守·不伪造面值）。**本任务不修底牌面值恢复**（用户裁决③：底牌留存档升版，与叫抢存档一次升版）——报告如实记录"底牌面值恢复延后"。
3. **顶栏倍数**：本任务**不**改顶栏取数（归 T-HUD-LIVE）；只确保 recentEvents 重建不破坏顶栏既有显示。
4. **确定性**：重建是纯函数推导，同输入同输出。

## 红线
- 不改 `flow/`（event-replay 白名单不动·底牌不落档是用户裁决）；不改 `game/`/`rules/`；不改 `data/save.ts`（存档 schema 不动）；不改 `game-scene/seats-renderer.ts`（`deriveLastActions` 复用不改）；不改 `screen-view.ts`（顶栏归 T-HUD-LIVE）。
- 不伪造底牌面值（保守牌背 = 如实，不是错误信息）。
- 不 import `cc` 之外的引擎 API（UI 层可 import `cc`）。

## 验收
- 种子 `test/ui/resume-replay-rebuild.test.ts` 全绿（含 2 红转绿）：① 恢复后 `recentEvents` 含三席末次出牌 ② 底牌 `revealedBottomCards` 为 null（保守牌背）③ 既有 `runtime-resume-phases`/`save-resume-e2e` 零回退。
- 既有 UI 测试 + 全量 vitest/typecheck 零回归；报告附重建逻辑 diff + 底牌保守显示说明 + 底牌面值延后记录。
- 审查按 `tasks/R-WAVE9.md` R:T-RESUME-REPLAY（常规·双层视觉预审：恢复后三席最近出牌可见、底牌牌背）。
