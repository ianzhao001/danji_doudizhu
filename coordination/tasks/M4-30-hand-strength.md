# M4-30 手牌强度评估（第十二批·AI 纵深）

- 状态：**ready**（依赖 `rules` 牌型/枚举已在 main）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M4-30-hand-strength`（`git worktree add ../斗地主.worktrees/M4-30 -b task/M4-30-hand-strength main`）
- 文件域：`assets/scripts/ai/handStrength.ts`（新）、`test/ai/hand-strength.test.ts`（新）、report
- **不改** `ai/bidding*.ts`（`isStrongHand` 是 boolean 判强；本任务是 0..100 连续评分，互补不替代）

## 目标
给一手牌一个 0..100 的强度评分 + 结构分解，供叫抢建议（M6-L10）、强度条 UI（M3-51）、未来 AI 复用。纯函数。

## 接口
```ts
export interface HandStrength {
  score: number;        // 0..100 整数
  bombs: number;        // 炸弹数
  rockets: number;      // 0/1（双王）
  highCards: number;    // ≥2(点数15) 与王的张数
  longestStraight: number;
}
export function evaluateHand(cards: Card[]): HandStrength;
```
- 评分加权（确定性、可解释）：炸弹/火箭权重最高、2 与大小王次之、顺子/连对结构加成、张数过多略减。**具体权重实现方定，但须单调**（加一张大牌或一个炸弹分不降）。
- 空手 → score 0。纯函数、确定性、不改入参；零 cc。

## 验收
- 测试：空手 0；含火箭分高于不含；多炸弹 > 单炸弹 > 无炸弹；单调性（加大牌不降分）；score∈[0,100]；可复现。
- 全绿、typecheck 净、零 cc、report 落盘。
