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

## 审查者评审段（GLM-5.2 · 2026-07-04 · approved · 0 打回轮次）

### 文件域核验
diff `main..task/T-FIX-SETTLE`：4 文件——`game-scene-skeleton.ts`(+102/-21)、`result-overlay-renderer.ts`(+19/-2)、`seats-renderer.ts`(+3/-1)、`T-FIX-SETTLE.report.md`(+63)。纯层/测试/根配置/scene/meta 零改动。符合任务书文件域（game-scene-skeleton + game-scene/* + report）。

### diff 逐行审
1. **settled 相位门控**：`showTransientHud = phase !== 'settled'`，settled 时 `hideSettledTransientHud()` 隐藏 20 个临时 HUD 节点（status/bidding-prompt/turn-timer/toast/hud×2/advisor×2/action×3/bid×3/last-action×3/ai-thinking×3），`renderSeatFeedback/renderHud/renderAdvisor/renderStatus/renderTurnTimer/renderToasts` 均门控跳过；`renderPlayArea` 传 `showLabel` 隐藏"已出牌/自由出牌"说明文字但保留牌面渲染。牌桌主体（topBar/seats/bottomCardsDock/playArea 牌面/hand）不受门控，暗幕下保留可见——口径两条都满足。
2. **隐藏+保活策略**：`hideLiveSubtree` 设 `active=false` + `markLiveSubtree` 递归加入 `liveRenderNodes`，防止 `pruneInactiveChildren` 销毁。这避免了异步 `resources.load` 回调写入已销毁 Sprite 的崩溃风险——正确。
3. **loadSprite 安全 wrapper**：新增实例方法 `this.loadSprite(path, sprite)`，`applySpriteFrame` 检查 `sprite.isValid && sprite.node?.isValid` 才赋值；try/catch 在 Sprite 仍 valid 时 throw（失效时吞掉异步回调）。替换 5 处调用（cardBack/cardAsset/suitAsset/addSprite/gameTableBg）。`result-overlay-renderer` 改用 `ctx.loadSprite`，`seats-renderer` 接口加 `loadSprite` 签名。`ui-helpers.loadSprite` 仍被 `lobby-scene.ts` 消费（不在文件域，不动）——无越域。
4. **result overlay 置顶兜底**：`panel.setSiblingIndex(overlay.children.length-1)` + `overlay.setSiblingIndex(ctx.uiRoot.children.length-1)`——行为要求 2 满足。
5. **面板内浅色底衬**：`settlement-panel-fill` 节点，`Graphics` 画 `Color(255,247,226,238)` 圆角矩形，`setSiblingIndex(0)` 置最底（不遮 badge/text/buttons）——确保面板内容区不透出底层牌桌。

### 检查单逐项核销（R-WAVE3 R:T-FIX-SETTLE）
- [x] 文件域仅 game-scene-skeleton + game-scene/* + report；纯层/测试零改动。
- [x] diff 核：settled 相位跳过 statusLine/last-action 渲染 + result overlay 置顶兜底；无布局坐标/文案顺手改（renderPlayArea showLabel 是必要相位门控）。
- [x] 四横屏结算截图：面板内无底层药丸/文本（transient 全 0）；暗幕下牌桌仍可见（tableStillVisible seats=14/handCards=68/topBar=4 四档一致）。
- [x] 重开回归证据：844x390 restart(bidding) status=1/biddingPrompt=1/lastActions=3 + playing hud=2/lastActions=3/advisor=1 + secondSettlement transient 全 0 + lobbyReturn(lobby) + lobbyNewRound(bidding)。
- [x] productErrors=[] 四档；vitest/typecheck 与 main 基线一致（140/711）。
- [x] 常规任务双闸后直接合并；验收披露 + handoff 回规划者。

### 全量回扫范围与分流
回扫范围：`loadSprite` 全消费方（lobby-scene 仍用 ui-helpers 版本不受影响）、`spriteFrameResourcePath` import 合法性（asset-keys.ts:96 存在）、`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` 完整性（覆盖所有 playing 专属瞬时节点）、`GameSceneRendererContext` 接口变更（additive，加 loadSprite 签名，不破坏既有消费者）。无域外致命，无拿不准。

### 打回轮次
0 轮。

### 测试基线（审查者独立复跑）
worktree `b814ee6`：`npm --prefix test run typecheck` 净；`npm --prefix test test` **140 文件 / 711 用例全绿**（selfplay 质量门 Hard 组合率 0.993 / 压队友 0 / 胜率差 Hard−Normal +0.133 / Hard−Simple +0.633，与 V2 基线一致）。`git diff --check` 净。

## 验收披露（审查者 GLM-5.2 · 2026-07-04 · approved 已合并）

- **评审结论**：approved——域内致命清零、全量回扫已做且无未决阻断项。
- **打回轮次与原因**：0 轮。
- **全量回扫范围与分流结果**：回扫覆盖 `loadSprite` 全消费方（lobby-scene 仍用 ui-helpers 版本不受影响）、`spriteFrameResourcePath` import 合法性（asset-keys.ts:96 存在）、`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` 完整性（20 节点覆盖所有 playing 专属瞬时 HUD）、`GameSceneRendererContext` 接口变更（additive，加 loadSprite 签名，不破坏既有消费者）。无域外致命，无拿不准。
- **合并 commit**：`6df0c88`（merge --no-ff task/T-FIX-SETTLE）。
- **最终测试基线**：worktree `b814ee6` 跑 `npm --prefix test test` **140 文件 / 711 用例全绿** + `npm --prefix test run typecheck` 净 + `git diff --check` 净。合并后 main `de27d1d`：worktree+分支已清理，BOARD `done 6df0c88`。
- **CDP 证据**：四横屏（844×390/812×375/915×412/780×360）`productErrors=[]`；firstSettlement transient 全 0 + tableStillVisible(seats=14/handCards=68/topBar=4) + overlayTop/panelTop=true；844x390 连续回归链 firstSettlement → restart(bidding,HUD 恢复) → playing(HUD 恢复) → secondSettlement(transient 全 0) → lobbyReturn → lobbyNewRound(bidding)。证据目录 `/tmp/doudizhu-fix-settle-evidence/`。
- **v1.2 收口**：T-FIX-SETTLE done = V2-ISSUE-1 修复落地。v1.2 收口放行条件 = T-FIX-SETTLE done ✅ + 用户主观终审通过（待进行：名字牌对比度 + 修后结算画面 + 整体手感）→ handoff 回规划者做 v1.2 版本终局裁定 + 协调用户主观终审。
