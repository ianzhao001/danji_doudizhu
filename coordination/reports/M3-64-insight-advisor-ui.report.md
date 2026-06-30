# M3-64-insight-advisor-ui 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：implemented（待审查）
- 同步状态：任务开始前 `task/M6-editor` 基线为 `a647bbe`（M3-63 已实现、待审查）。

## 改了哪些文件

- 更新 `assets/scripts/ui/components/game-scene-skeleton.ts`
  - 接入 `adviseAction(...)` + `deriveInsightView(...)`，玩家 `playing` 回合按当前手牌与 `snapshot.top?.pattern` 派生建议文案。
  - 新增默认关闭的 advisor 开关：玩家回合显示 `建议关` 小按钮，点击后变为 `建议开` 并显示建议浮条。
  - 关闭 advisor 后不再渲染 `advisor-panel`，依赖现有 render diff 清理节点，无残留。
  - advisor 只做低打扰展示，不自动选择牌、不提交动作、不改变 `nextHint`/原有 `提示` 按钮行为。
  - 不新增脚本组件，不手写 `.meta`、scene 或 prefab。
- 新增验证截图：
  - `coordination/reports/M3-64-advisor-off-390x844.png`
  - `coordination/reports/M3-64-advisor-on-390x844.png`

## 测试与类型检查输出

```
npm --prefix test run typecheck
tsc --noEmit

npm --prefix test test -- ai/insight.test.ts ui/insight-view.test.ts ui/screen-view.test.ts ui/ai-thinking-view.test.ts ui/last-action-view.test.ts
Test Files  5 passed (5)
Tests       25 passed (25)

npm --prefix test test
Test Files  128 passed (128)
Tests       632 passed (632)

git diff --check
<no output>

纯层 / 本次纯 UI 文件 cc grep
<no output>
```

## Creator 3.8.8 复核状态

- 本机使用 `/Applications/Cocos/Creator/3.8.8/CocosCreator.app` 打开 `/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor`。
- 编辑器窗口标题：`game.scene - 斗地主 - Cocos Creator 3.8.8`；预览服务：`http://localhost:7456/`；预览分辨率按 `Apple iPhone 12; 13; 14; 12/13 Pro (390X844)` 复核。
- Cocos 重启后已重新导入脚本，`temp/programming/...game-scene-skeleton...js` 中可检索到 `advisorEnabled`、`建议关`、`renderAdvisor`、`toggleAdvisor`。
- 390x844 运行时截图证据（DPR2 PNG 为 780x1688）：
  - `coordination/reports/M3-64-advisor-off-390x844.png`：默认关闭态，仅显示 `建议关` 开关；无建议浮条。
  - `coordination/reports/M3-64-advisor-on-390x844.png`：开启态显示 `建议开` 与建议文案 `先出小牌，尽量保留炸弹`；浮条位于出牌区与余牌 HUD 之间。
- 运行时行为复核：
  - CDP 驱动新局、完成叫分、等待玩家 `playing` 回合，确认 `phase: "playing"`、`isPlayerTurn: true`。
  - 默认态：`advisorEnabled: false`，节点仅有 `advisor-toggle` / `button-label: "建议关"`。
  - 开启态：`advisorEnabled: true`，节点含 `advisor-panel` / `advisor-label: "先出小牌，尽量保留炸弹"` / `button-label: "建议开"`。
  - 再次关闭：`advisorEnabled: false`，`advisorPanels: []`，证明关闭后无残留。
  - 截图前外部 Preview 页面已 `Page.bringToFront`，`document.visibilityState: "visible"`，`cc.game._paused: false`，并等待连续 RAF，避免截到 paused 旧帧。
- Console / 运行时日志：
  - Chrome DevTools Protocol 监听 `Runtime.exceptionThrown`、`Log.entryAdded(error)`、`Runtime.consoleAPICalled(error/assert)`：本次 M3-64 预览驱动全程 `errors: []`。
  - 编辑器 Console 当前可见日志仅为 Cocos Creator / Builtin pipeline / physics backend 启动信息；未观察到运行时 Error 行。
- 本次未改 `assets/scene/game.scene`、`.meta`、`package.json`、`tsconfig.json`、`cocos.config.json`、`settings/`、`profiles/`、`build/`。

## 与 spec 的偏差 / 关键决策

- 选择复用既有 `game-scene-skeleton.ts` 运行时建节点，不新增组件和 `.meta`，保持编辑器串行文件域最小。
- advisor 默认关闭，且只在玩家 `playing` 回合渲染；非玩家回合、叫抢阶段、结算阶段均不显示。
- 关闭态仍保留小开关，方便玩家在当前回合低成本打开；建议浮条本身完全不显示。
- advisor 与原 `提示` 按钮并存：`提示` 仍只负责选中可出牌，advisor 只展示文字建议。

## 自检（对照验收项）

- [x] 任务书已存在并已执行。
- [x] 接入 `adviseAction(...)`。
- [x] 接入 `deriveInsightView(...)`。
- [x] 玩家回合按当前手牌 + top 渲染建议文案。
- [x] advisor 默认关闭，可开关。
- [x] 关闭后 `advisor-panel` 无残留。
- [x] 不遮挡手牌、`出牌 / 不要 / 提示`、强度条、余牌 HUD。
- [x] 390x844 Preview 开/关截图已落盘。
- [x] Preview / CDP 零 Error；编辑器 Console 未观察到运行时 Error。
- [x] 未改测试。
- [x] 未碰 `main`。
- [x] `npm --prefix test test` 全绿。
- [x] `npm --prefix test run typecheck` 无错。
- [x] `git diff --check` 无输出。
