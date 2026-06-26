# M5-02 存档深校验（top + 有界深层结构校验）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/serialize.ts`
  - 可读不可改：`assets/scripts/game/types.ts`、`assets/scripts/rules/*`、`test/game/**`
- 依赖：M5-01（已并 main）
- 分支：`task/M5-02-serialize-deep`

## 背景
M5-01 的 `deserializeRound` 只做 **7/8** 浅必需字段校验（**漏 `top`**，根因是 M5-01 spec 未列），且不校验结构深度。断局重开需对损坏存档明确拒绝，防止损坏数据进入运行时崩溃。

## 行为要求（在 M5-01 基础上扩展，保持 version 校验与往返语义）
1. **`top` 纳入必需字段**：`top: null` 合法；缺 `top`（`hasOwnProperty` 为 false）非法。
2. **有界深层结构校验**（仅运行时安全，不重判牌型规则）：
   - `seats`：数组且 `length===3`；每项为对象 `{ index ∈ {0,1,2}, hand: 数组 }`；三个 `index` 恰为 0/1/2。
   - `turn` / `landlord ∈ {0,1,2}`。
   - `phase ∈ GamePhase` 取值；`winner ∈ Side` 取值 或 `null`。
   - `top === null` 或 `{ seat ∈ {0,1,2}, pattern: 对象且 pattern.category ∈ Category、pattern.mainRank 为 number }`。
   - `passesInARow` / `bombsPlayed` 为 `number` 且 `≥ 0`。
   - `hand` 内每张牌结构成形：`{ rank: number, suit ∈ Suit }`。
3. 任一不满足 → `throw new Error('corrupted round state: <可读原因>')`。
4. **复用** `game`/`rules` 导出的枚举（`GamePhase`/`Side`/`Category`/`Suit`/`Rank`）做守卫，勿硬编码、勿重造。纯函数；禁止 import `cc`；禁止改签名。

## 验收（test/game/serialize-deep.test.ts，不可改）
- `top: null` 往返合法；缺 `top` → 抛错。
- `seats` 非数组 / 长度≠3 → 抛错。
- `phase` 非法枚举值 → 抛错。
- `top.pattern` 缺 `category` → 抛错。
- 完整合法深状态 `deserialize(serialize(s))` 与 s 深相等。
- 现有 `serialize.test.ts` + `serialize-version.test.ts` 保持绿。
- `npm --prefix test test` 全绿、`npm --prefix test run typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
