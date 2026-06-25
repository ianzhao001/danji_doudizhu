# M2-01 game-core 单局状态机核心（出牌循环）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/core.ts`（实现这里的函数体）
  - 可读不可改：`assets/scripts/game/types.ts`、`assets/scripts/game/index.ts`（架构维护的契约）
  - 可读不可改：`test/game/core.test.ts`（验收测试，架构提供）
- 依赖：`rules`（已完成）
- 分支：`task/M2-01-game-core`

## 目标
实现「给定地主后」的出牌循环状态机：发牌接入、归属校验、当前最大出牌、回合轮转、连续过牌归位、胜负判定。叫抢地主与结算倍数**不在本任务**（M2-02/03）。

## 公共 API 契约（已在 `game/types.ts` / `game/core.ts` 固定，实现 core.ts 函数体）
```ts
createPlayingRound(deal: Deal, landlord: SeatIndex): RoundState
//   地主获得底牌（手牌 17→20），phase=Playing，turn=landlord，top=null，winner=null。

apply(state: RoundState, action: RoundAction): ApplyResult
//   校验并应用动作，返回新状态（不可变更新）+ 事件序列。非法动作抛 IllegalActionError。

snapshot(state: RoundState, viewer?: SeatIndex): GameSnapshot
//   只读快照；handCounts 为三家剩牌数；viewer 给定时附其手牌，不泄露他人手牌。
```

## 行为要求
- **归属校验**：出的牌必须是该座位手牌的「子多重集」（按 rank+suit 物理牌计数），否则 `IllegalActionError`。
- **轮次**：非当前 `turn` 座位行动 → 抛错。
- **牌型/压制**：领出（`top===null`）时用 `rules.validatePlay(cards)`；跟牌时用 `rules.validatePlay(cards, top.pattern)`，压不过抛错。领出时 `pass` 非法（必须出牌）。
- **出牌后**：从手牌移除这些牌；`top={seat,pattern}`；`turn` 顺时针 +1（mod 3）；`passesInARow=0`；炸弹/火箭令 `bombsPlayed++` 并产 `bomb`/`rocket` 事件。
- **过牌**：`passesInARow++`，`turn` +1；当一圈内**连续两人过牌**（回到 `top.seat`）→ `top=null`、`passesInARow=0`、产 `reset` 事件（leader = 原 top.seat 重新自由领出）。
- **胜负**：某座位手牌清空 → `phase=Settled`、`winner`=该座位所属阵营（地主→Landlord，农民→Farmer）、产 `win` 事件。胜负判定后不再接受动作。
- **不可变**：`apply` 不得原地修改入参 `state`（返回新对象，便于回放/快照）。
- **可序列化**：`RoundState` 全程为纯数据（无函数/类实例字段）。

## 验收
- `npm --prefix test test`（含 `test/game/core.test.ts`）全绿。
- `npm --prefix test run typecheck` 无错。
- 仅改 `assets/scripts/game/core.ts`；未碰 types/index/测试；未 import `cc`。

## 测试命令
`npm --prefix test test` ；类型检查 `npm --prefix test run typecheck`
