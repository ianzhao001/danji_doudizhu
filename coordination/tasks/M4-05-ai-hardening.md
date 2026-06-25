# M4-05 ai-hardening AI 强化（helper 收敛 + 全序 tie-breaker + hard 大牌压制）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/levels/_shared.ts`（新建，公共 helper）
  - `assets/scripts/ai/levels/simple.ts`、`normal.ts`、`hard.ts`（改为复用 _shared）
  - 可读不可改：`assets/scripts/ai/strategy.ts`、`ai/index.ts`、`game/types.ts`、`rules/*`、`test/ai/**`
- 依赖：M4-01/02/03（已并 main）
- 分支：`task/M4-05-ai-hardening`

## 目标
合并三档重复逻辑、消除对 `enumerateMoves` 顺序的隐式依赖，并补齐 hard 的「大牌压制」语义。不改 simple/normal 既有行为。

## 行为要求
1. 新建 `ai/levels/_shared.ts`，抽取并统一：
   - `compareMoves`：**全序**比较（`length → category → mainRank → 逐张牌点序列 → 逐张花色序列`），保证任意两个不同 Move 有确定序、不依赖 `enumerateMoves` 产出顺序。
   - `pickSmallest` / `pickLargest` / `pickSmallestBombLike`。
   - `protectedCards` / `usesProtectedCards`（四张同点炸弹 + 双王火箭）、`bombLikeMoves`、`toPlay`、`conservativeAction`（保炸弹决策树）。
   - simple/normal/hard 改为 `import` 复用，删除各自重复实现。
2. hard「大牌压制」明确化：
   - pressing（任一对手 `handCounts[seat] <= 2`）**跟牌**且无炸弹/火箭可用时，出 `legalFollows` 中**最大能压制者**（`pickLargest`）抢回牌权，**不 pass**。
   - pressing **领出**仍保守（出最小着法）。
   - pressing 且持炸弹/火箭：维持现状（出最小炸弹、火箭最后）。
3. simple/normal 对外行为不变；全序 `compareMoves` 使「同长同主点」候选选择确定。
- 确定性、绝不非法、不 import `cc`。

## 验收（test/ai/hardening.test.ts，不可改）
- hard pressing 跟牌无炸弹 → 出最大可压：`handCounts=[3,1,3]`、top=对手单`3`、手牌 `5 9 K` → 出单 `K`。
- hard pressing 领出 → 保守：`handCounts=[5,1,3]`、top=null、手牌 `3 4 5 9 K` → 出单 `3`。
- normal 火箭保护（回归）：领出 `x X 3 4 5` → 出单 `3`（不拆火箭）。
- 现有 `test/ai/{simple,normal,hard}.test.ts` 全部保持绿。
- `npm --prefix test test` 全绿、`npm --prefix test run typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
