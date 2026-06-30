# M3-57-toast-timer-wiring 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：implemented（待审查）
- 同步状态：任务开始前 `task/M6-editor` 已 fast-forward 到当前 `main`，基线为 `02c2aa5`。

## 改了哪些文件

- 更新 `assets/scripts/ui/components/game-scene-skeleton.ts`
  - 接入 `toast-queue`：组件持有 `ToastQueue`，`FlowEvent` 订阅中对炸弹、火箭、不要、春天/反春天事件调用 `pushToast(...)`。
  - 组件 `update(dt)` 驱动 `tickToasts(...)`，toast 到期后通过现有 render diff 清理节点，避免残影。
  - 接入 `turn-timer`：玩家 `playing` 阶段使用 `deriveTurnTimer(remaining,total)` 渲染倒计时条，最后 5 秒 urgent 变色。
  - 计时仅为视觉提示；倒计时到 0 后不提交动作、不调用 runtime 自动出牌或过牌。
  - toast 动效受 `settings.animation` 门控；关闭动效时直接显示，不执行 tween。
  - 不新增脚本组件，不手写 `.meta`、scene 或 prefab。
- 新增验证截图：
  - `coordination/reports/M3-57-toast-timer-390x844.png`
  - `coordination/reports/M3-57-toast-expired-390x844.png`

## 测试与类型检查输出

```
npm --prefix test run typecheck
tsc --noEmit

npm --prefix test test -- ui/toast-queue.test.ts ui/turn-timer.test.ts ui/screen-view.test.ts ui/cue-id-consistency.test.ts
Test Files  4 passed (4)
Tests       22 passed (22)

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
- 390x844 运行时截图证据：
  - `coordination/reports/M3-57-toast-timer-390x844.png`：toast 与计时条同屏，核心操作按钮仍可见；该图为布局复核截图，toast 使用组件自身 `ToastQueue` 状态注入后渲染，避免等待随机 AI 事件。
  - `coordination/reports/M3-57-toast-expired-390x844.png`：toast 到期清理后无残影，计时条进入 urgent 红色 5s 状态。
- 运行时行为复核：
  - 叫抢阶段不渲染 turn timer，避免与叫抢按钮重叠。
  - 进入 `playing` 且轮到玩家时可见 `计时 14s`，随后按 `update(dt)` 递减。
  - 点击真实 `action-pass` 后，组件事件路径产生 `座位1 不要` toast；约 2.2 秒后 `toast-layer-runtime/toast-100/toast-label` 已清理，无过期节点残留。
  - 倒计时到 `计时 0s` 后仍停留在玩家回合，不触发自动出牌 / 自动过牌，符合「单机仅提示、不改 runtime 契约」。
- Console / 运行时日志：
  - Chrome DevTools Protocol 监听 `Runtime.exceptionThrown`、`Log.entryAdded(error)`、`Runtime.consoleAPICalled(error/assert)`：M3-57 叫抢、进入 playing、计时、真实 pass toast、toast 过期流程均为 `errors: []`。
  - 编辑器 Console 可见启动信息为 Cocos Creator / Builtin pipeline / physics backend 切换日志；未观察到运行时 Error。浏览器 WebAudio autoplay warning 为非阻塞预览警告。
- 本次未改 `assets/scene/game.scene`、`.meta`、`package.json`、`tsconfig.json`、`cocos.config.json`、`settings/`、`profiles/`、`build/`。

## 与 spec 的偏差 / 关键决策

- 计时限定在 `playing` 阶段玩家回合显示；叫抢阶段虽然也可能是玩家操作窗口，但 spec 目标为“回合计时”，且叫抢按钮区域更紧，限定后可避免 390x844 上与叫抢操作重叠。
- toast + timer 同屏截图使用组件状态注入来稳定复现布局；真实事件入队路径另用 `action-pass` 验证，入队、渲染、过期均走实际运行时代码。
- 选择在既有 `game-scene-skeleton.ts` 运行时建节点，不新增组件和 `.meta`，以保持编辑器串行文件域最小。
- `TURN_TIMER_MS` 当前为组件内固定 15 秒展示时长；没有引入数据层配置，也没有修改 AI 思考延迟或 round-runtime 行为。

## 自检（对照验收项）

- [x] 任务书已存在并已执行，未转规划者。
- [x] 分支启动前已同步到当前 `main`。
- [x] 接入 `pushToast` / `tickToasts`。
- [x] 关键事件覆盖炸弹、火箭、不要、春天/反春天。
- [x] `update(dt)` 驱动 toast 过期和 timer 递减。
- [x] 动效受 `settings.animation` 门控。
- [x] 玩家 `playing` 回合渲染 `deriveTurnTimer(...)` 倒计时条。
- [x] urgent 最后 5 秒变色。
- [x] 超时不自动提交动作，不改 runtime 契约。
- [x] 390x844 截图已落盘。
- [x] toast 出现并自动消失，无残影。
- [x] 不遮挡 `出牌 / 不要 / 提示` 核心操作。
- [x] 未改测试。
- [x] 未碰 `main`。
- [x] `npm --prefix test test` 全绿。
- [x] `npm --prefix test run typecheck` 无错。
- [x] `git diff --check` 无输出。
- [x] Preview 运行时 CDP 无 Error；编辑器 Console 未观察到运行时 Error。
