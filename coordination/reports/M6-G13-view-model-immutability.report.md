# M6-G13 视图模型入参不可变护栏

## 变更
- 新增 `test/ui/view-model-immutability.test.ts`。
- 覆盖旧核心 VM：`deriveScreenVM`、`deriveActionButtons`、`deriveBiddingView`、`deriveResultView`、`deriveStatsView`、`deriveRecordsView`、`deriveLobbyView`、`deriveSettingsView`、`toggleSetting`、`setDifficulty`。
- 覆盖新增 VM：`deriveRecordsDetailView`、`deriveStatsDetailView`、`deriveStrengthMeter`、`deriveCardMemoryView`、`deriveBiddingAdviceView`、`deriveReplayView`、`deriveLastActions`、`deriveInsightView`、`deriveAiThinking`。

## 验证
- `npm --prefix test test -- --run`：126 个测试文件 / 619 个用例通过。
- `npm --prefix test run typecheck`：通过。

## 说明
- 绿护栏任务，只新增测试与 report，不改产品码。
- 零 `cc`。
