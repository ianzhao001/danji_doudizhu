# M-FLOW-05 叫抢测试/文档语义对齐（架构授权的测试维护）

- 状态：ready（低优先）
- 文件域（**只允许改这些**）：
  - `test/flow/policies.test.ts`（**本任务例外授权**改其中指定断言；其余测试仍不可改）
  - `coordination/tasks/M-FLOW-04-bid-level-policy.md`（spec 文案对齐）
  - 可读不可改：`assets/scripts/flow/**`、`assets/scripts/ai/**`、其余 `test/**`
- 依赖：M-FLOW-04（已并 main `a2f4828`）
- 分支：`task/M-FLOW-05-bid-test-align`

## 背景
M-FLOW-04 把 `bidPolicy` 切到 `chooseBidByLevel` 后，遗留两处语义不一致（评审建议 1.3 / 1.3b），均**不影响功能、不改产品代码**：
1. `test/flow/policies.test.ts`（M-FLOW-03 种入）第 40–48 行那条 `it('bidPolicy calling 强手 → call 且深相等 chooseBid；弱手 → pass')`：断言仍写「深相等 `chooseBid`」，当前为绿仅因所用强手（火箭）/弱手（0 高牌）在 Hard 与基线阈值下结果**恰好相同**——属虚假语义，易误导。
2. M-FLOW-04 spec 验收第 3 条要求 `policies-bid.test.ts` 含 `runHeadlessRound` 注入性测试，实则该覆盖在 `policies.test.ts`（M-FLOW-03）里、`policies-bid.test.ts` 未含——spec 文案与种子不符。

## 行为要求
1. 改 `policies.test.ts` 那条 `bidPolicy` 用例：
   - 断言对象从 `chooseBid(hand, calling)` 改为 `chooseBidByLevel(hand, calling, LEVELS[0])`（`LEVELS[0]===Hard`），并相应 `import { chooseBidByLevel }`；用例标题改述为「按座位难度路由（深相等 `chooseBidByLevel(...,LEVELS[seat])`）」。
   - **保持该用例及全套测试为绿**（强手/弱手仍 call/pass，仅断言对象更精确）。**只动这一条用例**，勿碰文件内其他断言。
2. 改 `M-FLOW-04-bid-level-policy.md` 验收第 3 条：把「`policies-bid.test.ts` 含 runHeadlessRound」改述为「`runHeadlessRound` 可注入性由 `policies.test.ts`（M-FLOW-03）覆盖，本任务不重复种入」。
3. 不改任何产品代码；不新增/删除测试用例（仅就地修正指定断言与文案）。

## 验收
- `npm --prefix test test` 全绿（用例数不变）、`typecheck` 无错。
- `git diff` 仅触及上述两文件的指定处。

## 测试命令
`npm --prefix test test`
