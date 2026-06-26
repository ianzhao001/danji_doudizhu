# M4-07 叫抢难度分层策略

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/bidding-levels.ts`（新）
  - 可读不可改：`assets/scripts/ai/index.ts`（桶由架构维护，已加导出）、`assets/scripts/ai/{bidding,strategy}.ts`、`assets/scripts/game/**`、`test/ai/**`
- 依赖：M2-09（`chooseBid` 已并 main）
- 分支：`task/M4-07-bid-levels`

## 背景
出牌已分三档（M4-01/02/03），但叫抢仍是单一基线 `chooseBid`。本任务按 `AiLevel` 分层叫抢，
后续 flow/UI（M-FLOW-03）可按座位难度统一选择叫抢策略。复用基线判强逻辑，只调阈值。

## 行为要求
1. `chooseBidByLevel(hand: Card[], state: BiddingState, level: AiLevel): BidAction`。
2. 三档以「高牌数」`highCardCount`（点数 ≥ `Rank.R2`，含 2 与双王）为主轴，火箭/炸弹一律视为强：
   - **Normal**：等价基线 `chooseBid`（`highCardCount ≥ 2` 或 火箭/炸弹 → 叫/抢）。**必须委派或深相等于 `chooseBid(hand, state)`**。
   - **Simple**（保守）：火箭/炸弹 或 `highCardCount ≥ 3` 才叫/抢，否则 pass。
   - **Hard**（积极）：火箭/炸弹 或 `highCardCount ≥ 1` 即叫/抢。
3. 阶段语义同基线：`calling`→`call`/`pass`、`grabbing`→`grab`/`pass`，动作 `seat === state.turn`；
   `done`/`redeal` 阶段调用应抛错（与 `chooseBid` 一致）。
4. 纯函数、确定性、禁止 import `cc`、禁止改签名。`level` 复用 `AiLevel`。

## 验收（test/ai/bidding-levels.test.ts，架构种入·不可改）
- `chooseBidByLevel(hand, state, Normal)` 对多手牌深相等于 `chooseBid(hand, state)`。
- 两高牌 `2 2 3 4 5`：Normal=call、Simple=pass、Hard=call（证明 Simple < Normal）。
- 一高牌 `2 3 4 5 6`：Normal=pass、Simple=pass、Hard=call（证明 Hard > Normal）。
- 火箭 `x X 3 4 5`：三档皆 call。
- 无高牌无炸 `3 4 5 6 7`：三档皆 pass。
- `grabbing` 阶段三档动作 `seat === state.turn`。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
