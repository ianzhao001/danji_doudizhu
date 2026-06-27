# M5-G1-core-bombs 实现报告

- 实现方标识：Codex
- 分支：`task/M5-G1-core-bombs`
- 状态：in-review

## 改了哪些文件
- 新增 `test/game/core-bombs.test.ts`，覆盖炸弹/火箭事件计数与普通牌型边界。

## 测试与类型检查输出
```
npm --prefix test test
Test Files 63 passed (63)
Tests 341 passed (341)

npm --prefix test run typecheck
tsc --noEmit passed
```

## 与 spec 的偏差 / 关键决策
- 无偏差；仅新增 green-guard 测试，不改产品码。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [ ] 测试全绿
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
