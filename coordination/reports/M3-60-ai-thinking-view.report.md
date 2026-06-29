# M3-60 AI 思考指示视图模型

## 变更
- 新增 `assets/scripts/ui/ai-thinking-view.ts`，导出 `deriveAiThinking`。
- 新增 `test/ui/ai-thinking-view.test.ts` 覆盖 hero/AI 回合、settled、座位标签和 dots 周期。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 512 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 纯函数，零 `cc`，不持有运行时状态。
