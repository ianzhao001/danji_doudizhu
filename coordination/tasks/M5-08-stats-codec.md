# M5-08 战绩统计编解码（容错迁移）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/statsCodec.ts`（新）
  - 可读不可改：`assets/scripts/data/index.ts`（桶由架构维护，已加导出）、`assets/scripts/data/stats.ts`、`test/data/**`
- 依赖：M2-10（`MatchStats`/`emptyStats` 已并 main）
- 分支：`task/M5-08-stats-codec`

## 背景
战绩统计需落盘。本任务给 `MatchStats` 做纯 JSON 编解码 + 容错迁移（与 M5-05 设置 codec 同模式），
为后续 stats 存储（M5-06 同形 adapter）铺垫。损坏/旧版数据安全回 `emptyStats()`。

## 行为要求
1. `STATS_VERSION = 1`。
2. `serializeStats(stats: MatchStats): string`：`JSON.stringify({ version: STATS_VERSION, stats })`。
3. `deserializeStats(json: string): MatchStats`：
   - `JSON.parse` 失败 → `emptyStats()`（不抛错）。
   - 解析成功 → 校验/容错还原：非对象 → `emptyStats()`；`version` 不符或缺 → `emptyStats()`；
     各数值字段缺/非有限数 → 用 `emptyStats()` 对应字段补；返回**完整当前形** `MatchStats`。
4. 纯函数、确定性、禁止 import `cc`。从 `./stats` 取 `MatchStats`/`emptyStats`。

## 验收（test/data/stats-codec.test.ts，架构种入·不可改）
- `serialize→deserialize` 往返深相等。
- `deserializeStats('not json')` → `emptyStats()`（不抛错）。
- `deserializeStats('{}')` → `emptyStats()`。
- 部分字段对象：缺 `landlordWins` → 该字段回 0、其余保留合法值。
- `version` 缺/旧 → 全默认。
- 非数值字段（如 `rounds: 'x'`）→ 该字段回 0。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
