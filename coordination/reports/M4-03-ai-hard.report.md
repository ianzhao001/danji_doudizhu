# M4-03-ai-hard 实现报告

- 实现方标识：Codex
- 分支：`task/M4-03-ai-hard`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ai/levels/hard.ts`：实现自包含 hard 策略；包含保炸弹/火箭保守逻辑，并在任一对手剩牌 `<= 2` 且炸弹/火箭可出或可压时优先使用炸弹/火箭控权。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  16 passed (16)
Tests       75 passed (75)
ai/hard.test.ts (3 tests) passed

npm --prefix test run typecheck
tsc --noEmit
passed
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 未运行时调用 `normalStrategy`；hard 内部复制了保守策略所需逻辑，避免并行分支桩函数影响。
- pressing 时多个炸弹/火箭可选，按炸弹主点从小到大选择，火箭排在最后。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
