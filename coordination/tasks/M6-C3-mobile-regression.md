# M6-C3 移动端回归 + 渲染性能（消费 M6-L3 · 串行于 C2 之后）

- 状态：blocked（待 M6-L3 + M6-C2 入 main；同 `task/M6-editor` 串行 #3，编辑器单写者）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·非 worktree·单写者）
- 执行分支：`task/M6-editor`
- **worktree 路径**：与 C1/C2 同一 `task/M6-editor` 工作树（`../斗地主.worktrees/M6-editor`），串行于 C2 之后；不复用历史残留目录。
- 文件域（**只允许改这些**）：
  - `assets/scene/game.scene`（SafeArea + Widget + Canvas ResolutionPolicy）
  - `assets/scene/lobby.scene`（SafeArea + Widget）
  - `assets/scene/*.meta`（编辑器生成）
  - `assets/scripts/ui/components/game-scene-skeleton.ts`（渲染层硬编码坐标改相对 canvasSize 锚定 + 消费参数化 tableLayout + render clearNode 差分优化）
  - `coordination/reports/M3-36-portrait-adaptation.report.md`（补闭合验收）
  - `docs/QA_CHECKLIST.md`（UI 验收项闭合）
- 依赖：**M6-L3**（参数化 tableLayout 须先入 main）；**M6-C2**（game-scene-skeleton 动效已改，本任务在其后串行避免双写）

## 目标
M3-36 实质只完成 50%（自述报告仍 blocked、4 项截图未落盘）。本任务补齐：SafeArea/Canvas ResolutionPolicy、渲染层去硬编码坐标、render 差分更新降性能开销、6 张多分辨率截图落盘。

## 背景（侦察结论·必读）
- M3-36 已做：`canvasSize()` 读 UITransform、containerWidth 自适应（`game-scene-skeleton.ts:199-207`）。但 report `M3-36-portrait-adaptation.report.md:5` 自述 blocked，4 项截图（390×844 大厅+游戏、412×915、360×780）未闭合。
- **渲染层硬编码坐标**：`game-scene-skeleton` 内 y:382/350/158/62/-132/-180/-232/-286/-336 等硬编码，屏高 780→915 时带间距错乱。本任务改相对 canvasSize 锚定 + 消费 M6-L3 参数化 `tableLayout(w,h)`。
- **render clearNode 全量销毁重建**（`:211,454-459`）：每次 render 销毁所有子节点再重建，开销大。本任务改差分更新（复用节点、仅更新变化的）。

## 行为要求
1. 两场景根节点加 **SafeArea** 组件（应对刘海/状态栏/底部 home indicator）。
2. Canvas 设 **ResolutionPolicy = fit-width**（竖屏宽度铺满、高度适配），lobby/game 两场景一致。
3. `game-scene-skeleton` 渲染层硬编码坐标改**相对 canvasSize 锚定**，并消费 M6-L3 参数化 `tableLayout(containerWidth, containerHeight)` 计算 region（不再写死 390×844 坐标）。
4. `render()` 的 clearNode 改**差分更新**：复用已有节点、仅更新 label/sprite/position 的变化，减少每帧节点销毁重建。
5. 多事件批量去抖：短时间多个 FlowEvent 合并一次 render（可选优化，若 clearNode 差分已够则不强制）。
6. **6 张多分辨率截图**落盘 `coordination/reports/`：390×844 大厅、390×844 游戏、412×915 大厅、412×915 游戏、360×780 大厅、360×780 游戏。更新 `M3-36-portrait-adaptation.report.md` 闭合 4 项验收，状态置 done。
7. 更新 `docs/QA_CHECKLIST.md` UI 验收项。

## 验收
- 6 张截图落盘；390×844/412×915/360×780 三档下核心按钮不遮挡手牌、对手座对称、出牌区居中、playerHand 贴底。
- 渲染层无硬编码 390 坐标（全部相对 canvasSize + 参数化 tableLayout）。
- render 不再全量销毁重建（差分更新）。
- M3-36 report 闭合、状态 done；QA_CHECKLIST UI 项闭合。
- `game-scene-skeleton` 不被测试 import；纯逻辑/typecheck 不受影响。

## 测试命令
`npm --prefix test test`（须全绿——依赖 M6-L3 已转绿的 table-layout-resolutions 测试）
