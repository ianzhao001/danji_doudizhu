# M3-00 结算弹窗视图模型（Settlement → VM）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/result-view.ts`（新；`ui/` 纯逻辑岛，本文件**禁止 import `cc`**）
  - 可读不可改：`assets/scripts/game/**`（`Settlement`/`Side`/`SeatIndex`）、`test/ui/**`
- 依赖：M2-03（`Settlement` 已并 main）
- 分支：`task/M3-00-result-view-model`

## 背景
结算弹窗需要：胜负文案、最终倍数、三家分数、春天/炸弹摘要。先做无 cc 纯函数，消费 `Settlement`。

## 行为要求（纯函数、确定性、禁 cc）
1. `ResultView { resultText: string; multiplier: number; bombs: number; springText: string; scores: { seat: SeatIndex; score: number; isLandlord: boolean }[] }`。
2. `deriveResultView(args: { settlement: Settlement; landlord: SeatIndex; heroSeat: SeatIndex }): ResultView`：
   - `resultText`：hero 赢 → `'胜利'`，输 → `'失败'`。胜负**由 hero 得分符号判定**：`settlement.scores[heroSeat] > 0` 即胜（三家分和为 0、地主方与农民方符号相反、无平局，故符号即胜负）。**`Settlement` 不含 winner 字段、入参也不传 winner**，不要去找。`heroSeat===landlord` 只用于标注 `isLandlord`，不参与胜负判定。
   - `multiplier`/`bombs`：透传 `settlement.multiplier`/`settlement.bombs`。
   - `springText`：`spring==='none'→''`、`'spring'→'春天'`、`'anti-spring'→'反春天'`。
   - `scores`：三座，每项 `{ seat, score: settlement.scores[seat], isLandlord: seat===landlord }`。
3. 纯函数、禁 cc、不改入参。从 `../game` 取 `Settlement`/`Side`/`SeatIndex`/`Spring`。

## 验收（test/ui/result-view.test.ts，架构种入·不可改）
- 地主赢、hero 是地主：`resultText==='胜利'`、`scores[hero].isLandlord===true`、`scores[hero].score>0`。
- 地主赢、hero 是农民：`resultText==='失败'`、`scores[hero].score<0`。
- 农民赢、hero 是农民：`resultText==='胜利'`、`scores[hero].score>0`。
- 三家 score 之和为 0；`multiplier`/`bombs` 透传；`spring` 各值文案正确。
- 入参不变。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
