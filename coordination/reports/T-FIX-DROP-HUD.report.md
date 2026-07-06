# T-FIX-DROP-HUD Report

任务：T-FIX-DROP-HUD（scoped-fix：左家多牌出牌与强度/剩牌 HUD 重叠）
分支：task/T-FIX-DROP-HUD
日期：2026-07-06
状态：ready-for-planner-visual-review

## 范围与红线

本轮产品代码只改：

- `assets/scripts/ui/components/game-scene-skeleton.ts`

额外提交截图证据：

- `coordination/reports/T-FIX-DROP-HUD-evidence/**`

未修改：

- `test/**`
- 纯层 `rules/game/ai/flow/data`
- lobby、scene、meta、resources、asset-keys
- game 层出牌轮转、`nextSeat`、P-G7 #3 座位映射

## 改动摘要

- `renderPlayArea` 将完整 `TableZones` 传入 `playAreaLayout`。
- `playAreaLayout` 对 side-seat 出牌新增同侧 HUD 安全 band：
  - 左家避让 `strengthMeter` / `memoryDock` 顶边。
  - 右家避让 `turnTimer` / `advisorDock` 顶边。
  - 单牌、对子、多行牌统一把牌区夹在 HUD 上方；8 张及以上仍保持两行布局，必要时按安全 band 缩放。
- 未改变 hero 出牌区、按钮、暂停面板、结算门控或座位显示映射。

## 执行者视觉自审勾销表

| 检查项 | 结论 | 证据 |
| --- | --- | --- |
| 左家 8 张顺子 × HUD 净空 | 自审通过。四横屏 zoom 均显示左家 8 张牌在强度/剩牌 HUD 上方，下排牌底不被 HUD 覆盖，角标可读 | `coordination/reports/T-FIX-DROP-HUD-evidence/contact-sheets/T-FIX-DROP-HUD-left-straight8-zoom-contact.png` |
| 左家单/对/顺子/飞机 | 自审通过。780 总览中四种左家出牌均让开强度/剩牌 HUD；顺子和飞机两行不互压 | `coordination/reports/T-FIX-DROP-HUD-evidence/contact-sheets/T-FIX-DROP-HUD-780-side-shapes-contact.png` |
| 右家单/对/顺子/飞机 | 自审通过。780 总览中四种右家出牌均让开计时/建议区；多牌不压 timer/advisor | `coordination/reports/T-FIX-DROP-HUD-evidence/contact-sheets/T-FIX-DROP-HUD-780-side-shapes-contact.png` |
| #2 既有：牌间不互压/标签不压牌 | 自审通过。侧家 8 张牌保持两行，角标和花色可读；本轮未改 last-action/seat feedback | 同上 |
| settled/相位/暂停面板/逆时针映射 | 自审通过。本轮未改相关逻辑与文件；截图仍显示 seat2 左、seat1 右 | 同上 |
| productErrors / failedResponses | 四横屏均 `[]` / `[]` | `coordination/reports/T-FIX-DROP-HUD-evidence/summary.json` |

说明：截图采集方式为进入真实 Cocos web-mobile `playing` 场景后，在浏览器会话内临时设置 `runtime.state.top` 为左/右侧测试牌型并 `render()`，仅用于视觉复现和截图；未写入产品代码，未修改 game 轮转。

## CDP 证据

- seed：`20260705`
- 本地服务：`http://127.0.0.1:18182/?seed=20260705`
- 构建产物：`build/web-mobile`
- 证据目录：`coordination/reports/T-FIX-DROP-HUD-evidence/`
- 覆盖：4 横屏 × 左/右 × 单牌/对子/8 张顺子/8 张飞机，共 32 张截图 + 4 张左家 8 张顺子 zoom + 2 张 contact sheet。

| 横屏档 | captures | productErrors | failedResponses |
| --- | ---: | --- | --- |
| 844x390 | 8 | `[]` | `[]` |
| 812x375 | 8 | `[]` | `[]` |
| 915x412 | 8 | `[]` | `[]` |
| 780x360 | 8 | `[]` | `[]` |

关键证据：

- `coordination/reports/T-FIX-DROP-HUD-evidence/contact-sheets/T-FIX-DROP-HUD-left-straight8-zoom-contact.png`
- `coordination/reports/T-FIX-DROP-HUD-evidence/contact-sheets/T-FIX-DROP-HUD-780-side-shapes-contact.png`
- `coordination/reports/T-FIX-DROP-HUD-evidence/summary.json`

## 构建与测试

```text
Cocos Creator 3.8.8 web-mobile build
COCOS_EXIT=36
... build Task (web-mobile) Finished in (4 s)ms ...
```

说明：本机 Creator CLI 仍返回既有 metrics exit code 36；日志包含 `build Task (web-mobile) Finished`，且后续 CDP 证据链成功。

```text
npm --prefix test test

Test Files  141 passed (141)
Tests       739 passed (739)
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

请规划者按双层视觉预审关重点复核：

1. `T-FIX-DROP-HUD-left-straight8-zoom-contact.png` 中四档左家 8 张顺子是否确实与强度/剩牌 HUD 净空，牌点数/花色全可读。
2. `T-FIX-DROP-HUD-780-side-shapes-contact.png` 中左/右侧单牌、对子、8 张顺子、8 张飞机是否无牌间互压、无 HUD 覆盖。
3. 本轮是否保持 P-G7 逆时针 UI 映射、暂停面板和 T-FIX-SETTLE settled 门控不回归。

规划者视觉审通过后，再交 `R-WAVE7 R:T-FIX-DROP-HUD` 做结构/证据审查。
