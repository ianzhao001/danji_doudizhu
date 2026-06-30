# M3-56-hud-meters 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：in-review（代码与自动化验证完成；Creator 3.8.8 Preview / 390x844 截图待复核）
- 同步状态：已在任务开始前将 `main` fast-forward 合入 `task/M6-editor`，当前基线为 `46fc70e`。

## 改了哪些文件

- 更新 `assets/scripts/ui/components/game-scene-skeleton.ts`
  - 新增运行时 HUD，不新增脚本组件、scene、prefab 或 `.meta`。
  - 手牌强度：接入 `evaluateHand(hand)` + `deriveStrengthMeter(...)`，渲染强度条、档位文案和百分比。
  - 已出牌/剩牌：组件新增独立 `fullGameEvents: GameEvent[]`，只从 `FlowEvent.round` 累积全量 `GameEvent`，不复用只保留最近 12 条的 `recentEvents`。
  - 断局恢复：从 `restoreRound(...)` 得到的 `resume.events` 初始化 `fullGameEvents`，避免续局后已出牌面板丢历史。
  - 余牌面板：使用 `trackPlayed(fullGameEvents, currentViewerHand)` + `deriveCardMemoryView(...)`，`ownHand` 传当前手牌，避免初始手牌与已出事件双重扣减。
  - 面板支持折叠/展开，默认紧凑显示高价值牌，展开显示全部点数。

## 测试与类型检查输出

```
npm --prefix test test
Test Files  128 passed (128)
Tests       632 passed (632)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
<no output>

纯层 / 指定 UI 纯岛 cc grep
<no output>
```

## Creator 3.8.8 复核状态

- 本机存在 `/Applications/Cocos/Creator/3.8.8/CocosCreator.app`。
- 未在本次命令行流程中完成 Creator Preview / 390x844 截图采集：该 app 的直接 `--help` 入口返回内置 Node help，不是项目级 headless CLI；为避免误拉起 GUI 卡住任务，未伪造 Creator 证据。
- 本次未改 `assets/scene/game.scene`、`.meta`、`package.json`、`settings/`、`profiles/`、`build/`。
- 请审查者用 Cocos Creator 3.8.8 打开 `/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor`，验证：
  - game 场景可编译/预览，Console 零 Error。
  - 390x844 下 HUD 不遮挡手牌、出牌区、操作按钮。
  - 强度条随当前手牌刷新。
  - 剩牌面板使用全量事件，出牌后数字递减；抽查公式：点数剩余 = 54 牌中该点总量 - 当前手牌该点 - 公开已出该点。
  - 展开/收起按钮可用。

## 与 spec 的偏差 / 关键决策

- 选择复用现有 `game-scene-skeleton.ts` 运行时建节点，而不是新增 HUD 组件；这样不需要新增 `.meta` 或手写 scene 绑定，文件域更窄。
- 已出牌事件源明确为 `fullGameEvents`，不是 `recentEvents`。
- `ownHand` 明确传 `snapshot.viewerHand` 当前手牌，符合 M3-56 spec 对 M4-31 `trackPlayed` 语义的要求。
- HUD 默认在玩家有手牌后渲染；叫抢阶段无 viewer hand 时不显示，避免空手强度/余牌面板干扰叫抢。

## 疑问（给架构 / 审查者）

- 请重点审 UI 位置是否需要进一步下沉或拆为独立组件；当前实现控制在单文件内，便于接续 M3-57/M3-63/M3-64。
- Creator Preview 截图与 Console 零 Error 仍需人工复核后再合并。

## 自检（对照验收项）

- [x] 任务书已存在并已执行，未转规划者。
- [x] 分支启动前同步到当前 `main`。
- [x] 接入 `evaluateHand` + `deriveStrengthMeter`。
- [x] 接入 `trackPlayed` + `deriveCardMemoryView`。
- [x] 事件源为全量 `GameEvent[]`，非 sliced `recentEvents`。
- [x] `ownHand` 使用当前手牌，避免双重扣减。
- [x] 可折叠余牌面板。
- [x] 未改测试。
- [x] 未碰 `main`。
- [x] `npm --prefix test test` 全绿。
- [x] `npm --prefix test run typecheck` 无错。
- [x] `git diff --check` 无输出。
- [ ] Creator 3.8.8 Preview / 390x844 截图 / Console 零 Error 待复核。
