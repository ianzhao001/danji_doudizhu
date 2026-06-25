# M2-04 serialization（RoundState ↔ JSON）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/serialize.ts`（实现）
  - 可读不可改：`assets/scripts/game/types.ts`（用 `RoundState`）、`test/game/serialize.test.ts`
- 依赖：M2-01（types）
- 分支：`task/M2-04-serialization`

## 目标
`RoundState` 的序列化与反序列化，为 M5 断局重开铺垫。纯函数。

## 公共 API 契约（见 serialize.ts 桩）
- `serializeRound(state: RoundState): string`
- `deserializeRound(json: string): RoundState`

## 规则
- **往返一致**：`deserializeRound(serializeRound(s))` 与 `s` 深相等（含 `top.pattern`、每个 `seat.hand`、所有枚举字段）。
- 纯 JSON；`GamePhase`/`Side`（字符串枚举）与 `pattern.category`（数值枚举）原样保真。
- 反序列化对非法 JSON 抛错。

## 验收（test/game/serialize.test.ts）
- 构造含 `top`（如一手对子 `5 5`）与三家手牌的 `RoundState` → 往返后 `toEqual` 原状态。
- 反序列化非法字符串 → 抛错。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。
