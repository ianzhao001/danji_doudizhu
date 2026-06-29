# M3-50 新手教程步骤模型（第十二批·打磨·离线）

- 状态：**ready**（内容以 docs/RULES.md + GAME_DESIGN.md 为准）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M3-50-tutorial-steps`（`git worktree add ../斗地主.worktrees/M3-50 -b task/M3-50-tutorial-steps main`）
- 文件域：`assets/scripts/ui/tutorial-steps.ts`（新）、`test/ui/tutorial-steps.test.ts`（新）、report

## 目标
单机离线新手引导的有序步骤内容模型（无网络），供教程屏（M3-55）渲染。

## 接口
```ts
export interface TutorialStep { id: string; title: string; body: string; highlight?: string; }
export function tutorialSteps(): TutorialStep[];
export function nextStep(steps: TutorialStep[], index: number): number; // 钳制不越界
```
- 步骤覆盖核心循环：发牌/看手牌 → 叫抢地主 → 出牌与牌型 → 跟牌/不要 → 炸弹与火箭 → 结算与倍数。每步 title+body 简明，`highlight` 可选对应 UI 区域键（如 `playerHand`/`actionButtons`）。
- `nextStep` 钳制到 `[0, len-1]`。纯数据、确定性、零 cc。

## 验收
- 测试：步骤数与 id 稳定、覆盖叫抢/出牌/炸弹/结算关键词、nextStep 末步不越界、highlight 键合法（在已知区域键集合内）。
- 全绿、typecheck 净、零 cc、report 落盘。
