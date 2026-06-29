# M6-G14 AI 隐藏状态隔离护栏

## 变更
- 新增 `test/ai/ai-hidden-state-isolation.test.ts`。
- 覆盖 simple/normal/hard 三档，在自由领出、跟单、跟对、炸弹兜底等快照下验证：
  - 不修改 `GameSnapshot`。
  - 输出动作合法且 seat 对齐当前 turn。
  - 快照仅暴露 `handCounts` 与 viewerHand，不含他人手牌数组。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 520 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 绿护栏任务，未修改任何产品码。
