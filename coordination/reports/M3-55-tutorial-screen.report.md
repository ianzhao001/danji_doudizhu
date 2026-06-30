# M3-55-tutorial-screen 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/components/lobby-scene.ts`
  - 在现有 `LobbyScene` 内新增「教程」入口，运行时渲染教程面板。
  - 消费 `tutorialSteps()` 与 `nextStep()`，支持上一步、下一步、跳过。
  - 正文按固定宽度拆为多行 Label，避免 390 宽度下横向溢出。
- `coordination/reports/M3-55-tutorial-first-390x844.png`
- `coordination/reports/M3-55-tutorial-middle-390x844.png`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  128 passed (128)
Tests       632 passed (632)

npm --prefix test run typecheck
tsc --noEmit
passed

npm --prefix test test -- ui/tutorial-steps.test.ts ui/lobby-view.test.ts ui/settings-view.test.ts
Test Files  3 passed (3)
Tests       14 passed (14)

git diff --check
passed

rg -n "^import .*from ['\"]cc['\"]" assets/scripts/rules assets/scripts/game assets/scripts/ai assets/scripts/flow assets/scripts/data assets/scripts/ui/tutorial-steps.ts assets/scripts/ui/strength-meter-view.ts assets/scripts/ui/card-memory-view.ts
no matches
```

## Creator 复核
- Creator 版本：Cocos Creator 3.8.8。
- 启动方式：`env -u ELECTRON_RUN_AS_NODE open -n "/Applications/Cocos/Creator/3.8.8/CocosCreator.app" --args --project "/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor"`。
- Preview：`lobby.scene`，fresh Chrome CDP target `9231`，URL `http://localhost:7456/?scene=dc62324b-10d4-4870-9518-1a34ce682067`。
- 视口：CDP `Emulation.setDeviceMetricsOverride({ width: 390, height: 844, deviceScaleFactor: 2, mobile: true })`，运行时确认 `inner=[390,844]`、`scene="lobby"`。
- 截图：
  - `coordination/reports/M3-55-tutorial-first-390x844.png`：首步 `1/6`、标题「先看手牌」。
  - `coordination/reports/M3-55-tutorial-middle-390x844.png`：连续 3 次「下一步」后 `4/6`、标题「跟牌或不要」。
  - DevTools surface 按 DPR=2 捕获后用 `sips -z 844 390` 归一化为 390x844 文件尺寸。
- 交互验证：
  - 点击「教程」后出现 `tutorial-panel`。
  - 连续点击「下一步」可到中间步骤。
  - 点击「跳过」后 `tutorial-panel` 节点数量为 0，回到 lobby 控件。
- Console / runtime error：CDP 期间 `Runtime.exceptionThrown` 与 `Runtime.consoleAPICalled(type=error)` 均为空数组。

## 与 spec 的偏差 / 关键决策
- 未手写 `assets/scene/lobby.scene` 或 `.meta`，改为在已有 `LobbyScene` 内运行时注入教程入口和面板；这是为了遵守不手写 scene/meta 的编辑器线纪律，并把文件域收敛到现有组件。
- 没有新增 cc 组件，因此没有新增 `.meta`。`cc` import 仍只存在于 Cocos 组件层。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 纯层未 import cc
- [x] Creator 3.8.8 Preview 复核
- [x] 390x844 首步 + 中间步截图落盘
- [x] 未改 scene/meta；运行时注入已说明
- [x] worktree 无本地未提交 `package.json` / `settings/` / `profiles/` 噪声
