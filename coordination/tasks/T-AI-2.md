# T-AI-2 — 困难档拉开：炸弹/火箭时机 + 残局收割 + 三档文案对齐

- 状态：blocked（T-AI-1 落 main 后 ready，同 ai 域流水线接续）
- 类型：纯逻辑（ai 层，禁 import `cc`）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/levels/hard.ts`、`assets/scripts/ai/endgame.ts`
  - `assets/scripts/data/difficultyConfig.ts`（**仅 label/description 文案**，与新行为相符）
  - `coordination/reports/T-AI-2.report.md`
  - **测试由架构种入（T-AI-1 合并后种）**：炸弹/火箭时机单元契约 + quality.test.ts Hard 档指标扩展
- 依赖：T-AI-1 ✅ 落 main
- 分支：`task/T-AI-2`（届时由架构从含 T-AI-1 的 main 创建）

## 行为要求（spec 骨架，测试种入时细化）

1. **炸弹/火箭时机**：持火箭且对手（对农民=地主）手牌 ≤2 → 主动火箭夺权；非 pressing 且自己手牌 >6 → 不挥霍炸弹（守住 `protectedCards`）；炸弹用于：收官、拦截对手近胜、短手夺权。
2. **残局收割**：泛化 `roughTurnCount`/`finishingFollow` 到跟牌决策——己方剩余 ≤2 墩可清空时积极抢权带走。
3. **压制细化**：pressing 领出不再一律最小单（`hardening.test.ts:40` 契约届时由架构重写）。
4. **文案对齐**：难度描述与实际行为相符（简单=「出牌直接，适合新手」风格；普通=组合与配合；困难=控权与时机）。

## 质量指标门（届时种入）
组合首出率 Hard ≥ 0.50 且 ≥ Normal+5pp；压队友率 Hard ≤ 0.08；胜率差 Hard−Normal ≥ +0.03、Hard−Simple ≥ +0.10；时机类用单元契约锁定。

## 交付物
分支提交 + report；获 `approved` 后 `claim→merge→release`。
