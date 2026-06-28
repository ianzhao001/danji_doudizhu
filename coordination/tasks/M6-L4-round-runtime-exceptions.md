# M6-L4 异常流程加固（resume-to-settled / redeal-超限 / bidding 缺失 reason）

- 状态：**ready**（架构已 seed 失败测试 `test/flow/round-runtime-exceptions.test.ts` + `test/game/bidding-reasons.test.ts`）
- 派发模式：实现型 AI（worktree·`task/M6-L4`·纯逻辑·零 cc·可测）
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/round-runtime.ts`（resume-to-settled 补 settle 投影 + redead 超限契约）
  - `assets/scripts/game/bidding.ts`（保持 CALLER_MISSING/grabQueue reason 不变·护栏）
  - `test/flow/round-runtime-exceptions.test.ts`（架构已提供）
  - `test/game/bidding-reasons.test.ts`（架构已提供）
- 依赖：无（复用 `finishIfSettled`/`settleFromGameEvents`/`winEventFrom`）
- 分支：`task/M6-L4`

## 目标
补未覆盖异常路径：resume 到已结算局的 settlement 契约、redead 超 `DEFAULT_MAX_REDEALS` 的 runtime 终态、bidding grabbing 阶段 reason 护栏。

## 行为要求（测试已钉死·见 round-runtime-exceptions + bidding-reasons）

### 缺口 1（真红）：resume-to-settled
- 当前 `RoundRuntimeImpl` 构造器（`round-runtime.ts:121`）resume 到 `phase=Settled` 时只设 `currentPhase='settled'`，**不调 `finishIfSettled`** → `settlement()` 返回 null、`onSettled` 不触发。
- 修复：resume 路径若 `resume.state.phase === GamePhase.Settled` 且 resume 携带 win 事件，调 `finishIfSettled`（或等价 settle 投影），使 `settlement()` 非 null、`onSettled` 触发一次。
- 幂等：重复 flush 不重复触发 `onSettled`（复用 `settledNotified` 守卫）。
- 三方分数零和。

### 缺口 2（契约钉死）：redead 超限
- 当前 `redeal`（`:316-319`）redeals 超 `DEFAULT_MAX_REDEALS` 后静默设 `currentPhase='disposed'`，不发 settle 事件。
- 测试钉死契约：超限后 `phase==='disposed'` 且**不**产出 `settled` 事件。实现方须与此契约对齐；若需改为抛错须同步改 spec 与 driver.ts:237 的对应语义（先与架构确认）。

### 缺口 3（绿护栏）：bidding grabbing reason
- `bidding-reasons.test.ts` 锁死 `CALLER_MISSING`（`bidding.ts:104`，caller===null 护栏）与 grabbing 阶段非队首 grab 的 `NOT_TURN`（`:105`）。这两条 reason 代码已抛，测试为绿护栏防回归。实现方若重构 bidding 须保持 reason 文本与抛出点不变。

## 验收
- `npm --prefix test test` 全绿（`round-runtime-exceptions.test.ts` 缺口1转绿、缺口2契约通过；`bidding-reasons.test.ts` 绿护栏通过）
- `npm --prefix test run typecheck` 无错
- 仅改声明的文件域；未 import `cc`（flow/game 层）

## 测试命令
`npm --prefix test test`

## 后续
M6-L5 selfplay 须 rebase 确认改了 round-runtime settle 行为后 1..50 仍全绿。
