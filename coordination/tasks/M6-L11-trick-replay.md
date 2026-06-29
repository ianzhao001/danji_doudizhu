# M6-L11 按墩回放模型（第十一批·打磨）

- 状态：**ready**（依赖 `game/replay.ts:buildTrace`、`GameEvent` 已在 main）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 纯 spec
- 分支：`task/M6-L11-trick-replay`（`git worktree add ../斗地主.worktrees/M6-L11 -b task/M6-L11-trick-replay main`）
- 文件域：`assets/scripts/game/trick-replay.ts`（新）、`test/game/trick-replay.test.ts`（新）、report
- **不改** `game/replay.ts`（可 import 复用 `buildTrace`）

## 目标
现有 `buildTrace` 是扁平事件序列；本任务把一局事件按「牌权墩」分组（连续两过 → `reset` 事件为墩边界），便于回放界面（M3-44）逐墩展示。纯函数。

## 接口
```ts
export interface ReplayPlay { seat: SeatIndex; kind: 'play' | 'pass' | 'bomb' | 'rocket'; }
export interface ReplayTrick { index: number; leader: SeatIndex; plays: ReplayPlay[]; winnerSeat: SeatIndex | null; }
export function buildTricks(events: GameEvent[]): ReplayTrick[];
```
- 用 `reset.leader` / 首个出牌方界定每墩 leader；墩内收集 play/pass/bomb/rocket；`win` 事件落到最后一墩 `winnerSeat`。
- 不产生非法分组；无事件 → 空数组；纯函数、确定性、零 `cc`、不改 events。

## 验收
- 测试：单墩、多墩（reset 分墩）、含炸弹/火箭墩、收尾 win 墩、空输入；同输入深相等。
- 全绿、typecheck 净、零 cc、report 落盘。
