# R-WAVE7 — v1.2 第七波（V5 签收整改）审查任务书

- 适用：ART-PAUSE-BTN / ART-IMPORT-PAUSE-BTN / P-G7-UIFIX3 / V6
- 通用/能力边界/回扫/交接：同 R-WAVE1 + PROTOCOL「双层视觉预审关」。审查者只核结构/证据链，不判美观。
- lane：ART-PAUSE-BTN（preview 分支）审后合；ART-IMPORT-PAUSE-BTN 用户图审后排队；P-G7-UIFIX3 分阶段（①即可·②待 import）末阶段整分支合；V6 最后。均常规任务双闸。

## R:ART-PAUSE-BTN
- [ ] 文件域仅 `asset-previews/v13-pause-buttons/` + report；走 task 分支。
- [ ] image_gen 正式件（非 Pillow 直出）；2 组皮肤（或 6 件）+ 64/176 拉伸模拟证包裹不变形；review-sheet + PROMPTS/sha256。
- [ ] 风格协调 v13；无第三方 IP。用户图审结论逐件记录，未过不入 import。

## R:ART-IMPORT-PAUSE-BTN
- [ ] 全新文件 `pause-btn-*` + asset-keys 纯增键；同名覆盖=打回；lobby/既有键零改动。
- [ ] sha256 与 preview 逐字节一致；`.meta` Creator 生成、sprite-frame、border≥24。
- [ ] 全量 vitest/typecheck 不回归。

## R:P-G7-UIFIX3（结构 + 证据·不判美观·分阶段）
**阶段①**
- [ ] 文件域仅 game-scene-skeleton + game-scene/* + report；**game 层 `nextSeat`/出牌轮转零改动**（#3 是 UI 映射·diff 核 game/ 未触）；test/纯层/lobby/meta/resources 零改动；未重做美术。
- [ ] #3 座位映射翻转**一致**：seatName(1→右家/2→左家) + body/nameplate/思考/last-action + `renderPlayArea` dropZone 落点同步翻转；证据=逆时针出牌链（hero→右→左）截图。
- [ ] #2 出牌区多牌（顺子/飞机）不重叠、牌型标签不压牌、角标不互遮——多档出牌截图。
- [ ] #4 左右家文字/btn 异常修复——前后对比截图。
- [ ] T-FIX-SETTLE/相位互斥/T-LAYOUT4 无重叠/卡面无中心数字不回归；productErrors=[]；vitest/typecheck 不回归（141/739）。
- [ ] **报告含执行者自审勾销表 + 规划者视觉审结论（BOARD）**。
**阶段②**
- [ ] 消费 ART-IMPORT-PAUSE-BTN 新键；暂停 6 btn 背景包裹文字、两组各同色高对比；四横屏暂停面板（menu+confirm）截图；双层视觉预审通过记录。

## R:V6（verify-only）
- [ ] diff 仅 `reports/V6*`；产品码/测试零改动。
- [ ] 固定 seed 四横屏全相位 e2e + V5 四否点逐项复核证据（逆时针出牌/出牌区多牌/左右家/暂停面板）+ productErrors=[]。
- [ ] AI 指标不低于门；PLAYTEST；双层视觉预审记录；**用户审美签收项**明确列出（含 V5 四否点复核），不代判。
- [ ] 合并后披露：V6 done + 用户签收 → 规划者 v1.2 版本终局裁定。

---
格式沿用 R-WAVE1 尾部 + `templates/handoff.md`。
