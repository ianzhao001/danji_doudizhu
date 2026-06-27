# M4-20-hint-suggest 实现报告

- 实现方标识：Codex
- 分支：`task/M4-20-hint-suggest`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ai/hint.ts`
- `test/ai/hint.test.ts`

## 测试与类型检查输出
```
npm --prefix test test -- ai/hint.test.ts
Test Files  1 passed (1)
Tests       9 passed (9)

npm --prefix test test
Test Files  57 passed (57)
Tests       314 passed (314)

npm --prefix test run typecheck
tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `hintSuggestions` 复用 `enumerateMoves` / `legalFollows`，排序为非炸弹优先，再复用 `_shared.compareMoves` 的稳定全序。
- `nextHint` 用排序后的 cards key 匹配上一条建议，命中则取后一项，末项回绕；未命中或缺省取首项。
- 产品文件未 import `ai/bidding*`，未改 `ai/index.ts`，未新增 `.meta`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改 main / 他人模块
- [x] 未 import cc
- [x] 未 import `ai/bidding*`
