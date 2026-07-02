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
- 视觉 gate 补强：CDP 目检发现横屏 HUD 初版偏拥挤，已将 runtime settings / advisor / strength / timer / action row 收进出牌区与按钮区之间的短高间隙；顶部 phase 从 runtime 原始值映射为「叫地主/对局中/本局结算」，避免显示 `playing`。
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

## CDP visual gate 证据
- 执行脚本：`node /tmp/doudizhu-v11-visual-smoke.mjs P-G /Users/admin/Documents/Cocos/斗地主.worktrees/P-G/build/web-mobile /tmp/doudizhu-v11-visual-gate/P-G`
- 输出：`/tmp/doudizhu-v11-visual-gate/P-G/summary.json`
- 结论：4 个横屏尺寸均进入 `playing`，viewer hand = 20，`productErrors=[]`，共 6 张截图。
- 四横屏截图：
  - `/tmp/doudizhu-v11-visual-gate/P-G/P-G-844x390-game.png`
  - `/tmp/doudizhu-v11-visual-gate/P-G/P-G-812x375-game.png`
  - `/tmp/doudizhu-v11-visual-gate/P-G/P-G-915x412-game.png`
  - `/tmp/doudizhu-v11-visual-gate/P-G/P-G-780x360-game.png`
- 手牌按压交互证据：
  - pressed：`/tmp/doudizhu-v11-visual-gate/P-G/P-G-844x390-card-pressed.png`
  - released selected：`/tmp/doudizhu-v11-visual-gate/P-G/P-G-844x390-card-released-selected.png`
  - CDP 节点读数：按压前 `opacity=255, scale=1`；按压中 `opacity=214, scale=0.96`；释放后 `opacity=255, scale=1`，并选中抬起。
- 目检结论：左右 AI 落上角，出牌区居中，手牌铺底；HUD/action/advisor 在 844x390、812x375、915x412、780x360 下无核心交互叠压；顶部状态为中文「对局中」，无 `座位N` / `AI 左家` / `出牌区\n` / `playing` 这类开发味文案。

## 与 spec 的偏差 / 关键决策
- 未改 `lastActionPosition` / `aiThinkingPosition` 坐标算法；按任务书复核后保持原有 opponent 区定位，仅在渲染文案层把 AI thinking label 改为「左家思考中/右家思考中」。
- 出牌区顶端文案采用 `左家·已出牌` / `右家·已出牌` / `自由出牌`，不引入新的牌型格式化模块，保持本任务只改 game-scene 文件域。
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
- [x] 四横屏截图/CDP/手牌按压运行时证据
