# M4-01 ai-simple 简单 AI（最小化·确定性）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/levels/simple.ts`（实现 `simpleStrategy` 函数体）
  - 可读不可改：`assets/scripts/ai/strategy.ts`、`assets/scripts/ai/index.ts`、`assets/scripts/game/types.ts`、`assets/scripts/rules/*`、`test/ai/simple.test.ts`
- 依赖：M4 接口契约（`AiLevel` / `AiStrategy` / `strategyFor`，已在 main）+ rules（`enumerateMoves` / `legalFollows` / `recognize`）+ M2-01（`GameSnapshot` / `RoundAction`）
- 分支：`task/M4-01-ai-simple`

## 目标
实现确定性「最小化」难度：总是走能出的最小着法，跟不上就过。结果不依赖 `rng` 随机（签名保留 `rng` 仅为统一接口）。

## 公共 API 契约（见 strategy.ts 与 levels/simple.ts 桩）
```ts
export type AiStrategy = (snapshot: GameSnapshot, rng: Rng) => RoundAction;
export const simpleStrategy: AiStrategy;
```
- 约定：`snapshot.viewerHand` = 行动方手牌（非空），`snapshot.turn` = 行动座位，返回动作 `seat === snapshot.turn`。
- 取用方式：`strategyFor(AiLevel.Simple)`（测试即如此调用）。

## 行为要求
- **领出**（`snapshot.top === null`）：在 `enumerateMoves(viewerHand)` 候选里选「最小着法」——先按出牌张数最少、再按主牌点数最小排序取第一（等价于优先出点数最小的单张）。
- **跟牌**（`top !== null`）：`follows = legalFollows(viewerHand, top.pattern)`；非空选「最小能压制者」（同上排序取第一），空则 `{ type:'pass', seat: turn }`。
- **确定性**：相同输入恒定同一输出，且与 `rng` 序列无关。绝不输出非法动作，不 import `cc`。

## 验收（test/ai/simple.test.ts，不可改）
- 领出 `3 4 5 6 7` → 出单张 `3`。
- 跟牌 top=单`5`、手牌 `4 6 K` → 出单张 `6`（最小能压）。
- 跟牌 top=单`2`、手牌 `3 4 5` → `pass`。
- 确定性：不同 `rng` 种子下同输入同输出。
- `npm --prefix test test` 全绿、`npm --prefix test run typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
