# M3-52 回合计时视图模型

## 变更
- 新增 `assets/scripts/ui/turn-timer.ts`，导出 `deriveTurnTimer`。
- 新增 `test/ui/turn-timer.test.ts` 覆盖满档、过半、urgent、钳制、total<=0 与向上取整。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 513 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 纯展示计算，零 `cc`，不持有定时器，不提交动作。
