# P-G4-UI-REMAKE 实现报告

- 实现方标识：Codex
- 分支：`task/P-G4-UI-REMAKE`
- 状态：in-review（v13 游戏内 UI 接线完成，待 R:P-G4-UI-REMAKE 审查）

## 改了哪些文件

- `assets/scripts/ui/components/game-scene-skeleton.ts`
- `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`
- `assets/scripts/ui/components/game-scene/result-overlay-renderer.ts`
- `assets/scripts/ui/components/game-scene/seats-renderer.ts`
- `coordination/reports/P-G4-UI-REMAKE.report.md`

未改 lobby、规则、AI、流程、存档、`assets/resources/**`、`.meta`、`asset-keys.ts`、场景或 prefab。

## 实现摘要

- 游戏内背景改用 `gameTableBgV13`；保持 lobby 零触碰。
- 三名角色按 `TableZones` v13 body/nameplate 落位，名字牌作为宿主立绘子节点渲染在 body 上层。
- 玩家手牌改用 `heroHandLarge` 底部大牌区，保留选牌、提示、出牌、不要触发逻辑。
- 叫抢/出牌按钮改用 `tableActionBar` 居中悬桌；叫抢/出牌仍相位互斥。
- 底牌托架改用 `bottomCardsDockV13`，未亮底牌展示 v13 牌背，亮底牌展示 v13 卡面。
- 卡面采用混合渲染：`cardTemplateV13` / joker 图 + 代码绘制点数 + `suit-*-v13` 花色图。
- 结算改为暗幕牌桌 + v13 胜负横幅/面板 + 三家分数/余牌 + 再来一局/返回大厅；保留 T-FIX-SETTLE settled 门控，结算截图 `transientActive=0`。

## v13 key 消费清单

已消费 `ART-IMPORT-GAME-REMAKE.report.md` 的全部 23 个 `xxxV13` 键：

```
gameTableBgV13,
heroBodyV13, leftAiBodyV13, rightAiBodyV13,
seatNameplateV13, bottomCardsDockV13,
btnPrimaryV13, btnSecondaryV13, btnTertiaryV13, btnDisabledV13,
settlementBannerWinV13, settlementBannerLoseV13, settlementPanelV13,
badgeMultiplierV13, badgeTimerV13,
cardTemplateV13, cardBackV13,
suitSpadeV13, suitHeartV13, suitClubV13, suitDiamondV13,
jokerSmallV13, jokerBigV13
```

机械 grep 证据：

```
rg -n "V13" assets/scripts/ui/components/game-scene-skeleton.ts assets/scripts/ui/components/game-scene/*.ts
```

## v13 zone 消费清单

已消费：

```
heroBody, opponentLeftBody, opponentRightBody,
heroNameplate, opponentLeftNameplate, opponentRightNameplate,
heroHandLarge, tableActionBar, settlementShowcase
```

继续保留 legacy zone 消费，供 topBar、bottomCardsDock、dropZone、HUD 等既有 UI 维持行为。

## 构建证据

命令：

```
rm -rf build/web-mobile && env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator --project /Users/admin/Documents/Cocos/斗地主.worktrees/P-G4-UI-REMAKE --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

结果：

```
exit code 36
日志含：================================ build Task (web-mobile) Finished in (3 s)ms ================================
产物路径：build/web-mobile
```

说明：本机 Creator CLI 在该项目上沿用既有现象，构建完成后返回 36；按任务验收口径以日志 `build Task (web-mobile) Finished` 作为可生成产物证据。

## GUI 验收证据

脚本：

```
NODE_PATH=/tmp/doudizhu-playwright-smoke/node_modules node /tmp/doudizhu-pg4-v13-e2e.cjs /Users/admin/Documents/Cocos/斗地主.worktrees/P-G4-UI-REMAKE /tmp/doudizhu-pg4-v13-evidence-r5
```

说明：Playwright 运行器与脚本均在 `/tmp`，不进入提交。脚本使用本机 Chrome 打开 `build/web-mobile`，四横屏每档截 11 张：lobby、叫抢、出牌、玩家选牌、玩家出牌、AI 出牌、结算、再来一局回归、第二轮叫抢、第二轮结算、返回大厅。

结果摘要：

| viewport | captures | productErrors | failedResponses | round1 | round2 | AI 出牌 | 玩家出牌 | settlement transient | return |
|---|---:|---|---|---|---|---|---|---:|---|
| 844×390 | 11 | `[]` | `[]` | settled | settled | true | true | 0 | lobby |
| 812×375 | 11 | `[]` | `[]` | settled | settled | true | true | 0 | lobby |
| 915×412 | 11 | `[]` | `[]` | settled | settled | true | true | 0 | lobby |
| 780×360 | 11 | `[]` | `[]` | settled | settled | true | true | 0 | lobby |

汇总文件：

```
/tmp/doudizhu-pg4-v13-evidence-r5/summary.json
```

关键截图路径：

```
/tmp/doudizhu-pg4-v13-evidence-r5/844x390/P-G4-844x390-round1-bidding.png
/tmp/doudizhu-pg4-v13-evidence-r5/844x390/P-G4-844x390-round1-playing.png
/tmp/doudizhu-pg4-v13-evidence-r5/844x390/P-G4-844x390-round1-player-selected.png
/tmp/doudizhu-pg4-v13-evidence-r5/844x390/P-G4-844x390-round1-ai-play.png
/tmp/doudizhu-pg4-v13-evidence-r5/844x390/P-G4-844x390-round1-settlement.png
/tmp/doudizhu-pg4-v13-evidence-r5/844x390/P-G4-844x390-restart-bidding.png
/tmp/doudizhu-pg4-v13-evidence-r5/844x390/P-G4-844x390-return-lobby.png

/tmp/doudizhu-pg4-v13-evidence-r5/812x375/P-G4-812x375-round1-bidding.png
/tmp/doudizhu-pg4-v13-evidence-r5/812x375/P-G4-812x375-round1-playing.png
/tmp/doudizhu-pg4-v13-evidence-r5/812x375/P-G4-812x375-round1-player-selected.png
/tmp/doudizhu-pg4-v13-evidence-r5/812x375/P-G4-812x375-round1-ai-play.png
/tmp/doudizhu-pg4-v13-evidence-r5/812x375/P-G4-812x375-round1-settlement.png
/tmp/doudizhu-pg4-v13-evidence-r5/812x375/P-G4-812x375-restart-bidding.png
/tmp/doudizhu-pg4-v13-evidence-r5/812x375/P-G4-812x375-return-lobby.png

/tmp/doudizhu-pg4-v13-evidence-r5/915x412/P-G4-915x412-round1-bidding.png
/tmp/doudizhu-pg4-v13-evidence-r5/915x412/P-G4-915x412-round1-playing.png
/tmp/doudizhu-pg4-v13-evidence-r5/915x412/P-G4-915x412-round1-player-selected.png
/tmp/doudizhu-pg4-v13-evidence-r5/915x412/P-G4-915x412-round1-ai-play.png
/tmp/doudizhu-pg4-v13-evidence-r5/915x412/P-G4-915x412-round1-settlement.png
/tmp/doudizhu-pg4-v13-evidence-r5/915x412/P-G4-915x412-restart-bidding.png
/tmp/doudizhu-pg4-v13-evidence-r5/915x412/P-G4-915x412-return-lobby.png

/tmp/doudizhu-pg4-v13-evidence-r5/780x360/P-G4-780x360-round1-bidding.png
/tmp/doudizhu-pg4-v13-evidence-r5/780x360/P-G4-780x360-round1-playing.png
/tmp/doudizhu-pg4-v13-evidence-r5/780x360/P-G4-780x360-round1-player-selected.png
/tmp/doudizhu-pg4-v13-evidence-r5/780x360/P-G4-780x360-round1-ai-play.png
/tmp/doudizhu-pg4-v13-evidence-r5/780x360/P-G4-780x360-round1-settlement.png
/tmp/doudizhu-pg4-v13-evidence-r5/780x360/P-G4-780x360-restart-bidding.png
/tmp/doudizhu-pg4-v13-evidence-r5/780x360/P-G4-780x360-return-lobby.png
```

## 测试与类型检查输出

```
npm --prefix test test
Test Files  141 passed (141)
Tests       727 passed (727)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed
```

## 工作树状态

预期改动：

```
M  assets/scripts/ui/components/game-scene-skeleton.ts
M  assets/scripts/ui/components/game-scene/bid-actions-renderer.ts
M  assets/scripts/ui/components/game-scene/result-overlay-renderer.ts
M  assets/scripts/ui/components/game-scene/seats-renderer.ts
A  coordination/reports/P-G4-UI-REMAKE.report.md
```

## 偏差 / 说明

- `settlementPanelV13` 正常消费，同时在结算面板节点上绘制粉色半透明底板作为即时加载兜底，避免 Sprite 首帧加载波动导致结算文字悬空；不改资源、不改结算逻辑。
- 卡牌仍采用任务书要求的混合渲染，不把点数/花色整体烘焙为静态牌图。
- GUI 截图中底层牌桌与余牌在暗幕下保留；settled 态 transient HUD 计数为 0，按钮/计时/提示等运行中 HUD 不再作为活跃瞬态节点。

## 疑问 / 需规划者裁定

- 无。

## 批次交接记录 / 下一步

- 所属批次 / 任务号：UI-REMAKE / `P-G4-UI-REMAKE`
- 本回合结论 / 状态：v13 游戏内 UI 接线完成，测试/typecheck/diff-check 与四横屏 GUI 证据通过，待审查。
- 下一步找谁：审查者（GLM-5.2）
- 原因：按 `R-UI-REMAKE.md` 的 `R:P-G4-UI-REMAKE` 核代码范围、v13 键消费、zone 消费、相位互斥、settled 门控、GUI 证据与测试链；通过后由审查者整分支合并。
- 待用户终审事项：本任务不替代用户主观视觉终审；用户主观项转 V3。

给下一窗口的可粘贴提示词：

```
你是本仓库 斗地主 的审查型 AI，审查任务 P-G4-UI-REMAKE。
先读：coordination/PROTOCOL.md、coordination/tasks/P-G4-UI-REMAKE.md、coordination/tasks/R-UI-REMAKE.md 的 R:P-G4-UI-REMAKE、coordination/reports/P-G4-UI-REMAKE.report.md、coordination/BOARD.md 的 UI-REMAKE 段、coordination/reports/ART-IMPORT-GAME-REMAKE.report.md 的键清单。
当前分支：task/P-G4-UI-REMAKE。请审查 git diff main..task/P-G4-UI-REMAKE：确认只改 game-scene-skeleton/game-scene/*/本报告；消费 v13 新键组与 T-LAYOUT3 v13 zones；名字牌为宿主 body 上层贴附件；叫抢/出牌相位互斥、per-seat 落点、bottomRevealed、T-FIX-SETTLE settled 门控、再来一局/返回大厅均不回归；核 /tmp/doudizhu-pg4-v13-evidence-r5/summary.json 与四横屏截图 productErrors=[]；复跑 test/typecheck/diff-check。通过后按协议写 approved 并由审查者 claim/merge/release。
```

## 自检（对照验收项）

- [x] 仅改允许文件域
- [x] 消费全部 v13 新键组
- [x] 消费 v13 zone：body/nameplate/heroHandLarge/tableActionBar/settlementShowcase
- [x] lobby、规则、AI、流程、存档、资源与 `.meta` 零触碰
- [x] 叫抢/出牌相位互斥不回归
- [x] `bottomRevealed` 亮底牌展示不回归
- [x] settled 门控：结算截图 `transientActive=0`
- [x] 再来一局回归与返回大厅链路通过 GUI
- [x] 四横屏 GUI 截图齐，`productErrors=[]`
- [x] Cocos web-mobile 构建日志含 `build Task (web-mobile) Finished`
- [x] 全量测试通过
- [x] typecheck 通过
- [x] `git diff --check` 通过
