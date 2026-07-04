# P-G4-UI-REMAKE — 游戏内 UI 重造接线

- 状态：blocked（等 `ART-IMPORT-GAME-REMAKE` 与 `T-LAYOUT3` 落 main）
- 任务模式：editor-evidence
- 类型：Cocos 运行时 UI 接线
- 文件域（只允许改这些）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `assets/scripts/ui/components/game-scene/*.ts`
  - `coordination/reports/P-G4-UI-REMAKE.report.md`
- 依赖：ART-IMPORT-GAME-REMAKE ✅；T-LAYOUT3 ✅
- 分支：`task/P-G4-UI-REMAKE`（自含两依赖的 main 创建）

## 行为要求

- 消费 `TableZones` v13 新 zone 与 **v13 新键组**（`xxxV13`）；lobby 键/文件零触碰。
- 玩家手牌改为底部横向大牌区（`heroHandLarge`）；保持现有选牌、提示、出牌、不要逻辑不变。
- 叫抢/出牌按钮居中悬桌（`tableActionBar`）；**相位互斥不回归**（叫抢期无出牌键组节点）；只用现有功能按钮，不新增功能入口。
- 三名角色立绘围桌（body×3）+ 名字牌 v13（nameplate×3），按 zone 取位（T-LAYOUT3 契约保证不叠手牌/按钮/落点）。
- 卡面维持**混合渲染架构**（`card-template-v13` + 代码绘制点数 + `suit-*-v13` 贴图）；验证新模板上代码字可读性（角标色 vs 模板底色，附放大截图）。
- 结算：暗幕牌桌 + `settlement-banner-v13` 大字 + `settlement-panel-v13`（三家分数/余牌）+ 再来一局/返回大厅；**T-FIX-SETTLE settled 门控与口径不回归**（transient HUD 全隐、面板内无底层浮入、暗幕下牌桌可见）。
- per-seat 三区落点、`bottomRevealed` 亮底牌、叫抢计时等既有流程行为不回归。
- 不改大厅、规则、AI、存档、流程层。

## 验收

- `npm --prefix test test`、`npm --prefix test run typecheck`、`git diff --check` 全绿。
- 四横屏（844×390/812×375/915×412/780×360）×｛叫抢、出牌、玩家选牌、AI 出牌、结算、再来一局回归链、返回大厅｝GUI 截图；`productErrors=[]`。
- Cocos web-mobile 构建可生成产物；若 CLI 退出码 36，日志需含 `build Task (web-mobile) Finished`。
- 报告列 v13 键消费清单（与 import 报告对照全覆盖）。
- 审查按 `tasks/R-UI-REMAKE.md` R:P-G4-UI-REMAKE（修订版）；用户主观终审项转 V3。
