# M4-31 已出牌记忆/未见牌推算

## 变更
- 新增 `assets/scripts/ai/cardMemory.ts`，导出 `CardMemory` 与 `trackPlayed(events, ownHand?)`。
- 新增 `test/ai/card-memory.test.ts` 覆盖空事件、play 中的普通/炸弹/火箭牌型、己方手牌扣减、不为负与确定性。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 512 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 仅消费公开 `play.pattern.cards` 和可选己方手牌；`bomb/rocket` 事件在当前 `GameEvent` 契约中不携带牌面，避免重复扣牌。
- 未修改 `index.ts` 桶导出。
