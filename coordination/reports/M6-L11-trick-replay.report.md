# M6-L11-trick-replay 实现报告

- 实现方标识：Codex
- 分支：`task/M6-L11-trick-replay`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/game/trick-replay.ts`：新增按 `reset` 边界分组的 `buildTricks(events)`。
- `test/game/trick-replay.test.ts`：覆盖空输入、单墩、多墩、炸弹/火箭、win 收尾、确定性与入参不变。

## 测试与类型检查输出
```text
npm --prefix test test
Test Files  93 passed (93)
Tests       474 passed (474)
game/trick-replay.test.ts (5 tests) passed

npm --prefix test run typecheck
tsc --noEmit
exit 0
```

## 与 spec 的偏差 / 关键决策
- `reset.leader` 作为当前墩胜者并作为下一墩 pending leader；`win` 落到最后一墩 `winnerSeat`。
- 没有改 `game/replay.ts`；本模型直接消费 `GameEvent[]`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
