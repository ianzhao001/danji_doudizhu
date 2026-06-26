# M5-G2 illegal-action 精确 reason green-guard

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/game/illegal-action-reasons.test.ts`（新，纯测试）
  - 可读不可改：`assets/scripts/game/**`、`test/game/**`（既有不可改）
- 依赖：M2-01/M2-02 已并 main
- 分支：`task/M5-G2-illegal-reasons`
- **green-guard**：现码即对，新建测试应直接绿。

## 背景
`IllegalActionError` 带 `reason` 码，但既有测试只查**异常类**不查 `reason` 串——reason 可静默漂移，而 UI/driver 会按 reason 分支。锁精确串。

## 行为要求（纯测试、禁 cc）
1. 构造场景触发各 reason，断言 `e.reason === '<CODE>'`（用 `expect(() => ...).toThrow()` 后取 `reason`，或 try/catch）。
2. core 侧（`game/core.ts`）reason：`ROUND_SETTLED`（已结算再出牌）、`NOT_TURN`（非该座出牌）、`CARD_NOT_IN_HAND`（手里没这牌）、`PASS_WITHOUT_TOP`（自由领出时过牌）。
3. bidding 侧（`game/bidding.ts`）reason：`BIDDING_CLOSED`（done/redeal 阶段行动）、`NOT_TURN`（非该座叫抢）、`CANNOT_GRAB_BEFORE_CALL`（calling 阶段抢）、`CANNOT_CALL_WHILE_GRABBING`（grabbing 阶段叫）。
4. 纯测试、禁 cc。**实现方须先核对 `game/core.ts`/`bidding.ts` 实际 reason 串**——若与上述不符，以代码为准并在报告记差异（可能 needs-fix）。

## 验收
- 新测试全绿、`npm --prefix test test` 全绿、`typecheck` 无错。

## 测试命令
`npm --prefix test test`
