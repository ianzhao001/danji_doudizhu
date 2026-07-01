# P-G game-scene 横屏 + 按压反馈 + 命名/文案

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `coordination/reports/P-G.report.md`
- 依赖：E-0 ✅ / T-A1 ✅ / T-0 ✅ / T-C0 ✅（均已并 main）
- 分支：`task/P-G`
- **单写者流水线**：单分支，**分阶段 commit + 分段送审**（① 横屏落位 → ② 按压反馈 → ③ 命名+文案）。
- **worktree 测试环境**：新 worktree 若报缺 `./temp/cli/tsconfig.cocos.json`，`mkdir -p temp/cli && cp /Users/admin/Documents/Cocos/斗地主/temp/cli/tsconfig.cocos.json temp/cli/`。

## 背景（关联规划书 §6 P-G）

E-0 已把设计分辨率翻 844×390，T-A1 的 `tableLayout` 在横屏产出正确几何，但 game-scene 消费侧仍有一处按竖屏取点、背景是竖图、手牌无按压反馈、部分文案带开发味。本任务把 game 场景横屏成形并打磨交互。

## 行为要求（分阶段）

### 阶段① 横屏落位
1. **`renderSeats`（L357）改消费侧**：当前两对手座从 `rectPoint(layout.playArea, …, 0.06/0.94)`（L363-364）取点 → 改为用 **`layout.opponentLeft` / `layout.opponentRight`**，使两 AI 落屏幕左右上角。
2. **仅复核不重写**：`lastActionPosition`（L~1099）与 `aiThinkingPosition`（L~1109）已用 `opponentLeft/Right`；hero 分支与其余 `layout.playArea` 相关落点（strength/timer/prompt/memory 等）在横屏短高（H≈390）下**复核 y-offset 与不重叠**，仅在溢出/叠压时微调，不做无谓重写。
3. `canvasSize()` 回退默认改 844×390。
4. 复核 `CARD_SIZE(52×74)`/`HAND_LIFT`/HUD（倍数/手牌数/计时/AI思考/insight/剩牌）在横屏不溢出、不叠压；手牌 20 张横向铺满 844 用 `hand-layout` 已有压缩逻辑验证。
5. **运行时纯色/渐变占位背景**：横图 ready 前**不加载竖 `gameTableBg`**（L166），改画纯色/渐变（避免拉伸污染评审）。横图作美术依赖登记后补。

### 阶段② 手牌按压反馈
6. 卡牌保留 `TOUCH_END`（L885-886，`toggleCard`）。新增 `TOUCH_START` 做 `UIOpacity`/`scale` 局部按压视觉、`TOUCH_END`/`TOUCH_CANCEL` 复位；与「选中抬起」区分。
7. **按压反馈约束**：`TOUCH_START` 期间**不得调 `this.render()`**（diff 渲染 `beginRenderDiff→render→endRenderDiff→pruneInactiveChildren` 会重建/重定位卡牌节点，销毁触摸目标）；复位后再走 toggle+render。
8. `TOUCH_START/END/CANCEL` 均 **off-before-on**，防 diff 复用下重复绑定。

### 阶段③ 命名 + 可见文案（消费 P-Text）
9. **可见文案**：严格按 [coordination/tasks/P-Text-copy-list.md](P-Text-copy-list.md) 落地——新增本地 `seatName(seat)`（0=你/1=左家/2=右家，地主后缀 `（地主）`），改 L335 地主标签、L372-373 去「AI」前缀、L426/L427 last-action、L698 结算行。清单「不改」项保持原样。
10. **节点命名规范**：`ensureNode` 创建的运行时节点用清晰稳定语义命名，去掉命名不清/开发味残留（供截图定位与后续复用）。

## 验收（编辑器/运行时·无 vitest 新增）
- `npm --prefix test test`（133/654 基线不回归）+ `npm --prefix test run typecheck` 净；未 import 破坏纯边界。
- **四横屏截图**（844×390 / 812×375 / 915×412 横 / 780×360）：两 AI 在左右上角、出牌区居中、手牌铺底不溢出、HUD 不叠压；CDP `productErrors=[]`（favicon 404 可忽略）。
- **交互证据**：手牌点击有按压反馈且功能不变（选牌/出牌正常、无重复回调）；last-action/HUD/结算无「座位N」「AI 左家」「出牌区\n」等开发味/占位文案。
- 证据落 `coordination/reports/P-G.report.md`（附截图路径 + CDP summary）。

## 交付物
- 分支 `task/P-G` 分阶段提交；报告。
- 获架构 `approved` 后 `claim → merge → release` 自合（与 P-L 共用单 lane，排队）。

## 测试命令
`npm --prefix test test`
