# M3-62 上一手动作视图模型

## 变更
- 新增 `assets/scripts/ui/last-action-view.ts`，导出 `deriveLastActions`。
- 新增 `test/ui/last-action-view.test.ts` 覆盖三座位、pass/bomb/rocket、play 文案与 reset/win 忽略。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 511 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 只消费 `GameEvent[]`，长度恒 3，零 `cc`。
