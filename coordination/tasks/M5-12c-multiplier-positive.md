# M5-12c 倍数字段正整数(≥1)收紧（落盘数值不变量·design-debt）

- 状态：**blocked**（待 T1 `M5-10-resume` + T5 `M5-12b` 并 main 后转 ready——本任务改 `save.ts`/`records.ts`，与 T1/T5 文件域冲突，须其后）
- **派发模式：纯 spec（无架构种入测试）**——解锁后实现方按本 spec 自写 vitest 测试 + 实现。
- 文件域（**只允许改这些**·解锁后）：
  - `assets/scripts/data/save.ts`（`bidMultiplier` 校验）
  - `assets/scripts/data/records.ts`（`migrateEntry` 的 `multiplier`）
  - 既有 `test/data/{save,records,...}.test.ts` 不可改；新增收紧用例由实现方自写
- 依赖：T1（save bidMultiplier 字段）、T5（records 数值收紧 helper）
- 分支：`task/M5-12c-multiplier-positive`（解锁后建）

## 背景（架构升级时记录的设计点）
T5 把 records `multiplier` 收紧为**非负整数**，但放行了 `0`；而倍数语义「从 1 起」（见 RULES 计分）——`multiplier:0`/`bidMultiplier:0` 不合法。本任务把倍数类字段统一收紧为**正整数(≥1)**：非法（含 0/负/小数）→ `multiplier` 回默认 `1`、`bidMultiplier`（save）回默认 `1`。**需用户确认采纳此策略后再解锁**（架构已在评审中标记为待拍板项）。

## 行为要求（草案）
1. `records.ts` `migrateEntry`：`multiplier` 由「非负整数」收紧为「正整数(≥1)，否则回 1」（`0`→`1`）。其余字段不变。
2. `save.ts` `deserializeSave`：`bidMultiplier` 若存在，由「非负整数」收紧为「正整数(≥1)」，`0` 视为损坏（`corrupted`）或回退 `1`——**二选一须在解锁 spec 定稿时与 T1 的回退语义对齐**。
3. 不放宽其它校验；合法数据往返不变。纯函数、禁 import `cc`。

## 验收（解锁后定稿；要点）
- `records` `multiplier:0` → `1`；`multiplier:1` 保留；负/小数 → `1`。
- `save` `bidMultiplier:0` → 按定稿语义（损坏抛错 或 回 1），`>=1` 整数保留。
- 既有 save/records 测试全绿；`npm --prefix test test` 全绿、typecheck 净、未 import `cc`。

> ⚠️ 本任务依赖一次**产品决策**（倍数下界 1 vs 0）。架构已在对话中向用户提请；未确认前保持 blocked。
