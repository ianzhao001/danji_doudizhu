# P-G3 实现报告

- 实现方标识：Codex
- 分支：`task/P-G3`
- 状态：阶段① in-review；阶段②待阶段①审查基线后继续

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

## 阶段②状态

- 阶段②尚未开始。本提交只建立 renderer 拆分基线，便于审查者先确认视觉等价与文件搬移。

## 自检

- [x] 仅改声明文件域。
- [x] 未改 `test/**`。
- [x] 未碰 flow/ai/data 纯层。
- [x] 未手写 `.scene` / `.prefab` / `.meta`。
- [x] 全量 vitest / typecheck / diff check 通过。
- [x] Creator build + CDP smoke 通过。
