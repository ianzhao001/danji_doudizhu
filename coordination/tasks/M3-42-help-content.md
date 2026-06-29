# M3-42 规则帮助内容模型（第十一批·打磨）

- 状态：**ready**（无代码依赖；内容以 `docs/RULES.md` 为准）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 纯 spec
- 分支：`task/M3-42-help-content`（`git worktree add ../斗地主.worktrees/M3-42 -b task/M3-42-help-content main`）
- 文件域：`assets/scripts/ui/help-content.ts`（新）、`test/ui/help-content.test.ts`（新）、report

## 目标
单机离线「规则/帮助」屏的纯内容数据模型（无网络）。把斗地主规则整理成分节文本，供帮助界面渲染。**内容须与 `docs/RULES.md` 一致**。

## 接口
```ts
export interface HelpSection { id: string; title: string; lines: string[]; }
export function helpSections(): HelpSection[];
```
- 至少 4 节：`patterns`（牌型：单/对/三张及带牌/顺子/连对/飞机/四带二/炸弹/火箭）、`compare`（同型同张才比，炸弹压非炸、火箭最大）、`bidding`（叫/抢/反抢翻倍）、`scoring`（底分×连乘倍数：叫抢×炸弹/火箭×春天）。
- 纯数据、确定性（每次返回等价内容）、零 `cc`、不依赖运行时状态。

## 验收
- 测试：节数与 id 稳定、每节 title 非空、lines 非空；关键术语出现（如「火箭」「春天」「连乘」）。
- 全绿、typecheck 净、零 cc、report 落盘。
