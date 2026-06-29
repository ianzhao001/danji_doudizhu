# M6-L7-stats-digest 实现报告

- 实现方标识：Codex
- 分支：`task/M6-L7-stats-digest`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/data/statsDigest.ts`：新增 `StatsDigest` 与 `digestRecords(records)`，覆盖胜负、当前/最佳连胜、分数极值、炸弹/春天、地主/农民分组。
- `test/data/stats-digest.test.ts`：新增空记录、全胜、混合 streak、分角色统计、入参不变测试。

## 测试与类型检查输出
```text
npm --prefix test test -- --testTimeout=60000
Test Files  93 passed (93)
Tests       474 passed (474)
data/stats-digest.test.ts (5 tests) passed

npm --prefix test run typecheck
tsc --noEmit
exit 0
```

## 与 spec 的偏差 / 关键决策
- 标准 `npm --prefix test test` 在当前机器上被既有 `selfplay/selfplay.test.ts` 5s timeout 擦边影响（可复现用例实际约 5.0s+），新增测试本身已绿；用 `--testTimeout=60000` 全量通过作为佐证，未修改任何既有测试。
- `currentStreak` 按 `records.entries` 末尾为最近一局计算，与 `appendRecord`/`recentRecords` 的顺序约定一致。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
