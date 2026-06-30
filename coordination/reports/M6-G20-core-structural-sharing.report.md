# M6-G20-core-structural-sharing 实现报告

- 实现方标识：Codex
- 分支：`task/M6-G20-core-structural-sharing`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/game/core.ts`
  - `replaceSeatHand` 改为只替换实际出牌座位，未变化座位保持原 `PlayerSeat` 引用。
  - `pass` 分支不再重建 `seats`/`hand`，只更新 `turn`/`top`/`passesInARow`。
- `test/game/core-structural-sharing.test.ts`
  - 新增结构共享回归测试：单次 pass、第二次 pass reset、出牌只替换行动座位。

## 测试与类型检查输出
```
npm --prefix test test -- game/core.test.ts game/core-structural-sharing.test.ts
Test Files  2 passed (2)
Tests  12 passed (12)

npm --prefix test test
Test Files  129 passed (129)
Tests  635 passed (635)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
通过，无输出

cc import 护栏
纯逻辑层无真实 `cc` import；grep 命中均为既有注释里的“禁止 import cc”文字。
```

## 与 spec 的偏差 / 关键决策
- 无行为偏差。
- 本任务按 G19/G20 串行约束先做 G20；G19 后续应在本提交之后继续抽 `nextSeat`/`cardKey`，避免 `game/core.ts` 冲突。
- `pass` 分支沿用原 `state.seats` 数组引用；这比只保持各 `PlayerSeat` 引用更彻底，且 pass 本身不改手牌/座位数据，符合 spec“pass 不拷手牌”的意图。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
