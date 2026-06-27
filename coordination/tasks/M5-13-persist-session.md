# M5-13 单局会话持久化集成（save↔resume↔aggregate 串联，纯逻辑）

- 状态：**blocked**（待 T1 `M5-10-resume` + T2 `M5-11-aggregate` 并 main 后转 ready；分支届时由架构创建）
- **派发模式：纯 spec（无架构种入测试）**——解锁后实现方按本 spec 自写 vitest 测试 + 实现。新文件 **import 直引、不改 `data/index.ts` 桶**。
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/session.ts`（新）
  - 新增 `test/data/session.test.ts`（实现方自写）
  - 可读不可改：`assets/scripts/data/{save,saveStorage,stats,records,aggregate}.ts`、`assets/scripts/game/{resume,types}.ts`、`assets/scripts/flow/types.ts`（`FlowResult`）
- 依赖：**T1**（`SaveSlot` 扩展 + `resumeRound`/`ResumeSnapshot`）、**T2**（`applyFinishedRound`）、M5-06/07（storage 适配器，已并 main）
- 分支：`task/M5-13-persist-session`（解锁后建）

## 背景
存储适配器（M5-06/07）、resume（T1）、aggregate（T2）各就位后，缺一条把它们串起来的**纯编排**：把当前对局存盘 → 重开时读盘恢复 → 结束时把结果累进战绩/历史并存盘。这是 QA「读档继续 + 战绩可保存」的收口层，**只做编排、注入 StorageLike、无浏览器依赖**。

## 公共 API 契约（解锁后以届时真实类型为准微调）
```ts
export interface SessionKeys { save: string; stats: string; records: string; }
/** 存当前对局（组装 SaveSlot 写入 save 槽）。 */
export function persistRound(storage: StorageLike, keys: SessionKeys,
  args: { round: RoundState; heroSeat: SeatIndex; bidMultiplier: number; events: GameEvent[] }): void;
/** 读盘恢复为可继续对局；无存档→null（复用 resumeRound）。 */
export function restoreRound(storage: StorageLike, keys: SessionKeys): ResumeSnapshot | null;
/** 一局结束：清存档槽 + applyFinishedRound 累进并写回 stats/records 槽。 */
export function commitFinishedRound(storage: StorageLike, keys: SessionKeys,
  args: { result: FlowResult; heroSeat: SeatIndex; playedAt: number }): { stats: MatchStats; records: RecordsState };
```

## 行为要求（草案，解锁后定稿）
1. `persistRound`：组 `SaveSlot{version,savedAt,round,heroSeat,bidMultiplier,events}` → `saveSave`。
2. `restoreRound`：`loadSave`→null 则 null；否则 `resumeRound(slot)`。
3. `commitFinishedRound`：读现有 stats/records（缺→empty）→ `applyFinishedRound` → 写回；并 `removeSave`（清断局槽）。
4. 纯编排、注入 `StorageLike`、禁 import `cc`、不做规则判断。

## 验收（解锁后补；要点）
- 存→取往返：`persistRound` 后 `restoreRound` 得到等价 `ResumeSnapshot`。
- 无存档 → `restoreRound` 返回 null。
- `commitFinishedRound` 使 stats.rounds+1、records 追加、save 槽被清除（之后 restore→null）。
- 注入内存 fake storage，无浏览器依赖；`npm --prefix test test` 全绿、typecheck 净、未 import `cc`。
