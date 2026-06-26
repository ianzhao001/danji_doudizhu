# M5-G7 AI 出牌保守策略路径 green-guard

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/ai/conservative-action-paths.test.ts`（新，纯测试）
  - 可读不可改：`assets/scripts/ai/**`（**仅出牌阶段**：`baseline.ts`/`strategy.ts`/`levels/*.ts`，**不 import `ai/bidding*.ts`**）、`assets/scripts/game/**`、`assets/scripts/rules/**`、`test/ai/**`（既有不可改）
- 依赖：M4 三档（`strategyFor`）已并 main
- 分支：`task/M5-G7-conservative-paths`
- **green-guard**：现码即对，新建测试应直接绿。
- **文件域边界**：本任务**不得** import `ai/bidding.ts`/`ai/bidding-levels.ts`（属 M4-10 任务域，避免合并冲突）。

## 背景
`ai/levels/_shared.ts` 的 `conservativeAction` 有几条未测路径：非收尾跟牌炸弹、自由领出仅炸弹 fallthrough、`isPressing` 边界 `handCounts===2`。

## 行为要求（纯测试、禁 cc）
1. 从 `../../assets/scripts/ai` 取 `strategyFor`/`AiLevel`（**不取 `chooseBid`/`chooseBidByLevel`**），构造 `GameSnapshot`。
2. 断言（用固定 rng）：
   - 跟牌阶段、手牌含炸弹且非收尾 → Normal/Hard 可能出炸弹压牌（`action.type==='play'` 且 `validatePlay` 过）。
   - 自由领出、手牌仅剩炸弹 → 出炸弹（`action.type==='play'`）。
   - `isPressing` 边界：`handCounts` 某对手 `===2` 时 Hard 行为与 `===3` 不同（锁 `<=2` 阈值——具体差异以代码为准）。
   - 所有产出动作 `validatePlay(action.cards, snapshot.top?.pattern ?? null).ok === true`（合法性护栏）。
3. 纯测试、禁 cc、不 import `ai/bidding*.ts`。

## 验收
- 新测试全绿、`npm --prefix test test` 全绿、`typecheck` 无错。

## 测试命令
`npm --prefix test test`
