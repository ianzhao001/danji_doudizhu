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

