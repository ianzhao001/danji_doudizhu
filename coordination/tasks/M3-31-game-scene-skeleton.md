# M3-31 游戏主场景骨架（绑定 screen-view，mock 门面占位）

- 状态：blocked（待 M3-29；建议 M3-30 之后，同 `task/M3-editor-integration` 串行）
- 派发模式：**编辑器执行者**（非 worktree·Cocos Creator）
- 执行分支：`task/M3-editor-integration`
- 文件域：
  - Cocos 场景目录（如 `assets/scene/`）：游戏主 `.scene`
  - Cocos 预制体目录（如 `assets/prefab/`）：手牌 / 座位 / 出牌区预制体（如需）
  - `assets/scripts/ui/components/`（新·**Cocos 组件**·绑 screen-view/table-layout/card-view；**任何 Vitest 不得 import**）
  - `.meta` 由编辑器生成
- 依赖：M3-29（资源）；**M5-21 通过接口契约对齐**——门面未并 main 前用本地 **mock 门面**（与 `RoundRuntime` 同形最小子集）+ 静态 fixtures 驱动渲染，门面并 main 后换实现，**组件代码零改**。

## 目标
建游戏主场景骨架：渲染桌面、玩家手牌区、两 AI 座位、当前出牌区、底牌/身份/倍数占位。第一版**只渲染**，不做完整交互（交互在 M3-32~34）。

## 契约对齐（关键）
- 对齐点是 **`deriveScreenVM` 入参**（`ui/screen-view.ts:29-37`）：`{snapshot?, bidding?, heroSeat, selectedCards, recentEvents: FlowEvent[], layoutOpts:{containerWidth,cardWidth,liftOffset}, settlement?}` → 返回 `ScreenVM{layout,hand,actions,bidding?,result?,cues,topBar}`。
- 组件写**薄 adapter**：`runtime → {snapshot,bidding,events,settlement}` 喂 `deriveScreenVM`。门面 `onEvent` 推单个 `FlowEvent`，adapter 累积成 `recentEvents` 数组。
- 门面未并 main 前：mock 门面（同形最小子集：`phase/currentSnapshot/currentBidding/onEvent/settlement/...`，见 `tasks/M5-21-round-runtime-session.md` 的 `RoundRuntime`）+ 静态 fixtures（一手牌、一个叫抢态、一个结算）驱动渲染。

## 验收
- 场景在 Cocos Creator 打开**无报错**，控件可见，资源实际显示（牌面 / 桌面背景 / 头像 / 倍数）。
- **390×844 预览截图**一张。
- 既有测试 / typecheck 不受影响。
