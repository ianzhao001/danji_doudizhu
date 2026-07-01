# P-Text 可见文案清单（P-G copy rider）

> 目标2 的「可见文案打磨」侧。**不单独开执行分支、不改 `strings.ts`、不做集中化**——由 **P-G 在 `game-scene-skeleton.ts` 内直接消费本表**。经核实,大厅(lobby)可见文案均已 player-facing,**无 P-L 文案改动**;开发味/占位味文案集中在 game-scene。

## 统一座位命名（P-G 内新增小 helper `seatName(seat)`）
- seat 0 = `你`,seat 1 = `左家`,seat 2 = `右家`(与 `handCounts[1]=左家 / handCounts[2]=右家` 一致)。
- 地主后缀:`（地主）`。
- `seatName` 是 game-scene 内的本地纯函数,非新模块。

## old → new（均在 `assets/scripts/ui/components/game-scene-skeleton.ts`）

| 行(约) | old | new | 理由 |
|---|---|---|---|
| L335 | `地主 ${topBar.landlordSeat + 1}` | `地主：${seatName(landlordSeat)}` | 「地主 座位2」是开发者座位索引 → 玩家可读名 |
| L372–373 | `AI 左家\n${n}张…` / `AI 右家\n…` | `左家\n${n}张…` / `右家\n…` | 去开发味「AI」前缀,与 seatName 术语统一 |
| L426 | `座位${top.seat + 1}` | `seatName(top.seat)` | last-action 标签里的开发者座位索引 |
| L427 | `出牌区\n${labelText}` | `${seatName(top.seat)}·${labelText}` | 去占位式「出牌区」区域名,改为「谁·出了什么」 |
| L698 | `座位${row.seat + 1}${isLandlord?'(地主)':''}` | `${seatName(row.seat)}${isLandlord?'（地主）':''}` | 结算行 → 玩家可读名 + 全角括号 |

## 明确不改（已 player-facing / 非占位）
- `自由出牌`、`本局结算`、`暂停`、`退出对局？`、`确认后返回大厅`、HUD(`倍数 ×`、`手牌 N`、`计时 …`)、`轮到你/等待` 等 → 保留。
- **全部 lobby 文案**(教程高亮、战绩/历史标签、开关项、`暂无战绩` 等)→ 保留,无 P-L 改动。
- 与 `STRINGS` 重复的内联字面量(`出牌`/`提示`/`战绩` …)→ **本轮不强制走 `t()`**(不做集中化);`strings.ts` 不改。

## 验收（并入 P-G 验收）
- 横屏预览下:HUD/last-action/结算 无「座位N」「AI 左家」「出牌区\n」等开发味/占位文案。
- `seatName` 覆盖 0/1/2 且地主后缀正确;截图佐证。
