# M4-09-bidding-strength-helper 实现报告

- 实现方标识：Codex
- 分支：`task/M4-09-bidding-strength-helper`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ai/bidding.ts`
- `assets/scripts/ai/bidding-levels.ts`
- `coordination/reports/M4-09-bidding-strength-helper.report.md`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  39 passed (39)
Tests       171 passed (171)

npm --prefix test run typecheck
tsc --noEmit passed

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/ai/bidding.ts assets/scripts/ai/bidding-levels.ts test/ai/bidding-strength.test.ts
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `chooseBid` 改为复用 `isStrongHand(hand, 2)`，行为保持不变。
- `chooseBidByLevel` 删除本地重复判强逻辑，统一复用 `isStrongHand(hand, thresholdFor(level))`。
- `thresholdFor` 使用 exhaustive switch：Simple=3、Normal=2、Hard=1，未知难度走 `never` 分支抛错。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
