# M3-41 历史明细视图模型

## 变更
- 新增 `assets/scripts/ui/records-detail-view.ts`，导出 `deriveRecordsDetailView`。
- 新增 `test/ui/records-detail-view.test.ts` 覆盖空记录、spring/bomb 标签、过滤标签、分数符号与不可变性。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 512 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 内部调用 `queryRecords`，不重写筛选/排序逻辑。
- 零 `cc`，未修改桶导出。
