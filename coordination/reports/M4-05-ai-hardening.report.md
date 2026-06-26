# M4-05-ai-hardening 实现报告

- 实现方标识：Codex
- 分支：`task/M4-05-ai-hardening`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ai/levels/_shared.ts`
- `assets/scripts/ai/levels/simple.ts`
- `assets/scripts/ai/levels/normal.ts`
- `assets/scripts/ai/levels/hard.ts`

## 测试与类型检查输出
```
npm --prefix test test

Test Files  20 passed (20)
Tests  89 passed (89)

npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 将三档重复 helper 收敛到 `_shared.ts`，并用 `length -> category -> mainRank -> card ranks -> suits` 的全序比较作为通用 tie-breaker。
- hard 在 pressing 跟牌且无 bomb-like 可用时选择最大合法跟牌；pressing 领出仍走保守策略。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
