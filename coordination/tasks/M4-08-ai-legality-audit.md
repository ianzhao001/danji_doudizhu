# M4-08 AI 合法性不变量审计（测试护栏）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/ai/legality-matrix.test.ts`（新，纯测试；**可新增 helper 于 `test/ai/_*.ts`，不可改既有测试断言**）
  - 可读不可改：`assets/scripts/ai/**`、`assets/scripts/rules/**`、`assets/scripts/game/**`、`test/ai/**`（既有断言不可改）
- 依赖：M4 三档（`strategyFor` 已并 main）+ rules（`validatePlay`）
- 分支：`task/M4-08-ai-legality-audit`

## 背景
三档 AI 各自分支测试覆盖了「预期场景」，但缺一个**横切不变量**：在一组构造快照下，三档**永远**产出合法动作
（`validatePlay` 通过、且牌在 viewer 手里）。本任务是测试护栏，防未来改动引入非法动作。

## 行为要求（纯测试代码、确定性、禁 cc）
1. 构造一组「覆盖性」`GameSnapshot`（自由领出、跟单张、跟对子、跟顺子、手牌含炸弹/火箭、手牌少等）。
2. 对每个快照 × `{Simple, Normal, Hard}` × 固定 rng 集：`strategyFor(level)(snapshot, rng)` 产出 `RoundAction`。
3. 断言（**不变量，架构种入，实现方可加快照不可改这些断言**）：
   - `action.type ∈ {'play','pass'}`。
   - `play` 时：`validatePlay(action.cards, snapshot.top?.pattern ?? null).ok === true`（`RuleResult` 的字段是 `ok`）；
     且 `action.cards` 每张牌在 `viewerHand` 内（不偷牌）。
   - `pass` 仅当 `snapshot.top !== null`（自由领出不得 pass）。
4. 纯测试、禁 cc。从 `../../assets/scripts/rules` 取 `validatePlay`，`../../assets/scripts/ai` 取 `strategyFor`/`AiLevel`。

## 验收（test/ai/legality-matrix.test.ts，架构种入·不可改）
- 三档在所有构造快照下满足上述不变量（绿护栏；当前三档应已满足——若发现非法，记入报告并置 changes-requested）。
- `npm --prefix test test` 全绿、`typecheck` 无错。

## 测试命令
`npm --prefix test test`
