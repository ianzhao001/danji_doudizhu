# M6-G13 视图模型入参不可变 横切护栏（第十二批·核心质量）

- 状态：**ready**（依赖各 view-model 已在 main）
- 派发模式：纯逻辑 worktree · 禁 cc · 绿护栏·不改产品码
- 分支：`task/M6-G13-view-model-immutability`（`git worktree add ../斗地主.worktrees/M6-G13 -b task/M6-G13-view-model-immutability main`）
- 文件域：`test/ui/view-model-immutability.test.ts`（新）、report

## 目标
锁横切不变量：所有 `derive*` 视图模型**不修改入参**（快照/数组/对象）。防后续重构引入就地变异 bug。

## 行为要求（测试钉死）
- 对一组代表性 view-model（`deriveScreenVM`/`deriveActionButtons`/`deriveBiddingView`/`deriveResultView`/`deriveStatsView`/`deriveRecordsView`/`deriveLobbyView`/`deriveSettingsView` 等已在 main 的）：构造输入 → 深拷贝快照 → 调用 → 断言原输入对象/数组**深相等于调用前**（未被变异）。
- 以各 VM 实际签名为准（先读 `ui/*.ts` 导出再写；不臆造）。
- 零 cc。

## 验收
- 全绿、typecheck 净、零 cc、report 落盘（列覆盖的 VM 清单）。
