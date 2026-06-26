# M3-00 hand-layout 输入守卫回归护栏（测试补全）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/ui/hand-layout-guards.test.ts`（新，纯测试）
  - 可读不可改：`assets/scripts/ui/hand-layout.ts`、`test/ui/**`（既有断言不可改）
- 依赖：M3-00-hand-layout + 输入守卫（`aaac57f` 已并 main）
- 分支：`task/M3-00-hand-layout-guards`

## 背景
`aaac57f` 给 `layoutHand` 加了输入前置条件（非法 `count`/尺寸抛错，避免负坐标），但 throw 路径**无测试**。本任务补绿护栏，防守卫被回归删除。

> **绿护栏**：行为已实现，实现方新建测试**应直接全绿**；本分支无桩、基于 main。

## 行为要求（纯测试、确定性、禁 cc）
1. 新建 `test/ui/hand-layout-guards.test.ts`，从 `../../assets/scripts/ui/hand-layout` 取 `layoutHand`。
2. 断言抛错路径（用 `expect(() => layoutHand(...)).toThrow()`）：
   - 非整数 `count`（如 `1.5`）→ 抛错；负 `count`（`-1`）→ 抛错。
   - `count === 0` → 返回 `[]`（**不抛**）。
   - count≥1 时 `containerWidth` 非正/非有限（`0`/`-10`/`NaN`/`Infinity`）→ 抛错。
   - count≥1 时 `cardWidth` 非正/非有限 → 抛错。
   - `count>1 && cardWidth>containerWidth`（如 `count=3, cardWidth=400, containerWidth=390`）→ 抛错。
   - `count===1 && cardWidth>containerWidth` → **不抛**（单张允许溢出居中），返回 1 个 slot。
3. 正常入参（`count=5, containerWidth=390, cardWidth=60`）返回 5 个 slot（绿）。
4. 纯测试、禁 import `cc`。

## 验收
- 新测试全绿、既有 `hand-layout.test.ts` 全绿、`typecheck` 无错。
- `npm --prefix test test` 全绿。

## 测试命令
`npm --prefix test test`
