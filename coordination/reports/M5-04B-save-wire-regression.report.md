# M5-04B-save-wire-regression 实现报告

- 实现方标识：Codex
- 分支：`task/M5-04B-save-wire-regression`
- 状态：in-review

## 改了哪些文件
- `test/data/save-wire.test.ts`
- `coordination/reports/M5-04B-save-wire-regression.report.md`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  39 passed (39)
Tests       172 passed (172)

npm --prefix test run typecheck
tsc --noEmit passed

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" test/data/save-wire.test.ts
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 新增 canonical wire 绿护栏：`serializeSave` 对输入 `version: 0/999` 均输出 `SAVE_VERSION`。
- 新增错误语义护栏：非法 JSON 抛 `invalid JSON`，非对象顶层抛 `expected object`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
