# M6-C3b 渲染层相对布局 + render 差分优化（拆自 C3·采纳建议#3）

- 状态：blocked（待 M6-L3 已在 main ✓ + M6-C2 入 main + C3a 排期）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 执行分支 `task/M6-editor`（串行于 C3a，避免与 C2/C3a 双写）
- 文件域（**只允许改这些**）：`assets/scripts/ui/components/game-scene-skeleton.ts`、report
- 依赖：M6-L3（参数化 `tableLayout(w,h)` 已在 main ✓）；M6-C2（动效改动已在该组件，串行其后）

## 目标（C3 的「代码」半）
1. `game-scene-skeleton` 渲染层硬编码坐标（y:382/350/158/62/-132/-180/-232/-286/-336 等）改**相对 canvasSize 锚定**，并消费 M6-L3 参数化 `tableLayout(containerWidth, containerHeight)` 算 region（不再写死 390×844）。
2. `render()` 的 `clearNode` 全量销毁重建改**差分更新**：复用节点、仅更新变化的 label/sprite/position。
3. （可选）多 FlowEvent 短时合并一次 render 去抖；clearNode 差分已够则不强制。

## 验收（按编辑器验收模板）
- 渲染层无硬编码 390 坐标（全部相对 canvasSize + 参数化 tableLayout）。
- render 不再全量销毁重建（差分）；Creator 预览三分辨率布局正确（与 C3a 截图一致，不回归）。
- `game-scene-skeleton` 不被测试 import；纯逻辑/typecheck 不受影响。
- report 注明 Creator 版本 + 是否改 scene/meta（应只改 .ts）+ worktree 无本地未提交残留（只提交文件域）。

## 测试命令
`npm --prefix test test`（须全绿；本任务不改纯逻辑测试）
