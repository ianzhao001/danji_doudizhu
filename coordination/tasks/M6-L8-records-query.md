# M6-L8 对局历史查询/筛选（第十一批·打磨）

- 状态：**ready**（依赖 `data/records.ts` 已在 main）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 纯 spec
- 分支：`task/M6-L8-records-query`（`git worktree add ../斗地主.worktrees/M6-L8 -b task/M6-L8-records-query main`）
- 文件域：`assets/scripts/data/recordsQuery.ts`（新）、`test/data/records-query.test.ts`（新）、report
- 不改 `records.ts`/桶（import 直引）

## 目标
对 `RecordsState.entries` 做纯查询（筛选 + 排序 + 截断），供历史明细界面（M3-41）的过滤器使用。

## 接口
```ts
export type RecordOutcome = 'all' | 'win' | 'loss';
export type RecordRole = 'all' | 'landlord' | 'farmer';
export interface RecordQuery { outcome?: RecordOutcome; role?: RecordRole; spring?: 'all' | Spring; order?: 'newest' | 'oldest'; limit?: number; }
export function queryRecords(records: RecordsState, q?: RecordQuery): RecordEntry[];
```
- 胜负/角色口径与 `stats.ts:recordRound` 一致（heroSeat===landlord 判角色；heroWon 判胜负）。
- 默认：`outcome='all',role='all',spring='all',order='newest',limit` 不传不截断。
- `order='newest'`：按 `playedAt` 降序（并列保持稳定）；`oldest` 升序。`limit<=0` → 空数组。
- 纯函数、不可变、不修改入参 records/entries；零 `cc`。

## 验收
- 测试覆盖：无过滤全返、win/loss、landlord/farmer、spring、order 两向、limit（含 0/负/超长）、空记录、稳定排序。
- 全绿、typecheck 净、零 cc、report 落盘。
