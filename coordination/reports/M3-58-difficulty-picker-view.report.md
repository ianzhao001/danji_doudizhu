# M3-58 难度选择视图模型

## 变更
- 新增 `assets/scripts/ui/difficulty-picker-view.ts`，导出 `deriveDifficultyPicker`。
- 新增 `test/ui/difficulty-picker-view.test.ts` 覆盖三档顺序、配置复用、选中态和非法 current 回退。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 511 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 复用 `difficultyConfig()`/`difficultyOptions()`，不复制配置。
- 零 `cc`，未修改桶导出。
