# T-AI-2 — 困难档拉开：压制性领出 + 残局收割 + 三档排序闭环 + 文案对齐

- 状态：ready（T-AI-1 ✅ `9353f76` 落 main；**本任务负责关闭「Normal>Hard 过渡态」**，裁定 2026-07-04）
- 类型：纯逻辑（ai 层 + difficultyConfig 文案，禁 import `cc`）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/levels/hard.ts`、`assets/scripts/ai/endgame.ts`
  - `assets/scripts/data/difficultyConfig.ts`（**仅 description 文案**，与行为相符）
  - `coordination/reports/T-AI-2.report.md`
  - **测试由规划者种入（不可改）**：`test/ai/hard-timing.test.ts`（新）、`test/ai/hardening.test.ts`（pressing 领出契约已改）、`test/selfplay/quality.test.ts`（Hard 三档排序门已加）、`test/data/difficulty-config.test.ts`（文案契约已加）
- 依赖：T-AI-1 ✅
- 分支：`task/T-AI-2`
- worktree 缺 `temp/cli/tsconfig.cocos.json` 时照例拷贝。

## 背景

T-AI-1 强化普通档后，困难档的**跟牌仍是旧保守回退**（`conservativeAction`），12-seed 代理实测 Hard 地主 0.5 vs Normal 0.667——三档排序反转，已作为已知过渡态登记 BOARD。本任务给困难档补齐压制/时机/残局三块，把排序契约（已迁移到质量门）打绿。

## 行为要求（实现到种子测试绿）

1. **pressing 领出不再一律最小单**（`hardening.test.ts` 已改契约 + `hard-timing.test.ts`）：
   - 对手（任一其他座位）手牌 ≤2 时领出：**不再送低单**。无对子时领最大单（K 案例）；有对子时领对子（1 张手对手压不了对子）。
2. **残局收割**（`hard-timing.test.ts`）：自己 ≤2 墩可清空时，跟牌**选控制牌**确保连出带走（`A A 2` 跟单 9 → 出 **2** 而非最小 A，2 只有王炸/炸弹能压，夺权后 AA 收官）。可泛化 `roughTurnCount`/`finishingFollow` 到跟牌路径。
3. **不挥霍守卫**（回归断言）：非 pressing 且手牌 >6 时，有普通可压绝不拆炸弹/火箭（现行为保持）。
4. **三档排序闭环**（`quality.test.ts` Hard 门）：
   - 组合首出率 Hard ≥ 0.50 且 ≥ Normal − 0.05（同带不回落；Normal 实测 ≈0.985 近天花板，"+5pp" 不可达，2026-07-04 修正）；
   - 压队友率 Hard ≤ 0.08；
   - 胜率差（对称三席轮换）Hard−Normal ≥ +0.03、Hard−Simple ≥ +0.10。
5. **文案对齐**（`difficulty-config.test.ts` 已锁定精确文案）：
   - 简单：`出牌直接，一次一张，适合新手熟悉规则。`
   - 普通：`会拆牌打组合、农民互相配合，适合日常对局。`
   - 困难：`控牌权、算时机，压制更强，适合挑战。`
6. **红线**：`compareMoves`/`pickSmallest` 语义不动；`simple.ts`/`normal.ts`/`lead-score.ts` 不动（Normal 行为已定型）；`_shared.ts` 只加不改；确定性保持（不消费 rng）。

## 验收
- 种子全绿：`hard-timing` + `hardening`（改后）+ `quality`（含新 Hard 门）+ `difficulty-config`（文案）；既有 `hard.test.ts`/`hard-depth`/`normal-combo`/`tie-breaker`/`hint*` **零改动全绿**；全量 vitest + typecheck 净。
- 报告说明压制/收割启发式的权重取舍（可解释性）。

## 交付物
分支提交 + `reports/T-AI-2.report.md`；提审 → 审查者按 `tasks/R-WAVE2.md` 检查单评审 → approved 后由审查者合并。
