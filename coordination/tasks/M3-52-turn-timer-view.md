# M3-52 回合计时视图模型（第十二批·打磨）

- 状态：**ready**（无代码依赖·纯函数）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M3-52-turn-timer-view`（`git worktree add ../斗地主.worktrees/M3-52 -b task/M3-52-turn-timer-view main`）
- 文件域：`assets/scripts/ui/turn-timer.ts`（新）、`test/ui/turn-timer.test.ts`（新）、report

## 目标
玩家回合倒计时的纯展示模型（组件传入剩余/总时长，本模型只算展示态，不持有计时器）。单机轻提示用。

## 接口
```ts
export interface TurnTimerView { remainingSec: number; pct: number; urgent: boolean; label: string; }
export function deriveTurnTimer(remainingMs: number, totalMs: number): TurnTimerView;
```
- `remainingSec = ceil(max(0, remainingMs)/1000)`；`pct = clamp(remainingMs/totalMs*100, 0, 100)`（totalMs<=0 → pct 0、安全）；`urgent = remainingMs <= 5000`；`label` 形如 `15s`。
- 纯函数、确定性、不持有状态/定时器；零 cc。

## 验收
- 测试：满档 pct 100、过半、urgent 阈值（5s 边界）、remaining<=0 钳到 0、totalMs<=0 安全、向上取整。
- 全绿、typecheck 净、零 cc、report 落盘。
