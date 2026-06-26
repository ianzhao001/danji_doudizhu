# M4-10 叫抢 dispatch 去重（chooseBid 复用 actionForStrength）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/bidding.ts`
  - `assets/scripts/ai/bidding-levels.ts`
  - 可读不可改：`assets/scripts/ai/{strategy,index}.ts`、`assets/scripts/game/**`、`assets/scripts/rules/**`、`test/ai/**`（既有断言不可改）
- 依赖：M4-09（`isStrongHand` 已并 main）+ M2-09（`chooseBid`）已并 main
- 分支：`task/M4-10-bid-dispatch-dedup`

## 背景
M4-09 抽出了 `isStrongHand` 单一真相源，但 `chooseBid`（`bidding.ts`）仍**内联** phase→action 映射（calling→call/pass、grabbing→grab/pass、closed→throw），与 `bidding-levels.ts` 的 `actionForStrength` **逐行重复**。且 `bidding-levels.ts:4` 注释「Normal 委派基线 chooseBid」已**过时**（M4-09 后 Normal 走 `isStrongHand(hand,2)` 不再委派）。本任务消除重复、修注释，**行为不变**。

## 行为要求
1. `ai/bidding-levels.ts` 的 `actionForStrength(state, isStrong)` **导出**（或移到 `bidding.ts` 导出，由 `bidding-levels` import——实现方择一，须单一真相源）。
2. `ai/bidding.ts` `chooseBid` 改为：`return actionForStrength(state, isStrongHand(hand, 2))`（复用），删除内联的 phase 分支与 `'chooseBid cannot act during closed bidding phase'` throw（该文案由 `actionForStrength` 统一提供；若文案须与既有 `chooseBid` 测试一致，以 `actionForStrength` 文案为准——架构确认既有 `bidding.test.ts` 不锁该文案）。
3. 修正 `bidding-levels.ts:4` 注释为「Normal 走 `isStrongHand(hand,2)`，与基线 `chooseBid` 等价但不委派」。
4. `isStrongHand`/`chooseBid`/`chooseBidByLevel` 签名**不变**；`chooseBidByLevel` 仍 `actionForStrength(state, isStrongHand(hand, thresholdFor(level)))`。
5. 纯逻辑、禁 cc。

## 验收（test/ai/bid-dispatch.test.ts，架构种入·不可改）
- `chooseBid(hand, calling)` 与 `actionForStrength(calling, isStrongHand(hand,2))` 深相等（多手牌）。
- `chooseBid(hand, grabbing)` 同理。
- `chooseBid(hand, done)` 与 `actionForStrength(done, ...)` 同抛错（同一文案）；**`redeal` 子态同样同抛错**（两个 `BIDDING_CLOSED` 子态都锁）。
- `chooseBidByLevel` 既有行为不变（Normal≡chooseBid、Simple/Hard 阈值分层）——**既有 `bidding-levels.test.ts`/`bidding.test.ts` 全绿不改**。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
