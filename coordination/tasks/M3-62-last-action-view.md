# M3-62 上一手动作视图模型（第十三批·打磨）

- 状态：**ready**（依赖 `game` GameEvent + `ui/card-view` 已在 main）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M3-62-last-action-view`（`git worktree add ../斗地主.worktrees/M3-62 -b task/M3-62-last-action-view main`）
- 文件域：`assets/scripts/ui/last-action-view.ts`（新）、`test/ui/last-action-view.test.ts`（新）、report

## 目标
把最近事件转成「每个座位上一手做了什么」的 VM（出了什么牌型/不要/炸弹），供座位旁显示。纯函数。

## 接口
```ts
export interface SeatLastAction { seat: SeatIndex; text: string; } // 如「出 一对K」「不要」「炸弹」「—」
export function deriveLastActions(recentEvents: GameEvent[]): SeatLastAction[]; // 长度 3，按座位 0/1/2
```
- 扫描 recentEvents，取每个座位最近一次动作映射为短文案（play→牌型中文 + 主点；pass→「不要」；bomb→「炸弹」；rocket→「火箭」；无→「—」）。
- 牌型/点数文案复用既有 `card-view`/RANK_LABEL 口径；reset/win 不计入「上一手」。
- 纯函数、确定性、长度恒 3、不改入参；零 cc。

## 验收
- 测试：三座位各自最近动作、pass/bomb/rocket 文案、无动作「—」、play 牌型描述、保序长度 3。
- 全绿、typecheck 净、零 cc、report 落盘。
