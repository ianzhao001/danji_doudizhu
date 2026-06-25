# M4-02 ai-normal 普通 AI（保炸弹 + 基础拆牌·确定性）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/levels/normal.ts`（实现 `normalStrategy` 函数体）
  - 可读不可改：`assets/scripts/ai/strategy.ts`、`assets/scripts/ai/index.ts`、`assets/scripts/game/types.ts`、`assets/scripts/rules/*`、`test/ai/normal.test.ts`
- 依赖：M4 接口契约（已在 main）+ rules（`enumerateMoves` / `legalFollows` / `recognize`）
- 分支：`task/M4-02-ai-normal`

## 目标
在「最小化」基础上**保护炸弹/火箭**：有更经济的着法时绝不动炸弹/火箭，也不从炸弹/火箭里抽牌去拆散它。仅当无其它可走、或一手出完即胜时才动炸弹/火箭。确定性、不依赖 `rng`。

## 公共 API 契约
```ts
export const normalStrategy: AiStrategy; // 约定同 M4-01
```
- 取用方式：`strategyFor(AiLevel.Normal)`。

## 行为要求（决策树）
1. 候选：领出用 `enumerateMoves(viewerHand)`，跟牌用 `legalFollows(viewerHand, top.pattern)`。
2. 标记手中**炸弹/火箭**对应牌点（四张同点的点数、双王）。注意 `enumerateMoves` 会把「从炸弹抽出的单/对/三」也列为候选——这些属于「拆炸弹」。
3. 「安全候选」= 候选中**本身不是炸弹/火箭**、**且不拆散**任一手中炸弹/火箭（即不动用这些点数的牌）的着法。
4. 安全候选非空 → 选其中最小着法（张数最少、主点最小）。
5. 安全候选为空：
   - 若某炸弹/火箭着法一手**出完即胜**（出后手牌清空）→ 出之。
   - 跟牌且仍无合法非炸弹着法 → 被迫出最小炸弹/火箭；领出时回退「最小化」。
   - 跟牌仍无可走 → `pass`。
- 确定性、绝不非法、不 import `cc`。

## 验收（test/ai/normal.test.ts，不可改）
- 领出 `3 4 4 4 4` → 出单 `3`（不拆炸弹 `4444`）。
- 跟牌 top=单`3`、手牌 `5 4 4 4 4` → 出单 `5`（不拆炸弹，避开拆牌单 `4`）。
- 跟牌 top=单`3`、手牌仅 `4 4 4 4` → 出炸弹 `4444`（出完即胜，唯一合理着法）。
- `npm --prefix test test` 全绿、`npm --prefix test run typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
