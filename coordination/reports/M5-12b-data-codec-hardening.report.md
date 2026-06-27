# M5-12b-data-codec-hardening 实现报告

- 实现方标识：Codex
- 分支：`task/M5-12b-data-codec-hardening`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/data/records.ts`：收紧记录迁移数值字段，`multiplier` 直接按 M5-12c 决策收紧为正整数。
- `assets/scripts/data/statsCodec.ts`：补充未知 version 回默认的策略注释。
- 新增 `test/data/records-migration.test.ts`。

## 测试与类型检查输出
```
npm --prefix test test
Test Files 63 passed (63)
Tests 343 passed (343)

npm --prefix test run typecheck
tsc --noEmit passed

rg cc import check
no matches
```

## 与 spec 的偏差 / 关键决策
- 按用户授权和已拍板 M5-12c 决策，`multiplier: 0` 不再作为非负整数保留，直接迁移为默认 `1`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
