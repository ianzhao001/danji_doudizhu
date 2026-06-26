# M5-12b 数据编解码加固（records 数值收紧 + statsCodec version 策略）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/records.ts`
  - `assets/scripts/data/statsCodec.ts`
  - 可读不可改：`assets/scripts/data/{index,stats}.ts`、`assets/scripts/game/**`、`test/data/**`
- 依赖：M5-08（statsCodec）+ M5-09（records）已并 main
- 分支：`task/M5-12b-data-codec-hardening`

## 背景
`records.ts` 的 `migrateEntry` 对 `multiplier`/`bombs`/`heroScore`/`playedAt` 只用 `finiteNumberOrDefault`（接受负数/小数，如 `multiplier: -5` 或 `1.5` 原样存活）；`statsCodec.ts` 对未知 version 静默回 `emptyStats`（策略正确但无护栏测试）。落盘数据应早收紧。

## 行为要求
1. `records.ts` `migrateEntry`：
   - `multiplier`/`bombs`/`playedAt` 收紧为**非负整数**（`Number.isInteger && >=0`，否则回默认：`multiplier→1`、`bombs→0`、`playedAt→0`）。
   - `heroScore` 收紧为**整数**（允许负——hero 得分可为负；非整数→回 0）。
   - 用一个 `nonNegIntOrDefault(value, fallback)` / `intOrDefault(value, fallback)` 局部 helper（不导出）。
2. `statsCodec.ts`：明确 version 策略——`parsed.version !== STATS_VERSION` → `emptyStats()`（现状即如此，**行为不变**，仅补注释+护栏）。各数值字段已用 `numberOrDefault`（finite），不变。
3. 不改任何导出签名；既有合法数据往返不变。
4. 纯函数、禁 import `cc`。

## 验收（test/data/records-migration.test.ts，架构种入·不可改）
- `migrateEntry` 各字段缺失→默认（`multiplier→1`、`bombs→0`、`heroScore→0`、`playedAt→0`、`heroSeat→0`、`winner→Farmer`、`spring→'none'`）。
- `multiplier: -5` → 1；`multiplier: 1.5` → 1；`bombs: -1` → 0；`bombs: 2.5` → 0；`playedAt: -1` → 0；`playedAt: 1.5` → 0。
- `heroScore: -10`（负整数）→ **保留 -10**（允许负）；`heroScore: 1.5` → 0。
- `winner: 'x'` → `Side.Farmer`；`spring: 'x'` → `'none'`。
- 合法 records 经 `migrateRecords` 幂等（深相等）。
- 既有 `records.test.ts`/`stats-codec.test.ts` 全绿。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
