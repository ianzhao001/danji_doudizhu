# M6-L13 UI 文案集中表

## 变更
- 新增 `assets/scripts/ui/strings.ts`，导出只读 `STRINGS` 与 `t(key, fallback?)`。
- 新增 `test/ui/strings.test.ts` 覆盖已知键、缺键回退、只读冻结与键命名规范。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 511 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 首版 zh-only，不引入 i18n 框架。
- 不迁移既有组件文案，未修改桶导出。
