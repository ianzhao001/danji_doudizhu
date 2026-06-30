# M6-G20 core.ts 不可变结构共享（去冗余手牌拷贝·审查转化·纯逻辑）

- 状态：ready（纯逻辑·无依赖·可即认领）
- 派发模式：**纯 spec**（改产品码 + 既有测试保持全绿）
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/core.ts`（`apply` 的 pass 分支 + `replaceSeatHand`）
  - 可新增 `test/game/core-structural-sharing.test.ts`（**不可改**既有 core 测试）
- 依赖：无
- 分支：`task/M6-G20-core-structural-sharing`
- 来源：第四轮审查 #7（不可变更新过度拷贝）
- 禁 `cc`（纯逻辑层）

## 背景（审查发现·已核实）
- [core.ts:65-68](assets/scripts/game/core.ts#L65-L68) `replaceSeatHand`：对**所有**座位建新 `PlayerSeat`，并对未变座位 `player.hand.slice()` 多余浅拷贝。
- [core.ts:111](assets/scripts/game/core.ts#L111)、[core.ts:123](assets/scripts/game/core.ts#L123) `apply` pass 分支：每次 pass `state.seats.map(p => ({...p, hand: p.hand.slice()}))` 完整复制全部三座手牌——但 **pass 不改任何手牌**。
- 每步 apply 复制 3 个手牌数组（最多 20 张/座），在 selfplay 批跑（M6-L5/G15）是无谓热点开销。

## 行为要求
1. **结构共享**：只对实际变化的座位建新 `PlayerSeat`，其余座位**保持原引用**（标准不可变结构共享）：`state.seats.map(p => p.index === seat ? { ...p, hand: nextHand } : p)`。
2. **pass 不拷手牌**：pass 分支不复制任何 `hand`（座位引用直接沿用，只更新 `turn`/`top`/`passesInARow`）。
3. **前置不变量必须仍成立**（实现方须核实并在测试中锁定）：
   - 全程无任何**原地修改** `hand`/`pattern.cards`（`removeCards` 返回新数组、`ensureOwnsCards` 只改本地 Map——均不动入参；核实无遗漏）。
   - 旧 `state` 不被后续操作影响（共享的是**未变**子结构，安全）；新增测试**不得**断言新旧 state 的未变座位持有**不同**引用（结构共享后它们刻意相等）。

## 验收
- `npm --prefix test test` 全绿（既有 `game/core`、`settlement`、`resume`、`flow/selfplay`、`M6-G15` 平衡等测试不改而过——回归安全网）。
- `npm --prefix test run typecheck` 无错。
- 仅改 `game/core.ts`（+ 新增测试）；未 import `cc`；`apply` 返回的状态语义与事件序列逐字不变。
- 与 M6-G19 串行（见 G19「均触 core.ts」说明）。

## 测试命令
`npm --prefix test test`
