# R-WAVE5 — v1.2 第五波 UI-FIX 审查任务书（审查者专用）

- 适用任务：T-LAYOUT4 / P-G5-UIFIX / V4
- 通用核验/能力边界/阻塞升级/全量回扫/交接：同 [R-WAVE1.md](R-WAVE1.md) 1-7 条 + PROTOCOL「协作运行模型」「双层视觉预审关」。
- **能力边界重申**：审查者(GLM)**不判美观、不亲验图像**——只核结构/契约/证据链/可复现。视觉达标由「执行者自审 + 规划者视觉审」双层担保（见报告自审勾销表 + R 内规划者视觉审栏）；用户做最终审美签收。
- lane：T-LAYOUT4 随到随合；P-G5-UIFIX 末段整分支合（**前置双层视觉预审通过**）；V4 最后。均常规任务双闸。

## R:T-LAYOUT4 检查单
- [ ] 种子 `test/ui/table-zones-v13.test.ts` 未被改动（`git diff main..task/T-LAYOUT4 -- test/` 应只含规划者种子提交）；新增 T-LAYOUT4 三 it 全绿。
- [ ] 名字牌 vs 宿主 body `rectGap ≥ 8`（三对）；名字牌 vs heroHandLarge/tableActionBar `≥ 0`；HUD（强度/剩牌/建议）vs 对家 body `≥ 8`。
- [ ] **零改动全绿**：既有 T-LAYOUT3 的 16 断言 + T-LAYOUT2 `table-zones.test.ts`（含语义：strength 左于 actionBar / memory 左半 / advisor 右半）；legacy 6 字段深相等。
- [ ] 纯层无 `cc` import；全量 vitest/typecheck/diff-check 绿。
- [ ] 报告四横屏 rectGap 表证明非重叠。

## R:P-G5-UIFIX 检查单（结构 + 证据·不判美观）
- [ ] 文件域仅 game-scene-skeleton + game-scene/* + report；test/纯层/lobby/scene/meta 零改动；**未重做美术**（无 `assets/resources` 改动）。
- [ ] diff 逐条对应 spec 8 项：卡面中心数字删(890)、按钮盒高≥60+标签包裹+对比、底牌幂等(消闪烁·签名/保活)、HUD 消费 T-LAYOUT4 新区、名字牌分离渲染、结算横幅/标题不切叠+暗幕加深、叫抢字底衬、顶部信息条松绑。
- [ ] **T-FIX-SETTLE settled 门控不回归**（`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES`/`showTransientHud`/相位判断/`event.type===settled` 仍在·结算 transient 全隐·面板内无浮入）；相位互斥（叫抢期无出牌键组节点）、per-seat 落点不回归。
- [ ] **报告含执行者视觉自审勾销表**（四类硬伤逐横屏勾销）+ **规划者视觉审结论**（达标放行的 sha/结论）——二者缺一不合并（这是本波防翻车的核心闸）。
- [ ] 四横屏 CDP 截图链齐（叫抢/出牌/选牌/AI出牌/结算/再来一局/返回大厅）+ `productErrors=[]`；vitest/typecheck 不回归（141/727）；构建产物或 `build ... Finished` 日志。

## R:V4 检查单（verify-only）
- [ ] diff 仅 `reports/V4*`；产品码/测试零改动。
- [ ] 固定 seed 四横屏全相位 e2e 截图链（v13 整改后布局）+ seed/覆写口可复现；`productErrors=[]`。
- [ ] 双层视觉预审通过记录在案（执行者自审表 + 规划者视觉审结论）；AI 指标不低于 T-AI-1/T-AI-2 门。
- [ ] PLAYTEST 记录真实；**用户审美签收项**明确列出待用户（整体观感对照方向稿/名字牌/手牌/按钮/结算/手感），不代判。
- [ ] 合并后披露：V4 done + 用户审美签收 → 转规划者做 **v1.2 版本终局裁定**。

---
验收披露/阻塞升级格式沿用 [R-WAVE1.md](R-WAVE1.md) 尾部模板；交接用 [../templates/handoff.md](../templates/handoff.md)。
