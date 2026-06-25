# M4-02-ai-normal 实现报告

- 实现方标识：Codex
- 分支：`task/M4-02-ai-normal`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ai/levels/normal.ts`：实现保炸弹/火箭的确定性策略；优先选择不拆炸弹/火箭的安全候选，无安全候选时才按规则使用炸弹/火箭或 pass。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  16 passed (16)
Tests       76 passed (76)
ai/normal.test.ts (4 tests) passed

npm --prefix test run typecheck
tsc --noEmit
passed
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 被迫选择多个炸弹/火箭时，按炸弹主点从小到大选择，火箭排在最后，避免过早使用最大压制牌。
- 跟牌时如果只有拆炸弹/火箭的非炸弹候选且没有炸弹/火箭可用，则选择 pass，不拆保护牌。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
