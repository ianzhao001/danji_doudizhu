# T-TERM-FEEDBACK — runtime 异常终止 UI 反馈（轮询 terminationReason）+ 暂停接线骑士

- 状态：ready（2026-07-07 派发·C 波·UI 接线；2026-07-07 规划者把关扩 spec：+暂停接线骑士·BUG-01 端到端收口）
- 任务模式：seeded-red（UI 接线·复用纯层）
- 风险等级：常规（改 `game-scene-skeleton.ts` 单文件 + 种子 UI 测试）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`（update 循环加 `terminationReason()` 轮询；`'redealExhausted'`/`'error'` 时弹反馈：toast/轻弹窗"对局异常已终止"+「返回大厅」/「重开」按钮——复用既有 toast/overlay 机制·不新建场景；**暂停接线骑士**：`openPauseMenu` → `runtime.pause()`·退出暂停（「继续」/关闭菜单回调）→ `runtime.resume()`·「返回大厅/重开」走既有 dispose 路径**不调 resume**）
  - `coordination/reports/T-TERM-FEEDBACK.report.md`
  - **测试规划者种入不可改**：`test/ui/termination-feedback.test.ts` + `test/ui/pause-wiring.test.ts`（届时同批种）
- 依赖：纯层 `terminationReason()` 已存在 `flow/round-runtime.ts:68,148`·本任务只消费；**T-ADVANCE-REENTRY 须先 done**（flow 防重入先行——接线后用户「暂停→1s 内继续」落在 thinkDelayMs 375–1000ms 窗口内，无防重入即双循环并发）；**与 T-RESUME-REPLAY/T-HUD-LIVE 同改 skeleton** → 串行（三者可同批 sequential·文件域重叠）；**与 B 波 P-GS-SPLIT2 同改 skeleton** → 必须在 P-GS-SPLIT2 之前合
- 分支：`task/T-TERM-FEEDBACK`（届时自含 T-HUD-LIVE 的 main 建）

## 行为要求（实现到种子绿）

1. **轮询挂接**：`game-scene-skeleton.ts` update 循环（既有 `update()`·稿称 `:307-310` 附近·timer 累加点）加：若 `runtime.phase() === 'disposed'` 且 `runtime.terminationReason()` ∈ `{'redealExhausted','error'}`（即非 `'settled'`）且**尚未反馈过**（去重 flag）→ 触发反馈 UI。
2. **反馈 UI**：复用既有 toast/overlay 机制（不新建场景/组件）——显示文案："对局异常终止（重发耗尽/内部错误）"+「返回大厅」+「重开」按钮。**默认低打扰**（toast 而非全屏阻断·与 P-BID-POLISH 面板低打扰一致）；按钮复用既有导航（返回大厅走既有 `returnToLobby`·重开走既有 `startGame`）。
3. **settled 不触发**：`terminationReason()==='settled'` 走既有结算覆盖层（`result-overlay-renderer.ts`）·本任务不碰。
4. **去重**：同一终止只反馈一次（flag·避免 update 每帧重复弹）。
5. **确定性**：纯轮询+条件渲染，同输入同输出。
6. **暂停接线骑士（BUG-01 端到端收口·2026-07-07 规划者扩）**：以**暂停菜单生命周期**为界——`openPauseMenu`（既有 `skeleton:903-906` 附近·现只置 pauseState）追加 `this.runtime?.pause()`；完全退出暂停菜单（「继续」/关闭回调）追加 `this.runtime?.resume()`；暂停菜单内子屏切换（设置等）**不**重复调 pause/resume（幂等由 runtime 保证·但避免噪声调用）；「返回大厅」「重开」走既有 dispose/startGame 路径，**不调 resume**（disposed 后 resume 幂等已由 T-PAUSE-GATE 钉死，但语义上退出即弃局）。既有 pauseState 视觉冻结（M3-66 turn-timer 冻结等）逻辑**不动**，runtime 接线是纯追加。

## 红线
- 不改 `flow/`（`terminationReason`/`terminationDetail` 纯层 API 不动·不加终止事件——选轮询方案）；不改 `game/`/`rules/`；不改 `result-overlay-renderer.ts`（结算覆盖层不动）；不改 `pause-menu.ts`。
- 反馈 UI 复用既有机制·不新建场景/组件/资源。
- 不代用户决定"重开还是返回"·只提供按钮（用户主观选择）。

## 验收
- 种子 `test/ui/termination-feedback.test.ts` 全绿（含 2 红转绿）：① `redealExhausted` 时反馈 UI 出现 ② `error` 时反馈 UI 出现 ③ `settled` 不触发本反馈 ④ 去重（同一终止一次）。
- 种子 `test/ui/pause-wiring.test.ts` 全绿（届时种·预计钉：① openPauseMenu → `runtime.isPaused()===true` ② 退出暂停 → `isPaused()===false` 且推进恢复 ③ 返回大厅走 dispose 且不调 resume ④ 重复开/关无多余调度）。
- 既有 `round-runtime-hardening`/`-exceptions`/`-diagnostics`/`runtime-pause` 零回退；全量 vitest/typecheck 零回归。
- 双层视觉预审：异常终止反馈截图·零重叠·按钮包裹·对比度（暂停接线为逻辑接线·沿既有暂停菜单不新增画面）。
- 审查按 `tasks/R-WAVE9.md` R:T-TERM-FEEDBACK（常规·双层视觉预审 + 暂停接线检查项）。
