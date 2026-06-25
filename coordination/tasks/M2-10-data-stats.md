# M2-10 data-stats（战绩统计）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/stats.ts`（实现 + 本模块自有类型）
  - `assets/scripts/data/index.ts`（桶，架构已给出 `export * from './stats'`）
  - 可读不可改：`assets/scripts/game/*`、`test/data/stats.test.ts`
- 依赖：M2-01（`SeatIndex`/`Side`）+ M2-03（`Settlement`）
- 分支：`task/M2-10-data-stats`

## 目标
把一局结算结果累计进**真人玩家视角**的战绩。纯函数、不可变，为 M5 战绩页与存档铺垫。不涉及 Cocos、不落盘 IO（持久化是后续任务）。

## 公共 API 契约（见 stats.ts 桩）
```ts
export interface MatchStats {
  rounds: number;        // 总局数
  asLandlord: number;    // 当地主局数
  landlordWins: number;  // 当地主且赢的局数
  asFarmer: number;      // 当农民局数
  farmerWins: number;    // 当农民且赢的局数
  netScore: number;      // 累计净分（hero 座位得分之和）
}
export function emptyStats(): MatchStats;
export function recordRound(
  stats: MatchStats,
  r: { heroSeat: SeatIndex; landlord: SeatIndex; winner: Side; settlement: Settlement },
): MatchStats;
```

## 规则（纯、不可变）
- `emptyStats()`：所有字段为 0。
- `recordRound`：返回**新对象**，**不修改入参** `stats`。
  - `rounds + 1`。
  - hero 是否地主：`heroSeat === landlord` → `asLandlord+1`，否则 `asFarmer+1`。
  - hero 所在阵营是否赢：hero 是地主且 `winner==='landlord'`，或 hero 是农民且 `winner==='farmer'` → 对应 `landlordWins`/`farmerWins` +1。
  - `netScore + settlement.scores[heroSeat]`（地主赢则地主 +、农民 −，由 settlement 已保证三家和为 0）。
- 不 import `cc`。

## 验收（test/data/stats.test.ts，架构已写好）
- hero 当地主且赢：`asLandlord=1`、`landlordWins=1`、`netScore += scores[hero]`。
- hero 当农民且赢 / 且输：`asFarmer`、`farmerWins`、`netScore` 正确累计。
- 连续 `recordRound` 多局：各计数与 `netScore` 等于各局 `scores[heroSeat]` 之和。
- 入参 `stats` 不被修改（不可变）。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。
