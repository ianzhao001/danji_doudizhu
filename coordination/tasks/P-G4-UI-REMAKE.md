# P-G4-UI-REMAKE — 游戏内 UI 重造接线

- 状态：todo（等待 `ART-IMPORT-GAME-REMAKE` 与 `T-LAYOUT3`）
- 类型：Cocos 运行时 UI 接线
- 文件域（只允许改这些）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `assets/scripts/ui/components/game-scene/*.ts`
  - `coordination/reports/P-G4-UI-REMAKE.report.md`
- 依赖：ART-IMPORT-GAME-REMAKE ✅；T-LAYOUT3 ✅
- 分支建议：`task/P-G4-UI-REMAKE`

## 行为要求

- 消费 `TableZones` v13 新 zone 与新增 body avatar 资源键。
- 玩家手牌改为底部横向大牌区；保持现有选牌、提示、出牌、不要逻辑不变。
- 叫抢/出牌按钮居中悬在牌桌上；只使用现有功能按钮，不新增截图里的新功能。
- 三名角色围绕牌桌渲染，名字牌提高对比度并避开手牌/按钮/出牌区。
- 结算改为“暗幕牌桌 + 居中胜负大字 + 三家分数/余牌 + 再来一局/返回大厅”；保持 T-FIX-SETTLE 口径：面板外暗幕牌桌可见，面板/展示区内无底层 HUD 浮入。
- 不改大厅、规则、AI、存档、流程。

## 验收

- `npm --prefix test test`、`npm --prefix test run typecheck`、`git diff --check` 全绿。
- Cocos web-mobile 构建可生成产物；若 CLI 仍退出 36，日志需包含 `build Task (web-mobile) Finished`。
- GUI 截图证据：844×390、812×375、915×412、780×360 的叫抢、出牌、玩家选牌、AI 出牌、结算、再来一局回归；`productErrors=[]`。
- 用户主观终审：pink 风格一致性、布局、名字牌对比度、手牌可读性、按钮易点性、结算观感。
