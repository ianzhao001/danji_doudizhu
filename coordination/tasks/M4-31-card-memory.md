# M4-31 已出牌记忆/未见牌推算（第十二批·AI 纵深）

- 状态：**ready**（依赖 `game` GameEvent + `rules` 牌组已在 main）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M4-31-card-memory`（`git worktree add ../斗地主.worktrees/M4-31 -b task/M4-31-card-memory main`）
- 文件域：`assets/scripts/ai/cardMemory.ts`（新）、`test/ai/card-memory.test.ts`（新）、report

## 目标
从**公开** `GameEvent[]`（play/bomb/rocket 暴露 pattern.cards）推算每个点数还剩多少张未现身，供「已出牌」HUD（M3-54）与未来 AI。**仅用公开信息**（不碰隐藏手牌）。纯函数。

## 接口
```ts
export interface CardMemory {
  remainingByRank: Record<number, number>; // rank(3..15,16,17) → 剩余未见张数
  playedCount: number;                      // 已公开打出的总张数
}
export function trackPlayed(events: GameEvent[], ownHand?: Card[]): CardMemory;
```
- 起点：标准 54 张每点数的初始张数（3..A/2 各 4 张、大小王各 1）。从 events 的 play/bomb/rocket 的 `pattern.cards` 扣减；可选 `ownHand` 一并扣（视角玩家已知自己的牌）。
- 扣减不为负（防御坏输入）；pass/reset/win 不计牌。空 events → 初始全量（减 ownHand）。纯函数、确定性、不改入参；零 cc。

## 验收
- 测试：空 events 全量；出若干牌后对应 rank 递减；炸弹扣 4 张同点；火箭扣双王；含 ownHand 扣减；不越界为负；可复现。
- 全绿、typecheck 净、零 cc、report 落盘。
