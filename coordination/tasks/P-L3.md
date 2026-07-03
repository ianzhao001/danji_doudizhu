# P-L3 — lobby 两阶段流水线：真续局 + 布局微调 → 美术接线

- 状态：ready（阶段①可开工；②依赖 ART-IMPORT-UIKIT）
- 类型：编辑器/运行时（单写者流水线，分阶段 commit + 分段提审）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/lobby-scene.ts`
  - `coordination/reports/P-L3.report.md`
- 依赖：T-FLOW-BID ✅ / T-DEDUP ✅（已 main）；阶段②另需 ART-IMPORT-UIKIT
- 分支：`task/P-L3`
- worktree 缺 tsconfig 照例拷贝；CDP 截图由执行者代验取证。

## 阶段①：「继续游戏」真续局 + 布局微调

1. **真续局**：`deriveLobbyView({ savedSlot: null })`（lobby-scene:141 硬编码）改为读真实存档（`STORAGE_KEYS.save` + data 层现有读取函数）：有档 →「继续游戏」可点并恢复该局；无档 → 置灰/隐藏。与「开始新局」行为区分（新局需清旧档语义按现有 data 层约定）。注意 T-FLOW-BID 的逐手存档已让 playing 中每手都有档——续局入口终于有真实价值。
2. 布局微调：home 三栏密度/对齐小修（不改结构）；确认设置/难度读写走 `STORAGE_KEYS`（T-DEDUP 已合，只核验不重做）。
3. 验收：四横屏截图（有档/无档两种 home 态）+ 点「继续游戏」进入 game 且局面恢复（截图佐证手牌/计数一致）+ `productErrors=[]` + vitest/typecheck 不回归。

## 阶段②：美术接线（依赖 ART-IMPORT-UIKIT）

面板皮/按钮三态皮/icon-back/icon-settings/empty-records 空态图接线（对照 P-G3③ 同口径）；toggle 开关态样式统一。
验收：四横屏 × home+6 子屏截图，按钮三态/面板九宫格无变形。

## 红线
不碰 test/**；不碰 game-scene/纯层；`.meta` 不手写。

## 交付物
分支分阶段提交 + 报告；每阶段提审 → 审查者按 `tasks/R-WAVE2.md` 评审。
