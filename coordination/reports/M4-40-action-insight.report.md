# M4-40 出牌建议综合

## 变更
- 新增 `assets/scripts/ai/insight.ts`，导出 `adviseAction`。
- 新增 `test/ai/insight.test.ts` 覆盖一手出完、跟不上建议过、保炸弹、跟牌一手出完、score 来源与空手。

## 验证
- `npm --prefix test test -- --run`：121 个测试文件 / 600 个用例通过。
- `npm --prefix test run typecheck`：通过。

## 说明
- 组合 `evaluateHand`、`canFinishInOneMove`/`finishingFollow` 与 `bestHint`。
- additive 纯函数，不修改既有 AI strategy/hint。
- 零 `cc`，未修改桶导出。
