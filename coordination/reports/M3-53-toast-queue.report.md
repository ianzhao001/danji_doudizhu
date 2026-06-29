# M3-53 瞬时提示队列模型

## 变更
- 新增 `assets/scripts/ui/toast-queue.ts`，导出 `emptyToasts`、`pushToast`、`tickToasts`。
- 新增 `test/ui/toast-queue.test.ts` 覆盖 push、过期、id 递增、最大条数裁剪与空队列。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 512 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 纯不可变模型，零 `cc`，不持有定时器。
