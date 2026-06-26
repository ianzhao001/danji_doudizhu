# M-FLOW-02-illegal-action 实现报告

- 实现方标识：Codex
- 分支：`task/M-FLOW-02-illegal-action`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/flow/driver.ts`

## 测试与类型检查输出
```
npm --prefix test test

Test Files  24 passed (24)
Tests  103 passed (103)

npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 出牌循环中 `playPolicy` 与 `apply` 的异常会包装成 `HeadlessRoundError`，保留 seed/turns/landlord/lastEvents 与原始 `cause`。
- 已是 `HeadlessRoundError` 的错误直接 rethrow，避免二次包装。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
