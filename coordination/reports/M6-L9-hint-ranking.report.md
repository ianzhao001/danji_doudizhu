# M6-L9-hint-ranking 实现报告

- 实现方标识：Codex
- 分支：`task/M6-L9-hint-ranking`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ai/hintRank.ts`：新增 `rankHints` / `bestHint`，在 `hintSuggestions` 合法集外层做稳定策略排序。
- `test/ai/hint-rank.test.ts`：覆盖领出低牌优先、炸弹靠后、最小跟牌、空集 null、确定性和入参不变。

## 测试与类型检查输出
```text
npm --prefix test test
Test Files  93 passed (93)
Tests       474 passed (474)
ai/hint-rank.test.ts (5 tests) passed

npm --prefix test run typecheck
tsc --noEmit
exit 0
```

## 与 spec 的偏差 / 关键决策
- 复用现有码里的 `compareMoves` 作最终全序兜底，并补 `cardKey` 字符串比较处理完全等价移动。
- 不改 `ai/hint.ts`，只消费其合法候选集。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
