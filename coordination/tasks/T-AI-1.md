# T-AI-1 — 普通档脱胎：组合首出 + 农民不压队友（AI「只出单牌」主修）

- 状态：ready
- 类型：纯逻辑（ai 层，禁 import `cc`）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ai/levels/lead-score.ts`（新建：共享首出评分器，可提炼 hard 的 `categoryShapingBonus`/`scoreLeadMove` 思路）
  - `assets/scripts/ai/levels/normal.ts`（重写）
  - `assets/scripts/ai/levels/_shared.ts`（**只加不改**：可新增 `isTeammateTop` 等导出；`compareMoves`/`pickSmallest` 语义一字不动）
  - `assets/scripts/ai/levels/hard.ts`（**仅两处**：`cardKey` 重复实现改为 `import { cardKey } from '../../rules'`；`isTeammateTop` 改为从 `_shared` 导入。行为零变化）
  - `coordination/reports/T-AI-1.report.md`
  - **测试由架构种入/重写（不可改）**：`test/ai/normal-combo.test.ts`（新）、`test/ai/tie-breaker.test.ts`（normal 分支已改期望）、`test/selfplay/quality.ts`+`quality.test.ts`（质量指标门）
- 依赖：—（Wave 1 并行；**与 T-AI-2 同域流水线，本任务先行**）
- 分支：`task/T-AI-1`
- worktree 缺 tsconfig 同 T-LAYOUT2 处理。

## 背景（v1.2 规划书 §1-4）

`compareMoves` 按张数升序 → `pickSmallest` 永远选单张 → 简单/普通首出必最小单，每一墩都被拖成单张乒乓；简单/普通仅差「护炸弹」；农民会压自己队友。默认难度=普通，玩家看到的就是这个。用户裁决三档差异化：**简单档保持单张风（新手锚点，本任务不动 simple.ts）**；普通档本任务脱胎；困难档 T-AI-2 拉开。

## 行为要求（实现到架构种的测试绿）

1. **首出（top===null）**：普通档改用 `lead-score` 评分选型——在护炸弹/护火箭的 safe 候选内，**优先成型组合**（顺子/连对/飞机/三带优于拆单），无组合机会时仍出最小单。锁定用例（已种）：
   - `3 4 5 6 7 7 7` → 出 5 张顺子 34567（现状出单 3）
   - `3 3 4 4 5 5 K` → 出连对 334455
   - `3 4 4 4 K` → 出三带一 444+3
   - `x X 3 4 5` → 仍出单 3（火箭保护不破）
   - `3 4 4 4 4` → 仍出单 3（炸弹保护不破）
2. **跟牌**：保持最小代价压制；**新增农民配合**——己方是农民、当前顶牌来自队友农民、且地主手牌数 > 2 时 **pass**；地主手牌 ≤2（紧急）时不受此约束照常压。
3. **红线**：`compareMoves`/`pickSmallest`/`pickLargest` 语义不动（hint 提示链共享，动了连坐 `test/ai/hint*.test.ts`）；`simple.ts` 不动；确定性（与 rng 无关）保持。
4. hard.ts 仅做两处机械替换（cardKey import / isTeammateTop 上移共享），`test/ai/hard*.test.ts` 与 `hardening.test.ts` 必须零改动全绿。

## 质量指标门（`test/selfplay/quality.test.ts`，已种·确定性 seed 集）

| 指标 | 定义 | 门槛 |
|---|---|---|
| 组合首出率 | 领出且存在 ≥2 张非炸组合机会时，实际出 ≥2 张的占比（同质三席自对弈） | **Normal ≥ 0.35**；**Simple ≤ 0.15** |
| 压队友率 | 农民回合、顶牌为队友、地主手牌>2 时选择压过的占比 | **Normal ≤ 0.20** |
| 胜率差 | winRate(单席 Normal 对双席 Simple，三席轮换) − winRate(单席 Simple 对双席 Normal) | **≥ +0.05** |

基线实测（架构 Wave 0 跑于当前实现，写进 report 对照）见种子测试内注释。套件运行须 <120s。

## 验收
- `normal-combo.test.ts`/`tie-breaker.test.ts`/`quality.test.ts` 全绿；`simple/hard/hardening/conservative-action-paths/hint*` **零改动**全绿；全量 vitest + typecheck 净。

## 不可做
不改任何测试；不动 simple.ts / bidding 策略 / flow / compareMoves 语义；不引入随机性。

## 交付物
分支提交 + `reports/T-AI-1.report.md`（附质量指标实测表）；获 `approved` 后 `claim→merge→release`。
