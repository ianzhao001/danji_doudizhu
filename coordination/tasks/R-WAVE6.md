# R-WAVE6 — v1.2 第六波（V4 签收整改）审查任务书

- 适用任务：P-G6-UIFIX2 / V5
- 通用/能力边界/回扫/交接：同 R-WAVE1 + PROTOCOL「双层视觉预审关」。审查者(GLM)只核结构/证据链，不判美观（美观由双层视觉预审担保）。
- lane：P-G6-UIFIX2 末段整分支合（前置双层视觉预审通过）；V5 最后。常规任务双闸。

## R:P-G6-UIFIX2 检查单（结构 + 证据·不判美观）
- [ ] 文件域仅 game-scene-skeleton + game-scene/* + report；test/纯层/lobby/scene/meta/resources 零改动；未重做美术。
- [ ] diff 逐条对应 6 项：人物外移上移(seats)、名字牌角色清晰+不深felt(seats)、出牌区点数可见+手牌数字增大、按钮包裹+对比(addButton)、结算 5 子项(result-overlay：文字重叠/横幅溢出/标题对比/去冗余返回箭头/同层文字色一致)、零重叠。
- [ ] **T-FIX-SETTLE settled 门控不回归**（`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES`/`showTransientHud` 仍在）；相位互斥、per-seat 落点、T-LAYOUT4 无重叠(zone)不回归。
- [ ] **报告含执行者自审勾销表 + 规划者视觉审结论（BOARD）**——缺一不合并（本波 gate 从严：规划者须逐项对照用户 5 否点 + 针对性 zoom）。
- [ ] 四横屏全相位 CDP 截图齐 + `productErrors=[]`；vitest/typecheck 不回归（141/739）；构建产物或 `build ... Finished` 日志。

## R:V5 检查单（verify-only）
- [ ] diff 仅 `reports/V5*`；产品码/测试零改动。
- [ ] 固定 seed 四横屏全相位 e2e 截图链（v13 二轮整改后）+ `productErrors=[]`；seed 可复现。
- [ ] 双层视觉预审通过记录在案；AI 指标不低于 T-AI-1/T-AI-2 门；PLAYTEST 真实。
- [ ] **用户审美签收项**明确列出待用户（含 V4 的 5 否点逐项复核证据），不代判。
- [ ] 合并后披露：V5 done + 用户审美签收 → 转规划者做 v1.2 版本终局裁定。

---
验收披露/阻塞升级/交接格式沿用 R-WAVE1 尾部模板 + `templates/handoff.md`。
