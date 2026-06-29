# M4-41 叫抢置信度

## 变更
- 新增 `assets/scripts/ai/bid-confidence.ts`，导出 `bidConfidence`。
- 新增 `test/ai/bid-confidence.test.ts` 覆盖弱/强手、score 来源、阈值与确定性。

## 验证
- `npm --prefix test test -- --run`：121 个测试文件 / 599 个用例通过。
- `npm --prefix test run typecheck`：通过。

## 说明
- additive 纯函数，不修改 `ai/bidding*.ts` 或 `ai/bidding-advisor.ts`。
- 零 `cc`，未修改桶导出。
