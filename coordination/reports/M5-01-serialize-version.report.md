# M5-01-serialize-version 实现报告

- 实现方标识：Codex
- 分支：`task/M5-01-serialize-version`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/game/serialize.ts`

## 测试与类型检查输出
```
npm --prefix test test

Test Files  20 passed (20)
Tests  90 passed (90)

npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `serializeRound` 输出 `{ version: 1, state }`，`deserializeRound` 校验版本与 RoundState 必需字段后只返回 `state`。
- 非法 JSON 保持由 `JSON.parse` 抛错；版本/损坏数据统一抛可读 `Error`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
