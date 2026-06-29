# M4-32 残局一手出完检测（第十二批·AI 纵深）

- 状态：**ready**（依赖 `rules` 牌型识别/枚举已在 main）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M4-32-endgame-finisher`（`git worktree add ../斗地主.worktrees/M4-32 -b task/M4-32-endgame-finisher main`）
- 文件域：`assets/scripts/ai/endgame.ts`（新）、`test/ai/endgame.test.ts`（新）、report
- **不改** 既有 AI/hint（仅 import `rules` 枚举）

## 目标
残局判断：当前轮到自己**领出**时，手牌能否一手全部打光（即整手是单一合法牌型）；以及跟牌时是否存在一手打光的合法跟牌。供提示「可一击制胜」与未来 AI 收官。纯函数。

## 接口
```ts
export function canFinishInOneMove(hand: Card[]): boolean;            // 领出：整手是单一合法牌型
export function finishingFollow(hand: Card[], top: HandPattern): Move | null; // 跟牌：能一手出完且压过 top 的着法
```
- `canFinishInOneMove`：`recognize(hand)` 为合法牌型即 true（含单/对/炸/顺/连对/飞机/四带二等）。空手→false。
- `finishingFollow`：在 `legalFollows(hand, top)` 中找用光全部手牌的着法（cards.length===hand.length），返回其一（确定性取首个稳定序），无则 null。
- 纯函数、确定性、不改入参；零 cc。

## 验收
- 测试：整手顺子→true、整手三带二→true、杂牌→false、空手→false；跟牌一手出完命中、无解返回 null；可复现。
- 全绿、typecheck 净、零 cc、report 落盘。
