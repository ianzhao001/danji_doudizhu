# M3-60 AI 思考指示视图模型（第十三批·打磨）

- 状态：**ready**（无代码依赖·纯函数）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M3-60-ai-thinking-view`（`git worktree add ../斗地主.worktrees/M3-60 -b task/M3-60-ai-thinking-view main`）
- 文件域：`assets/scripts/ui/ai-thinking-view.ts`（新）、`test/ui/ai-thinking-view.test.ts`（新）、report

## 目标
对局中提示「当前哪个座位在思考/行动」的纯展示 VM，供游戏屏在 AI 回合显示 loading 点。纯函数。

## 接口
```ts
export interface AiThinkingView { active: boolean; seat: SeatIndex | null; label: string; dots: number; }
export function deriveAiThinking(turn: SeatIndex, heroSeat: SeatIndex, phase: 'bidding' | 'playing' | 'settled', tickMs: number): AiThinkingView;
```
- `active = phase!=='settled' && turn!==heroSeat`（轮到 AI）；`seat=active?turn:null`；`label` 形如「AI 左家思考中」（座位→名称映射，与既有座位文案一致）；`dots = floor(tickMs/300)%4`（0..3，做动效点数）。
- 纯函数、确定性、零 cc。

## 验收
- 测试：hero 回合 active=false、AI 回合 active=true+seat、settled 不 active、dots 周期 0..3、label 对应座位。
- 全绿、typecheck 净、零 cc、report 落盘。
