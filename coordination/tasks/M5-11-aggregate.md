# M5-11 一局结果→战绩/记录 聚合纯函数

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/aggregate.ts`（新）
  - `assets/scripts/data/index.ts`（桶由架构维护，已加 `export * from './aggregate'`）
  - 可读不可改：`assets/scripts/data/{stats,records}.ts`、`assets/scripts/game/**`、`assets/scripts/flow/types.ts`（`FlowResult` 可读）、`test/data/**`
- 依赖：M2-10（`recordRound`/`RoundOutcome`/`MatchStats`）+ M5-09（`appendRecord`/`RecordEntry`/`RecordsState`）+ M-FLOW（`FlowResult`）已并 main
- 分支：`task/M5-11-aggregate`

## 背景
「战绩统计」「对局历史」的 codec/storage 已有（M5-08/M5-09），但缺**生产者**：把一局 `FlowResult`/`Settlement` 折算成 `RoundOutcome`+`RecordEntry` 并累入 `MatchStats`/`RecordsState`。本任务补这条纯逻辑链，闭合 QA「本地设置和战绩可保存」。

## 公共 API 契约（架构固定）
```ts
export function toRoundOutcome(result: FlowResult, heroSeat: SeatIndex): RoundOutcome;
export function toRecordEntry(result: FlowResult, heroSeat: SeatIndex, playedAt: number): RecordEntry;
export function applyFinishedRound(
  stats: MatchStats, records: RecordsState,
  result: FlowResult, heroSeat: SeatIndex, playedAt: number,
): { stats: MatchStats; records: RecordsState };
```

## 行为要求
1. `toRoundOutcome(result, heroSeat)`：返回 `{ heroSeat, landlord: result.landlord, winner: result.winner, settlement: result.settlement }`（纯投影，复用 `RoundOutcome` 形状）。
2. `toRecordEntry(result, heroSeat, playedAt)`：`heroScore = result.settlement.scores[heroSeat]`；其余字段从 `result`：`landlord=result.landlord`、`winner=result.winner`、`multiplier=result.settlement.multiplier`、`bombs=result.settlement.bombs`、`spring=result.settlement.spring`。
3. `applyFinishedRound(...)`：`stats' = recordRound(stats, toRoundOutcome(result, heroSeat))`；`records' = appendRecord(records, toRecordEntry(result, heroSeat, playedAt))`；返回 `{stats: stats', records: records'}`。**不可变**（复用 `recordRound`/`appendRecord` 的不可变性）。
4. 纯函数、确定性、禁 import `cc`。从 `./stats` 取 `MatchStats`/`RoundOutcome`/`recordRound`，从 `./records` 取 `RecordsState`/`RecordEntry`/`appendRecord`，从 `../flow`（type-only）取 `FlowResult`，从 `../game`（type-only）取 `SeatIndex`。

## 验收（test/data/aggregate.test.ts，架构种入·不可改）
- `toRoundOutcome`：字段深相等 `result` 对应字段、`heroSeat` 透传。
- `toRecordEntry`：`heroScore===settlement.scores[heroSeat]`、其余字段对齐。
- `applyFinishedRound`：`stats.rounds`+1、`records.entries` 末尾追加该 entry、入参 `stats`/`records` 不被改动（不可变）。
- 连续两局：`applyFinishedRound(applyFinishedRound(s0,r0,res1,...), r1, res2, ...)` 的 `stats.rounds===2`、`records.entries.length===2`。
- **stats 语义（加固）**：hero 为地主且赢→`asLandlord`/`landlordWins`+1、`netScore=+scores[hero]`；hero 为农民且赢→`asFarmer`/`farmerWins`+1、`netScore` 正；hero 为农民但地主赢→`farmerWins` 不增、`netScore` 负；多局 `netScore` = 各局 `scores[hero]` 之和、`entries` 顺序（playedAt/heroScore）保真。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
