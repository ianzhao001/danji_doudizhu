# T-FLOW-BID — 先发牌后叫抢（叫抢期可见手牌）+ 亮底牌事件 + 逐手存档

- 状态：ready
- 类型：纯逻辑（flow 层，禁 import `cc`）
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/round-runtime.ts`（实现架构已种的接口桩）
  - `assets/scripts/ui/screen-view.ts`（`deriveScreenVM` 增可选 `biddingHand` 入参，叫抢期产出手牌 VM）
  - `coordination/reports/T-FLOW-BID.report.md`
  - **只读**：`flow/driver.ts`、`flow/policies.ts`、`flow/types.ts`（契约由架构维护，已含新成员）
  - **测试 `test/flow/bidding-visibility.test.ts` + `test/ui/screen-view.test.ts` 增量由架构种入（不可改）**
- 依赖：—（Wave 1 并行）
- 分支：`task/T-FLOW-BID`
- worktree 缺 tsconfig 同 T-LAYOUT2 处理。

## 背景（v1.2 规划书 §1-3）

`startDeal()` 已发牌存 `currentDeal`，但 `this.state=null` 直到 `enterPlaying` → 叫抢期快照为 null，17 张手牌视图层读不到；底牌 3 张在 `createPlayingState` 静默并入地主手（无亮牌步骤）；**`persist` 全仓仅 1 个调用点（enterPlaying）→ playing 中途退出回滚到开局**。用户裁决：最小版 + 逐手存档 rider（不做叫抢期序列化）。

## 行为要求（架构已种接口桩 + 失败测试，实现到绿）

1. **叫抢期只读口** `RoundRuntime.biddingDeal(): BiddingDealView | null`（类型已在 types.ts）：
   - `bidding` 相且 `currentDeal` 存在时返回 `{ viewerHand: hero 的 17 张副本, handCounts: [17,17,17] }`；**不得泄露他人手牌/底牌**；离开 bidding 相后返回 null。
   - `currentSnapshot()` **保持叫抢期返回 null**（`GameSnapshot.landlord` 非空类型，禁止伪造快照）。
2. **亮底牌事件**：`enterPlaying` 在 `landlordDecided` 之后、首个 playing 推进之前 `emit({ type: 'bottomRevealed', cards: currentDeal.bottom 副本 })`（FlowEvent 新成员已由架构加入 types.ts）。
3. **逐手存档 rider**：每次**成功** apply 出牌/过牌后（AI 与玩家两条路径：`advanceUntilPause` 内 apply 后与 `submitPlayerAction` 内 apply 后，可统一挂 `pushApplyResult` 处）调用 `this.persist?.(...)`（与 enterPlaying 现有调用同 payload 口径）。失败/异常路径不得调用。
4. **`deriveScreenVM`**：新增可选入参 `biddingHand?: Card[]`；提供时（叫抢期）`hand` 由其派生（复用现有选牌/布局管线，选牌集视为空），不提供时行为与现状完全一致。
5. resume（v1 存档）路径行为不变；`redeal` 后 `biddingDeal()` 反映新一副牌。

## 验收
- 架构种入的失败测试转绿：叫抢期 `biddingDeal()` 17 张+[17,17,17]+无泄露；事件序 `deal → bid* → landlordDecided → bottomRevealed(3 张) → 首个 round 事件`；地主首个 playing 快照 20 张且包含该 3 张；persist 在 landlordDecided 前 0 次、进 playing 1 次、之后每成功一手 +1；screen-view 增量断言绿。
- 既有 `test/flow/**`、`test/runtime/**` 回归零改动全绿；`npm --prefix test test` + typecheck 净。

## 不可做
不改测试与 types.ts/driver.ts/policies.ts；不做叫抢期序列化（SaveSlot/SAVE_VERSION 不动）；发牌动画/按钮门控是 UI 时序归 P-G3②，本任务不碰组件。

## 交付物
分支提交 + `reports/T-FLOW-BID.report.md`；获 `approved` 后 `claim→merge→release`。
