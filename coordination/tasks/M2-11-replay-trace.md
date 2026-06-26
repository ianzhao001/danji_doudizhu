# M2-11 回放/调试 trace（事件流 → 可复盘摘要）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/replay.ts`（新）
  - 可读不可改：`assets/scripts/game/**`、`assets/scripts/flow/**`（`FlowEvent` 可读）、`test/game/**`
- 依赖：M2-01（`GameEvent`/`RoundAction`）/ M-FLOW（`FlowEvent`）已并 main
- 分支：`task/M2-11-replay-trace`

## 背景
调试/回放/失败报告需要从事件流生成可读 trace：每步动作、牌型、谁出、是否炸弹/过牌，
以及一个最小摘要（总局数、炸弹数、胜负、倍数）。先做无 cc 纯函数。

## 行为要求（纯函数、确定性、禁 cc）
1. `TraceLine { turn: number; seat: SeatIndex; kind: 'play'|'pass'|'bomb'|'rocket'|'reset'; summary: string }`。
2. `buildTrace(events: GameEvent[]): TraceLine[]`：把 `GameEvent` 序列转成 `TraceLine[]`，维护一个递增 `turn` 计数（每个 `play`/`pass`/`bomb`/`rocket`/`reset` 事件 +1）；`win` 事件不计 turn。
   - `play`：`summary` 含牌型 category 与 mainRank（如 `'play Single R3'`）。
   - `pass`/`bomb`/`rocket`/`reset`：对应文案。
3. `traceSummary(events: GameEvent[]): { turns: number; bombs: number; winner: Side | null }`：`turns`=`play`+`pass`+`bomb`+`rocket`+`reset` 计数；`bombs`=`bomb`+`rocket` 计数；`winner` 取 `win` 事件的 side（无则 null）。
4. 纯函数、禁 cc、不改入参。从 `./types` 取 `GameEvent`/`SeatIndex`/`Side`，`../rules` 取 `Category`（如需文案）。

## 验收（test/game/replay.test.ts，架构种入·不可改）
- 给定一组 `GameEvent`（play/pass/bomb/win 混合）：`buildTrace` 输出 `TraceLine[]` 顺序一致、`turn` 递增、`win` 不计入。
- `traceSummary`：`turns`/`bombs` 计数正确、`winner` 取自 `win` 事件、无 win 时 `winner===null`。
- 入参不变。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
