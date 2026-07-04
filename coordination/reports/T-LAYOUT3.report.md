# T-LAYOUT3 种子报告

- 实现方标识：Codex（规划种子）
- 分支：`task/T-LAYOUT3`
- 状态：ready（红测试已种，待执行者实现）

## 改了哪些文件

- `test/ui/table-zones-v13.test.ts`
- `coordination/reports/T-LAYOUT3.report.md`

## 测试与类型检查输出

```
npm --prefix test exec -- vitest run ui/table-zones-v13.test.ts
Test Files  1 failed (1)
Tests       16 failed (16)
主要失败：heroBody missing；v13 新 zone 尚未由 tableZones 返回。

npm --prefix test run typecheck
tsc --noEmit passed
```

## 与 spec 的偏差 / 关键决策

- 红测试只种在 `task/T-LAYOUT3` 分支，未进入 main，避免 main 基线变红。
- 新 worktree 缺 `temp/cli/tsconfig.cocos.json` 时已按任务书 workaround 从主工作树复制；该文件不纳入提交。

## 下一步

- 执行者在 `task/T-LAYOUT3` 中只改 `assets/scripts/ui/table-zones.ts` 与本报告，使新增 v13 zones 满足四横屏契约。
- 完成后跑全量 `npm --prefix test test`、`npm --prefix test run typecheck`、`git diff --check`。
