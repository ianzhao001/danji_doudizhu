# P-G3 实现报告

- 实现方标识：Codex
- 分支：`task/P-G3`
- 状态：阶段①已提交 `fef74c7`；阶段②已实现并获准继续；阶段③/④已实现待审

## 阶段①改动文件

- `assets/scripts/ui/components/game-scene-skeleton.ts`
- `assets/scripts/ui/components/game-scene/seats-renderer.ts`
- `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`
- `assets/scripts/ui/components/game-scene/hud-renderer.ts`
- `assets/scripts/ui/components/game-scene/result-overlay-renderer.ts`
- `assets/scripts/ui/components/game-scene.meta`
- `assets/scripts/ui/components/game-scene/*.ts.meta`

## 实现摘要

- move-only 拆出 4 个 renderer：
  - `seats-renderer.ts`：`renderSeats` / `renderSeatFeedback` / `lastActionPosition` / `aiThinkingPosition`。
  - `bid-actions-renderer.ts`：`renderBidding` / `renderActions` / `renderStatus` / `renderTurnTimer` / `renderAdvisor`。
  - `hud-renderer.ts`：`renderHud` / `renderCardMemory`。
  - `result-overlay-renderer.ts`：`renderResult`。
- `GameSceneSkeleton` 保留薄 wrapper，并通过 `rendererContext()` 显式传入 `uiRoot`、settings、runtime、回调与绘制 helper。
- 未改坐标、文案、按钮行为、动画参数、音效/震动、卡面、toast、暂停菜单、手牌交互。
- `.meta` 为 Creator 3.8.8 / AssetDB 自动生成，未手写。

## 测试与类型检查

```
npm --prefix test test -- ui/screen-view.test.ts ui/table-layout-landscape.test.ts ui/turn-timer.test.ts ui/card-memory-view.test.ts ui/ai-thinking-view.test.ts ui/insight-view.test.ts integration/save-resume-e2e.test.ts
=> Test Files 7 passed (7)
=> Tests 33 passed (33)

npm --prefix test test
=> Test Files 139 passed (139)
=> Tests 703 passed (703)

npm --prefix test run typecheck
=> tsc --noEmit passed

git diff --check
=> passed
```

## Creator / CDP 证据

- Creator build：

```
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /Users/admin/Documents/Cocos/斗地主.worktrees/P-G3 \
  --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

- Creator 返回既有 metrics exit code `36`；`temp/logs/project.log` 记录 `build Task (web-mobile) Finished in (4 s)`，并生成 `build/web-mobile/`。
- CDP smoke：`node /tmp/doudizhu-v11-visual-smoke.mjs P-G /Users/admin/Documents/Cocos/斗地主.worktrees/P-G3/build/web-mobile /tmp/doudizhu-wave2-p-g3-phase1`
- 输出：`/tmp/doudizhu-wave2-p-g3-phase1/summary.json`
- 结论：6 张截图，`productErrors=[]`。
- 四横屏 game 截图均进入 `phase="playing"`、`handCount=20`：
  - `/tmp/doudizhu-wave2-p-g3-phase1/P-G-844x390-game.png`
  - `/tmp/doudizhu-wave2-p-g3-phase1/P-G-812x375-game.png`
  - `/tmp/doudizhu-wave2-p-g3-phase1/P-G-915x412-game.png`
  - `/tmp/doudizhu-wave2-p-g3-phase1/P-G-780x360-game.png`
- 手牌交互截图：
  - `/tmp/doudizhu-wave2-p-g3-phase1/P-G-844x390-card-pressed.png`
  - `/tmp/doudizhu-wave2-p-g3-phase1/P-G-844x390-card-released-selected.png`

## 阶段②改动文件

- `assets/scripts/ui/components/game-scene-skeleton.ts`
- `assets/scripts/ui/components/game-scene/seats-renderer.ts`
- `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`
- `assets/scripts/ui/components/game-scene/hud-renderer.ts`
- `assets/scripts/ui/components/game-scene/result-overlay-renderer.ts`

## 阶段②实现摘要

- `render()` 改走 `tableZones(canvas.width, canvas.height)`；顶部信息条、状态行、actionBar、强度条、计时、记牌器、建议、三家落牌区、底牌托架均消费命名 zone。
- 叫抢相消费 `runtime.biddingDeal()`，经 `deriveScreenVM({ biddingHand })` 渲染 17 张可见手牌；顶部手牌数和三家计数用 `[17,17,17]`。
- 新增发牌动画锁：首帧发牌期间 `bid-*` 按钮渲染为 disabled，锁结束后再启用；计时器在锁内冻结。
- actionBar 相位互斥：bidding 只渲染 `bid-*`，playing 只渲染 `action-*`。
- 消费 `bottomRevealed`：叫抢期底牌托架显示 3 张牌背，进入 playing 后展示 3 张明牌；地主手牌数变为 20。
- `snapshot.top.seat` 按座位落到 `dropZoneLeft` / `dropZoneRight` / `dropZoneHero`。
- 结算面板改为 `settlement-overlay-runtime` 子树，先 dim + `BlockInputEvents` 再挂 panel，避免底层 HUD 继续吃输入。
- 音效/动效/震动 chips 从牌桌中央迁入暂停菜单。
- 支持 URL `?seed=...` 覆写开局 seed，供 V2 固定种子复现。

## 阶段② 17 对重叠核销

以下按 P-G3/T-LAYOUT2/R-WAVE2 的重叠来源逐项核销，四横屏截图见下一节。

1. `top-landlord` ↔ 左家座位：`top-landlord` 进入 `infoStrip`。
2. `top-hand-count` ↔ 右家座位：`top-hand-count` 进入 `infoStrip`。
3. `top-multiplier` ↔ 顶部相位标题：三项徽标收敛到 `infoStrip`。
4. `bottom-card-back-*` ↔ 左/右家座位：底牌托架走 `bottomCardsDock`。
5. `bottom-card-*` ↔ 中央落牌区：底牌托架与 `dropZoneHero` 分行。
6. `bidding-prompt` ↔ 出牌区标题：提示走 `statusLine`。
7. `status-label` ↔ 叫抢按钮：状态走 `statusLine`，按钮走 `actionBar`。
8. `status-label` ↔ 出牌按钮：同上，状态与动作行分离。
9. `bid-call` ↔ `action-play`：bidding 相不渲染出牌键组。
10. `bid-pass` ↔ `action-pass`：bidding 相不渲染出牌键组。
11. `bid-grab` ↔ `action-hint`：bidding 相不渲染出牌键组。
12. `action-play` ↔ `bid-call`：playing 相不渲染叫抢键组。
13. `hud-strength-meter` ↔ actionBar：强度条走 `strengthMeter` 左翼。
14. `turn-timer-runtime` ↔ actionBar：计时走 `turnTimer` 右翼；bidding 也复用该区。
15. `hud-card-memory` ↔ 中央出牌区：记牌器走 `memoryDock` 左半屏。
16. `advisor-toggle`/`advisor-panel` ↔ 中央出牌区：建议走 `advisorDock` 右半屏。
17. `play-card-*` 共用中央落点：按 `top.seat` 分流到三处 dropZone。

## 阶段②测试与类型检查

```
npm --prefix test test -- ui/table-zones.test.ts flow/bidding-visibility.test.ts ui/screen-view.test.ts ui/table-layout-landscape.test.ts ui/turn-timer.test.ts ui/card-memory-view.test.ts integration/save-resume-e2e.test.ts
=> Test Files 7 passed (7)
=> Tests 55 passed (55)

npm --prefix test test
=> Test Files 139 passed (139)
=> Tests 703 passed (703)

npm --prefix test run typecheck
=> tsc --noEmit passed

git diff --check
=> passed
```

## 阶段② Creator / CDP 证据

- Creator build：

```
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /Users/admin/Documents/Cocos/斗地主.worktrees/P-G3 \
  --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

- Creator 返回既有 metrics exit code `36`；日志记录 `build Task (web-mobile) Finished in (4 s)`，并生成 `build/web-mobile/`。
- 标准 P-G smoke：`node /tmp/doudizhu-v11-visual-smoke.mjs P-G /Users/admin/Documents/Cocos/斗地主.worktrees/P-G3/build/web-mobile /tmp/doudizhu-wave2-p-g3-phase2-final`
  - 输出：`/tmp/doudizhu-wave2-p-g3-phase2-final/summary.json`
  - 结论：6 张截图，`productErrors=[]`。
- Phase② flow probe：`/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/summary.json`
  - 四横屏各 3 张截图：`bidding-locked` / `bidding-ready` / `playing`。
  - locked：`biddingHand=17`、`handCounts=[17,17,17]`、`bid-call/bid-pass.interactable=false`、`action-play.exists=false`、`backs=3`、`shownBottom=0`、`topLabel="地主 待定"`、`productErrors=0`。
  - bidding-ready：`lockMs=0`、`bid-call/bid-pass.interactable=true`、`action-play.exists=false`、`backs=3`。
  - playing：`phase="playing"`、`handCount=20`、`handCounts=[20,17,17]`、`bid-*` 不存在、`action-play.exists=true`、`backs=0`、`shownBottom=3`、`topLabel="地主 你"`。
  - 截图目录：
    - `/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/P-G3-844x390-bidding-locked.png`
    - `/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/P-G3-844x390-bidding-ready.png`
    - `/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/P-G3-844x390-playing.png`
    - `/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/P-G3-812x375-bidding-locked.png`
    - `/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/P-G3-812x375-bidding-ready.png`
    - `/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/P-G3-812x375-playing.png`
    - `/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/P-G3-915x412-bidding-locked.png`
    - `/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/P-G3-915x412-bidding-ready.png`
    - `/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/P-G3-915x412-playing.png`
    - `/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/P-G3-780x360-bidding-locked.png`
    - `/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/P-G3-780x360-bidding-ready.png`
    - `/tmp/doudizhu-wave2-p-g3-phase2-final-flow-probe/P-G3-780x360-playing.png`

## 阶段③/④开工同步

- 已在 worktree 内执行 `git merge main`，合入 main `95da87d`，生成 merge commit `866385e`。
- ART-IMPORT-UIKIT 已在 main 提供 v12 uikit 资源与 `RESOURCE_PATHS.seatNameplate` / `RESOURCE_PATHS.bottomCardsDock` 等键；本阶段只做 game-scene 接线和命名/文案收尾。

## 阶段③/④改动文件

- `assets/scripts/ui/components/game-scene-skeleton.ts`
- `assets/scripts/ui/components/game-scene/seats-renderer.ts`
- `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`
- `assets/scripts/ui/components/game-scene/result-overlay-renderer.ts`

## 阶段③实现摘要

- 按钮绘制从纯色 helper 换为本组件内 `btn-primary` / `btn-secondary` / `btn-disabled` 九宫格 Sprite 背景；出牌/不要/提示/叫抢/设置/返回类按钮按语义补 icon。
- 弹窗与 toast 面板接 `panel-popup` 九宫格；底牌托架接 `bottom-cards-dock`；顶部信息条接 `badge-turn` / `badge-multiplier` / `seat-nameplate`。
- 左右座位改为语义节点卡片：`seat-avatar`、`seat-avatar-frame`、`seat-nameplate`、`seat-role-badge`；未定角色用 AI 头像，定地主后切 landlord/farmer avatar/badge。
- 回合计时节点补 `badge-countdown-ring`；结算面板补胜负 badge 与 spring emphasis；炸弹/火箭 cue 触发时补 emphasis 贴图动效。
- 按 spec 保留代码绘制项：强度条、计时进度条、遮罩、小型 HUD/提示条的结构绘制未替换。

## 阶段④实现摘要

- 新增与保留节点均走可审查语义名：`top-phase-badge`、`top-landlord-nameplate`、`bottom-cards-dock-skin`、`seat-*`、`turn-timer-badge`、`result-outcome-badge`、`emphasis-*`。
- 顶栏文案收窄为 `地主待定` / `地主你` / `倍数×N` / `手牌N`，避免横屏窄档拥挤；未引入调试文案或开发态说明。
- 可读性返修：亮色按钮、名字牌、弹窗/结算面板上的文字统一改深色系；深色 HUD 小条仍保留浅字，避免亮色图上压亮色文字。

## 阶段③/④测试与类型检查

```
npm --prefix test test
=> Test Files 140 passed (140)
=> Tests 711 passed (711)

npm --prefix test run typecheck
=> tsc --noEmit passed

git diff --check
=> passed
```

## 阶段③/④ Creator / CDP 证据

- Creator build：

```
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /Users/admin/Documents/Cocos/斗地主.worktrees/P-G3 \
  --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

- Creator 返回既有 metrics exit code `36`；`temp/logs/project.log` 记录 `build Task (web-mobile) Finished in (4 s)`，并生成 `build/web-mobile/`。
- 本机 Creator 用户配置存在 `~/.CocosCreator/editor/window.json` 恢复警告；该警告发生在 build finished 后，未影响包生成与 CDP 运行。
- 标准 P-G smoke：`node /tmp/doudizhu-v11-visual-smoke.mjs P-G /Users/admin/Documents/Cocos/斗地主.worktrees/P-G3/build/web-mobile /tmp/doudizhu-wave2-p-g3-phase34-readable`
  - 输出：`/tmp/doudizhu-wave2-p-g3-phase34-readable/summary.json`
  - 结论：6 张截图，`productErrors=[]`。
  - 四横屏 playing 截图：
    - `/tmp/doudizhu-wave2-p-g3-phase34-readable/P-G-844x390-game.png`
    - `/tmp/doudizhu-wave2-p-g3-phase34-readable/P-G-812x375-game.png`
    - `/tmp/doudizhu-wave2-p-g3-phase34-readable/P-G-915x412-game.png`
    - `/tmp/doudizhu-wave2-p-g3-phase34-readable/P-G-780x360-game.png`
  - 手牌交互截图：
    - `/tmp/doudizhu-wave2-p-g3-phase34-readable/P-G-844x390-card-pressed.png`
    - `/tmp/doudizhu-wave2-p-g3-phase34-readable/P-G-844x390-card-released-selected.png`
- ART node probe：`/tmp/doudizhu-wave2-p-g3-phase34-art-probe-final/summary.json`
  - 截图：
    - `/tmp/doudizhu-wave2-p-g3-phase34-art-probe-final/P-G3-844x390-bidding.png`
    - `/tmp/doudizhu-wave2-p-g3-phase34-art-probe-final/P-G3-844x390-playing.png`
  - CDP 读数：`top-phase-badge`、`top-landlord-nameplate`、`top-multiplier-badge`、`bottom-cards-dock-skin`、`button-bg`、`button-icon`、`seat-avatar`、`seat-avatar-frame`、`seat-nameplate`、`seat-role-badge`、`turn-timer-badge` 均存在，`productErrors=[]`。
- 人工抽样：已打开 `/tmp/doudizhu-wave2-p-g3-phase34-readable/P-G-844x390-game.png`；顶部信息条、座位头像/名字牌、底牌托架、按钮 icon/皮肤均可见；按钮/名字牌/顶栏深色文字可读，无明显遮挡；强度/计时/记牌器维持代码绘制。

## 自检

- [x] 仅改声明文件域。
- [x] 未改 `test/**`。
- [x] 未碰 flow/ai/data 纯层。
- [x] 未手写 `.scene` / `.prefab` / `.meta`。
- [x] 全量 vitest / typecheck / diff check 通过。
- [x] Creator build + CDP smoke 通过。
- [x] 阶段②四横屏 locked/ready/playing CDP probe 通过。
- [x] 阶段③/④ uikit 接线、语义命名、文案收尾完成。
- [x] 阶段③/④ Creator build + 四横屏 CDP smoke + ART node probe 通过。
