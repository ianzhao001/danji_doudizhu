# T-FIX-SETTLE 实现报告

- 任务：T-FIX-SETTLE — scoped-fix / V2-ISSUE-1 结算面板内浮入底层 HUD
- 分支：`task/T-FIX-SETTLE`
- 实现者：Codex
- 日期：2026-07-04

## 改动概述

- 更新 `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `settled` 阶段不再渲染临时 HUD：status、bidding prompt、turn timer、toast、last-action、AI thinking、advisor、强度/剩牌 HUD、play-area 说明文字。
  - 结算态对既有临时 HUD 子树执行隐藏并保活，避免本帧 diff 直接销毁后触发异步 SpriteFrame 回调写入失效 Sprite。
  - 保留牌桌主体：top bar、座位、底牌托架、出牌区牌面、玩家手牌仍在暗幕下可见。
  - 将场景内资源加载改为带 Sprite/Node 有效性检查的 `loadSprite` wrapper，覆盖本任务域内 game scene 的 sprite 加载。
- 更新 `assets/scripts/ui/components/game-scene/result-overlay-renderer.ts`
  - 结算 overlay 和 panel 每次渲染后显式置顶。
  - 面板内部增加浅色底衬，遮住保留牌桌在面板区域的透出内容；面板外暗桌仍保留。
  - 结算底图加载改走 game scene 的安全 `loadSprite`。
- 更新 `assets/scripts/ui/components/game-scene/seats-renderer.ts`
  - 给 `GameSceneRendererContext` 增加 `loadSprite`，供 result renderer 使用。

## 口径边界

- 没有一刀切清场：暗幕下仍可见桌面、座位、手牌和牌桌信息。
- 面板内已清干净：结算态机械探针中 status / biddingPrompt / turnTimer / toastLayer / hud / lastActions / aiThinking / advisor 全部为 0。
- “再来一局”后进入新局，bidding/playing 中临时 HUD 恢复；第二局再结算后仍清干净。
- “返回大厅”后再开始新局也进入正常 bidding。

## 验证

- ✅ `npm --prefix test run typecheck`
  - `tsc --noEmit` passed。
- ✅ `npm --prefix test test`
  - 140 files / 711 tests passed。
- ✅ `git diff --check`
- ✅ Cocos Creator web-mobile build
  - 命令：`env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator --project /Users/admin/Documents/Cocos/斗地主.worktrees/T-FIX-SETTLE --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"`
  - CLI 退出码仍为 36，但日志明确包含 `build Task (web-mobile) Finished in (4 s)`；构建产物已生成于 `build/web-mobile`。
- ✅ CDP 验收脚本
  - 脚本：`/tmp/doudizhu-fix-settle-verify.mjs`
  - 汇总：`/tmp/doudizhu-fix-settle-evidence/summary.json`
  - seed：`20260704`
  - 四横屏 `productErrors=[]`：844x390、812x375、915x412、780x360。
  - 四横屏首轮结算：`phase=settled`，`overlayTop=true`，`panelTop=true`，`tableStillVisible.seats=14`，`tableStillVisible.handCards=68`，`tableStillVisible.topBar=4`。
  - 844x390 连续回归：settlement -> result-new -> bidding -> playing(last-action/HUD restored) -> second settlement -> result-lobby -> new game bidding。

## 截图证据

- `/tmp/doudizhu-fix-settle-evidence/844x390/T-FIX-SETTLE-844x390-settlement-round-1.png`
- `/tmp/doudizhu-fix-settle-evidence/812x375/T-FIX-SETTLE-812x375-settlement-round-1.png`
- `/tmp/doudizhu-fix-settle-evidence/915x412/T-FIX-SETTLE-915x412-settlement-round-1.png`
- `/tmp/doudizhu-fix-settle-evidence/780x360/T-FIX-SETTLE-780x360-settlement-round-1.png`
- `/tmp/doudizhu-fix-settle-evidence/844x390/T-FIX-SETTLE-844x390-round-2-bidding-after-result-new.png`
- `/tmp/doudizhu-fix-settle-evidence/844x390/T-FIX-SETTLE-844x390-round-2-playing-last-action-restored.png`
- `/tmp/doudizhu-fix-settle-evidence/844x390/T-FIX-SETTLE-844x390-settlement-round-2.png`
- `/tmp/doudizhu-fix-settle-evidence/844x390/T-FIX-SETTLE-844x390-return-lobby.png`
- `/tmp/doudizhu-fix-settle-evidence/844x390/T-FIX-SETTLE-844x390-new-round-after-return-lobby.png`

## 风险与后续

- `ui-helpers.ts` 不在任务文件域内，本任务没有改它；game scene 内的直接 sprite 加载已改走安全 wrapper。
- CDP 脚本在稳定 lobby 后清空 setup 阶段错误计数，只统计正式开局验证窗口中的 `productErrors`；正式验证窗口结果为全空。
- 未修改测试、纯逻辑层、根配置、`.meta`、scene/prefab。
