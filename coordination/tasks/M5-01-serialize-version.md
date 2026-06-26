# M5-01 存档版本化（serialize version / schema 校验）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/serialize.ts`
  - 可读不可改：`assets/scripts/game/types.ts`、`test/game/**`
- 依赖：M2-04（已并 main）
- 分支：`task/M5-01-serialize-version`

## 背景
M2-04 当前为纯 JSON 直出直入（无版本 / 无校验）。为 M5 断局重开防线，序列化需带版本号，反序列化需校验版本与必需字段，对损坏 / 未知版本数据明确拒绝。

## 行为要求（向后兼容现有往返语义）
1. `serializeRound(state)`：输出顶层包装 `{ "version": 1, "state": <RoundState> }` 的 JSON。字段名固定为 `version`（当前值 `1`）与 `state`。
2. `deserializeRound(json)`：
   - `JSON.parse` 失败 → 抛错（保持现状）。
   - 顶层缺 `version` 或 `version !== 1`（含未来高版本）→ 抛明确错误。
   - 缺 `state`，或 `state` 缺必需字段（`phase` / `landlord` / `seats` / `turn` / `passesInARow` / `winner` / `bombsPlayed`）→ 抛明确错误。
   - 校验通过 → 返回**纯 `RoundState`**（剥去 version 包装，返回对象不得含 version）。
3. 纯函数；禁止 import `cc`；禁止改签名（`serializeRound(state: RoundState): string` / `deserializeRound(json: string): RoundState`）。
4. 错误统一 `throw new Error(...)`，消息可读（含原因，如 `unsupported save version` / `corrupted round state`）。

## 验收
- 现有 `test/game/serialize.test.ts`（往返深相等、非法 JSON 抛错）必须保持绿——往返语义不变（version 仅在 wire 层、不进入 `RoundState`）。
- 架构新增 `test/game/serialize-version.test.ts`（不可改）覆盖：
  - serialize 输出顶层 `version === 1`。
  - 带版本往返 `deserialize(serialize(s))` 与 s 深相等。
  - 缺 version 的裸 `RoundState` JSON → 抛错。
  - `version: 999` → 抛错。
  - `{ version: 1 }`（缺 state）→ 抛错。
- `npm --prefix test test` 全绿、`npm --prefix test run typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
