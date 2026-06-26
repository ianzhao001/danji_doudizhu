# M5-10 断局存档负载扩展 + Resume 纯函数

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/save.ts`（扩展 `SaveSlot` + 收紧 `savedAt`）
  - `assets/scripts/game/resume.ts`（新）
  - `assets/scripts/game/index.ts`（桶由架构维护，已加 `export * from './resume'`）
  - 可读不可改：`assets/scripts/game/{types,serialize,core,settlement}.ts`、`assets/scripts/data/saveStorage.ts`、`test/data/**`、`test/game/**`
- 依赖：M5-04（`SaveSlot`/`serializeSave`/`deserializeSave`）+ M2-01（`RoundState`/`GameEvent`/`GameSnapshot`）已并 main
- 分支：`task/M5-10-resume`

## 背景
断局重开（QA「读档后能合法继续当前局」）需要把存档里的 `RoundState` 恢复成可继续的对局，并保留再结算所需信息（`heroSeat`/`bidMultiplier`/`events`）。当前 `SaveSlot` 只有 `{version,savedAt,round}`——`settle()` 需要 `events`+`bidMultiplier`，`stats/records` 需要 `heroSeat`，故负载必须扩展。

## 行为要求
1. **`SaveSlot` 加 3 个 optional 字段**（必须 optional，否则既有 `test/data/save.test.ts:30` 的 `{version,savedAt,round}` 字面量编译失败——该测试不可改）：
   ```ts
   export interface SaveSlot {
     version: number;
     savedAt: number;
     round: RoundState;
     heroSeat?: SeatIndex;       // 真人座位（缺则回退 round.landlord）
     bidMultiplier?: number;     // 叫抢倍数（缺则回退 1）
     events?: GameEvent[];       // 本局已发生事件（缺则回退 []）
   }
   ```
2. `serializeSave(slot)`：恒写 `SAVE_VERSION`（保持现状）+ 写入存在的可选字段（`heroSeat`/`bidMultiplier`/`events`）。**`SAVE_VERSION` 保持 1**（加性扩展，不破坏往返）。
3. `deserializeSave(json)`：在既有校验后，校验并回填可选字段——`heroSeat` 若存在须为合法 `SeatIndex`（0|1|2）；`bidMultiplier` 若存在须为非负整数；`events` 若存在须为数组（逐项形态可宽松，不强校验内部）。返回的 `SaveSlot` 保留这些字段。
4. 收紧 `savedAt`：由 `Number.isFinite` 改为 `Number.isInteger && savedAt >= 0`（既有测试用整数，不破）。`corrupted('savedAt must be a non-negative integer')`。
5. 新 `game/resume.ts`：
   ```ts
   export interface ResumeSnapshot {
     state: RoundState;
     heroSeat: SeatIndex;
     bidMultiplier: number;
     events: GameEvent[];
   }
   export function resumeRound(slot: SaveSlot): ResumeSnapshot;
   ```
   缺字段回退：`heroSeat = slot.heroSeat ?? slot.round.landlord`；`bidMultiplier = slot.bidMultiplier ?? 1`；`events = slot.events ?? []`。返回 `state: slot.round`（不复制 round 内部，只组合）。
6. 纯函数、确定性、禁 import `cc`。从 `./types` 取 `RoundState`/`GameEvent`/`SeatIndex`，从 `../data/save` 取 `SaveSlot`（type-only）。

## 验收（test/game/resume.test.ts + test/data/save-resume-fields.test.ts，架构种入·不可改）
- `resumeRound(完整 slot)`：返回 `{state,heroSeat,bidMultiplier,events}` 深相等入参字段。
- `resumeRound(缺 heroSeat/bidMultiplier/events 的 v1 slot)`：`heroSeat===round.landlord`、`bidMultiplier===1`、`events===[]`。
- `deserializeSave` 拒绝非法 `heroSeat`（如 `9`）、负 `bidMultiplier`（如 `-1`）、非整数 `bidMultiplier`（如 `1.5`）、`events` 非数组（如 `'x'`）。
- `savedAt` 非整数（如 `1.5`）或负（如 `-1`）→ 抛错；`savedAt: 0` → 不抛（非负下界）。**这是行为要求 #4 的强制项**（`save-resume-fields.test.ts` 种入·红，须收紧 `save.ts` 后转绿）。
- canonical wire（绿护栏，`save-resume-fields.test.ts`）：缺省可选字段时 `serializeSave` 输出**不含** `heroSeat`/`bidMultiplier`/`events` 键；存在时写入并往返保真；`bidMultiplier: 0` 边界往返保真。
- 往返：完整 slot `serializeSave`→`deserializeSave`→`resumeRound` 深相等（绿护栏）。
- 既有 `save.test.ts` 全绿不改、`npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
