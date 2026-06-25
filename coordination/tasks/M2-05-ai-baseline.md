# M2-05 ai-baseline 基线随机合法 AI

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/baseline.ts`（实现）、`assets/scripts/ai/index.ts`（桶，已由架构给出）
  - 可读不可改：`assets/scripts/game/types.ts`、`assets/scripts/rules/*`、`test/ai/baseline.test.ts`
- 依赖：M2-01（`GameSnapshot`/`RoundAction`）+ rules（`enumerateMoves`/`legalFollows`）
- 分支：`task/M2-05-ai-baseline`

## 目标
仅产出合法动作的基线随机 AI（出牌阶段），供无 UI 自对弈与后续 flow 复用。叫抢决策不在本任务。

## 公共 API 契约（见 baseline.ts 桩）
- `chooseAction(snapshot: GameSnapshot, rng: Rng): RoundAction`
- 约定：`snapshot.viewerHand` = 行动方手牌（非空），`snapshot.turn` = 行动座位。

## 规则
- **领出**（`snapshot.top === null`）：用 `rules.enumerateMoves(viewerHand)` 取候选，用 `rng` 随机选一个 → `{ type:'play', seat: turn, cards }`。
- **跟牌**（`top !== null`）：`follows = rules.legalFollows(viewerHand, snapshot.top.pattern)`；非空则随机选一个 `play`，空则 `{ type:'pass', seat: turn }`。
- **确定性**：相同 `rng` 序列产生同一选择。**绝不**输出非法动作。不 import `cc`。

## 验收（test/ai/baseline.test.ts）
- 领出：返回 `play`，其 `cards` 是 `viewerHand` 子集且能被 `recognize`，`seat===turn`。
- 跟牌且手中有更大牌：返回能压过 `top` 的 `play`。
- 跟牌且手中无更大牌：返回 `pass`。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。
