# M3-00 叫抢视图模型（按钮文案/可用/当前座提示）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/bidding-view.ts`（新；`ui/` 纯逻辑岛，本文件**禁止 import `cc`**）
  - 可读不可改：`assets/scripts/game/**`（`BiddingState`/`BidAction`）、`test/ui/**`
- 依赖：M2-02/M2-08（`BiddingState` 已并 main）
- 分支：`task/M3-00-bidding-view-model`

## 背景
叫抢阶段 UI 需要按钮文案（叫地主/不叫/抢/不抢/反抢）、可用状态、当前该谁行动的提示。
先做无 cc 纯函数，消费 `BiddingState`。

## 行为要求（纯函数、确定性、禁 cc）
1. `BiddingView { prompt: string; buttons: { id: 'call'|'grab'|'pass'; label: string; enabled: boolean }[] }`。
2. `deriveBiddingView(state: BiddingState, viewerSeat: SeatIndex): BiddingView`：
   - `prompt`：含当前轮座位提示，如 `请座位 ${state.turn+1} 行动`；`done`/`redeal` 阶段 `prompt` 反映结束。
   - `buttons`：
     - `calling` 阶段：`call`（叫地主，enabled = `state.turn===viewerSeat`）、`pass`（不叫，同条件）；无 `grab`。
     - `grabbing` 阶段：`grab`（抢，enabled = `state.turn===viewerSeat`）、`pass`（不抢，同条件）；无 `call`。
     - `done`/`redeal`：全部 `enabled=false`。
3. 纯函数、禁 cc。从 `../game` 取 `BiddingState`/`SeatIndex`。

## 验收（test/ui/bidding-view.test.ts，架构种入·不可改）
- `calling` 初始（`createBidding(0)`、viewer=0）：`call`/`pass` enabled、无 `grab`、prompt 含座位 1。
- `calling` 但非玩家轮（viewer=1、turn=0）：`call`/`pass` 均 disabled。
- `grabbing`（applyBid call 后 turn=1、viewer=1）：`grab`/`pass` enabled、无 `call`。
- `done`/`redeal`：全 disabled。
- 入参不变。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
