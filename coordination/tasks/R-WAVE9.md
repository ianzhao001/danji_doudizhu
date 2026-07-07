# R-WAVE9 — v1.3 第九批修复波审查任务书（审查者专用）

- 适用：T-PAUSE-GATE / T-LIVE-MULT / T-ADVANCE-REENTRY / T-RESUME-REPLAY / T-HUD-LIVE / T-TERM-FEEDBACK / T-LASTACT-LEGIBILITY（+ P-BID-POLISH 扩 spec 的 G2/G3 骑士）
- 通用核验/能力边界/回扫/交接：同 R-WAVE1 1-7 条 + PROTOCOL（批次作业·双层视觉预审关·精确机器态）。审查者不判美观。
- lane：C 波纯层（PAUSE-GATE→LIVE-MULT→ADVANCE-REENTRY 串行）与 C 波 UI（RESUME-REPLAY→HUD-LIVE→TERM-FEEDBACK 串行·均改 skeleton 须在 B 波 P-GS-SPLIT2 之前合；TERM-FEEDBACK 另需 ADVANCE-REENTRY 先 done）共用单 lane 排队；与 B 波双窗并行。

## R:T-PAUSE-GATE（**三闸·高风险 flow 接口**）
- [ ] 种子未改（`git diff main..task -- test/` 仅规划者种子）；4 用例全绿（2 红转绿）。
- [ ] 文件域仅 `flow/round-runtime.ts` + `flow/runtime/bidding-driver.ts` + report；**game/、rules/ 零触碰**；`flow/types.ts`/`driver.ts`/`policies.ts`/`clock.ts`/`event-replay.ts`/`persistence.ts` 零 diff。
- [ ] `RoundRuntime` 接口加 `pause()/resume()/isPaused()` 三方法；既有方法签名一字不动；`submitPlayerAction` 暂停态仍接受（契约·非 bug）。
- [ ] gate 在 `sleepForRuntimeAi` 之后、决策之前检查；in-flight sleep 醒来若 paused 则 return；resume 重启 `scheduleRuntimeAdvance`。
- [ ] disposed 后 pause/resume 幂等；headless `runHeadlessRound` 零影响（driver 测试零回退）。
- [ ] runtime 全家（resume-phases/hardening/diagnostics/exceptions/bidding-visibility/round-runtime/policy-history/driver*）零改动全绿；全量零回归。
- [ ] 置 `approved-pending-planner` 排队 → 规划者结构性把关认可改 `approved` → 合并。

## R:T-LIVE-MULT（**三闸·高风险 game/types 共享契约**）
- [ ] 种子未改；3 用例全绿（2 红转绿）。
- [ ] 文件域仅 `game/types.ts` + `game/core.ts` + `flow/runtime/bidding-driver.ts`（runtimeSnapshot enrich）+ report；**`RoundState` 字段未改**；`settle()`/`FlowEvent`/`PlayPolicy`/`BidPolicy` 零 diff。
- [ ] `GameSnapshot` 加可选 `bidMultiplier?`/`bombsPlayed?`；既有不解构此字段的测试（save-resume-e2e/runtime-resume-phases/quality/difficulty/policies）零回退。
- [ ] 依赖方向：`game` 不 import `flow`（`bidMultiplier` flow-enrich 不反向）；`snapshot()` 签名两参不动。
- [ ] 全量 vitest/typecheck 零回归；报告附三处 diff + 依赖方向自证。
- [ ] 置 `approved-pending-planner` → 规划者认可 → 合并。

## R:T-ADVANCE-REENTRY（**三闸·规划者裁量升级·flow 推进核心**）
- [ ] 种子未改；`runtime-advance-reentry` 全绿（红转绿数以种入为准）。
- [ ] 文件域仅 `flow/runtime/bidding-driver.ts` + `flow/round-runtime.ts` + report；`RoundRuntime` 公共接口零新增方法；`flow/types.ts`/`driver.ts`/`policies.ts`/`clock.ts`/`event-replay.ts`/`persistence.ts` 零 diff；`game/`/`rules/` 零触碰。
- [ ] 防重入单一咽喉：`advanceRuntimeUntilPause` 入口查 `advanceLoopRunning`·置位·**finally 全路径清位**（player-gate/paused/disposed return、maxTurns/异常 terminate、throw 均清）；`scheduleRuntimeAdvance` 不加第二处检查。
- [ ] 语义锚：resume 在旧 sleep 未醒时=新调度被吞、旧循环续跑（恰一循环·不多一次 sleep）；旧循环已退出后 resume=正常重启；**无丢唤醒**（paused 退出必清 flag）。
- [ ] paused/disposed 既有 gate 零改动；submit 路径行为与事件桶语义不变（报告须复述「flag=true 时 submit 不可达」论证）。
- [ ] runtime 全家（runtime-pause/resume-phases/hardening/exceptions/diagnostics/bidding-visibility/round-runtime/policy-history/driver*）零改动全绿；全量+typecheck 零回归。
- [ ] 置 `approved-pending-planner` 排队 → 规划者认可 → 合并。

## R:T-RESUME-REPLAY（常规·双层视觉预审·2026-07-07 规划者种子期修订同步）
- [ ] 种子未改；3 用例全绿（2 红转绿·红因=纯岛模块未建·今日 typecheck 红 1×TS2307 实现后须净）。
- [ ] 文件域仅 **新 `ui/resume-rebuild.ts`（纯岛）** + `game-scene-skeleton.ts` + report；`flow/`/`game/`/`rules/`/`data/save.ts`/`seats-renderer.ts`/`last-action-view.ts`/`screen-view.ts` 零 diff。
- [ ] 纯岛 `rebuildRecentEvents`：round 包装 + `slice(-12)` 镜像 live 截断（skeleton:386）·顺序保持·零非 round 事件（不伪造 deal/bid/bottomRevealed/settled）·**禁 import `cc`**。
- [ ] skeleton 接线逐行核：恢复路径 `this.recentEvents = rebuildRecentEvents(this.fullGameEvents)`（`:376` 附近·紧随 fullGameEvents 重建）；`revealedBottomCards` 保持 null（保守牌背·不伪造面值·延后说明在案）；live 路径（onEvent 累积+cap）零改动。
- [ ] 双层视觉预审：恢复后三席最近出牌可见 + 底牌牌背·四横屏零重叠；执行者自审表 + 规划者视觉审结论在案。
- [ ] 全量零回归（含 `runtime-resume-phases`/`save-resume-e2e`）。

## R:T-HUD-LIVE（常规·双层视觉预审·2026-07-07 规划者种子期口径修订）
- [ ] 种子未改；`topbar-live-multiplier` 全绿（红转绿数以种入为准·「顶栏 label 存在」不在种子——cc 渲染归视觉审+逐行核）。
- [ ] 文件域仅 `screen-view.ts` + `game-scene-skeleton.ts`（顶栏渲染）+ report；`game/`/`rules/`/`flow/`/`seats-renderer.ts`/`result-overlay-renderer.ts`/`table-zones.ts` 零 diff。
- [ ] VM 取数分相 + 优先级 settlement > snapshot > bidding > 缺省：bidding 相 `multiplier>0 ? multiplier : 1`（未叫 0 显示 1·不用 `??`——0 不是 undefined）·bombs 恒 0；playing 相 `snapshot.bidMultiplier ?? 1` + `snapshot.bombsPlayed ?? 0`（旧快照无字段回退 1/0）；settled 相 settlement 值（既有·不回退）。顶栏不重算结算公式、不自行统计事件。
- [ ] skeleton 顶栏渲染逐行核：消费 VM 值·新增 bombs label 不破坏 T-LAYOUT4（相位可见集·零重叠）。
- [ ] 双层视觉预审：四横屏×三相顶栏截图·零重叠·包裹·对比度；执行者自审表 + 规划者视觉审结论在案。
- [ ] 全量零回归（含 `screen-view*`/`view-model-immutability`）。

## R:T-TERM-FEEDBACK（常规·双层视觉预审 + 暂停接线骑士·2026-07-07 规划者种子期口径修订）
- [ ] 种子未改；`termination-feedback` 全绿（4 红转绿 + 2 绿锚·钉纯岛 `deriveTerminationFeedback` + toast-queue 复用目标 pushToast 上限 3/tickToasts 过期）。
- [ ] **前置核验**：T-ADVANCE-REENTRY 已 `done 601e9fe`（flow 防重入先行·否则暂停接线打开双循环窗口）。
- [ ] 文件域仅 **新 `ui/termination-feedback-view.ts`（纯岛·禁 cc）** + `game-scene-skeleton.ts` + report；`flow/`/`game/`/`rules/`/`result-overlay-renderer.ts`/`pause-menu.ts`/`toast-queue.ts` 零 diff。
- [ ] 纯岛判定为**正向清单** `reason ∈ {redealExhausted, error}`（**非 `!== 'settled'`**——玩家主动退出 dispose 时 reason=null 不得弹"异常终止"·种子③钉死）；文案两条固定（重发耗尽/内部错误）；skeleton update 经纯岛决策 → pushToast + 去重 flag + 返回大厅/重开按钮。
- [ ] 暂停接线骑士（**无 vitest 种子·CDP 行为证据 + 逐行核**）：openPauseMenu → `runtime.pause()`；完全退出暂停（`closePauseMenu :892`）→ `runtime.resume()`；返回大厅/重开（`restartFromPause :893` 等）走 dispose/startGame 不调 resume；暂停菜单内子屏切换不重复调；既有 pauseState 视觉冻结（M3-66）零改动。CDP 证据四条：暂停 AI 冻结/继续恢复/退出 disposed 不复活/重复开关幂等。
- [ ] 双层视觉预审：异常终止反馈截图（四横屏）·零重叠·按钮包裹·对比度；执行者自审表 + 规划者视觉审结论在案。
- [ ] 全量零回归（含 runtime-pause/runtime-advance-reentry/toast-queue）。

## R:T-LASTACT-LEGIBILITY（常规·editor-evidence·视觉审②存量转派·2026-07-07 增补）
- [ ] 无种子（无纯逻辑缝）；全量 vitest/typecheck 零回归。
- [ ] 文件域仅 `game-scene/seats-renderer.ts`（`renderLastActions` 及其布点助手）+ report；`last-action-view.ts`/`game-scene-skeleton.ts`/`table-zones.ts` 零 diff。
- [ ] 只动呈现（底衬/颜色/坐标）：`deriveLastActions` 数据链、文案、`'—'` 占位语义零改动。
- [ ] 证据核：四横屏 × live-playing + resumed 两态截图——三席 last-action 可辨读（含右家压亮背景）、hero label 与操作按钮行零重叠；执行者四类硬伤自审表在案；规划者视觉审结论在案（审查者不判美观·只核证据链完整）。
- [ ] 审慎背景：源于 T-RESUME-REPLAY 规划者视觉审第二层两处存量发现（对比不足②·按钮叠压①）·live/resumed 一致故非回归·details 见任务卡。

## P-BID-POLISH 扩 spec 骑士（G2 叫抢建议接线 + G3 阈值对齐）
- [ ] `ai/bidding-advisor.ts` `adviseBid` 加 `level: AiLevel` 参数·按 `thresholdFor(level)` 取阈值（不再硬编码 2）；规划者重种 `test/ai/bidding-advisor.test.ts`（原锁死阈值 2 的断言改为按档断言）。
- [ ] 叫抢建议面板接线（`bidding-advice-view` 消费 `adviseBid`·低打扰·与既有 P-BID-POLISH spec 合并）。
- [ ] G4 出牌建议**保持默认关**（`advisorEnabled=false` 不改·红线）。
- [ ] 审查按既有 R:P-BID-POLISH + 本骑士补充。

---
验收披露/阻塞升级沿 R-WAVE1 尾部模板；交接用 `templates/handoff.md`。
