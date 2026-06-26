# M5-G5 春天/倍数边界 green-guard

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/game/settlement-spring-boundaries.test.ts`（新，纯测试）
  - 可读不可改：`assets/scripts/game/**`、`test/game/**`（既有不可改）
- 依赖：M2-03（`settle`/`Settlement`）已并 main
- 分支：`task/M5-G5-spring-boundaries`
- **green-guard**：现码即对，新建测试应直接绿。

## 背景
`settlement.ts` 的春天判定 `landlordPlays===1`（anti-spring）是**精确等 1** 非 `<=1`——语义边界需锁；全倍数公式 `bidMultiplier × 2^bombs × (spring?2:1)` 既有测试只验和为 0、不验倍数值。锁之。

## 行为要求（纯测试、禁 cc）
1. 从 `../../assets/scripts/game` 取 `settle`/`SettlementInput`/`Side`，从 `../../assets/scripts/rules` 取构造 events 的 `cards`/`recognize`。
2. 断言：
   - anti-spring 边界：地主只出 1 手 + 农民赢 → `spring==='anti-spring'`；地主出 0 手 + 农民赢 → `spring==='none'`（锁 `===1` 非 `<=1`）。
   - spring：地主赢 + 农民 0 手 → `spring==='spring'`。
   - 全倍数：`bidMultiplier=3`、`bombs=2`（两个炸弹事件）、`spring='anti-spring'` → `settlement.multiplier === 24`（3×4×2）。
   - 无春天无炸弹：`multiplier === bidMultiplier`。
   - 加固倍数：单炸 `bid=2×2^1=4`；火箭计入炸弹数 `bid=1×2^1=2`；多炸 3 个 → `2^3=8`。
   - 加固得分（已核实 `multiplier` **不含** baseScore）：地主赢→`scores[landlord]>0` 且两农民 `<0`、三方零和、值 `=2·unit`；农民赢→符号反转、零和；`baseScore` 线性缩放 `scores` 而不改 `multiplier`。
3. 纯测试、禁 cc。**实现方先核 `settlement.ts` 实际公式**——倍数公式 `bidMultiplier × 2^bombs × (spring?2:1)`，`unit=baseScore×multiplier`，地主 `±2·unit`/农民 `∓unit`。

## 验收
- 新测试全绿、`npm --prefix test test` 全绿、`typecheck` 无错。

## 测试命令
`npm --prefix test test`
