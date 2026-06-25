# M2-09 ai-bid-policy（基线叫抢决策）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/bidding.ts`（实现）
  - `assets/scripts/ai/index.ts`（桶，架构已加 `export * from './bidding'`）
  - 可读不可改：`assets/scripts/game/bidding.ts`、`assets/scripts/rules/*`、`test/ai/bidding.test.ts`
- 依赖：M2-02（`BiddingState`/`BidAction`）+ rules（`Card`/`Rank`）
- 分支：`task/M2-09-ai-bid-policy`

## 目标
给叫抢阶段一个**确定性、纯函数**的基线决策：依手牌强弱决定 call/grab/pass。供 flow 默认策略与后续 selfplay 复用。**不接管出牌**（那是 M2-05 chooseAction）。体验级强弱评估留到 M4。

## 公共 API 契约（见 bidding.ts 桩）
- `chooseBid(hand: Card[], state: BiddingState): BidAction`
- 约定：`state.turn` = 当前行动座位；返回动作 `seat` 必须等于 `state.turn`。

## 规则（确定性，无需 rng）
- `state.phase === 'calling'`：`isStrong(hand)` → `{ type:'call', seat: state.turn }`，否则 `{ type:'pass', seat: state.turn }`。
- `state.phase === 'grabbing'`：`isStrong(hand)` → `{ type:'grab', seat: state.turn }`，否则 `{ type:'pass', seat: state.turn }`。
- `state.phase` 为 `'done'`/`'redeal'`：不应被调用；可抛 `Error`（调用方负责不在此阶段调用）。
- **`isStrong(hand)`（基线判定，钉死）**：满足任一即为强——
  1. 含**火箭**：同时有小王(SmallJoker)和大王(BigJoker)；或
  2. 含**炸弹**：某点数(rank)出现 4 张；或
  3. **≥2 张**点数 ≥ `Rank.R2`（即 2 / 小王 / 大王，按 `rank` 数值比较）。
- 不 import `cc`。相同输入恒定输出同一结果。

## 验收（test/ai/bidding.test.ts，架构已写好）
- 强手（如含双王）calling → `call`；弱手（全小牌）calling → `pass`。
- 强手 grabbing → `grab`；弱手 grabbing → `pass`。
- 返回动作 `seat === state.turn`。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。
