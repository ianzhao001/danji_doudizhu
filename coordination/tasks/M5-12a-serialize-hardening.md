# M5-12a 存档序列化加固（数值整数化 + 错误约定统一 + Settled 往返）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/serialize.ts`
  - 可读不可改：`assets/scripts/game/{types,core}.ts`、`assets/scripts/rules/**`、`test/game/**`
- 依赖：M5-02B/M5-02C（serialize 已含形状+语义校验）已并 main
- 分支：`task/M5-12a-serialize-hardening`
- **合并时序**：须在 `task/M5-10-resume` **之前**合并（M5-10 的 resume/migrate 依赖本任务的 serialize 错误约定）。

## 背景
`serialize.ts` 三处加固点：① `passesInARow`/`bombsPlayed` 用 `assertNonNegativeNumber`（接受 `1.5` 小数），应是整数；② 文件内错误约定不统一（`fail()`→`corrupted round state:` vs 行 121–125 裸 `throw new Error('corrupted save data:...')`）；③ 只测了 `Playing`/`winner:null` 往返，`Settled`+`winner≠null` 未锁。

## 行为要求
1. `passesInARow`、`bombsPlayed` 改用 `assertNonNegativeInteger`（**已在本文件定义**，复用之），`fail('round.<field> must be a non-negative integer')`。
2. 统一错误约定：行 121–125 的 `throw new Error('corrupted save data: ...')`/`'unsupported save version: ...'` 改走 `fail()`（即 `throw new Error('corrupted round state: <reason>')`），与文件内既有 `fail()` 一致。**错误 reason 文本可调整**（M5-10 测试只断言 `toThrow()` 不锁文案，故不冲突）。
3. 不放宽任何既有校验；合法存档往返不变。
4. 纯函数、禁 import `cc`、禁止改导出签名。

## 验收（test/game/serialize-integer-fields.test.ts + test/game/serialize-settled.test.ts，架构种入·不可改）
- `passesInARow: 2.5` → 抛错；`passesInARow: -1` → 抛错；`bombsPlayed: 1.5` → 抛错。
- `Settled` + `winner: Side.Landlord` + 非 null `top` 的 round 经 `serializeRound`→`deserializeRound` 往返深相等（绿护栏，覆盖既有未测的终局态）。
- `winner` 非法值（如 `'x'`）→ 抛错。
- 既有 `serialize*.test.ts` 全绿（不锁错误文案的断言不受影响；锁文案者由架构确认无）。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
