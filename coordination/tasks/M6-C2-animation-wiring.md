# M6-C2 基础动画接线（消费 M6-L2 animation-params · 串行于 C1 之后）

- 状态：blocked（待 M6-L2 + M6-C1 入 main；同 `task/M6-editor` 串行 #2，编辑器单写者）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·非 worktree·单写者）
- 执行分支：`task/M6-editor`
- **worktree 路径**：与 C1 同一 `task/M6-editor` 工作树（`../斗地主.worktrees/M6-editor`），串行于 C1 之后；不复用历史残留目录。
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`（playEffect/addCard/renderHand/renderResult 改调 animation-params + 修双重 lift）
  - `assets/scene/game.scene`（出牌区/动效节点编排）
  - `assets/scene/game.scene.meta`（编辑器生成）
- 依赖：**M6-L2**（animation-params 纯函数须先入 main）；**M6-C1**（playCue 已改调 audio-gate，本任务在其后串行避免 game-scene-skeleton 双写）

## 目标
补完 M3-35 未做的 card 级/弹窗级动效：deal 逐张飞入、play 出牌区牌面入场、bomb/rocket 出牌区局部强调、win/lose 结算弹窗入场、pass/settled 分支；修 addCard 双重 lift 不一致。让动效粒度从「整屏 pulse」细化到「出牌区/单牌/弹窗」。

## 背景（侦察结论·必读）
- 现有动效只有 `playEffect` 整屏 scale pulse（`game-scene-skeleton.ts:429-436`），仅 deal/play/bomb/rocket 四 cue，作用对象 `this.uiRoot`（整个 UI 根），粒度粗。
- **addCard:334 双重 lift 不一致**：`node.setPosition(x, y + (selected ? 4 : 0), 0)` 硬编码 +4，但 `renderHand` 已用 VM 的 `slot.y`（`layoutHandInteractive` 算出选中 `-liftOffset`=-18）。选中时双重叠加（18+4=22px）且数值不一致。本任务改用 VM 的 `slot.y` 做选中位移，对 lift 做 tween（非跳变）。
- 出牌区 `renderPlayArea`（:235-238）只放一个文本 Label，不渲染实际牌面、无飞入。
- 结算弹窗 `renderResult`（:272-285）直接 setPosition 无入场动画。

## 行为要求
1. `playEffect(cue)` 参数改喂 M6-L2 的 `pulseParams(cue)`（scaleUp/upMs/downMs）；非动效 cue（pass/win/settled/landlordDecided/redeal/bid/reset）返回 null 则不动效。
2. **tween 作用对象收窄**：bomb/rocket 的强调从 `this.uiRoot`（整屏）改到**出牌区节点**（局部 scale + 短促 shake），不再整屏抖。
3. **deal 逐张飞入**：addCard 创建牌节点后，用 M6-L2 的 `dealCardDelay(index, total)` 做逐张延迟淡入/位移 tween（从下方/淡入到 slot 位），不再直接 setPosition 跳变。
4. **play 出牌飞入**：出牌区渲染实际牌面（非纯文本），用 M6-L2 的 `playFlyFromTo()` 做从下方飞入到 playArea 槽位的 tween。
5. **结算弹窗入场**：renderResult 用 scale-in/淡入 tween（受 settings.animation 门控）。
6. **修 addCard 双重 lift**：选中位移改用 VM `slot.y`，对 lift 做 tween（向上/向下），去硬编码 +4。
7. 动效时长短（≤300ms，与 M6-L2 上界一致），不阻塞交互；受 `settings.animation` 门控（关则无动效）。

## 验收
- deal 逐张飞入、play 出牌飞入、bomb/rocket 出牌区局部强调、结算弹窗入场、pass/settled 分支均有动效（animation 开时）；关 animation 无动效。
- 选中上浮用 VM 坐标 tween，无双重视觉错位。
- 动效对象是出牌区/单牌/弹窗，不再整屏 pulse。
- `game-scene-skeleton` 不被测试 import；纯逻辑/typecheck 不受影响。
- **390×844 截图**：炸弹强调动效一帧（出牌区局部，非整屏）。

## 测试命令
`npm --prefix test test`（须全绿——依赖 M6-L2 已转绿的 animation-params 测试）
