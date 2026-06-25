# M4-01-ai-simple 实现报告

- 实现方标识：Codex
- 分支：`task/M4-01-ai-simple`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ai/levels/simple.ts`：实现确定性最小化策略；领出用 `enumerateMoves`，跟牌用 `legalFollows`，按张数再主点数选最小候选，无可跟时 pass。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  16 passed (16)
Tests       76 passed (76)
ai/simple.test.ts (4 tests) passed

npm --prefix test run typecheck
tsc --noEmit
passed
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `rng` 参数按统一接口保留但不读取，保证结果与随机序列无关。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
