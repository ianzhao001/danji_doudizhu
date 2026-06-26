# M-FLOW flow 增强（HeadlessRoundError 诊断 + playPolicy 注入）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/driver.ts`（消费 playPolicy + 异常路径抛 HeadlessRoundError）
  - `assets/scripts/flow/types.ts`（接口已由架构落桩；如需补字段须保持向后兼容、勿改既有签名）
  - 可读不可改：`assets/scripts/ai/**`、`assets/scripts/game/**`、`assets/scripts/rules/**`、`test/flow/**`、`test/selfplay/**`
- 依赖：M2-06 / M2-07（已并 main）
- 分支：`task/M-FLOW-diagnostics`

## 背景
M2-07 selfplay 在 `runHeadlessRound` 自身抛错时拿不到 turns/landlord/最后事件（`test/selfplay/runner.ts` 会把失败包成空 partial）。本任务让 flow 抛携带局部诊断的专用错误，并把出牌决策开放为可注入策略，为 M4-04 难度差异 selfplay 铺路。接口（`HeadlessRoundError` 类、`FlowConfig.playPolicy`、`PlayPolicy` 类型）已在 main 落桩，**driver 行为待实现**。

## 行为要求
1. **playPolicy 注入**：`driver.ts` 出牌决策（现 `const action = chooseAction(snap, rng)`）改为
   `const action = (config.playPolicy ?? defaultPlayPolicy)({ seat: state.turn, snapshot: snap, rng });`
   其中 `defaultPlayPolicy` 包装 baseline `chooseAction`，保证**未注入时逐位行为与现状完全一致**（selfplay/driver.test 不变）。
2. **HeadlessRoundError 诊断**：超 `maxTurns`、结算缺 `win` 等异常路径改抛 `HeadlessRoundError`，填充：
   - `seed`、`turns`（已进行回合数）、`landlord`、`lastEvents`（`events` 末尾 N 条，N≥10 或不足则全部）。
   - `message` **必须含 seed**（保持现有 `rejects.toThrow('42')` 绿）。
   - 叫抢阶段错误（无 landlord / 超 maxRedeals）可保持现状普通 Error（含 seed），或一并迁移，但**不得破坏现有 driver.test**。
3. 纯逻辑、只做编排、不重判规则；禁止 import `cc`；除已落桩的可选项外禁止改公共签名。

## 验收（test/flow/diagnostics.test.ts，不可改）
- 注入 playPolicy：自定义 policy 被调用（次数 > 0，且 = `result.turns`），跑到 settled。
- `maxTurns=1` 抛 `HeadlessRoundError`：`instanceof HeadlessRoundError`、`seed===42`、`turns≥1`、`lastEvents.length>0`、`message` 含 `42`。
- 现有 `test/flow/driver.test.ts`（5 用例）与 `test/selfplay/**` 必须保持绿（默认 playPolicy 向后兼容）。
- `npm --prefix test test` 全绿、`npm --prefix test run typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
