# M5-12a-serialize-hardening 实现报告

- 实现方标识：Codex
- 分支：`task/M5-12a-serialize-hardening`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/game/serialize.ts`

## 测试与类型检查输出
```
npm --prefix test test -- game/serialize-integer-fields.test.ts game/serialize-settled.test.ts
Test Files  2 passed (2)
Tests       9 passed (9)

npm --prefix test test
Test Files  56 passed (56)
Tests       305 passed (305)

npm --prefix test run typecheck
tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `passesInARow` 与 `bombsPlayed` 已从非负数校验收紧为非负整数校验。
- `assertVersionedSave` 内裸 `throw` 已统一改为 `fail()`，错误前缀归一为 `corrupted round state: ...`。
- 未修改测试、未改导出签名、未新增 public API。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
