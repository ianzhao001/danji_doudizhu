# M4-42 困难 AI 中盘策略纵深（消费 M4-30/31/32·审查转化·产品 gated）

- 状态：ready（**产品已解 gate·2026-07-01**·排期为独立 AI 纵深批·PROTOCOL bootstrap 派发；规模大于清理类任务）
- 派发模式：**纯 spec**（改产品码 + 自写 vitest/selfplay 验证）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/levels/hard.ts`（+ 可能的私有 helper，**不改** `_shared`/Normal 共用路径的签名）
  - 可新增 `test/ai/hard-depth.test.ts`、扩展 selfplay 平衡测试（**不弱化** M4-08 合法性审计 / M6-G15 平衡护栏）
- 依赖：M4-30 handStrength / M4-31 cardMemory / M4-32 endgame（**均已并 main**·本任务是消费它们）
- 分支：`task/M4-42-hard-ai-depth`
- 来源：第四轮审查 #9（Hard 与 Normal 仅残局有别，中盘等价）
- 禁 `cc`（纯逻辑层）

## 背景（审查发现·已核实）
Hard 的「积极控权」仅靠 `isPressing()`（对手剩牌 ≤2 才激活），否则退化为与 Normal 共用的 `conservativeAction`——**中盘完全等价于 Normal**。作为最高档难度，策略深度不足；而 M4-30/31/32 三个纵深模块已入 main 却未被 Hard 充分消费。

## 行为要求（在保持**合法性**与**确定性**前提下增强 Hard 中盘）
1. **手牌塑形**：用 `evaluateHand`/着法枚举优化拆牌，减少总手数（避免无谓拆炸/拆顺）。
2. **控权意识**：地主身份时更积极压制、争取连续出牌权；农民配合时不抢队友牌权。
3. **记牌消费**：用 `trackPlayed`/`cardMemory` 估计外部剩余炸弹/大牌概率，据此决定保/出大牌与炸弹时机。
4. **终局规划**：结合 `M4-32 endgame` 检测必胜/连续出牌链，残局更稳。
5. 仍走着法枚举产出合法动作，**不得**输出非法着法、**不得**读取隐藏手牌（守 M4-08/G14）。

## 验收
- **selfplay 胜率**：在固定 seed 集下 Hard 对 Normal 有**可测正向胜率优势**（实现方定阈值并在 report 给出，如 Hard 地主胜率显著高于 Normal 地主）；零和、终止、可复现不变。
- 合法性不变量全绿（M4-08 审计 / G14 隐藏态隔离 / G15 平衡护栏不弱化）。
- `npm --prefix test test` 全绿；`typecheck` 无错；未 import `cc`；未改 `_shared`/Normal 共用签名。

## 备注
- **规模与排期**：本任务含策略设计 + selfplay 调参，**显著大于** G19/G20/G21 清理类；建议作为独立 AI 纵深批次排期，不与发布前清理混跑。
- 若产品决定「三档差异够用」，可降级为 backlog 不做——交产品决策。

## 测试命令
`npm --prefix test test`
