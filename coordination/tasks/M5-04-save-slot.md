# M5-04 断局存档槽位纯模型

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/save.ts`（新）
  - 可读不可改：`assets/scripts/data/index.ts`（桶由架构维护，已加导出）、`assets/scripts/game/**`、`test/data/**`
- 依赖：M5-02（已并 main，复用其校验）
- 分支：`task/M5-04-save-slot`

## 背景
断局重开需要一个**无 IO 的纯数据**存档槽位：包住一局 `RoundState` 加元数据，
并复用 M2-04/M5-02 已校验的 `serializeRound`/`deserializeRound` 做往返与损坏检测。
本任务只定义模型与编解码，**不做 localStorage 等本地 IO**（IO 属后续 M5）。

## 行为要求
1. 类型 `SaveSlot { version: number; savedAt: number; round: RoundState }`；导出 `SAVE_VERSION`（当前=1）。
2. `serializeSave(slot: SaveSlot): string`：产出 `{ version, savedAt, round }` 的 JSON；
   `round` 字段复用 `serializeRound(slot.round)`（即内层为已版本化字符串），保证单一编解码真相源。
3. `deserializeSave(json: string): SaveSlot`：
   - 解析外层；`version !== SAVE_VERSION` 或 `savedAt` 非有限数 → 抛错（前缀 `corrupted save slot:`）。
   - 内层 `round` 经 `deserializeRound(...)` 还原+校验（损坏 round 透传其抛错）。
   - 返回 `{ version, savedAt, round }`。
3. 纯函数、确定性、禁止 import `cc`、禁止本地 IO。

## 验收（test/data/save.test.ts，架构种入·不可改）
- `serializeSave` → `deserializeSave` 往返：`round` 深相等、`savedAt`/`version` 保真。
- 内层 round 损坏（如缺字段）→ `deserializeSave` 抛错。
- 外层 `version` 不符 → 抛错；`savedAt` 非数 → 抛错。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
