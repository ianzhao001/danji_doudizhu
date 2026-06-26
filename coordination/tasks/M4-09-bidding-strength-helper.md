# M4-09 叫抢判强逻辑去重 + 阈值 exhaustive

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/bidding.ts`
  - `assets/scripts/ai/bidding-levels.ts`
  - `test/ai/bidding-strength.test.ts`（架构已种失败测试，可新增用例、不可改既有断言）
  - 可读不可改：`assets/scripts/ai/{strategy,index}.ts`、`assets/scripts/game/**`、`assets/scripts/rules/**`、`test/ai/**`（既有断言不可改）
- 依赖：M2-09（`chooseBid`）+ M4-07（`chooseBidByLevel`）已并 main
- 分支：`task/M4-09-bidding-strength-helper`

## 背景
评审 🟡：`bidding-levels.ts` 的 `isStrongAtThreshold` 与 `bidding.ts` `chooseBid` 的判强逻辑（火箭/炸弹/highCardCount）**逐行重复**，仅阈值不同——违背 M4-07「复用基线判强逻辑，只调阈值」，规则一旦微调会两处漂移。且 `chooseBidByLevel` 的 `level===Hard?1:3` **非 exhaustive**，未来加第四档会静默落 Simple 阈值。本任务抽单一真相源 + 收紧 switch，**行为不变**（既有测试全绿即正确）。

## 公共 API 契约（架构固定）
```ts
// ai/bidding.ts 新增导出（单一真相源判强）
export function isStrongHand(hand: Card[], highCardThreshold: number): boolean;
// 语义：火箭(双王) 或 炸弹(四同点) 或 highCardCount(点数 ≥ Rank.R2，含 2 与双王) ≥ highCardThreshold
```

## 行为要求
1. 在 `ai/bidding.ts` 实现并导出 `isStrongHand(hand, threshold)`（上述语义），替换 `chooseBid` 内联判强 → `chooseBid` 用 `isStrongHand(hand, 2)`，动作映射（calling→call/pass、grabbing→grab/pass、done/redeal→throw）不变。
2. `ai/bidding-levels.ts`：删除本地 `isStrongAtThreshold`，改用 `isStrongHand`；档位阈值用 **exhaustive switch** `thresholdFor(level: AiLevel): number`——`Simple→3`、`Normal→2`、`Hard→1`、`default: { const _x: never = level; throw new Error(...) }`（与 `ai/strategy.ts` 的 `strategyFor` never 落地一致）。`chooseBidByLevel(hand,state,level)` = `actionForStrength(state, isStrongHand(hand, thresholdFor(level)))`。
3. **不改任何既有导出签名**（`chooseBid`/`chooseBidByLevel` 形参与返回不变）；`isStrongHand` 为新增导出。纯逻辑、确定性、禁 import `cc`。

## 验收（`test/ai/bidding-strength.test.ts` 架构种入·既有断言不可改）
- `isStrongHand` 阈值边界：火箭/炸弹任意阈值为强；`2 2 3 4 5` 阈值 2 为强、阈值 3 不强；`2 3 4 5 6` 阈值 1 为强、阈值 2 不强。
- 等价不变量：对一组手牌，`chooseBid(hand, calling)` 与 `isStrongHand(hand,2)` 推出的 call/pass 一致。
- **既有 `test/ai/bidding.test.ts`、`test/ai/bidding-levels.test.ts` 全绿不改**（行为不变的证明，含 M4-07 的 Normal≡chooseBid 断言）。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
