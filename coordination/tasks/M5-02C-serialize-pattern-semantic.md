# M5-02C 存档 top.pattern 语义一致性校验

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/serialize.ts`
  - 可读不可改：`assets/scripts/game/types.ts`、`assets/scripts/rules/**`、`test/game/**`
- 依赖：M5-02B（已并 main，shape 校验已就位）
- 分支：`task/M5-02C-serialize-pattern-semantic`

## 背景
M5-02B 把 `top.pattern` 校验补到了**形状**层（`category`/`mainRank`/`length`/`cards`/一致性），
但未校验**语义**：声明 `{category: Pair, mainRank: R7, length: 2}` 的 `cards` 实际可能是 `3 4`（不是对子），
形状合法却语义错误，断局重开仍会放过损坏 `TopPlay`。本任务用 `recognize(cards)` 与声明的 pattern 比对（评审意见 #1）。

## 行为要求（仅扩展 `deserializeRound` 的 `top.pattern` 校验）
1. `top !== null` 时，在 M5-02B 的形状校验**之后**追加语义校验：
   - `const recognized = recognize(pattern.cards)`（复用 `rules` 的 `recognize`）。
   - 若 `recognized === null` → `fail('top.pattern.cards is not a valid pattern')`。
   - 若 `recognized.category !== pattern.category` 或 `recognized.mainRank !== pattern.mainRank`
     或 `recognized.length !== pattern.length` → `fail('top.pattern semantics mismatch')`。
2. 不放宽任何既有校验；合法存档往返不变（合法 pattern 的 `recognize` 必与声明一致）。
3. 纯函数、禁止 import `cc`、禁止改导出签名。从 `../rules` 取 `recognize`（已导出）。

## 验收（test/game/serialize-semantic.test.ts，架构种入·不可改）
- 形状合法但 `cards` 非合法牌型（`3 4` 声明为 Pair）→ 抛错。
- `cards` 是合法牌型但 category 不符（`3 3` 声明为 Single）→ 抛错。
- `cards` 合法但 mainRank 不符（`7 7` 声明 mainRank=R3）→ 抛错。
- `cards` 合法但 length 不符（已在 M5-02B 覆盖形状层；本任务语义层亦应拦）→ 抛错。
- 完整合法 top.pattern（Pair 7 7）往返深相等（绿护栏）。
- 既有 `serialize*.test.ts` 全绿；`npm --prefix test run typecheck` 无错；未 import `cc`。

## 测试命令
`npm --prefix test test`
