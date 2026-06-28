# M3-36 390×844 竖屏适配回归（Canvas/Widget/安全区）

- 状态：blocked（待 M3-32~35；同 `task/M3-interaction` 串行 #5·收尾）
- 派发模式：编辑器执行者（非 worktree·Cocos Creator）
- 执行分支：`task/M3-interaction`
- 文件域：`assets/scene/{lobby,game}.scene`（Canvas/Widget/安全区设置）、`assets/scripts/ui/components/*`（如需按屏宽算 layoutOpts）、`.meta`
- 依赖：M3-30/31（场景）、M3-32~35（交互层）

## 目标
保证大厅与游戏场景在参考分辨率 **390×844** 及常见竖屏机型（更高/更矮、刘海安全区）下布局正确、关键交互区不被裁切。手牌区固定底部为最高优先级交互区。

## 行为要求
1. Canvas `ResolutionPolicy`：竖屏 fit-width（设计 390×844）；根节点 Widget 对齐四边/安全区。
2. 关键区锚定：手牌区贴底、操作按钮紧贴手牌上方、两 AI 座上半屏左右、出牌区居中、底牌/倍数顶部（对齐 GAME_DESIGN 竖屏原则）。
3. `layoutOpts.containerWidth` 按实际屏宽传入 `deriveScreenVM`（非写死 390），手牌步距/压缩随宽自适应（`hand-layout` 已支持压缩）。
4. 安全区：顶部刘海/底部 home 指示条用 SafeArea 组件或 Widget 内缩，关键按钮不入安全区。

## 验收
- 三档比例各出 **390×844 截图**：参考(390×844)、更高(如 412×915)、更矮(如 360×780)——大厅 + 游戏各一组；关键区无裁切、无重叠、手牌可读。
- 既有测试/typecheck 不受影响。
- 报告记录实测机型比例与已知偏差（留 M6-03 性能/多机型回归）。
