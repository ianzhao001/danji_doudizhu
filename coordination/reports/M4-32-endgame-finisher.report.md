# M4-32 残局一手出完检测

## 变更
- 新增 `assets/scripts/ai/endgame.ts`，导出 `canFinishInOneMove` 与 `finishingFollow`。
- 新增 `test/ai/endgame.test.ts` 覆盖领出、跟牌命中、无解、空手与确定性。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 513 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 复用 `recognize` 与 `legalFollows`，不重写牌型/比较规则。
- 零 `cc`，未修改既有 AI/hint 或桶导出。
