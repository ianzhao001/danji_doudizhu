# M3-54 已出牌 HUD 视图模型

## 变更
- 新增 `assets/scripts/ui/card-memory-view.ts`，导出 `deriveCardMemoryView`。
- 新增 `test/ui/card-memory-view.test.ts` 覆盖行序、exhausted 标记、rankLabel 与 remaining 透传。

## 验证
- `npm --prefix test test -- --run`：121 个测试文件 / 598 个用例通过。
- `npm --prefix test run typecheck`：通过。

## 说明
- 只消费 `CardMemory`，不重新跟踪事件。
- 零 `cc`，未修改桶导出。
