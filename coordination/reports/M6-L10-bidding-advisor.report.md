# M6-L10-bidding-advisor 实现报告

- 实现方标识：Codex
- 分支：`task/M6-L10-bidding-advisor`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ai/bidding-advisor.ts`：新增 `adviseBid(hand, phase)`，复用 `isStrongHand(hand, 2)` 给玩家叫/抢/过建议。
- `test/ai/bidding-advisor.test.ts`：覆盖强手 calling/grabbing、弱手 pass、strong 字段与 `isStrongHand` 一致、确定性。

## 测试与类型检查输出
```text
npm --prefix test test
Test Files  93 passed (93)
Tests       473 passed (473)
ai/bidding-advisor.test.ts (4 tests) passed

npm --prefix test run typecheck
tsc --noEmit
exit 0
```

## 与 spec 的偏差 / 关键决策
- 无偏差；没有改 `ai/bidding*.ts`，只 import `isStrongHand`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
