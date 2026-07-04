# R-WAVE3 — v1.2 Wave 3 审查任务书（审查者专用）

- 适用任务：V2（收口验证·verify-only）
- 流程/能力边界/阻塞升级/全量回扫：同 [R-WAVE1.md](R-WAVE1.md) 通用核验 1-7 条；批次作业与交接按 PROTOCOL「协作运行模型」。
- 合并 lane：单任务，随到随合（常规任务：verify-only 不触共享契约，双闸即可）。

## R:V2 检查单
- [ ] **verify-only 红线**：`git diff main..task/V2` 仅 `coordination/reports/V2*`——产品代码/测试**零改动**（发现改动=打回）。
- [ ] 固定 seed e2e：四横屏截图链齐全（叫抢 17 张可见 / 亮底牌翻面 / per-seat 落点 / 结算清场）；报告记 seed 值与覆写口语法；同 seed 复现口径明确。
- [ ] 17 对重叠检查单四分辨率抽查核销；证据为截图（审查者核证据链，不亲验图像）。
- [ ] 皮肤覆盖抽查：按钮三态/九宫格窄宽两档无变形/lobby home+6 子屏/牌桌三相截图齐。
- [ ] AI 指标表与 `[quality]` 原始输出一致，且不低于 T-AI-1/T-AI-2 门（Normal≥0.35 组合率·Hard≥0.50 且 ≥Normal−5pp·压队友 Normal≤0.20/Hard≤0.08·胜率差 Normal−Simple≥+0.05、Hard−Normal≥+0.03、Hard−Simple≥+0.10）。
- [ ] 四档 `productErrors=[]` 证据；vitest/typecheck 基线与审查者本人复跑一致。
- [ ] PLAYTEST 记录真实（步骤/结果/环境）；**待用户主观终审项**已明确列出（不得代替用户下结论）。
- [ ] 合并后验收披露：V2 done = v1.2 收口 → handoff 转规划者做版本终局裁定 + 用户终审。

## R:T-FIX-SETTLE 检查单（scoped-fix·V2-ISSUE-1·2026-07-04 追加）
- [ ] 文件域仅 `game-scene-skeleton.ts` + `ui/components/game-scene/*.ts` + report；纯层/测试零改动。
- [ ] diff 核：settled 相位跳过 statusLine/last-action 渲染（或等效相位门控）+ result overlay 置顶兜底；无布局坐标/文案顺手改。
- [ ] 四横屏结算截图：**面板内无底层药丸/文本**；**暗幕下牌桌仍可见**（口径保留——发现一刀切清场同样打回）。
- [ ] 重开回归证据：再来一局后 statusLine/last-action 在叫抢/出牌相位恢复（连续两局截图链）。
- [ ] `productErrors=[]`；vitest/typecheck 与 main 基线一致（140/711）。
- [ ] 常规任务双闸后直接合并；验收披露 + handoff 回规划者（**v1.2 收口放行条件之一**）。

---
验收披露/阻塞升级格式沿用 [R-WAVE1.md](R-WAVE1.md) 尾部模板；交接用 [../templates/handoff.md](../templates/handoff.md)。
