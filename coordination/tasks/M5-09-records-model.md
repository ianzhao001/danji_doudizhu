# M5-09 对局历史记录纯模型

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/records.ts`（新）
  - 可读不可改：`assets/scripts/data/index.ts`（桶由架构维护，已加导出）、`assets/scripts/game/**`、`test/data/**`
- 依赖：M2-03（`Settlement`）/ M2-10（`Side`）已并 main
- 分支：`task/M5-09-records-model`

## 背景
战绩统计是「累计数字」；对局历史是「逐局列表」，供 UI 战绩页展示最近 N 局。
本任务做纯不可变模型：追加、裁剪、倒序、版本迁移。无 IO。

## 行为要求
1. `RecordEntry { heroSeat: SeatIndex; landlord: SeatIndex; winner: Side; multiplier: number; bombs: number; spring: Spring; heroScore: number; playedAt: number }`。
2. `RECORDS_VERSION = 1`；`emptyRecords(): { version: number; entries: RecordEntry[] }`（entries 为空数组）。
3. `appendRecord(records, entry): typeof records`：**不可变**追加到末尾；若长度超过 `MAX_RECORDS`（默认 50，导出常量）则**裁剪最旧**（保留最近 50）。
4. `recentRecords(records, n): RecordEntry[]`：返回最近 n 局，**按时间倒序**（最新在前），n 超过长度则返回全部倒序。
5. `migrateRecords(raw: unknown): typeof emptyRecords()`：容错（非对象→空、缺字段→补、旧 version→迁当前）；不抛错。
6. 纯函数、不可变、禁止 import `cc`。`Side`/`Spring` 从 `../game` 取（`Settlement` 已导出 `Spring`）。

## 验收（test/data/records.test.ts，架构种入·不可改）
- `appendRecord` 不可变（入参不变）、追加到末尾、长度+1。
- 超过 `MAX_RECORDS` 裁剪最旧（长度恒为 `MAX_RECORDS`，最旧被丢）。
- `recentRecords(n)` 倒序、最新在前、n 超长返回全部倒序。
- `migrateRecords({})` → `emptyRecords()`；`migrateRecords(null/'x')` → `emptyRecords()`。
- 合法 records 经 `migrateRecords` 幂等（深相等）。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
