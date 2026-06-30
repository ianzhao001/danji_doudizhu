# M3-46a-help-screen 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/components/lobby-scene.ts`
  - 新增 lobby「帮助」入口。
  - 消费 `helpSections()`，运行时渲染帮助/规则面板。
  - 支持「上滚」「下滚」「返回」，长规则文本按窗口滚动展示。
- `coordination/reports/M3-46a-help-screen-390x844.png`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  128 passed (128)
Tests       632 passed (632)

npm --prefix test run typecheck
tsc --noEmit
passed

npm --prefix test test -- ui/help-content.test.ts ui/tutorial-steps.test.ts ui/lobby-view.test.ts ui/settings-view.test.ts
Test Files  4 passed (4)
Tests       17 passed (17)

git diff --check
passed

rg -n "^import .*from ['\"]cc['\"]" assets/scripts/rules assets/scripts/game assets/scripts/ai assets/scripts/flow assets/scripts/data assets/scripts/ui/help-content.ts assets/scripts/ui/tutorial-steps.ts assets/scripts/ui/strength-meter-view.ts assets/scripts/ui/card-memory-view.ts
no matches
```

## Creator 复核
- Creator 版本：Cocos Creator 3.8.8。
- 启动方式：`env -u ELECTRON_RUN_AS_NODE open -n "/Applications/Cocos/Creator/3.8.8/CocosCreator.app" --args --project "/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor"`。
- Preview：`lobby.scene`，fresh Chrome CDP target `9234`，URL `http://localhost:7456/?scene=dc62324b-10d4-4870-9518-1a34ce682067`。
- 视口：CDP `Emulation.setDeviceMetricsOverride({ width: 390, height: 844, deviceScaleFactor: 2, mobile: true })`，运行时确认 `inner=[390,844]`、`scene="lobby"`。
- 截图：`coordination/reports/M3-46a-help-screen-390x844.png`，DevTools surface 按 DPR=2 捕获后用 `sips -z 844 390` 归一化为 390x844 文件尺寸。
- 交互验证：
  - lobby 首页出现「帮助」入口。
  - 点击「帮助」后出现 `help-panel`，首屏显示 `1-12/33` 与「牌型」「出牌比较」内容。
  - 点击「下滚」后进度变为 `6-17/33`，内容窗口更新。
  - 点击「返回」后 `help-panel` 节点数量为 0，回到 lobby 控件。
- Console / runtime error：CDP 期间 `Runtime.exceptionThrown` 与 `Runtime.consoleAPICalled(type=error)` 均为空数组。

## 与 spec 的偏差 / 关键决策
- 未手写 `assets/scene/lobby.scene` 或 `.meta`，改为在已有 `LobbyScene` 内运行时注入帮助入口和面板；这样延续编辑器线不手写 scene/meta 的纪律，并把文件域收敛到现有组件。
- 未新增 cc 组件，因此没有新增 `.meta`。`cc` import 仍只存在于 Cocos 组件层。
- 帮助长内容采用「上滚/下滚」窗口滚动按钮，而不是新增 ScrollView prefab；这样避免手写 scene/prefab，同时满足长内容可滚动浏览。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 纯层未 import cc
- [x] Creator 3.8.8 Preview 复核
- [x] 390x844 帮助屏截图落盘
- [x] 未改 scene/meta；运行时注入已说明
- [x] worktree 无本地未提交 `package.json` / `settings/` / `profiles/` 噪声
