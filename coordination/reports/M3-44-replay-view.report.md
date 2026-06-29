# M3-44 回放视图模型

## 变更
- 新增 `assets/scripts/ui/replay-view.ts`，导出 `deriveReplayView`。
- 新增 `test/ui/replay-view.test.ts` 覆盖空回放、首/中/末导航、index 钳制与动作文案。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 512 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 只消费 `ReplayTrick[]`，按现有 `ReplayPlay.kind` 输出座位动作短文案。
- 零 `cc`，未修改桶导出。
