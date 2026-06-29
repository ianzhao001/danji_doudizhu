# M6-L12 暂停/退出确认状态模型（第十一批·打磨）

- 状态：**ready**（无代码依赖·纯状态机）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 纯 spec
- 分支：`task/M6-L12-pause-menu`（`git worktree add ../斗地主.worktrees/M6-L12 -b task/M6-L12-pause-menu main`）
- 文件域：`assets/scripts/ui/pause-menu.ts`（新）、`test/ui/pause-menu.test.ts`（新）、report

## 目标
对局内「暂停菜单 + 退出确认」的纯不可变状态模型，供游戏场景叠加层（M3-46）消费。无 `cc`、无 IO。

## 接口
```ts
export type PauseStage = 'closed' | 'menu' | 'confirm-quit';
export interface PauseState { stage: PauseStage; }
export const initialPause: PauseState;
export function openMenu(s: PauseState): PauseState;     // closed/* → menu
export function closeMenu(s: PauseState): PauseState;    // → closed
export function askQuit(s: PauseState): PauseState;      // menu → confirm-quit
export function cancelQuit(s: PauseState): PauseState;   // confirm-quit → menu
```
- 不可变（每次返回新对象）、非法转移返回原状态（如 closed 上 askQuit 不变）。
- 纯函数、确定性、零 `cc`。
- 仅建模 UI 叠加层开闭/确认状态；不触碰运行时/存档（resume/restart 的实际动作由组件接 round-runtime，本任务只出状态机）。

## 验收
- 测试：每条合法转移、非法转移幂等、initialPause=closed。
- 全绿、typecheck 净、零 cc、report 落盘。
