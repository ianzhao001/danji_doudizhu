# M6-G21 AI 启发式一致性硬化（cardMemory 不可变 + straightLength 鲁棒 + 评分权重具名·审查转化）

- 状态：ready（纯逻辑·无依赖·可即认领）
- 派发模式：**纯 spec**（改产品码 + 既有测试保持全绿）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/cardMemory.ts`
  - `assets/scripts/ai/handStrength.ts`
  - 可新增/扩展 `test/ai/cardMemory.test.ts`、`test/ai/handStrength.test.ts`（**不可弱化**既有断言）
- 依赖：无
- 分支：`task/M6-G21-ai-heuristic-hardening`
- 来源：第四轮审查 #8（cardMemory 可变性）+ #11（straightLength 隐式依赖枚举顺序）+ #12（评分权重魔数）
- 禁 `cc`（纯逻辑层）

## 背景（审查发现·已核实）
1. **#8 cardMemory 内部可变（中）**：`trackPlayed` 返回的 `remainingByRank` 是可被外部意外改写的可变对象；项目其它数据模块（stats/records）均不可变，风格不一致，未来若 memoize 会引 bug。消费方（`deriveCardMemoryView`）只读，故冻结安全。
2. **#11 straightLength 不重置（中）**：[handStrength.ts](assets/scripts/ai/handStrength.ts) 遇非 `isSequenceable`（R2/小王/大王）时**既不延长也不重置** `current`，仅靠「ALL_RANKS 中非顺子 rank 都在末尾」的隐式假设成立；排序若变会静默出错。
3. **#12 评分权重魔数（中）**：`evaluateHand` 用硬编码权重 `rockets*24 + bombs*18 + highCards*5 + (longestStraight-4)*4 + pairs*2 + trips*3 + min(len,20)`，无具名、无注释。

## 行为要求
1. **#8**：`trackPlayed` 返回前冻结结果（`Object.freeze(remainingByRank)` + 冻结外层 `CardMemory`），或改 `decrement` 为不可变累积。**返回值数值与现状逐字相同**，仅去除外部可变性。
2. **#11**：遍历中对非 `isSequenceable` rank 显式 `current = 0`，消除对枚举顺序的隐式依赖。**所有手牌的 `longestStraight` 输出与现状相同**（仅去隐式假设，不改结果）。
3. **#12**：把六个权重（24/18/5/4/2/3）与 `min(len,20)` 上限提为**具名常量**（如 `STRENGTH_WEIGHTS`），附一行注释说明各项含义。**数值不变、评分输出逐字不变**。**不**在本任务引入 selfplay 校准机制（属后续 AI 调参，超范围）。

## 验收
- `npm --prefix test test` 全绿；新增/扩展测试覆盖：`trackPlayed` 结果不可变（冻结）、`straightLength` 在含 2/王手牌下输出不变、`evaluateHand` 具名常量重构后评分逐字等价。
- `npm --prefix test run typecheck` 无错。
- 仅改声明文件域；未 import `cc`；三项均为**行为保持**（值不变，仅一致性/鲁棒性/可读性提升）。

## 测试命令
`npm --prefix test test`
