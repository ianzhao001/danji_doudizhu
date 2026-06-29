# M3-40 扩展战绩视图模型

## 变更
- 新增 `assets/scripts/ui/stats-detail-view.ts`，导出 `deriveStatsDetailView`。
- 新增 `test/ui/stats-detail-view.test.ts` 覆盖空 digest、典型 digest、连胜/连败文案。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 510 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 只消费 `StatsDigest`，不重算战绩。
- 零 `cc`，未修改桶导出。
