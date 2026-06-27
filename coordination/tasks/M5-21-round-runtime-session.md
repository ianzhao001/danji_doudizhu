# M5-21 交互式单局运行时门面（round-runtime，flow 层·无 cc·Vitest）

- 状态：ready
- 派发模式：纯 spec（无架构种入测试）——实现方按本 spec 自写 vitest 测试 + 实现。
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/round-runtime.ts`（新·交互式门面）
  - `assets/scripts/flow/driver.ts`（**重构**：抽 step helper 供 driver 与门面复用；对外行为/`FlowResult` 形状不变）
  - `test/flow/round-runtime.test.ts`（新·实现方自写）
  - 可读不可改：`assets/scripts/flow/{types,clock,policies}.ts`、`assets/scripts/game/**`、`assets/scripts/ai/**`、`assets/scripts/ui/screen-view.ts`（仅对齐入参）
  - **既有测试不可改**：`test/flow/driver.test.ts`、`test/flow/driver-diagnostics.test.ts`、`test/flow/policies.test.ts` 必须保持全绿（硬验收）
- 依赖：无并 main 前置（用 FakeStorage/FakeClock 自测）；与 M5-20 文件域不相交可并行；与 M3-31 通过本 spec 接口契约对齐（M3-31 用 mock 门面占位，不等本任务并 main）
- 分支：`task/M5-21-round-runtime-session`（worktree）

## 背景与目标
现有 `runHeadlessRound`（`flow/driver.ts`）是单个 `while(true)` 焊死循环，AI/玩家动作在循环内同步推进，**无法为真人玩家暂停等待输入**。M3 可玩闭环需要一个**交互式运行时门面**：start/resume 一局 → 驱动 AI 自动行动并在玩家回合**暂停** → 接收玩家动作 → 推进到结算；把「该渲染什么」摊平成 snapshot/bidding/events/settlement 喂给 UI（对齐 `deriveScreenVM` 入参），不让 Cocos 组件直接拼规则。

## 设计约束（必须遵守，写进实现）
1. **不整段复用 `runHeadlessRound`**——其 while 焊死不可暂停。改为从 driver 抽**纯 step helper**（建议：`stepBidding(...)`、`startPlaying(...)`、`stepPlay(...)`、`decideAiPlay(...)` 等），`driver.ts` 重构为调用这些 helper，门面复用同一组 helper。**driver 对外签名/行为/`FlowResult` 形状零变化**，`driver.test.ts`/`driver-diagnostics.test.ts` 全绿是硬验收。
2. **flow→data 零 import**：门面**不** import `data/session`、`data/save`、storage。persist/commit 经 `RuntimeConfig` 注入回调（`persist`/`onSettled`），由 UI 组合根接到 `persistRound`/`commitFinishedRound`。`grep -n "from '\.\./data'" assets/scripts/flow/round-runtime.ts` 必须**零命中**。
3. **resume 不碰 storage**：门面 resume 入参是已恢复的 `ResumeSnapshot`（组合根先调 `restoreRound(storage,keys)` 再传入），门面**不** import storage/session。
4. **persist/commit 时机钉死**：`landlordDecided` 后调一次 `persist`；`settled` 后调一次 `onSettled`；playing 中途**不**每步 persist。
5. **dispose 中断**：`dispose()` 后，已挂起的 `clock.sleep` 完成回来**不得**再 apply / 触发回调 / 推事件（disposed flag 在每次 `await sleep` **之后**检查）——这是门面相对 driver 的最大实现差异点、本批最易出 bug 处，重点自测。
6. **事件用 onEvent 回调**（Cocos 组件 onLoad 订阅 / onDestroy 取消最自然）；事件类型复用 `FlowEvent`（screen-view 已消费），**不新造事件类型**。门面 onEvent 每次推**单个** `FlowEvent`；screen-view 的 `recentEvents` 是数组，由 M3-31 的 adapter 负责累积。

## 公共 API 契约（架构据分层硬律落定 · resume 取 ResumeSnapshot 非 storage）
```ts
import type { AiLevel } from '../ai';
import type {
  BidAction, BiddingState, GameEvent, GameSnapshot, ResumeSnapshot,
  RoundAction, RoundFinishInput, RoundState, SeatIndex, Settlement,
} from '../game';
import type { Clock } from './clock';
import type { BidPolicy, FlowEvent, PlayPolicy } from './types';

export interface RuntimeConfig {
  seed: number;
  heroSeat: SeatIndex;
  levels: [AiLevel, AiLevel, AiLevel];
  baseScore?: number;          // 默认 1
  thinkingDelayMs?: number;    // 默认 0；每个 AI 行动前 await clock.sleep
  clock?: Clock;               // 默认 realClock
  bidPolicy?: BidPolicy;       // 默认 levelPolicies(levels).bidPolicy
  playPolicy?: PlayPolicy;     // 默认 levelPolicies(levels).playPolicy（用于 AI 座位）
  /** landlordDecided 后回调一次（组合根接 persistRound）。 */
  persist?: (payload: { round: RoundState; heroSeat: SeatIndex; bidMultiplier: number; events: GameEvent[] }) => void;
  /** settled 后回调一次（组合根接 commitFinishedRound）。 */
  onSettled?: (finish: RoundFinishInput) => void;
}

export type PlayerInput =
  | { kind: 'bid'; action: BidAction }
  | { kind: 'play'; action: RoundAction };

export interface SubmitResult {
  ok: boolean;
  snapshot?: GameSnapshot;
  bidding?: BiddingState;
  events?: FlowEvent[];        // 本次提交后新增的事件
  error?: { reason: string };  // ok:false 时给原因（'NOT_PLAYER_TURN' / 规则拒绝 reason 等）
}

export interface RoundRuntime {
  phase(): 'bidding' | 'playing' | 'settled' | 'disposed';
  currentSnapshot(): GameSnapshot | null;   // hero 视角快照（viewerHand = hero 手牌）
  currentBidding(): BiddingState | null;
  isPlayerTurn(): boolean;                   // 当前是否轮到 heroSeat 且需玩家输入
  legalInputs(): PlayerInput[] | null;       // 玩家回合：合法输入集合；非玩家回合/非交互：null
  submitPlayerAction(input: PlayerInput): Promise<SubmitResult>;
  onEvent(cb: (e: FlowEvent) => void): () => void;  // 返回取消订阅函数
  settlement(): Settlement | null;
  dispose(): void;
}

/** 发新局：发牌 → 叫抢（AI 自动）→ 玩家回合暂停。 */
export function startRoundRuntime(config: RuntimeConfig): RoundRuntime;

/** 从已恢复的 ResumeSnapshot 续局（组合根先 restoreRound 得到它再传入；门面不碰 storage）。 */
export function resumeRoundRuntime(resume: ResumeSnapshot, config: RuntimeConfig): RoundRuntime;
```
> `ResumeSnapshot = {state: RoundState; heroSeat; bidMultiplier; events}`（`game/resume.ts`）；`RoundFinishInput = {landlord; winner; settlement}`（`game/types.ts:80`）。两者均 `import type` 自 `../game`。

## 行为要求
1. **start**：`createRng(seed)` → `deal` → 用 `bidPolicy` 跑叫抢；轮到 hero 且需输入则**暂停**等 `submitPlayerAction({kind:'bid'})`，非 hero 座 AI 自动（每步 `await clock.sleep(thinkingDelayMs)`）。叫抢 done → 推 `landlordDecided` 事件 → 调 `persist` 一次 → `createPlayingRound` 进 playing。（redeal 子态：续发新牌重开叫抢，复用 driver 同逻辑。）
2. **playing 推进**：非 hero 座由 `playPolicy` 自动出牌（先 `await clock.sleep`，再 `apply`，推 `round` 事件）；轮到 hero 座则暂停，`isPlayerTurn()` 真、`legalInputs()` 给合法集合。
3. **submitPlayerAction**：
   - 非玩家回合 → `{ok:false, error:{reason:'NOT_PLAYER_TURN'}}`，状态不变。
   - 规则拒绝（非法动作） → `{ok:false, error:{reason}}`，状态不变。
   - 合法 → `applyBid`/`apply` 推进、推事件、返回 `{ok:true, snapshot, bidding?, events}`；随后**自动驱动**后续 AI 座直到下一次 hero 暂停或结算。
4. **结算**：playing 到 `Settled` → 取 win 事件 → `settle(...)` → 推 `settled` 事件 → 调 `onSettled(finish)` 一次（`finish={landlord,winner,settlement}`）。
5. `settlement()/currentSnapshot()/currentBidding()/phase()` 反映当前态；`dispose()` 后 `phase()==='disposed'`，挂起 sleep 回来不再 apply/回调/推事件。
6. **onEvent**：注册后收到后续每个 `FlowEvent`（单个推送）；返回函数可取消订阅。
7. 纯逻辑、**禁 import `cc`**；AI/clock/policies 全部复用既有 flow/game/ai API。

## 可复用依赖（全部已在 main）
- `game` 桶：`apply`/`snapshot`/`createPlayingRound`/`createBidding`/`applyBid`/`settle`/`GamePhase`。
- `flow`：`clock`(Clock/realClock)、`policies`(levelPolicies)、`types`(FlowEvent/FlowConfig/BidPolicy/PlayPolicy)。
- `ai`：`strategyFor`/`chooseBidByLevel`（经 `levelPolicies` 默认注入）。
- `rules`：`createRng`/`deal`。

## 自测覆盖（实现方自写 vitest，至少含）
- **FakeClock**：记录每次 `sleep(ms)`（不真实等待），断言 AI 行动前确有 sleep。
- **ControllablePlayPolicy + 固定 seed**：可控 AI 出牌，测连环推进与中断。
- 主链路：start →（AI 叫抢自动 / hero 叫抢）→ landlordDecided（断言 `persist` 被调一次 + payload 形状）→ playing → hero play → AI 跟出自动 → settled（断言 `onSettled` 被调一次 + finish 形状）+ events 序列合理。
- **resume**：构造 playing 中途态 `ResumeSnapshot` → `resumeRoundRuntime` → 推进至 settled，与等价直跑快照一致。
- 非法动作：hero 提交非法出牌 → `ok:false` + reason，且 `currentSnapshot()` 不变。
- 非玩家回合：非 hero 回合提交 → `ok:false, reason:'NOT_PLAYER_TURN'`。
- **dispose 中断**：`thinkingDelayMs>0` + FakeClock 挂起 sleep，dispose 后再 resolve 挂起 sleep → 断言不再 apply（snapshot 不变）、不再推事件、不再回调。
- **driver 回归**：`driver.test.ts`/`driver-diagnostics.test.ts` 全绿（重构不破坏）。
- 分层 grep：`round-runtime.ts` 对 `../data` 零 import、无 `cc`。

## 验收
- `npm --prefix test test` 全绿（新增门面测试 + 既有 driver/policies 测试不破）。
- `npm --prefix test run typecheck` 无错。
- `grep -n "from '\.\./data'" assets/scripts/flow/round-runtime.ts` 零命中；`grep "import .*'cc'" assets/scripts/flow/round-runtime.ts` 零命中。
- `driver.ts` 重构后对外签名/行为/`FlowResult` 形状不变。

## 测试命令
`npm --prefix test test`
