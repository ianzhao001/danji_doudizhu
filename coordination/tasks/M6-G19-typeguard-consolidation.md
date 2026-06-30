# M6-G19 跨层类型守卫去重（DRY 收口·审查转化·纯逻辑）

- 状态：ready（纯逻辑·无依赖·可即认领）
- 派发模式：**纯 spec**（架构出任务定义；实现方改产品码 + 保持既有测试全绿，不弱化）
- 文件域（**只允许改这些**）：
  - 新 `assets/scripts/rules/guards.ts`（generic + Card 守卫）
  - 新 `assets/scripts/game/seat.ts`（seat/event 守卫）
  - 改 import 的消费方：`game/{core,bidding,serialize,replay-codec}.ts`、`data/{save,records,statsCodec,settings}.ts`、`ai/hint.ts`、`ui/components/game-scene-skeleton.ts`（仅替换本地 `cardKey` 为 import）
  - 可新增 `test/rules/guards.test.ts` / `test/game/seat.test.ts`（**不可改/弱化**既有测试）
- 依赖：无
- 分支：`task/M6-G19-typeguard-consolidation`
- 来源：第四轮审查 #3（重复工具函数）
- 禁 `cc`（纯逻辑层）

## 背景（审查发现·已核实）
跨文件重复定义（grep 实证）：`isRecord` ×6（serialize/replay-codec/settings/statsCodec/records/save）、`isSeat` ×4（serialize/replay-codec/records/save）、`nextSeat` ×2（core/bidding）、`cardKey(card: Card)` ×3 同形（core/hint/game-scene-skeleton）、`isGameEvent` ×2（replay-codec/save）。`hasOwn` 仅 serialize.ts 一处（评审「2 处」不准，确认单处，可一并迁入 generic）。违反 DRY：SeatIndex 若扩展需逐文件改、易遗漏。

## 行为要求（守层级方向：rules 无依赖 → game → ai → data → ui）
1. **`rules/guards.ts`**（dependency-free / rules 类型）：导出 `isRecord(value): value is Record<string,unknown>`、`hasOwn(obj,key)`、`cardKey(card: Card): string`。
2. **`game/seat.ts`**（依赖 game/types）：导出 `isSeat(value): value is SeatIndex`、`nextSeat(seat): SeatIndex`、`isGameEvent(value): value is GameEvent`。
3. 消费方改为 import 上述单一真相源，删除本地重复定义。**逐一核对语义等价**：
   - serialize.ts `isSeat` 现返回 `value is 0|1|2`（与 `SeatIndex` 等价）——统一后确保类型不缩窄/不放宽。
   - `ai/hintRank.ts` 的 `cardKey(move: Move)` 是**不同签名**（入参 Move），**不在本任务范围**，保留原样。
   - `game-scene-skeleton.ts` 仅把本地 `cardKey` 换成 import；该文件属编辑器域、本任务**只改这一行 import**，不碰其它运行时逻辑。
4. **行为零改**：所有守卫输入/输出与原实现逐字等价；序列化/反序列化校验链不得放松。

## 验收
- `npm --prefix test test` 全绿（既有 serialize/save/records/statsCodec/settings/replay-codec/core/bidding/hint 测试不改而过）。
- `npm --prefix test run typecheck` 无错（无未用 import 残留）。
- 仅改声明文件域；未 import `cc`；无新增跨层反向依赖（rules 仍零依赖；game 守卫仅 game/data/ui 消费）。
- **与 M6-G20 均触 `game/core.ts`，二者串行不并行**（建议先 G20 改拷贝语义、后 G19 抽 `nextSeat`/`cardKey`，或反之；认领方在 report 注明顺序）。

## 测试命令
`npm --prefix test test`
