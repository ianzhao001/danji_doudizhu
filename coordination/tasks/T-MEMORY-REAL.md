# T-MEMORY-REAL — 困难档真记牌：flow 传递对局历史 + 绝对最大单接管

- 状态：ready（种子已验红：2 红/5 绿 `3548ae8`）
- 任务模式：seeded-red（纯逻辑·禁 import `cc`）
- **风险等级：高风险（跨 flow+ai）→ 三闸**：审查者置 `approved-pending-planner`，规划者结构性把关后改 `approved` 再合并
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/types.ts`（`PlayPolicy` 入参对象**新增** `history: GameEvent[]`——加法）
  - `assets/scripts/flow/driver.ts`（`decidePlayAction` 透传 + 整局驱动处传累积 `gameEvents`）
  - `assets/scripts/flow/round-runtime.ts`（AI 决策调用点传 `fullGameEvents` 等累积事件·:320 附近）
  - `assets/scripts/ai/strategy.ts`（`AiStrategy` 签名**新增可选**第三参 `history?: GameEvent[]`）
  - `assets/scripts/ai/levels/hard.ts`（消费 history：①`estimateMemoryPressure(hand, history)`→`trackPlayed(history, hand)`；②新增「绝对最大单接管」规则）
  - `coordination/reports/T-MEMORY-REAL.report.md`
  - **测试规划者种入不可改**：`test/ai/hard-memory.test.ts`、`test/flow/policy-history.test.ts`
- 依赖：—
- 分支：`task/T-MEMORY-REAL`（种子在 `3548ae8`）

## 行为要求（实现到种子绿）

1. **管线**：`PlayPolicy` 入参加 `history`（driver/runtime 两条驱动路径每次决策传**当前已累积**对局事件；probe 断言数组、单调不减、末次含 play 事件）。`AiStrategy` 第三参**可选**、默认空数组语义——**既有单元测试直调（两参）行为必须逐字不变**（回归面最小化设计）。simple/normal 不消费（签名兼容即可）。
2. **压强收敛**：`hard.ts estimateMemoryPressure` 改吃真历史（`trackPlayed(history, hand)`）——评分公式与常数**一字不动**（红线），让 highPressure 随对局自然收敛。
3. **绝对最大单接管**（种子钉死·插入位置=`chooseControlFollow` 之后、`conservativeAction` 之前）：跟牌、非 pressing、非队友顶、history 非空时——若存在**绝对最大单**候选（该单牌之上的所有 rank 经 `memory.remainingByRank` 证明已全部现身：更高 rank 计数全为 0），打出**最小的绝对最大单**接管牌权；不存在则走原路径。仅限 `Category.Single`（本版不扩牌型）。空历史不触发。
4. **确定性**：不消费 rng 新路径；同输入同输出（种子断言）。
5. **质量门全量重验**：`test/selfplay/quality.ts` 三档门（组合率/压队友/胜率差）**不得回退**——selfplay 经 driver 传真历史后 Hard 应同向或更优；若门红即真信号，报告数据并转规划者。附**前后指标对照表**进报告。

## 红线
`simple.ts`/`normal.ts`/`lead-score.ts`/`compareMoves`/`_shared.ts` 语义不动（_shared 只加不改）；评分常数不动；`game/`、`rules/` 零触碰；`trackPlayed` 本体不改。

## 验收
- 种子 7 用例全绿（含 2 红转绿）+ 既有 `hard*.test.ts`/`normal*`/`simple*`/`hint*`/`conservative*` **零改动全绿** + 全量 vitest/typecheck（基线自 141/739+2 文件递增记账）。
- 报告：接管规则实现说明 + 质量门前后对照表 + runtime 调用点 diff 指认。
- 审查按 `tasks/R-WAVE8.md` R:T-MEMORY-REAL（**三闸**）。
