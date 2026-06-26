# M5-04B 存档 canonical wire 回归护栏（测试补全）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/data/save-wire.test.ts`（新，纯测试）
  - 可读不可改：`assets/scripts/data/save.ts`、`assets/scripts/game/**`、`test/data/**`（既有断言不可改）
- 依赖：M5-04 + canonical wire 收紧（`05a3ae9` 已并 main）
- 分支：`task/M5-04B-save-wire-regression`

## 背景
`05a3ae9` 把 `serializeSave` 改为**恒输出 `SAVE_VERSION`**（不再透传 `slot.version`），与 `deserializeSave` 的 version 归一对称、自洽闭环；`deserializeSave` 用 try/catch 把非法 JSON 归一为 `corrupted('invalid JSON')`。但这两个行为**没有专用回归测试**（「version 归一化输出」完全没锁，「invalid JSON」仅由 save-storage 间接覆盖）。本任务补绿护栏，防有人改回 `slot.version` 或去掉 JSON 容错。

> **绿护栏**：行为已实现，实现方新建测试**应直接全绿**；本分支无桩、基于 main。

## 行为要求（纯测试、确定性、禁 cc）
1. 新建 `test/data/save-wire.test.ts`，从 `../../assets/scripts/data/save` 取 `serializeSave`/`deserializeSave`/`SAVE_VERSION`/`type SaveSlot`；构造合法 `RoundState`（可参考 `test/data/save.test.ts` 的 `validRound()`，**复制到本文件**，勿 import 既有测试）。
2. 断言（核心护栏）：
   - **canonical 输出**：`slot = { version: 0, savedAt: 1, round }`（version 故意 ≠ SAVE_VERSION）→ `JSON.parse(serializeSave(slot)).version === SAVE_VERSION`；`version: 999` 同理输出 `SAVE_VERSION`。
   - **往返**：`deserializeSave(serializeSave(slot))` 的 `version === SAVE_VERSION`、`round` 与原 `round` 深相等、`savedAt` 保真。
   - **invalid JSON**：`deserializeSave('not json')` 抛错且 `message` 含 `invalid JSON`。
   - **非对象顶层**：`deserializeSave('123')`、`deserializeSave('"x"')`、`deserializeSave('[]')` 抛错（`expected object`）。
3. 纯测试、禁 import `cc`、不改既有测试。

## 验收
- 新测试全绿、既有 `save*.test.ts` 全绿、`npm --prefix test run typecheck` 无错。
- `npm --prefix test test` 全绿。

## 测试命令
`npm --prefix test test`
