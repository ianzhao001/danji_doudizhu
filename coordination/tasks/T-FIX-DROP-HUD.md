# T-FIX-DROP-HUD — scoped-fix：左家多牌出牌与强度/剩牌 HUD 重叠（V6 阻断残留）

- 状态：ready（V6 执行者自审发现·规划者裁定阻断·2026-07-06）
- 任务模式：editor-evidence（Cocos 3.8.8 + CDP·双层视觉预审前置）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `assets/scripts/ui/components/game-scene/*.ts`（如需 hud-renderer/seats 配合）
  - `coordination/reports/T-FIX-DROP-HUD.report.md`
- 依赖：P-G7-UIFIX3 ✅`5b42a35`
- 分支：`task/T-FIX-DROP-HUD`
- 红线：不碰 test/纯层/lobby/scene/meta/resources/asset-keys；不改 game 层出牌轮转（#3 座位映射保持）；保 settled 门控/相位/T-LAYOUT4 无重叠/卡面无中心数字/暂停面板(P-G7②)/逆时针映射 不回归。

## 缺陷（规划者亲验 zoom 裁定阻断）

逆时针映射后 seat 2 = **左家**，出牌落 `dropZoneLeft`（左侧）；而**强度 `strengthMeter`/剩牌 `memoryDock` HUD 也在左侧**。当左家出 5+ 张（顺子/连对/飞机·分 2 行）时，**下排牌面被「强度 偏弱X%」HUD 药丸覆盖**，牌点数/牌型不可辨——踩用户「元素不可重叠」硬线。
- 证据：`reports/V6-evidence/contact-sheets/V6-zoom-780-left-multi-seat2.png`（强度药丸压 10♥/J♥ 下排）、`V6-contact-multi-cards-seat1-seat2.png`（seat2 四档）。**seat1（右家）无此问题**（右侧 timer/advisor 较疏、右家牌居中偏上）。
- 根因：`renderPlayArea`/`playAreaLayout` 的 side-seat 多行安全区**只避让人物、未避让 strength/memory HUD**（P-G7① 遗漏·规划者视觉审亦未核 HUD×多牌，本次校准）。

## 行为要求

- **左家（及任意家）多牌出牌牌面与强度/剩牌 HUD（及右侧 timer/advisor）视觉不重叠**（rectGap≥8 或明显净空·牌点数/牌型标签全可读）。机制执行者自选（择一或组合）：① 多行牌区上移贴近该家人物/落点、向上扩展不向下侵入 HUD 带；② 进一步缩放使牌区落在 HUD 之上的安全band；③ 侧家出牌时 HUD 让位/临时下沉。**保持 #2 既有达标**（牌间不互压、牌型标签不压牌）。
- 四横屏 × {左家/右家 × 单/对/顺子(8张)/飞机} 出牌截图 + 针对性 zoom（左家多牌×HUD 净空）佐证。

## 验收（双层视觉预审 + 客观门）

- 执行者自审勾销表（含本项：左家多牌×HUD 净空四档）→ 规划者视觉审逐档核（左家 8 张顺子 zoom 必核）。
- 四横屏 productErrors=[]；vitest/typecheck 不回归（141/739）；上述不变量不回归。
- 审查按 `tasks/R-WAVE7.md` R:T-FIX-DROP-HUD。

## 交付物

分支提交 + 报告（自审 + zoom）→ 双层视觉预审 → 审查 approved 合并 → **V6 重跑收口**（executor 重采 e2e 证据）→ 用户签收 = v1.2 终点。
