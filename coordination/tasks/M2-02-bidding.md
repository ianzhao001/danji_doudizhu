# M2-02 bidding 叫抢地主（抢翻倍）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/bidding.ts`（实现函数体；本模块自有类型由架构已固定在文件顶部）
  - 可读不可改：`assets/scripts/game/types.ts`（用 `SeatIndex`、`IllegalActionError`）、`test/game/bidding.test.ts`
- 依赖：M2-01（types）
- 分支：`task/M2-02-bidding`

## 目标
经典「叫 + 抢、抢翻倍」：定地主、算叫抢倍数；无人叫 → 重新发牌。不接入 createPlayingRound（调用方负责衔接）。

## 公共 API 契约（见 bidding.ts 桩，实现其函数体；测试只读）
- `createBidding(startSeat: SeatIndex): BiddingState`
- `applyBid(state: BiddingState, action: BidAction): BiddingState` —— 非法抛 `IllegalActionError`，不可变更新。
- `BidAction = { type: 'call' | 'grab' | 'pass'; seat: SeatIndex }`
- `BiddingState { phase: 'calling'|'grabbing'|'done'|'redeal'; turn; provisional: SeatIndex|null; multiplier; landlord: SeatIndex|null }`

## 协议（确定性）
1. **calling**：从 `startSeat` 起按座位序，每人 `call`/`pass`。首个 `call` 者 = 临时地主、`multiplier=1`、进入 `grabbing`。三人全 `pass` → `phase='redeal'`。
2. **grabbing**：非叫地主的另两家按座位序各一次 `grab`/`pass`，每 `grab` → `multiplier×2` 且夺为临时地主；其后若本轮发生过 grab，叫地主者有一次「反抢」`grab`/`pass`（再 ×2）。队列走完 → `phase='done'`，`landlord=临时地主`。
3. 非当前 `turn` 行动、或 `done`/`redeal` 后再行动 → `IllegalActionError`。

## 验收（test/game/bidding.test.ts，架构已写好）
- A叫·B不·C不 → landlord=A，multiplier=1。
- A叫·B抢·C不·A反抢 → multiplier=4，landlord=A。
- A叫·B抢·C不·A不 → multiplier=2，landlord=B。
- 三人全不叫 → phase='redeal'。
- `done` 后再 `applyBid` → 抛 `IllegalActionError`。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。
