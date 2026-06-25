# M2-08 bidding-pure-state（叫抢状态纯数据化重构）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/bidding.ts`（重构实现：去 WeakMap）
  - 可读不可改：`assets/scripts/game/types.ts`、`test/game/bidding.test.ts`（架构已加新测试，**不可改/削弱**）
- 依赖：M2-02（已并入 main 的 bidding 实现）
- 分支：`task/M2-08-bidding-pure`

## 背景 / 为什么
当前 `bidding.ts` 用**模块级 `WeakMap<BiddingState, BiddingContext>`** 保存 `caller/callingPasses/grabQueue/grabbed`，导致 `BiddingState` **不可序列化**：JSON 往返 / 对象 clone / 跨模块重建后，`contextOf` 取不到上下文会抛 `BIDDING_CONTEXT_MISSING`。这违反项目「state 必须纯数据可序列化」不变量（见 `game/types.ts` 头注与 `RoundState`），并会阻塞 M2-06 flow 与 M5 断局存档。

## 目标
把隐藏上下文**显式并入公开 `BiddingState`**，删除 WeakMap，使 `BiddingState` 成为完全纯数据；行为（叫/抢/反抢/定地主/redeal）与现有 5 条测试**保持不变**，并让架构新增的「JSON 往返后继续叫抢」测试转绿。

## 契约（架构已固定，`BiddingState` 新增 4 个必填纯字段）
```ts
export interface BiddingState {
  phase: BiddingPhase;
  turn: SeatIndex;
  provisional: SeatIndex | null;
  multiplier: number;
  landlord: SeatIndex | null;
  caller: SeatIndex | null;   // 首叫者（反抢判定用）
  callingPasses: number;      // calling 阶段累计 pass 数
  grabQueue: SeatIndex[];     // grabbing 阶段「待行动座位」队列
  grabbed: boolean;           // 本 grabbing 轮是否已发生过 grab
}
```

## 实现要求
- 把原 `BiddingContext`（callingPasses/caller/grabQueue/grabbed）的全部读写改为**直接读写 `BiddingState` 上的同名字段**。
- **删除** `WeakMap`、`contexts`、`contextOf`、`makeState` 的 WeakMap 写入、`BiddingContext` 类型（如不再需要）。
- 保持 `createBidding`/`applyBid` 签名不变、**不可变更新**（每次返回新对象，不原地改入参）、非法动作仍抛 `IllegalActionError`。
- 不 import `cc`。

## 验收（test/game/bidding.test.ts，架构维护）
- 原 5 条用例全部仍绿（A叫·B不·C不；A叫·B抢·C不·A反抢=×4；A叫·B抢·C不·A不=×2 定 B；三人全不叫=redeal；done 后再动作抛错）。
- **新增**：`BiddingState 可 JSON 往返后继续叫抢` —— `applyBid(JSON.parse(JSON.stringify(s)), …)` 不抛错且结果正确。
- `npm --prefix test test` 全绿、`npm --prefix test run typecheck` 无错（**注意：架构种子分支故意 typecheck 红——新必填字段尚未在实现里补齐；这正是你要完成的工作**）、未 import `cc`。

## 注意
- 种子分支初始状态：5 条旧测试绿、新测试红、`tsc` 报「字面量缺少 caller/callingPasses/grabQueue/grabbed」——这是预期的红，表示你要在所有 `BiddingState` 字面量补齐这 4 个字段并改用它们。完成后 test + typecheck 必须全绿。
- 字段**必须保持必填**，不要改成可选来绕过 typecheck。
