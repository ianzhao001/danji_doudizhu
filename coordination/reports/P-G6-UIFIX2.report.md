# P-G6-UIFIX2 执行报告

- 任务：P-G6-UIFIX2 — v13 二轮视觉整改（V4 用户签收 5 否点）
- 执行方标识：GPT-5.5 执行者
- 分支：`task/P-G6-UIFIX2`
- 状态：ready-for-planner-visual-review
- 记录时间：2026-07-05 22:40 CST

## 范围与红线

- 仅修改游戏内 UI 接线层：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `assets/scripts/ui/components/game-scene/hud-renderer.ts`
  - `assets/scripts/ui/components/game-scene/result-overlay-renderer.ts`
  - `assets/scripts/ui/components/game-scene/seats-renderer.ts`
- 未修改 `test/`、纯逻辑层、lobby、scene、meta、resources；未重做美术资源。
- 保留 T-FIX-SETTLE settled 门控：`showTransientHud` 与 `SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` 未改；结算仍走 `renderResult` 覆盖层。

## 改动摘要

| V4 否点 / P-G6 要求 | 本轮处理 | 代码位置 |
|---|---|---|
| 左上/右上人物分别外移且整体上移 | 左右立绘视觉矩形由向桌内推改为小幅向屏缘外移，并上移；缩小视觉占位以减少碰撞风险 | `seats-renderer.ts` `seatBodyVisualRect` |
| 名字牌角色清晰，不深入牌桌 | 左/右名字牌随各自立绘贴屏缘落位；角色行颜色加深；hero 紧凑名字牌也显示 `地主/农民/待定` | `seats-renderer.ts` `seatNameplateRect` / `renderSeatNameplate` |
| 出牌区点数可见 + 手牌角标更大 | 出牌区容器放大；AI 出牌缩放由 `0.74` 调为 `0.92`；卡牌角标字号/label 框加大 | `game-scene-skeleton.ts` `renderPlayArea` / `addCardNode` |
| 按钮背景包裹文字 + 对比 | 装饰按钮最小高调为 62；收窄图标显示条件避免小按钮挤字；label 内边距/字号重调；结算两个按钮同用 primary 文色/皮肤 | `game-scene-skeleton.ts` `addButton` / `buttonSkinPath` / `buttonIconPath` |
| 结算 5 子项 | 标题加深色底；胜负字缩小并加横幅内边距；移除单独“继续加油”行并将春天信息并入倍率行；分数区压缩并避开按钮；删除返回大厅箭头；两按钮同级同色 | `result-overlay-renderer.ts` |
| 整体零重叠 | 自审发现并修复 `剩牌` 面板“展开”和 `+9` 重叠；最终 r2 截图复核 | `hud-renderer.ts` |

## 执行者视觉自审勾销表

| 检查项 | 结论 | 证据 |
|---|---|---|
| 重叠 | 自审通过；首次 r1 自审发现 `剩牌` 面板“展开9”叠字，已移除收起态 `+N` 小尾标，r2 复核无该重叠 | `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/780-playing-hud-buttons.jpg` |
| 对比 | 自审通过；名字牌角色行加深，结算标题加深色底，按钮文字与底图保持反差 | `780-bidding-characters-nameplates.jpg`、`780-settlement-panel.jpg`、`780-bidding-buttons.jpg` |
| 包裹 | 自审通过；叫抢/出牌/提示/结算按钮文字落在按钮主体内，窄按钮不再显示挤压图标 | `780-bidding-buttons.jpg`、`780-playing-hud-buttons.jpg`、`780-settlement-buttons.jpg` |
| 闪烁 | 自审未观察到底牌白板/缺失帧；本轮未改底牌逻辑 | 两轮 bidding/settlement 截图链，`summary.json` 四档两局 settled |
| 出牌点数可见 | 自审通过；AI 出牌牌面角标在 780 zoom 可读 | `780-ai-play-card-rank.jpg` |
| 结算 5 子项 | 自审通过；文字未互盖，胜负字在 banner 内，标题有深底，返回大厅无箭头，两按钮文字色一致 | `780-settlement-panel.jpg`、`780-settlement-buttons.jpg` |
| 按钮逐颗包裹 | 自审通过；叫抢、出牌、提示、建议、结算按钮均有截图覆盖 | `round1-bidding.jpg`、`round1-playing.jpg`、`round1-settlement.jpg` |

说明：上述为执行者硬伤自审，不替代用户主观审美判断；按双层视觉预审关，下一步交规划者逐项视觉审。

## CDP 截图链

- seed：`20260705`
- 最终证据目录：`/tmp/doudizhu-pg6-uifix2-evidence-r2/`
- summary：`/tmp/doudizhu-pg6-uifix2-evidence-r2/summary.json`
- 脚本：`/tmp/doudizhu-pg4-v13-e2e.cjs`（沿用历史脚本名，输出字段仍带 P-G4，不代表本任务号）
- 说明：首次证据目录 `/tmp/doudizhu-pg6-uifix2-evidence/` 用于发现 HUD `展开9` 重叠，最终以 r2 为准。

| 横屏档 | 截图数 | productErrors | failedResponses | 首局 | 第二局 | AI 出牌捕获 | 玩家出牌捕获 |
|---|---:|---|---|---|---|---|---|
| 844x390 | 11 | `[]` | `[]` | settled | settled | true | true |
| 812x375 | 11 | `[]` | `[]` | settled | settled | true | true |
| 915x412 | 11 | `[]` | `[]` | settled | settled | true | true |
| 780x360 | 11 | `[]` | `[]` | settled | settled | true | true |

最终 contact sheets / zoom：

- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/round1-bidding.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/round1-playing.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/round1-player-selected.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/round1-ai-play.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/round1-settlement.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/round2-settlement.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/780-bidding-characters-nameplates.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/780-bidding-buttons.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/780-bidding-hand-centered.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/780-playing-hud-buttons.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/780-playing-hand-centered.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/780-ai-play-card-rank.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/780-ai-play-full-table.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/780-settlement-panel.jpg`
- `/tmp/doudizhu-pg6-uifix2-evidence-r2/contact-sheets/780-settlement-buttons.jpg`

## 构建与测试

```text
Cocos Creator 3.8.8 web-mobile build
COCOS_EXIT=36
... build Task (web-mobile) Finished in (3 s)ms ...
```

- 构建日志：`/tmp/doudizhu-pg6-uifix2-build-r2.log`
- 说明：本机 Creator CLI 仍输出已知 `build-script` SIGTERM 调试行并返回 36；日志含 `build Task (web-mobile) Finished`，且后续 CDP e2e 成功。

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

定向 T-LAYOUT 回归：

```text
npm --prefix test exec -- vitest run ui/table-zones-v13.test.ts ui/table-zones.test.ts

Test Files  2 passed (2)
Tests  56 passed (56)
```

## 规划者视觉审结论

- 状态：待规划者填写。
- 请求规划者重点逐项复核 V4 用户 5 否点：
  1. 人物与牌桌关系：左上/右上是否已分别外移、整体上移，且不压手牌/按钮/名字牌。
  2. 名字牌：地主/农民信息是否清晰，左/右名字牌是否不再深入牌桌内部。
  3. 按钮：所有带文字按钮是否被背景完整包裹且颜色对比足够。
  4. 结算：5 子项是否均达标。
  5. 整体：四横屏全相位是否无视觉元素互盖。

## 提审说明

- 本轮按协议先交规划者做视觉审，不直接交用户或审查者。
- 规划者视觉审通过后，再转 `R-WAVE6 R:P-G6-UIFIX2` 做结构/证据审查。
