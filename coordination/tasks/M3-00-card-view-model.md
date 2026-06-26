# M3-00 牌面视图模型（Card → 渲染键）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/card-view.ts`（新；`ui/` 纯逻辑岛，本文件**禁止 import `cc`**）
  - 可读不可改：`assets/scripts/rules/**`、`test/ui/**`
- 依赖：无（独立；复用 `rules` 的 `Card`/`Rank`/`Suit`/`RANK_LABEL`）
- 分支：`task/M3-00-card-view-model`

## 背景
Cocos 手牌渲染需要从 `Card` 得到「用哪张图、显示什么点数、什么花色、排序键」。
先做成无 cc 纯函数，后续组件直接消费，便于单测。

## 行为要求（纯函数、确定性、禁 cc）
1. `cardView(card: Card): { assetKey: string; rankLabel: string; suitKey: Suit | 'joker'; sortKey: number }`：
   - `assetKey`：稳定字符串，如 `${rank}-${suit}`（实现方定形，须**确定性**且**唯一**到牌）。
   - `rankLabel`：复用 `RANK_LABEL[card.rank]`（rules 已导出）；双王用 `'小王'`/`'大王'`（与 RANK_LABEL 一致）。
   - `suitKey`：`card.suit`；王为 `'joker'`。
   - `sortKey`：等于 `card.rank`（数值，便于升序排）。
2. `cardsView(cards: Card[]): ReturnType<cardView>[]`：对每张牌 `cardView`，**保持入参顺序**、返回新数组。
3. 不改入参；禁止 import `cc`。

## 验收（test/ui/card-view.test.ts，架构种入·不可改）
- `cardView` 各字段非空、`sortKey === card.rank`、`rankLabel` 与 `RANK_LABEL` 一致。
- `assetKey` 对同 rank 不同 suit 不同（唯一到牌）、对同牌相同（确定性）。
- 双王：`suitKey === 'joker'`、`rankLabel` 为王文案。
- `cardsView` 长度等同入参、保持顺序、入参不变。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
