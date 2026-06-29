# M4-30 手牌强度评估

## 变更
- 新增 `assets/scripts/ai/handStrength.ts`，导出 `HandStrength` 与 `evaluateHand(cards)`。
- 新增 `test/ai/hand-strength.test.ts` 覆盖空手、火箭、炸弹层级、单调性、范围与确定性。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 512 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 纯函数、零 `cc`，不修改入参。
- 未修改 `ai/bidding*.ts` 与 `index.ts` 桶导出。
