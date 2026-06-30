# M6-G21-ai-heuristic-hardening 实现报告

- 实现方标识：Codex
- 分支：`task/M6-G21-ai-heuristic-hardening`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ai/cardMemory.ts`
  - `CardMemory` 返回类型改为 readonly。
  - `trackPlayed` 返回前冻结 `remainingByRank` 与外层对象。
- `assets/scripts/ai/handStrength.ts`
  - `straightLength` 对非顺子 rank 显式重置 `current = 0`。
  - 评分权重提取为 `STRENGTH_WEIGHTS`，公式数值不变。
- `test/ai/card-memory.test.ts`
  - 新增返回对象冻结断言。
- `test/ai/hand-strength.test.ts`
  - 新增含 2/王的顺子长度保持断言。
  - 新增代表性强手牌的完整评分输出断言。

## 测试与类型检查输出
```
npm --prefix test test -- ai/card-memory.test.ts ai/hand-strength.test.ts
Test Files  2 passed (2)
Tests  13 passed (13)

npm --prefix test test
Test Files  128 passed (128)
Tests  635 passed (635)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
通过，无输出

cc import 护栏
rg -n "^\\s*import .*['\\\"]cc['\\\"]|from ['\\\"]cc['\\\"]" assets/scripts/ai assets/scripts/game assets/scripts/rules assets/scripts/data
无命中
```

## 与 spec 的偏差 / 关键决策
- 无行为偏差：`trackPlayed` 数值不变，`evaluateHand` 分数不变。
- 采用返回前冻结而非改 `decrement` 为不可变累积，改动更窄；内部仍局部累积，暴露给外部的是不可变结果。
- `straightLength` 显式处理非 `isSequenceable` rank；在当前 `ALL_RANKS` 顺序下输出保持一致，但不再依赖 2/王永远排在末尾。
- 本任务未引入 selfplay 调参机制，符合 spec 范围。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
