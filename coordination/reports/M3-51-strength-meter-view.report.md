# M3-51 手牌强度条视图模型

## 变更
- 新增 `assets/scripts/ui/strength-meter-view.ts`，导出 `deriveStrengthMeter`。
- 新增 `test/ui/strength-meter-view.test.ts` 覆盖三档边界、pct 透传/钳制与 label 非空。

## 验证
- `npm --prefix test test -- --run`：121 个测试文件 / 598 个用例通过。
- `npm --prefix test run typecheck`：通过。

## 说明
- 只消费 `HandStrength`，不重算评分。
- 零 `cc`，未修改桶导出。
