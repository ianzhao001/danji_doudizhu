# M4-03 ai-hard 困难 AI（积极控权 + 择时炸弹·确定性）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/levels/hard.ts`（实现 `hardStrategy` 函数体）
  - 可读不可改：`assets/scripts/ai/strategy.ts`、`assets/scripts/ai/index.ts`、`assets/scripts/game/types.ts`、`assets/scripts/rules/*`、`test/ai/hard.test.ts`
- 依赖：M4 接口契约（已在 main）+ rules。**注意**：并行期 `normal.ts` 可能仍是桩，故 **hard 必须自包含**，不得在运行时调用 `normalStrategy`（应自行复制保守逻辑）。
- 分支：`task/M4-03-ai-hard`

## 目标
在「保炸弹的保守策略」基础上，对**濒临出完的对手**积极控权：任一对手 `handCounts` 很少时用炸弹/火箭或大牌强行压制抢回牌权；否则走保守策略。确定性、不依赖 `rng`。

## 公共 API 契约
```ts
export const hardStrategy: AiStrategy; // 约定同 M4-01
```
- 取用方式：`strategyFor(AiLevel.Hard)`。
- 座位：己方 = `snapshot.turn`，其余两席为对手；对手剩牌数取 `snapshot.handCounts[seat]`。

## 行为要求（决策树）
1. `pressing` = 存在对手 `handCounts[seat] <= 2`（阈值 2）。
2. **pressing 且持炸弹/火箭且当前可出/可压** → 出炸弹/火箭压制（多个炸弹取最小，火箭最后用）。
3. 否则走「保炸弹」保守策略（同 M4-02 决策树：安全候选最小，必要时才动炸弹 / 出完即胜）。
- **自包含**：复制保守逻辑，**不要** `import { normalStrategy }` 运行时调用（normal 并行期可能为桩会抛错）。确定性、绝不非法、不 import `cc`。

## 验收（test/ai/hard.test.ts，不可改）
- `handCounts=[5,1,3]`、top=对手单`3`、手牌 `6 4 4 4 4` → 出炸弹 `4444`（对手濒死，积极压制）。
- `handCounts=[5,5,5]`、top=对手单`3`、手牌 `6 4 4 4 4` → 出单 `6`（对手不危险，保炸弹）。
  - 两例仅 `handCounts` 不同、手牌与 top 相同，用以验证 pressing 阈值切换行为。
- `npm --prefix test test` 全绿、`npm --prefix test run typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
