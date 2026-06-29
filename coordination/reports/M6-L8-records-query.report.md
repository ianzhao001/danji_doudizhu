# M6-L8-records-query 实现报告

- 实现方标识：Codex
- 分支：`task/M6-L8-records-query`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/data/recordsQuery.ts`：新增 `queryRecords`，支持 outcome/role/spring/order/limit 查询。
- `test/data/records-query.test.ts`：覆盖默认查询、胜负/角色/spring 过滤、稳定排序、limit 和空记录。

## 测试与类型检查输出
```text
npm --prefix test test
Test Files  93 passed (93)
Tests       475 passed (475)
data/records-query.test.ts (6 tests) passed

npm --prefix test run typecheck
tsc --noEmit
exit 0
```

## 与 spec 的偏差 / 关键决策
- 排序用 `{entry,index}` 装饰保证 `playedAt` 相同时稳定保留原 entries 顺序。
- 返回新数组但不深拷贝 `RecordEntry`，保持查询层轻量且不修改入参。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
