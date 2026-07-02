# P-L 实现报告

- 实现方标识：Codex
- 分支：`task/P-L`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/components/lobby-scene.ts`

## 实现摘要
- 横屏全屏重排：home 改为左侧对局入口/战绩摘要、中间难度、右侧设置+四入口的三栏布局；教程、帮助、战绩、历史页都改为 390 高内的横屏居中面板。
- 入口真按钮：删除 `wirePrimaryNavigation` / `wireGameSceneLabel` 裸 `Label + TOUCH_END` 接线；「开始新局 / 继续游戏」改由共享 `addButton` 生成真按钮。
- 背景：停止加载竖版 `lobbyBg`，运行时绘制纯色/渐变占位背景，横图 ready 前不拉伸旧图。
- 命名规范：运行时节点改为稳定语义名，例如 `home-start-button`、`entry-tutorial-button`、`records-outcome-win` 等，二级页按钮也带稳定名称。
- 文案：按 P-Text 结论，lobby 可见文案保持原样，仅做布局与按钮化。

## 测试与类型检查输出
```
npm --prefix test test
=> Test Files 134 passed (134)
=> Tests 659 passed (659)

npm --prefix test run typecheck
=> tsc --noEmit passed
```

## Creator / 构建烟测
- 命令：
```
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /Users/admin/Documents/Cocos/斗地主.worktrees/P-L \
  --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```
- Creator 返回既有 metrics exit code `36`，但 `temp/logs/project.log` 末尾记录 `build Task (web-mobile) Finished in (4 s)`，并生成 `build/web-mobile/`。
- `build/web-mobile/src/settings.json`：
  - `CocosEngine: 3.8.8`
  - `engine.platform: web-mobile`
  - `launch.launchScene: db://assets/scene/lobby.scene`
  - `screen.designResolution: 844x390`
  - `screen.orientation: auto`（构建配置读数，非本任务文件域）

## CDP visual gate 证据
- 执行脚本：`node /tmp/doudizhu-v11-visual-smoke.mjs P-L /Users/admin/Documents/Cocos/斗地主.worktrees/P-L/build/web-mobile /tmp/doudizhu-v11-visual-gate/P-L`
- 输出：`/tmp/doudizhu-v11-visual-gate/P-L/summary.json`
- 结论：4 个横屏尺寸 × 6 个子屏均截图完成，`productErrors=[]`；入口按钮按压后成功进入 `game` 场景。
- 四横屏 × 六子屏截图：
  - 844x390：`P-L-844x390-home.png` / `tutorial.png` / `help.png` / `stats.png` / `records.png` / `difficulty-settings.png`
  - 812x375：`P-L-812x375-home.png` / `tutorial.png` / `help.png` / `stats.png` / `records.png` / `difficulty-settings.png`
  - 915x412：`P-L-915x412-home.png` / `tutorial.png` / `help.png` / `stats.png` / `records.png` / `difficulty-settings.png`
  - 780x360：`P-L-780x360-home.png` / `tutorial.png` / `help.png` / `stats.png` / `records.png` / `difficulty-settings.png`
- 入口按钮交互证据：
  - pressed：`/tmp/doudizhu-v11-visual-gate/P-L/P-L-844x390-home-start-button-pressed.png`
  - CDP 读数：`afterClickScene=game`，交互过程 `productErrors=[]`。
- 目检结论：home 三栏、教程、帮助、战绩、历史、难度/设置在 844x390、812x375、915x412、780x360 下无明显溢出/叠压；主入口为真按钮且有按压态。

## 与 spec 的偏差 / 关键决策
- 任务书中的「难度/设置」没有新增独立 `LobbyScreen` 枚举值；它们作为 home 的两个主面板完成横屏覆盖，避免引入新导航状态。
- 「继续游戏」当前沿用现有大厅无存档接入条件，点击进入 game scene；本任务不实现存档分流功能。
- CDP visual gate 使用本地 Chrome headless + SwiftShader 跑 web-mobile build；in-app Browser MCP 当前无可用 browser target，故未走该通道。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] Creator web-mobile build 完成
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获 `approved` 前未合并 main
- [x] UI 组件内使用 `cc`，未改纯层、未新增纯层 `cc` import
- [x] 四横屏截图/CDP/入口按钮交互运行时证据
