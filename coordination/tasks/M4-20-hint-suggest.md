# M4-20 提示建议（legalFollows/enumerateMoves → 可循环提示序列）

- 状态：ready
- **派发模式：纯 spec（无架构种入测试）**——实现方按本 spec 自写 vitest 测试 + 实现。新文件 **import 直引、不改 `ai/index.ts` 桶**。
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/hint.ts`（新；**不得** import `ai/bidding*.ts`——属 M4-10 域）
  - 新增 `test/ai/hint.test.ts`（实现方自写）
  - 可读不可改：`assets/scripts/rules/**`（`enumerateMoves`/`legalFollows`/`Move`/`HandPattern`/`compareMoves` 若需排序自实现）、`assets/scripts/ai/levels/_shared.ts`（`compareMoves` 可读复用）
- 依赖：M1 `rules`（`enumerateMoves`/`legalFollows`，已并 main）
- 分支：`task/M4-20-hint-suggest`

## 背景
UI「提示」按钮要给玩家**可循环**的合法出牌建议：自由领出时枚举全部走法、跟牌时枚举可压走法，按「优先出小、保炸弹靠后」的稳定序排列，并支持点一次提示给下一个。复用 `rules` 着法枚举，不重算规则。

## 公共 API 契约
```ts
export interface HintResult { moves: Move[]; }   // 已排序的建议序列（可空：无合法出牌）
export function hintSuggestions(hand: Card[], current: HandPattern | null): Move[];
/** 循环取下一个建议：prev 为上次建议的 cards（无则取第一个）；到尾回绕；无建议 → null。 */
export function nextHint(hand: Card[], current: HandPattern | null, prev?: Card[]): Move | null;
```

## 行为要求
1. `current === null`（领出）→ 基于 `enumerateMoves(hand)`；否则 `legalFollows(hand, current)`。
2. 排序稳定且确定：非炸弹优先、同类小牌优先（可复用 `_shared.compareMoves` 的全序；炸弹/火箭排末尾）。**纯函数、确定性**——同输入同输出。
3. `nextHint`：`prev` 命中序列中某项则返回其**后一项**（末项回绕到首项）；`prev` 未命中或缺省 → 首项；序列空 → `null`。
4. 禁 import `cc`、**禁 import `ai/bidding*.ts`**、不改入参。

## 验收（实现方自写 test/ai/hint.test.ts）
- 领出（current null）手牌 `3 3 4 5 5`：`hintSuggestions` 非空、首项为最小合法走法（如单 3 或对 5——以排序规则为准）、炸弹（若有）不在首位。
- 跟牌：手 `5 9 2` 跟单 `A` → 建议含单 2（能压），不含压不住的 5/9（被 legalFollows 过滤）。
- 无合法出牌（跟一个手牌压不过的牌型）→ `hintSuggestions` 为 `[]`、`nextHint` 返回 `null`。
- `nextHint` 循环：连续以上一次结果的 `cards` 传入，能遍历整个序列并回绕到首项；`prev` 缺省 → 首项。
- 确定性：两次同参调用 `hintSuggestions` 深相等。
- 所有建议 `validatePlay(move.cards, current).ok === true`。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
