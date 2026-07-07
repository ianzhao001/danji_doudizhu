# T-RESUME-REPLAY — 断局恢复画面重建（recentEvents + 倍数·底牌留存档升版）

- 状态：ready（2026-07-07 派发·C 波·UI 接线；**2026-07-07 规划者种子期修订**：重建逻辑收进新纯岛 `ui/resume-rebuild.ts`——skeleton 是 cc 组件不可入 vitest，内联重建无缝可测；原文误记 `deriveLastActions` 在 seats-renderer，实际定义于纯岛 `ui/last-action-view.ts`、seats-renderer:261 只是解包调用点）
- 任务模式：seeded-red（UI 接线·复用纯层·禁重算规则）
- 风险等级：常规（改 `game-scene-skeleton.ts` + 新纯岛 + 种子 UI 测试·非共享契约文件）
- 文件域（**只允许改这些**）：
  - **新** `assets/scripts/ui/resume-rebuild.ts`（纯岛·**禁 import `cc`**·export `rebuildRecentEvents(events: GameEvent[]): FlowEvent[]`——逐个包成 `{ type: 'round', event }` 并 `slice(-12)` 镜像 skeleton live 路径截断 `game-scene-skeleton.ts:386`·顺序保持·不伪造任何非 round 事件；`.meta` 由 Creator 侧补·沿 M6-G19 惯例）
  - `assets/scripts/ui/components/game-scene-skeleton.ts`（恢复路径接线：`this.recentEvents = rebuildRecentEvents(this.fullGameEvents)`；底牌保守显示；顶栏倍数取数改实时源——**见 T-HUD-LIVE**·本任务不碰）
  - `coordination/reports/T-RESUME-REPLAY.report.md`
  - **测试规划者种入不可改**：`test/ui/resume-replay-rebuild.test.ts`
- 依赖：T-LIVE-MULT done `8637f6a`（同改 skeleton → 串行·已满足）；**与 B 波 P-GS-SPLIT2 后续同改 skeleton** → 必须在 P-GS-SPLIT2 之前合（否则 skeleton 已拆为 `game-scene/*`，文件域漂移）
- 分支：`task/T-RESUME-REPLAY`（已建自 main `df8eb03`·种子 `462624b`）

## 行为要求（实现到种子绿）

1. **recentEvents 重建（纯岛 + 接线两段）**：
   - 纯岛 `ui/resume-rebuild.ts` 的 `rebuildRecentEvents(events)`：round 包装 + `slice(-12)`（镜像 live 截断·别多别少）·顺序保持·空入空出。**种子①②钉死**：结构（全 round·末 12 条深等）与消费等价（按 `seats-renderer.ts:261` 同款解包后交 `deriveLastActions`——来自纯岛 `ui/last-action-view.ts`·复用不重算——三席末次动作与全量历史推导一致；无动作席位守 `'—'` 不得无中生有）。
   - skeleton 恢复路径（`startGame` 中 `resume?.events.slice()` 重建 `fullGameEvents` 处·`:376` 附近）接线 `this.recentEvents = rebuildRecentEvents(this.fullGameEvents)`，使三席"最近出牌"恢复后立即显示。**接线正确性由审查者逐行核 + 双层视觉预审截图验收**（cc 组件不可入 vitest）。
2. **底牌保守显示**：恢复后 `revealedBottomCards` 为 `null`（存档未存底牌面值·`flow/runtime/event-replay.ts:44-46` 白名单只 deal·`bottomRevealed` 不落档）→ **保持 3 张牌背显示**（保守·不伪造面值）。**本任务不修底牌面值恢复**（用户裁决③：底牌留存档升版，与叫抢存档一次升版）——报告如实记录"底牌面值恢复延后"。
3. **顶栏倍数**：本任务**不**改顶栏取数（归 T-HUD-LIVE）；只确保 recentEvents 重建不破坏顶栏既有显示。
4. **确定性**：重建是纯函数推导，同输入同输出。

## 红线
- 不改 `flow/`（event-replay 白名单不动·底牌不落档是用户裁决）；不改 `game/`/`rules/`；不改 `data/save.ts`（存档 schema 不动）；不改 `game-scene/seats-renderer.ts`（解包调用点不动）；不改 `ui/last-action-view.ts`（`deriveLastActions` 复用不改·种子③钉其语义）；不改 `screen-view.ts`（顶栏归 T-HUD-LIVE）。
- 新纯岛 `ui/resume-rebuild.ts` **禁 import `cc`**（skeleton 作为 cc 组件可 import `cc`）。
- 不伪造底牌面值（保守牌背 = 如实，不是错误信息）；`rebuildRecentEvents` 不得产出任何非 `round` 事件（不伪造 deal/bid/bottomRevealed/settled）。

## 验收
- 种子 `test/ui/resume-replay-rebuild.test.ts` 全绿（现 **2 红 1 绿**·规划者实跑验证）：① 红·结构（round 包装·顺序·slice(-12)·空入空出）② 红·消费等价 + 不伪造（解包→`deriveLastActions` 三席末次与全量一致·稀疏席位 `'—'`·零非 round）③ 绿锚·`deriveLastActions` 既有语义钉死复用目标。今日 typecheck 红=1×TS2307（纯岛未建·实现后须净）。
- skeleton 接线（恢复路径赋 `recentEvents`·`revealedBottomCards` 保持 null 牌背）由审查者逐行核；恢复后三席最近出牌可见 + 底牌牌背经**双层视觉预审**截图验收。
- 既有 UI 测试 + `runtime-resume-phases`/`save-resume-e2e` + 全量 vitest/typecheck 零回归；报告附重建逻辑 diff + 底牌保守显示说明 + 底牌面值延后记录（用户裁决③）。
- 审查按 `tasks/R-WAVE9.md` R:T-RESUME-REPLAY（常规·双层视觉预审：恢复后三席最近出牌可见、底牌牌背）。
