# P-G 实现报告

- 实现方标识：Codex
- 分支：`task/P-G`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/components/game-scene-skeleton.ts`

## 实现摘要
- 横屏落位：`renderSeats` 改为消费 `layout.opponentLeft` / `layout.opponentRight`，两侧对手从出牌区侧边移动到左右上角；`canvasSize()` fallback 改为 844x390。
- 背景：停止加载竖版 `gameTableBg`，运行时绘制纯色/渐变占位背景，横图 ready 前不拉伸旧图。
- HUD 短高适配：横屏下将「剩牌」面板收进出牌区左侧列，结算面板压到 390 高内，避免与出牌区/手牌/action 区互压。
- 手牌按压反馈：卡牌保留 `TOUCH_END` toggle；新增 `TOUCH_START` opacity/scale 局部反馈，`TOUCH_END`/`TOUCH_CANCEL` 复位；三事件均 off-before-on，`TOUCH_START` 不触发 `render()`。
- P-Text：新增本地 `seatName`，地主、对手、出牌区、AI 思考、结算、toast 中的可见 seat 文案改为「你/左家/右家」口径，去掉 `AI 左家`、`座位N`、`出牌区\n` 这类开发味显示。

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
  --project /Users/admin/Documents/Cocos/斗地主.worktrees/P-G \
  --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```
- Creator 返回既有 metrics exit code `36`，但 `temp/logs/project.log` 末尾记录 `build Task (web-mobile) Finished in (4 s)`，并生成 `build/web-mobile/`。
- `build/web-mobile/src/settings.json`：
  - `CocosEngine: 3.8.8`
  - `engine.platform: web-mobile`
  - `launch.launchScene: db://assets/scene/lobby.scene`
  - `screen.designResolution: 844x390`
  - `screen.orientation: auto`（构建配置读数，非本任务文件域）

## 与 spec 的偏差 / 关键决策
- 未改 `lastActionPosition` / `aiThinkingPosition` 坐标算法；按任务书复核后保持原有 opponent 区定位，仅在渲染文案层把 AI thinking label 改为「左家思考中/右家思考中」。
- 出牌区顶端文案采用 `左家·已出牌` / `右家·已出牌` / `自由出牌`，不引入新的牌型格式化模块，保持本任务只改 game-scene 文件域。
- 四横屏截图、CDP `productErrors=[]`、手牌按压录屏仍需审查者在 Creator/浏览器预览链路补验；本报告已完成代码、Vitest/typecheck、Creator web-mobile build 烟测。

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
- [ ] 四横屏截图/CDP/手牌按压运行时证据（待审查者或 Creator 预览补验）
