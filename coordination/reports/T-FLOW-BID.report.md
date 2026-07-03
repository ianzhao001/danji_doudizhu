# T-FLOW-BID 实现报告

- 任务：T-FLOW-BID — 先发牌后叫抢（叫抢期可见手牌）+ 亮底牌事件 + 逐手存档
- 分支：`task/T-FLOW-BID`
- 实现者：Codex
- 日期：2026-07-03

## 改动概述

- `assets/scripts/flow/round-runtime.ts`
  - 实现 `biddingDeal()`：仅在 bidding 相且 `currentDeal` 存在时返回 hero 17 张手牌副本与 `[17,17,17]` 手牌数量。
  - `currentSnapshot()` 保持 bidding 期返回 `null`，没有伪造 playing 快照。
  - `enterPlaying()` 在 `landlordDecided` 之后、创建 playing state 和首个 round 推进之前发出 `bottomRevealed`，cards 使用底牌副本。
  - 在成功 apply 后统一经 `pushApplyResult()` 触发 persist，payload 沿用现有 `{ round, heroSeat, bidMultiplier, events }` 口径。
  - 为避免 `landlordDecided -> enterPlaying()` 同一批事件产生重复 persist，`pushApplyResult()` 对含 `landlordDecided` 的 bucket 保持 enterPlaying 原有单次 persist 行为。
- `assets/scripts/ui/screen-view.ts`
  - `deriveScreenVM()` 增加可选 `biddingHand?: Card[]`。
  - snapshot 不存在但传入 `biddingHand` 时，复用 `layoutHandInteractive()` 生成叫抢期手牌 VM，选牌集为空。
  - 未提供 `biddingHand` 时维持原行为。

## 验证

- ✅ `npm --prefix test test -- flow/bidding-visibility.test.ts ui/screen-view.test.ts flow/round-runtime.test.ts flow/round-runtime-hardening.test.ts flow/runtime-resume-phases.test.ts integration/save-resume-e2e.test.ts`
  - 6 files / 29 tests passed。
- ✅ `npm --prefix test run typecheck`
- ✅ `git diff --check`

## 全量回归阻塞

`npm --prefix test test` 当前结果：

- 134 files passed / 1 file failed。
- 663 tests passed / 1 test failed。
- 唯一失败：
  - `test/ui/cue-id-consistency.test.ts > CueId consistency guard > exports the complete producible CueId set`
  - `CUE_IDS` 实际包含新增的 `"bottomRevealed"`，但测试内 `EXPECTED_CUE_IDS` 仍是旧列表。

失败 diff 摘要：

```text
Expected: ["play","pass","bomb","rocket","reset","win","deal","bid","redeal","landlordDecided","settled"]
Received: ["play","pass","bomb","rocket","reset","win","deal","bid","redeal","landlordDecided","bottomRevealed","settled"]
```

该不一致来自分支既有的 `assets/scripts/ui/event-cues.ts` / `test/ui/event-cues.test.ts` 已支持 `bottomRevealed`，但 consistency 测试常量未同步。修复需要修改 `test/ui/cue-id-consistency.test.ts`，超出本任务文件域与“测试不可改”约束，因此未越权处理。

## 风险与后续

- 本任务行为目标和 flow/runtime/screen-view 回归均已通过。
- 合并前需要架构者同步 `cue-id-consistency.test.ts` 的 `EXPECTED_CUE_IDS`，或另派 UI cue 一致性修复任务。
