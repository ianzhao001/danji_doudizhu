# M6-C3a 场景 SafeArea/ResolutionPolicy + 多分辨率截图（拆自 C3·采纳建议#3）

- 状态：blocked（待 M6-C2 入 main；`task/M6-editor` 串行）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 执行分支 `task/M6-editor`
- 文件域（**只允许改这些**）：`assets/scene/game.scene`、`assets/scene/lobby.scene`、`assets/scene/*.meta`（编辑器生成）、`coordination/reports/M3-36-portrait-adaptation.report.md`、`docs/QA_CHECKLIST.md`（UI 项闭合）
- 依赖：M6-C2（避免与 C3b 双写 component·见下排期）

## 目标（C3 的「场景 + 验收」半）
1. 两场景根加 **SafeArea** 组件（刘海/状态栏/home indicator）。
2. Canvas **ResolutionPolicy = fit-width**，lobby/game 一致。
3. **6 张截图**落盘 `coordination/reports/`：390×844 / 412×915 / 360×780 各大厅+游戏。
4. 闭合 `M3-36-portrait-adaptation.report.md`（4 项验收 → done）；更新 `QA_CHECKLIST.md` UI 验收项。

## 验收（按编辑器验收模板·见 BOARD「编辑器任务验收模板」）
- 6 张截图齐全；三档分辨率下核心按钮不遮挡手牌、对手座对称、出牌区居中、playerHand 贴底。
- Creator 编译零报错；纯逻辑/typecheck 不受影响（不改 .ts）。
- report 注明：Creator 版本、各截图路径、改了哪些 scene/meta、worktree 无本地未提交 `package.json/settings/profiles`（只提交文件域）。
