# R-WAVE9 — v1.3 第九批修复波审查任务书（审查者专用）

- 适用：T-PAUSE-GATE / T-LIVE-MULT / T-RESUME-REPLAY / T-HUD-LIVE / T-TERM-FEEDBACK（+ P-BID-POLISH 扩 spec 的 G2/G3 骑士）
- 通用核验/能力边界/回扫/交接：同 R-WAVE1 1-7 条 + PROTOCOL（批次作业·双层视觉预审关·精确机器态）。审查者不判美观。
- lane：C 波纯层（PAUSE-GATE→LIVE-MULT 串行）与 C 波 UI（RESUME-REPLAY→HUD-LIVE→TERM-FEEDBACK 串行·均改 skeleton 须在 B 波 P-GS-SPLIT2 之前合）共用单 lane 排队；与 B 波双窗并行。

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

## R:T-RESUME-REPLAY（常规·双层视觉预审）
- [ ] 种子未改；3 用例全绿（2 红转绿）。
- [ ] 文件域仅 `game-scene-skeleton.ts` + report；`flow/`/`game/`/`rules/`/`data/save.ts`/`seats-renderer.ts`/`screen-view.ts` 零 diff。
- [ ] recentEvents 从 fullGameEvents 重建（复用 `deriveLastActions`·不重算规则）；底牌保守牌背（不伪造面值·延后说明在案）。
- [ ] 双层视觉预审：恢复后三席最近出牌可见 + 底牌牌背·四横屏零重叠；执行者自审表 + 规划者视觉审结论在案。
- [ ] 全量零回归。

## R:T-HUD-LIVE（常规·双层视觉预审）
- [ ] 种子未改；4 用例全绿（2 红转绿）。
- [ ] 文件域仅 `screen-view.ts` + `game-scene-skeleton.ts`（顶栏渲染）+ report；`game/`/`rules/`/`flow/`/`seats-renderer.ts`/`result-overlay-renderer.ts`/`table-zones.ts` 零 diff。
- [ ] VM 取数分相（bidding=bidding.multiplier/playing=snapshot.bidMultiplier+bombsPlayed/settled=settlement）；顶栏不重算结算公式；新增 bombs label 不破坏 T-LAYOUT4。
- [ ] 双层视觉预审：四横屏×三相顶栏截图·零重叠·包裹·对比度；执行者自审表 + 规划者视觉审结论在案。
- [ ] 全量零回归。

## R:T-TERM-FEEDBACK（常规·双层视觉预审）
- [ ] 种子未改；4 用例全绿（2 红转绿）。
- [ ] 文件域仅 `game-scene-skeleton.ts` + report；`flow/`/`game/`/`rules/`/`result-overlay-renderer.ts`/`pause-menu.ts` 零 diff。
- [ ] 轮询 `phase()==='disposed' && terminationReason()!=='settled'`；复用既有 toast/overlay·不新建场景/组件/资源；去重一次；settled 不触发。
- [ ] 双层视觉预审：异常终止反馈截图·零重叠·按钮包裹·对比度；执行者自审表 + 规划者视觉审结论在案。
- [ ] 全量零回归。

## P-BID-POLISH 扩 spec 骑士（G2 叫抢建议接线 + G3 阈值对齐）
- [ ] `ai/bidding-advisor.ts` `adviseBid` 加 `level: AiLevel` 参数·按 `thresholdFor(level)` 取阈值（不再硬编码 2）；规划者重种 `test/ai/bidding-advisor.test.ts`（原锁死阈值 2 的断言改为按档断言）。
- [ ] 叫抢建议面板接线（`bidding-advice-view` 消费 `adviseBid`·低打扰·与既有 P-BID-POLISH spec 合并）。
- [ ] G4 出牌建议**保持默认关**（`advisorEnabled=false` 不改·红线）。
- [ ] 审查按既有 R:P-BID-POLISH + 本骑士补充。

---
验收披露/阻塞升级沿 R-WAVE1 尾部模板；交接用 `templates/handoff.md`。
