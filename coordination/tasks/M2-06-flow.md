# M2-06 flow（headless 回合驱动器）

- 状态：ready（**待 M2-08 + M2-03 + M2-05 在 main 后认领**；种子分支已基于这些 API）
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/driver.ts`（实现 `runHeadlessRound` 函数体）
  - 可读不可改：`assets/scripts/flow/{types,clock,index}.ts`（架构已固定契约）、`assets/scripts/game/*`、`assets/scripts/ai/*`、`assets/scripts/rules/*`、`test/flow/driver.test.ts`
- 依赖：M2-08（纯数据 bidding）+ M2-03（settlement）+ M2-05（ai 出牌）+ M2-01（game-core）
- 分支：`task/M2-06-flow`

## 目标
**只做编排，不重判规则、不内联 AI 进 game**：把发牌→叫抢→地主拿底牌→出牌循环→结算串成一个无 UI 的可测试回合驱动器，AI 思考时延走**可注入时钟**。确定性：同 `seed` → 同 `FlowResult`（时钟无关）。不 import `cc`。

## 公共 API 契约（架构已固定，见 flow/{types,clock}.ts）
```ts
export interface Clock { sleep(ms: number): Promise<void>; }            // 默认真实时钟；测试注入 fake clock
export type BidPolicy = (a: { seat: SeatIndex; state: BiddingState; hand: Card[] }) => BidAction;
export interface FlowConfig {
  seed: number;
  startSeat?: SeatIndex;        // 默认 0
  baseScore?: number;          // 默认 1
  thinkingDelayMs?: number;    // 默认 0；每个 AI 出牌前 await clock.sleep
  clock?: Clock;               // 默认 realClock
  bidPolicy?: BidPolicy;       // 默认 defaultBidPolicy：startSeat call、其余 pass
  maxTurns?: number;           // 默认 300；超出抛错（带 seed/turn）
  maxRedeals?: number;         // 默认 10；超出抛错（带 seed）
}
export type FlowEvent =
  | { type: 'deal'; landlordBottomTo: SeatIndex | null }
  | { type: 'bid'; action: BidAction; multiplier: number }
  | { type: 'redeal'; attempt: number }
  | { type: 'landlordDecided'; landlord: SeatIndex; bidMultiplier: number }
  | { type: 'round'; event: GameEvent }       // 包装 game 的 GameEvent，不改 GameEvent
  | { type: 'settled'; settlement: Settlement };
export interface FlowResult {
  landlord: SeatIndex; winner: Side; settlement: Settlement;
  events: FlowEvent[]; turns: number; redeals: number; finalState: RoundState;
}
export function runHeadlessRound(config: FlowConfig): Promise<FlowResult>;
```

## 编排流程（实现要点）
1. `rng = createRng(seed)`；`startSeat/baseScore/...` 取默认值。
2. **叫抢循环（含 redeal）**：`deal(rng)` → `createBidding(startSeat)` → 反复 `applyBid(state, bidPolicy({seat:state.turn,state,hand:hands[state.turn]}))`；遇 `phase==='redeal'` 则重新 `deal(rng)` 再来，计 `redeals`，超 `maxRedeals` 抛错（消息含 `seed`）。`phase==='done'` 得 `landlord` 与 `bidMultiplier = state.multiplier`。
3. `createPlayingRound(deal, landlord)`（地主已自动获底牌 17→20）。
4. **出牌循环**：`while finalState.phase !== Settled && turns < maxTurns`：`snap = snapshot(state, state.turn)` → `action = chooseAction(snap, rng)` → `await clock.sleep(thinkingDelayMs)` → `{state, events} = apply(state, action)`，把每个 `GameEvent` 包成 `{type:'round',event}` 累积，`turns++`。超 `maxTurns` 抛错（消息含 `seed` 与 `turn`）。
5. **结算**：从累积的 `GameEvent` 取 `winner`（win 事件的 side）；`settlement = settle({ landlord, winner, bidMultiplier, events: 收集到的 GameEvent[], baseScore })`，push `{type:'settled',settlement}`。
6. 返回 `FlowResult`。

## 约束
- 不在 flow 内做规则判断（合法性全由 `game.apply` 负责）；不修改 game/ai/rules 任何文件。
- `bidPolicy` 默认值保证首轮即定地主、不会无限 redeal。
- 时钟：默认 `realClock.sleep = (ms)=>new Promise(r=>setTimeout(r,ms))`；测试注入的 fake clock 只记录 ms 不真等——实现里思考时延**必须**走 `await config.clock.sleep(...)` 而非直接 `setTimeout`。

## 验收（test/flow/driver.test.ts，架构已写好）
- 固定 seed：`runHeadlessRound` 跑到 `finalState.phase==='settled'`，有 `settlement`，三家 `scores` 和为 0，`winner` 与终局一致。
- 注入 fake clock：每个 AI 出牌记一次 `sleep(thinkingDelayMs)`，不真实等待（用 `thinkingDelayMs>0` + 计数断言）。
- `bidPolicy` 恒 pass → 触发 redeal；`maxRedeals` 很小 → 抛错且消息含 `seed`。
- `maxTurns` 很小 → 抛错且消息含 `seed`/`turn`。
- 同 seed 两次运行：`landlord/winner/settlement.scores/turns` 一致。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。
