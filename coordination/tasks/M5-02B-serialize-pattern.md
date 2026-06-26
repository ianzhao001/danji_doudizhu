# M5-02B 存档 top.pattern 完整形校验

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/serialize.ts`
  - 可读不可改：`assets/scripts/game/types.ts`、`assets/scripts/rules/**`、`test/game/**`
- 依赖：M5-02（已并 main）
- 分支：`task/M5-02B-serialize-pattern`

## 背景
M5-02 的 `assertTop` 仅校验 `pattern.category` 与 `pattern.mainRank`，未校验 `pattern.length` / `pattern.cards`。
断局重开视角下，损坏的 `TopPlay`（缺 `cards`、`length` 与 `cards` 不一致、`cards` 含坏牌）会被放过。
本任务把 `top.pattern` 校验补成完整 `HandPattern` 形状校验（评审意见 #2）。

## 行为要求（仅扩展 `deserializeRound` 的运行时校验）
1. `top !== null` 时，除现有 `category`/`mainRank` 外，追加校验 `pattern`：
   - `length`：number、有限、非负整数。
   - `cards`：数组；每张牌结构成形（`rank ∈ Rank`、`suit ∈ Suit`）——复用现有 `assertCard`。
   - 一致性：`length === cards.length`。
2. 任一不满足 → `fail('<原因>')`（沿用 `corrupted round state:` 前缀）。
3. 不放宽任何既有校验；合法存档往返不变。纯函数、禁止 import `cc`、禁止改导出签名。

## 验收（test/game/serialize-pattern.test.ts，架构种入·不可改）
- `top.pattern` 缺 `cards` → 抛错。
- `top.pattern.cards` 非数组 → 抛错。
- `top.pattern.cards` 含非法牌（坏 `rank`）→ 抛错。
- `top.pattern` 缺 `length` / `length` 非数字 → 抛错。
- `length !== cards.length` → 抛错。
- 完整合法 `top.pattern` 往返深相等（绿护栏）。
- 既有 `serialize*.test.ts` 全绿；`npm --prefix test run typecheck` 无错；未 import `cc`。

## 测试命令
`npm --prefix test test`
