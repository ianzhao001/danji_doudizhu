# M3-51 手牌强度条视图模型（消费 M4-30 · 第十二批·打磨）

- 状态：**ready**（依赖 M4-30 入 main 后认领）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M3-51-strength-meter-view`（`git worktree add ../斗地主.worktrees/M3-51 -b task/M3-51-strength-meter-view main`）
- 文件域：`assets/scripts/ui/strength-meter-view.ts`（新）、`test/ui/strength-meter-view.test.ts`（新）、report
- 依赖：**M4-30**（`evaluateHand`/`HandStrength`）

## 目标
把 `HandStrength` 转成强度条 UI 的 VM（百分比 + 档位文案 + 色调键），不重算评分。

## 接口
```ts
export interface StrengthMeterView { pct: number; label: string; tone: 'weak' | 'mid' | 'strong'; }
export function deriveStrengthMeter(strength: HandStrength): StrengthMeterView;
```
- `pct = strength.score`（0..100）；`tone`/`label` 按阈值分档（如 <34 弱/34-66 中/>66 强）。
- 纯函数、确定性、不可变；零 cc。

## 验收
- 测试：三档边界（含分界值）映射正确、pct 透传、label 非空。
- 全绿、typecheck 净、零 cc、report 落盘。
