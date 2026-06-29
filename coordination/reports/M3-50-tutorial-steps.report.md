# M3-50 新手教程步骤模型

## 变更
- 新增 `assets/scripts/ui/tutorial-steps.ts`，导出 `tutorialSteps`、`nextStep` 与 highlight 键集合。
- 新增 `test/ui/tutorial-steps.test.ts` 覆盖稳定步骤、核心关键词、索引钳制、highlight 合法性与返回对象隔离。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 512 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 纯数据模型，零 `cc`，未修改桶导出。
