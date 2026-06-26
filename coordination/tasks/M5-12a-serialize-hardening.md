# M5-12a 存档序列化加固（数值整数化 + 错误约定统一 + Settled 往返）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/serialize.ts`
  - 可读不可改：`assets/scripts/game/{types,core}.ts`、`assets/scripts/rules/**`、`test/game/**`
- 依赖：M5-02B/M5-02C（serialize 已含形状+语义校验）已并 main
- 分支：`task/M5-12a-serialize-hardening`
- **合并时序**：须在 `task/M5-10-resume` **之前**合并（M5-10 的 resume/migrate 依赖本任务的 serialize 错误约定）。

## 背景
`serialize.ts` 三处加固点：① `passesInARow`/`bombsPlayed` 用 `assertNonNegativeNumber`（接受 `1.5` 小数），应是整数；② 文件内错误约定不统一（`fail()`→`corrupted round state:` vs 行 121–127（`assertVersionedSave` 内 4 处裸 `throw`，含行 127 `'corrupted round state: missing state'`） 裸 `throw new Error('corrupted save data:...')`）；③ 只测了 `Playing`/`winner:null` 往返，`Settled`+`winner≠null` 未锁。

## 行为要求
1. `passesInARow`、`bombsPlayed` 改用 `assertNonNegativeInteger`（**已在本文件定义**，复用之），`fail('round.<field> must be a non-negative integer')`。
2. 统一错误约定：行 121–127（`assertVersionedSave` 内 4 处裸 `throw`，含行 127 `'corrupted round state: missing state'`） 的 `throw new Error('corrupted save data: ...')`/`'unsupported save version: ...'` 改走 `fail()`（即 `throw new Error('corrupted round state: <reason>')`），与文件内既有 `fail()` 一致。**错误 reason 文本可调整**（M5-10 测试只断言 `toThrow()` 不锁文案，故不冲突）。
3. 不放宽任何既有校验；合法存档往返不变。
4. 纯函数、禁 import `cc`、禁止改导出签名。

## 验收（test/game/serialize-integer-fields.test.ts + test/game/serialize-settled.test.ts，架构种入·不可改）
- **红（须改产品码，仅非整数）**：`passesInARow: 2.5` → 抛错；`bombsPlayed: 1.5` → 抛错。现 `assertNonNegativeNumber` 用 `Number.isFinite` **接受小数**；实现方改 `assertNonNegativeInteger` 后转绿。
- 绿护栏（现码即拒/即受，锁不回归）：`passesInARow: -1` / `bombsPlayed: -1` → 抛错（现码 `<0` 已拒）；`passesInARow:0 / bombsPlayed:0` → 不抛（合法整数下界）；非数值类型（`'0'`）→ 抛错（类型护栏）。
- 注：`roundWith` 必须产出版本化 wire（`{version,state}`），否则会先因 missing version 抛错、令红断言因错误原因变绿——初版种子此 helper 漏了版本包裹，已在本次加固修正。
- `Settled` + `winner: Side.Landlord` + 非 null `top`（含 Single 与 **Bomb 四同点多卡** 两种 pattern、`bombsPlayed` 取 1/2）经 `serializeRound`→`deserializeRound` 往返深相等（绿护栏，覆盖既有未测的终局态与多卡 pattern）。
- `winner` 非法值（如 `'x'`）→ 抛错。
- 既有 `serialize*.test.ts` 全绿（不锁错误文案的断言不受影响；锁文案者由架构确认无）。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
