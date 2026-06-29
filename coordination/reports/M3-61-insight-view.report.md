# M3-61 出牌建议视图模型

## 变更
- 新增 `assets/scripts/ui/insight-view.ts`，导出 `deriveInsightView`。
- 新增 `test/ui/insight-view.test.ts` 覆盖推荐文案、建议过牌、空手安全与强调阈值。

## 验证
- `npm --prefix test test -- --run`：125 个测试文件 / 617 个用例通过。
- `npm --prefix test run typecheck`：通过。

## 说明
- 只消费 `ActionInsight`，不重新解析牌型或计算建议。
- 零 `cc`，未修改桶导出。
