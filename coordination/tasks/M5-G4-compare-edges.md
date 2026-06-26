# M5-G4 compare 边界 green-guard

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/rules/compare-edges.test.ts`（新，纯测试）
  - 可读不可改：`assets/scripts/rules/**`、`test/rules/**`（既有不可改）
- 依赖：M1（`beats`/`recognize`）已并 main
- 分支：`task/M5-G4-compare-edges`
- **green-guard**：现码即对，新建测试应直接绿。

## 背景
`rules/compare.ts` 的 `beats` 有三条边界未直接测：同 mainRank 平局→false（防「等压等」死循环）、null 入参防御→false、rocket-vs-rocket→false（一副牌唯一火箭不变量）。锁之防回归。

## 行为要求（纯测试、禁 cc）
1. 从 `../../assets/scripts/rules` 取 `beats`/`recognize`，用 `test/rules/_util` 的 `cards`。
2. 断言：
   - `beats(P('5 5'), P('5 5'))` → `false`（同 mainRank 平局）。
   - `beats(null/undefined 入参)` → `false`（防御；用 `as any` 或可选传参构造）。
   - `beats(火箭, 火箭)` → `false`（rocket-vs-rocket）。
   - 对照：`beats(P('6 6'), P('5 5'))` → `true`（正常压）。
   - 炸弹序（加固）：炸弹压非炸弹（vs 单/对/顺）、非炸弹压不过炸弹、大炸压小炸、等炸→false、火箭压炸弹、炸弹压不过火箭。
   - 跨型/长度不可比（加固）：不同牌型→false；同型不同长→false（即便主点更大）。
3. 纯测试、禁 cc。

## 验收
- 新测试全绿、`npm --prefix test test` 全绿、`typecheck` 无错。

## 测试命令
`npm --prefix test test`
