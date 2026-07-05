# P-G7-UIFIX3 Report

任务：P-G7-UIFIX3 阶段①（#2 出牌区多牌 / #3 逆时针座位映射 / #4 左右家异常）
分支：task/P-G7-UIFIX3
日期：2026-07-06
状态：ready-for-planner-visual-review

## 范围与红线

本阶段只修改游戏内 UI 接线层：

- `assets/scripts/ui/components/game-scene-skeleton.ts`
- `assets/scripts/ui/components/game-scene/*.ts`
- `coordination/reports/P-G7-UIFIX3.report.md`

未修改：

- `assets/scripts/game/**`，尤其未改 `nextSeat`
- `test/**`
- 纯层 `rules/game/ai/flow/data`
- lobby、scene、meta、resources、asset-keys

阶段②暂停面板接线未做，等待 `ART-IMPORT-PAUSE-BTN`。

## 改动摘要

| 用户否点 / 任务项 | 本轮处理 | 文件 |
| --- | --- | --- |
| #3 出牌顺序视觉顺时针 | 新增 UI 显示映射：seat 1 = 右家，seat 2 = 左家；人物、名字牌、last-action、AI thinking、出牌落点、结算席位名统一消费该映射；game 层轮转不动 | `game-scene/seat-display.ts`、`seats-renderer.ts`、`game-scene-skeleton.ts`、`result-overlay-renderer.ts` |
| #2 右家/任意家多牌出牌重叠 | `renderPlayArea` 改为按可用宽度动态缩放、1/2 行布局；侧边座位限制在人物与桌面之间的安全区；所有座位牌面用同一 spacing 计算，避免角标互压 | `game-scene-skeleton.ts` |
| #2 牌型/动作文字压牌 | last-action / thinking 位置改为跟随新 seat drop zone，并上移到牌区外侧净空 | `seats-renderer.ts` |
| #4 左右家文字/btn 异常 | 左右席文案集中为 `seatDisplayName`；旧纯 view 文案在 UI 层做左右替换，不改纯层测试契约 | `seat-display.ts`、`bid-actions-renderer.ts` |

## 执行者视觉自审勾销表

| 检查项 | 结论 | 证据 |
| --- | --- | --- |
| #3 seat1→右 / seat2→左 一致性 | 自审通过。seat1 的出牌落右侧，seat2 的出牌落左侧；名字牌、last-action、结算席位名使用同一映射 | `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/right-seat-play.jpg`、`left-seat-play.jpg` |
| #2 右家多牌 | 自审通过。四档均捕获 seat1 右家 6 张多牌，角标可见，牌与计时条/名字牌不互压 | `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/right-seat-multi-card.jpg`、`780-right-multi-zoom.jpg` |
| #2 左家多牌压力 | 自审通过。四档均捕获 seat2 左家 8 张多牌，自动分 2 行显示，牌角标不互遮 | `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/left-seat-multi-card.jpg` |
| #4 左右家文字/btn | 自审通过。左右名字牌与计时/动作按钮同屏显示，未见用户截图中的文字叠压异常 | `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/780-left-right-nameplates-zoom.jpg` |
| 相位互斥 / settled 门控 | 自审通过。结算截图存在，重开回到 bidding；本阶段未改 settled gate 逻辑 | `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/settlement.jpg`、`restart-bidding.jpg` |
| productErrors | 四档均 `[]`；failedResponses 均 `[]` | `/tmp/doudizhu-pg7-uifix3-evidence/summary.json` |

说明：以上为执行者硬伤自审，不替代规划者视觉审和用户主观签收。

## CDP 证据

- seed：`20260705`
- 构建产物：`build/web-mobile`
- 本地服务：`http://127.0.0.1:18181/`
- 证据目录：`/tmp/doudizhu-pg7-uifix3-evidence/`
- 脚本：`/tmp/doudizhu-pg7-e2e.mjs`
- 方式：Chrome CDP + Cocos web-mobile build；截图来自真实 Cocos 画面。玩家回合用 runtime `legalInputs()` 自动提交合法输入推进流程，避免人工坐标抖动；UI 显示与点击入口仍在真实场景内验证。

| 横屏档 | 截图数 | productErrors | failedResponses | seat1 多牌 | seat2 多牌 | settled | restart |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| 844x390 | 10 | `[]` | `[]` | yes | yes | yes | yes |
| 812x375 | 10 | `[]` | `[]` | yes | yes | yes | yes |
| 915x412 | 10 | `[]` | `[]` | yes | yes | yes | yes |
| 780x360 | 10 | `[]` | `[]` | yes | yes | yes | yes |

出牌链摘要（四档一致）：

- step 1：seat2 出 8 张，落左侧。
- step 3：seat1 出 2 张，落右侧。
- step 10：seat1 出 6 张，落右侧多牌区。

关键 contact sheets / zoom：

- `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/bidding.jpg`
- `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/playing.jpg`
- `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/right-seat-play.jpg`
- `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/left-seat-play.jpg`
- `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/right-seat-multi-card.jpg`
- `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/left-seat-multi-card.jpg`
- `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/780-right-multi-zoom.jpg`
- `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/780-left-right-nameplates-zoom.jpg`
- `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/settlement.jpg`
- `/tmp/doudizhu-pg7-uifix3-evidence/contact-sheets/restart-bidding.jpg`

## 构建与测试

```text
Cocos Creator 3.8.8 web-mobile build
COCOS_EXIT=36
... build Task (web-mobile) Finished in (4 s)ms ...
```

- 构建日志：`/tmp/doudizhu-pg7-build.log`
- 说明：本机 Creator CLI 仍返回既有 metrics exit code 36；日志包含 `build Task (web-mobile) Finished`，且后续 CDP 证据链成功。

```text
npm --prefix test test

Test Files  141 passed (141)
Tests  739 passed (739)
```

```text
npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

```text
git diff --check

exit 0
```

## 待规划者视觉审

请规划者按双层视觉预审关复核：

1. seat1 右家 / seat2 左家映射是否符合逆时针观感，人物、名字牌、落牌区、last-action 是否同侧一致。
2. 右家 6 张、左家 8 张多牌截图中，牌型/动作文字与牌面是否仍有视觉重叠。
3. 左右家名字牌、计时条、动作按钮是否仍有文字/按钮异常。
4. 本阶段未做暂停面板按钮接线，#1 仍走 ART-PAUSE-BTN → ART-IMPORT-PAUSE-BTN → P-G7 阶段②。

规划者视觉审通过后，再交 `R-WAVE7 R:P-G7-UIFIX3` 做结构/证据审查。

---

## 审查者结论（R-WAVE7 R:P-G7-UIFIX3 阶段① · GLM-5.2 · 2026-07-06）

**结论：approved**，打回 0 轮。

### 文件域核查

分支 `task/P-G7-UIFIX3`（`acadcc1` + 报告格式修复 `4eed53d`），真正改动（`f3f182e..4eed53d`）仅 6 文件 +257−55：

1. `assets/scripts/ui/components/game-scene-skeleton.ts`（+109/-...：renderPlayArea dropZone 翻转 + playAreaLayout/playCardPosition 多牌布局 + seatName→seatDisplayName）
2. `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`（+3：swapLegacySideText 翻转 bidding.prompt）
3. `assets/scripts/ui/components/game-scene/result-overlay-renderer.ts`（+10：seatName→seatDisplayName）
4. `assets/scripts/ui/components/game-scene/seat-display.ts`（新文件 31 行：seatDisplayName/visualSideForSeat/dropZoneForSeat/swapLegacySideText）
5. `assets/scripts/ui/components/game-scene/seats-renderer.ts`（+37：leftSeat=2/rightSeat=1 翻转 + seatName→seatDisplayName + dropZoneForSeat + y 上移避让）
6. `coordination/reports/P-G7-UIFIX3.report.md`（新报告 122 行）

**零改动域**：`assets/scripts/game/`（**nextSeat 不动·独立核验 exit=0**）、`test/`、纯层（rules/game/ai/flow/data）、lobby、scene、meta、resources、asset-keys.ts、table-zones.ts。

### 检查单逐项核销

| 检查项 | 结论 | 证据 |
|---|---|---|
| 文件域仅 game-scene-skeleton+game-scene/*+report | ✅ | f3f182e..4eed53d diff --stat 6 文件 |
| game 层 nextSeat/出牌轮转零改动 | ✅ | `git diff f3f182e..acadcc1 -- assets/scripts/game/` exit=0；`nextSeat` 仍在 `game/seat.ts:8` |
| test/纯层/lobby/meta/resources 零改动 | ✅ | 各域 diff exit=0 |
| #3 座位映射翻转一致 | ✅ | seat-display.ts seat1→right/seat2→left；seats-renderer leftSeat=2/rightSeat=1 名字牌翻转；renderPlayArea dropZoneForSeat 落点翻转；lastActionPosition/aiThinkingPosition 同步翻转；seatNameplateRect 用 visualSideForSeat；eventToastText/landlord 标签用 seatDisplayName |
| #2 多牌不重叠 | ✅ | playAreaLayout 动态缩放(0.58-0.94)+8张分2行+safe area 避让人物；lastAction/aiThinking y 上移 20px 避让牌面 |
| #4 左右家文字/btn | ✅（带保留） | swapLegacySideText 翻转纯层 bidding.prompt 文字；seatDisplayName 统一左右文案；#4 红框截图未入仓库→留 V6 用户签收（同规划者 R1 结论） |
| T-FIX-SETTLE settled 门控 | ✅ | `SETTLEMENT_TRANSIENT_HUD_NODE_NAMES`/`showTransientHud` 10 处命中 |
| 相位互斥 | ✅ | 未触相关逻辑 |
| T-LAYOUT4 无重叠 | ✅ | table-zones.ts 零改动 |
| 卡面无中心数字 | ✅ | 未触 card-face 相关 |
| productErrors=[] | ✅ | 四档（844x390/812x375/915x412/780x360）全 `[]`/`failedResponses=[]`/settled=1/restart=True |
| vitest 141/739 | ✅ | 141 passed (141) / 739 passed (739) 26.74s |
| typecheck | ✅ | tsc --noEmit 净 |
| diff --check | ✅ | 报告 trailing whitespace/EOF 已修复（commit 4eed53d），exit=0 |
| 报告含自审勾销表+规划者视觉审结论 | ✅ | 报告 6 项自审表 + BOARD 规划者 R1=PASS（668a610） |

### 全量回扫

- **域内致命**：0
- **域外致命**：0
- **拿不准（非阻断·转规划者建议单）**：1 项——`assets/scripts/ui/ai-thinking-view.ts:13` 的 `deriveAiThinking` label 仍用旧映射（offset===1→'AI 左家'/offset===2→'AI 右家'），与新 UI 映射不一致。但 UI 的 `renderAiThinking` 不消费 `thinking.label`，而是用 `seatDisplayName(thinking.seat)` 生成文字，不影响渲染。纯层测试 `ai-thinking-view.test.ts` 仍用旧映射期望且全绿（纯层不改）。建议规划者后续统一该映射（另拆任务，不阻断本轮）。

### 合并提示处理

分支建于 `f3f182e`（早于 `V5-user-review.md` 提交 `0993fd0` 和 BOARD 规划者 R1 提交 `668a610`）。`git diff main..task/P-G7-UIFIX3` 显示 `V5-user-review.md -43` 和 `BOARD.md -1` 系分支落后 main、非执行者删除。3-way merge 自动保留 main 版本，无冲突。

### 合并证据

claim `ef41043` → merge `93cc7c2`（`--no-ff`，6 文件 +257−55）→ release 待提交。

合并后 main `93cc7c2`：**141 文件/739 用例全绿（28.74s）+ typecheck 净 + diff --check 净**。

### 下一步

P-G7-UIFIX3 阶段① done。阶段②（暂停面板 6 按钮）待 ART-IMPORT-PAUSE-BTN 落 main 后开工。V6 收口在阶段②合并后。**V6 done + 用户签收 = v1.2 终点**。用户主观终审不可由 AI 代判。
