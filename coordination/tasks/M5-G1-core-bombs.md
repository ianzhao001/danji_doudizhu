# M5-G1 core 炸弹计数/事件 green-guard

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/game/core-bombs.test.ts`（新，纯测试）
  - 可读不可改：`assets/scripts/game/**`、`test/game/**`（既有不可改）
- 依赖：M2-01（`apply`/`createPlayingRound`）已并 main
- 分支：`task/M5-G1-core-bombs`
- **green-guard**：行为已实现，新建测试**应直接全绿**；若红说明发现真 bug，记报告置 changes-requested。

## 背景
`game/core.ts` 的 `apply` 在出炸弹/火箭时会 `bombsPlayed++` 并发 `bomb`/`rocket` 事件——settlement 的炸弹计数依赖此源头，但 core 侧**零直接覆盖**（settlement 只从 events 数）。锁此不变量防回归。

## 行为要求（纯测试、禁 cc）
1. 从 `../../assets/scripts/game` 取 `apply`/`createPlayingRound`/`GamePhase` 等，从 `../../assets/scripts/rules` 取 `cards` 构造手牌与炸弹。
2. 断言：
   - 出炸弹（四同点）后：`state.bombsPlayed` +1、`events` 含一个 `{type:'bomb'}`。
   - 出火箭（双王）后：`state.bombsPlayed` +1、`events` 含一个 `{type:'rocket'}`。
   - 出普通单张/对子后：`state.bombsPlayed` 不变、`events` 不含 bomb/rocket。
3. 纯测试、禁 cc、不改既有测试。

## 验收
- 新测试全绿、`npm --prefix test test` 全绿、`typecheck` 无错。

## 测试命令
`npm --prefix test test`
