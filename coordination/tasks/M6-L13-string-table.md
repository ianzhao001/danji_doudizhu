# M6-L13 UI 文案集中表（第十二批·可维护性打磨）

- 状态：**ready**（无代码依赖·纯数据）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M6-L13-string-table`（`git worktree add ../斗地主.worktrees/M6-L13 -b task/M6-L13-string-table main`）
- 文件域：`assets/scripts/ui/strings.ts`（新）、`test/ui/strings.test.ts`（新）、report
- **不改** 现有组件/视图（本任务只**新增**集中表；组件迁移到该表是后续编辑器任务，非本任务）

## 目标
把散落在组件/视图里的中文 UI 文案集中为单一只读字符串表 + 取值函数，为后续一致性维护（及潜在本地化）打基础。**首版仍 zh-only**，不引入 i18n 框架。

## 接口
```ts
export const STRINGS: Readonly<Record<string, string>>;
export function t(key: string, fallback?: string): string; // 缺键回 fallback ?? key
```
- 收录常用键：`lobby.newGame`/`lobby.continue`/`lobby.stats`/`lobby.settings`/`action.play`/`action.pass`/`action.hint`/`bid.call`/`bid.grab`/`bid.pass`/`result.win`/`result.lose`/`cue.bomb`/`cue.spring` 等（覆盖现有组件出现过的文案）。
- `t` 缺键返回 `fallback ?? key`，不抛错。纯数据、确定性、零 cc。

## 验收
- 测试：已知键取值正确、缺键回退、STRINGS 只读（类型层 Readonly）、键命名规范（`域.名`）。
- 全绿、typecheck 净、零 cc、report 落盘。
