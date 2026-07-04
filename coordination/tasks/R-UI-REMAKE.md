# R-UI-REMAKE — UI-REMAKE 审查检查单（2026-07-05 规划者修订版）

- 通用核验/能力边界/阻塞升级/全量回扫/交接：同 [R-WAVE1.md](R-WAVE1.md) 1-7 条与 PROTOCOL「协作运行模型」；批次作业与 handoff 模板照用。
- 合并 lane：T-LAYOUT3 随到随合；ART-GAME-REMAKE（preview 分支）审后合；ART-IMPORT 在用户图审通过后排队；P-G4 整分支；V3 最后。**均常规任务**（未触共享契约/状态机/rules）双闸即可。

## R:ART-GAME-REMAKE（修订）
- [ ] 文件域仅 `asset-previews/v13-pink-game-remake/` 与报告；**走 task 分支**（不再直落 main）。
- [ ] **文生图出处核验**：正式分项件为 image_gen 产物（报告记生成方式/prompt 摘要）；Pillow 脚本图仅存于布局示意且 PROMPTS.md 已标注——发现 Pillow 直出冒充正式件=打回。
- [ ] 全量清单齐（背景/立绘×3/名牌/按钮四态/结算横幅×2+面板/托架/徽章×2/卡牌件×8）+ 九宫格候选 64/176 两档拉伸模拟。
- [ ] 无第三方 IP/logo；无 加倍/金币/第四座位 等非功能元素进入正式件。
- [ ] 用户图审结论**逐件**记录（通过/打回）；未通过件不得流入 import。

## R:ART-IMPORT-GAME-REMAKE（修订）
- [ ] **全部新文件 `-v13` + asset-keys 纯增 `xxxV13` 键**；同名覆盖=打回；lobby 既有键/文件零改动（diff 机械核）。
- [ ] 逐件 sha256 与 preview 逐字节一致；只含用户图审通过件。
- [ ] `.meta` Creator 生成、`sprite-frame` 类型、九宫格 border 四值>0（btn×4/settlement-panel/nameplate/dock）。
- [ ] 全量 vitest/typecheck 不回归；新键 typecheck 过。

## R:T-LAYOUT3
- [ ] 种子 `test/ui/table-zones-v13.test.ts` 未被改动（16 红→绿）；`TableZones` 纯加法、legacy 6 字段兼容、既有 zones/layout 测试**零改动全绿**。
- [ ] 四横屏新增 zone 落屏不重叠、`tableActionBar` 高度 ≥44px。
- [ ] 纯层无 `cc` import；全量 test/typecheck/diff-check 绿。

## R:P-G4-UI-REMAKE（修订）
- [ ] 文件域仅 game-scene-skeleton + game-scene/* + report；lobby/纯层零触碰。
- [ ] 消费 v13 新键组与 v13 zone；键覆盖清单与 import 报告对照。
- [ ] 相位互斥、per-seat 落点、bottomRevealed、**T-FIX-SETTLE settled 门控**（transient 全隐/面板内无浮入/暗幕牌桌可见）不回归——重点审 diff 与结算截图。
- [ ] 卡面混合渲染架构保持；新模板代码字可读性截图。
- [ ] 四横屏 GUI 证据齐 + `productErrors=[]` + 再来一局/返回大厅回归链。
- [ ] 无新增功能入口；用户主观终审不代下结论（转 V3）。

## R:V3（预置）
- [ ] verify-only：diff 仅 `reports/V3*`；产品码/测试零改动。
- [ ] 固定 seed 四横屏 e2e 全相位截图链（v13 布局）；seed/覆写口记录可复现。
- [ ] v13 皮肤覆盖清单核销；AI 指标表不低于 T-AI-1/T-AI-2 门。
- [ ] `productErrors=[]`；vitest/typecheck 基线与审查者本人复跑一致。
- [ ] PLAYTEST 记录真实；**用户终审项**（整体观感对照方向稿/名字牌对比度/手牌可读性/按钮易点性/结算观感/手感）明确列出待用户，不代判。
- [ ] 合并后披露：V3 done → 转规划者做 **v1.2 版本终局裁定** + 用户终审。

---
验收披露/阻塞升级格式沿用 [R-WAVE1.md](R-WAVE1.md) 尾部模板；交接用 [../templates/handoff.md](../templates/handoff.md)。
