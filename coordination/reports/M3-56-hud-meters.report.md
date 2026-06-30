# M3-56-hud-meters 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：in-review（代码、自动化验证、Creator 3.8.8 Preview / 390x844 交互复核完成）
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

- 本机使用 `/Applications/Cocos/Creator/3.8.8/CocosCreator.app` 打开 `/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor`。
- 编辑器窗口标题：`game.scene - 斗地主 - Cocos Creator 3.8.8`；预览服务：`http://localhost:7456/`；设备栏选择 `Apple iPhone 12; 13; 14; 12/13 Pro (390X844)`。
- 390x844 Preview 运行时画布尺寸：页面 `innerWidth=390`、`innerHeight=844`，canvas client `390x796`（上方设备工具栏占约 48px）。
- 截图证据：
  - `coordination/reports/M3-56-hud-compact-390x844.png`
  - `coordination/reports/M3-56-hud-expanded-390x844.png`
  - `coordination/reports/M3-56-hud-post-play-expanded-390x844.png`
- Console / 运行时日志：
  - Cocos Creator 打开场景后可见编译日志为 `[Scene] Cocos Creator v3.8.8`、Builtin pipeline 与 physics backend 切换信息。
  - 外部 Preview 通过 Chrome DevTools Protocol 监听 `Runtime.exceptionThrown`、`Log.entryAdded(error)`、`Runtime.consoleAPICalled(error/assert)`：叫地主、抢地主、展开/收起、选牌、出牌、AI 跟牌流程均为 `errorEvents: []`。
  - 仅观察到浏览器 WebAudio autoplay warning；不影响本任务 HUD 行为。
  - 编辑器 Console 曾出现 Creator 预览通道级历史记录 `Channel closed`；已点击清空并保持 Preview 打开观察 5 秒，可见 Console 列表为空，底部计数归零，未复现新 Error。审查者若二次复核，建议清空历史 Console 后重新 Preview 判断 Error 过滤器。
- 交互复核：
  - 叫地主后继续点 `抢`，进入 `playing`；HUD 节点可见：`手牌强度`、`强势 67%`、`剩牌`、`展开`。
  - 紧凑态剩牌显示：`大王0`、`小王1`、`22`、`A3`、`K2`、`Q2`、`+9`。
  - 点击展开后按钮变 `收起`，显示全点数：`J2`、`102`、`92`、`82`、`73`、`64`、`52`、`44`、`33` 等；再次点击可恢复 `展开` 紧凑态。
  - 选中 `A♠` 后 `出牌` 按钮由 disabled 变 interactable；出牌后玩家手牌 `20 -> 19`，AI 左家接 `4♦ 4♣ 4♥ 4♠`，AI 左家手牌 `17 -> 13`。
  - AI 出四张 `4` 后重新展开剩牌，`4` 行由出牌前 `44` 变为 `40`，符合“点数剩余 = 54 牌中该点总量 - 当前手牌该点 - 公开已出该点”。
  - 390x844 截图中 HUD 位于出牌区与操作区之间，展开态不遮挡 `出牌 / 不要 / 提示` 核心操作按钮。
- Creator 打开项目时临时改写过根 `package.json` 的格式与 version，本次已定向恢复，未纳入提交。
- 本次未改 `assets/scene/game.scene`、`.meta`、`settings/`、`profiles/`、`build/`。

## 与 spec 的偏差 / 关键决策

- 选择复用现有 `game-scene-skeleton.ts` 运行时建节点，而不是新增 HUD 组件；这样不需要新增 `.meta` 或手写 scene 绑定，文件域更窄。
- 已出牌事件源明确为 `fullGameEvents`，不是 `recentEvents`。
- `ownHand` 明确传 `snapshot.viewerHand` 当前手牌，符合 M3-56 spec 对 M4-31 `trackPlayed` 语义的要求。
- HUD 默认在玩家有手牌后渲染；叫抢阶段无 viewer hand 时不显示，避免空手强度/余牌面板干扰叫抢。

## 疑问（给架构 / 审查者）

- 请重点审 UI 位置是否需要进一步下沉或拆为独立组件；当前实现控制在单文件内，便于接续 M3-57/M3-63/M3-64。
- 请审查者重点复核 Creator Console 中的 `Channel closed` 是否为编辑器预览通道历史噪声；运行时 CDP 与清空后可见 Console 未观察到本任务 Error。

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
- [x] Creator 3.8.8 Preview / 390x844 截图已采集。
- [x] HUD 可见，不遮挡核心操作按钮。
- [x] 剩牌展开 / 收起可用。
- [x] 出牌后手牌数与已出牌剩余数字递减合理。
- [x] Preview 运行时 CDP 无 Error；编辑器 Console 清空历史 `Channel closed` 后无新可见 Error。
