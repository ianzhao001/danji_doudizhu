# M5-14 持久化层分层校正 + 校验/原子性加固（架构债收口）

- 状态：**ready**（纯 spec 派发·无架构种入测试）——实现方按本 spec 自写 vitest 测试 + 实现。新文件 **import 直引、不改 `index.ts` 桶**。
- 起源：第五/六批合并后，架构对 `b511c08..main`（14 产品文件 / +296−26）做 6 维对抗式审查（36 agent / 25 确认 / 4 驳回），发现一批**架构债**。本任务收口其中**分层违规 + 校验缺口 + 原子性**三类。**纯逻辑层、禁 import `cc`。**
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/resume.ts`（去 `import type { SaveSlot } from '../data/save'`——见下「分层」）
  - `assets/scripts/game/types.ts`（新增 resume-payload DTO：`ResumePayload`，见下）
  - `assets/scripts/data/save.ts`（`deserializeSave` 加 events 元素校验 + 去对 `game` 的反向 type 依赖若可）
  - `assets/scripts/data/aggregate.ts`（`import type { FlowResult } from '../flow'` → 改为从 `game` 取等价 DTO 或经 `session` 注入，见下）
  - `assets/scripts/data/session.ts`（`commitFinishedRound` 原子化 + 去 `flow` type 依赖；`loadRecords` 损坏区分 absent/corrupt）
  - 新增 `test/game/resume-layering.test.ts`、`test/data/save-events-validation.test.ts`、`test/data/session-atomicity.test.ts`（实现方自写）
  - 可读不可改：`assets/scripts/{rules,flow}/**`、`assets/scripts/game/{serialize,core,settlement}.ts`、其余 `data/**`、`test/**`（除上述新增）
- 依赖：第五/六批已并 main（resume/aggregate/session/save/records 均在）
- 分支：`task/M5-14-resume-layering`

## 背景：分层违规（架构 spec 缺陷·非实现方过错）
ARCHITECTURE.md 固定依赖方向：`game` 只依赖 `rules`；`data` 只依赖可序列化 DTO，不反向依赖表现层/编排层。但 M5-10/M5-13 的**架构 spec** 明确让实现方写出下列边——是 spec 自身的缺陷，实现方 Codex 严格照 spec 落地（无过错）：

1. **`game/resume.ts:5` `import type { SaveSlot } from '../data/save'`**：`game` 反向依赖 `data`（type-only，运行时擦除，**无运行时环**，但违反「game 只依赖 rules」边界）。
2. **`data/aggregate.ts:5` 与 `data/session.ts:5` `import type { FlowResult } from '../flow'`**：`data` 依赖编排层 `flow`（违反「data 只依赖 DTO」）。
3. **`data/session.ts:6` `import { resumeRound, ... } from '../game'`（**运行时**）**：`data` 运行时依赖 `game`（加深 data→game 耦合；`data/save.ts:8` 已有 `game/serialize` 运行时依赖——既存，非本批引入）。

> 既有 `data/save.ts → game/serialize`（运行时）是历史既存边（M5-04 起），本任务**不强制拆**（拆它会动 serialize 契约，风险大）；本任务聚焦**新引入的 resume/aggregate/session 边**。

## 校正方案（实现方据实微调·以届时真实类型为准）
### A. resume-payload DTO 上移到 game（修违规 #1 + #3 的 game→data type 边）
- 在 `game/types.ts` 新增 DTO（**不**含 IO/Storage 概念）：
  ```ts
  /** 断局恢复所需的纯数据负载（不含 savedAt/version 等 IO 元数据）。 */
  export interface ResumePayload {
    round: RoundState;
    heroSeat?: SeatIndex;
    bidMultiplier?: number;
    events?: GameEvent[];
  }
  ```
- `game/resume.ts`：`resumeRound` 改为接收 **`ResumePayload`**（而非 `SaveSlot`），从 `./types` 取类型——**消除 `import type { SaveSlot } from '../data/save'`**。`ResumeSnapshot` 仍由本文件导出。
- `data/save.ts`：`SaveSlot` 的 resume 三字段（heroSeat/bidMultiplier/events）形状与 `ResumePayload` 对齐；提供一个**纯投影** helper（如 `SaveSlot → ResumePayload`）供 `data/session.ts` 调用，使 `session.restoreRound` = `loadSave → 投影为 ResumePayload → resumeRound`。**`data → game` 方向保留**（data 消费 game 的 DTO/函数，符合「data 依赖 game 的可序列化 DTO」），**消除 `game → data` 方向**。

### B. data 不依赖 flow（修违规 #2）
- `FlowResult` 的**聚合所需字段**只有 `{ landlord, winner, settlement }`（见 `aggregate.ts` 现状只读这三项 + settlement 内字段）。`data/aggregate.ts` 与 `data/session.ts` 改为接收一个**窄 DTO**（如 `RoundFinishInput { landlord: SeatIndex; winner: Side; settlement: Settlement }`，定义在 `game/types.ts` 或 `aggregate.ts` 本地），由 `flow`（调用方）把 `FlowResult` 投影成该 DTO 后传入——**消除 `data → flow` 的 type 边**。`flow` 依赖 `game`+`data` 是允许方向。
- 注意：`commitFinishedRound` 当前签名 `args: { result: FlowResult; ... }` → 改为 `args: { finish: RoundFinishInput; heroSeat; playedAt }`。

### C. 校验缺口（medium 级·latent）
- `data/save.ts` `deserializeSave`：`events` 当前仅 `Array.isArray` + `as GameEvent[]` 裸转（**无元素校验**）。补**逐元素最小校验**：每个元素须为 object 且有合法 `type`（枚举 `GameEvent` 的 discriminated union tag）；非法元素 → 整体 `corrupted('events contains invalid entry')` 或剔除非法项（二选一在实现时定，与既有 `corrupted` 抛错约定一致）。**不得**放宽其它校验。
- `data/statsCodec.ts`：`deserializeStats` 对 unknown version 直接 `emptyStats()`（**静默丢弃全部战绩**）。注释辩「stats 可推导」**不成立**（records 无胜负方归因，无法重建 asLandlord/landlordWins）。当前 version 恒为 1 故 latent。**校正**：保留 version 守卫，但把「静默丢弃」改为可观测（如返回 `{ stats, migrated: boolean }` 或导出 `MIGRATED_SENTINEL`），让调用方/调用方可告警；或在注释订正为「**不可**推导，故 version 必须匹配」。最小做法：订正注释 + 加一条 green 测试锁「unknown version → emptyStats」（已隐式绿，补显式）。

### D. 原子性（medium 级·latent）
- `data/session.ts` `commitFinishedRound` 当前**非原子**：依次写 stats → 写 records → 清 save 槽；若中途失败（注入 storage 抛错），重试会**双计 stats**。校正：**先算后写、写失败可重入**——`applyFinishedRound` 的结果先算出（纯函数、幂等），写入顺序改为「**先清 save 槽、再写 stats、再写 records**」（清槽幂等；stats/records 写入若失败，重试因结果已定不会双计）。或注入一个 `commitAll(storage, ops)` 批量原语（注入的 StorageLike 不保证原子，故以**幂等顺序**近似）。**纯逻辑、注入 fake storage 可测**。

### E. records 写入对称化（low/nit）
- `commitFinishedRound` 写 records 用裸 `JSON.stringify(next.records)`，读用 `migrateRecords(JSON.parse)`——不对称。校正：在 `data/records.ts` 加 `serializeRecords(state): string`（包 `{version: RECORDS_VERSION, entries}`），`session` 写路径改用它；读路径保持 `migrateRecords`。**往返不变、version 集中**。

### F. 损坏可观测（low）
- `data/session.ts` `loadRecords`：JSON parse 抛错 → `emptyRecords()`，与 save 槽「损坏抛错」契约不一致、且**静默吞全部历史**。校正：损坏时**不静默**——可返回 `emptyRecords()` 但经可观测通道（如 console.warn，**禁 cc**；或返回 `{records, ok}` 让 UI 告警）。最小：区分 absent（raw===null → empty，正常）与 corrupt（parse 抛错 → empty + 告警）。

## 验收（实现方自写上述 3 个新测试文件 + 既有测试全绿）
- **分层**：`grep -rn "from '../data/save'" assets/scripts/game/` → **零命中**；`grep -rn "from '../flow'" assets/scripts/data/` → **零命中**。`game/resume.ts` 不再 import `data`。
- **resume 语义不变**：`resumeRound(投影自 SaveSlot)` 对既有 `test/game/resume.test.ts` 行为等价（heroSeat 缺→`round.landlord`、bidMultiplier 缺→1、events 缺→[]）。既有 resume/save/save-resume-fields 测试全绿（可能需按 DTO 上移微调测试构造，但**语义断言不变**）。
- **events 校验**：`deserializeSave` 对含非法 events 元素的 wire 抛 corrupted（或剔除）；合法 events 往返保真。
- **原子性**：注入一个「第二次 setItem 抛错」的 fake storage，`commitFinishedRound` 抛错后**重试一次**，`stats.rounds` 恰好 +1（非 +2）。
- **records 对称**：`serializeRecords`/`migrateRecords` 往返等价；`commitFinishedRound` 写出的 records 能被 `loadRecords` 读回。
- **typecheck 净、`npm --prefix test test` 全绿、纯逻辑层零 `cc`**。既有 79 文件 / 416 用例不回退（新增测试计入）。

## 不在本任务范围（避免越界）
- 不拆既存 `data/save.ts → game/serialize` 运行时边（风险大、非本批引入）。
- 不动 `ai/`（M4-10 已验证行为保持）。
- 不动 `ui/screen-view.ts` 的 `landlord ?? 0` latent 误标（low·无产品调用方；留编辑器阶段绑真实 snapshot 时一并处理）。
- 不改 `M5-10-resume.md` 验收 #48 的 stale 文案（仅文档，不影响代码；如顺手可订正）。

## 测试命令
`npm --prefix test run typecheck && npm --prefix test test`
