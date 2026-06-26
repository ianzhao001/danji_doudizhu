# M5-02-serialize-deep 实现报告

- 实现方标识：Codex
- 分支：`task/M5-02-serialize-deep`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/game/serialize.ts`

## 测试与类型检查输出
```
npm --prefix test test

Test Files  24 passed (24)
Tests  109 passed (109)

npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 将 `top` 纳入必需字段；`top: null` 合法，缺字段非法。
- 反序列化校验只做运行时结构防护，不重判牌型规则；枚举值复用 `GamePhase` / `Side` / `Category` / `Suit` / `Rank`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
