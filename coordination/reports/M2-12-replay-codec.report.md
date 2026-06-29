# M2-12 回放编解码

## 变更
- 新增 `assets/scripts/game/replay-codec.ts`，导出 `REPLAY_VERSION`、`encodeReplay`、`decodeReplay`。
- 新增 `test/game/replay-codec.test.ts` 覆盖往返、空事件、确定性、版本化、坏 JSON、版本不符和非法事件。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 514 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- `decodeReplay` 抛错前缀为 `corrupted replay:`。
- 按当前 `GameEvent` 真实形状校验：`bomb/rocket` 只带 `seat`，牌面来自 `play.pattern`。
- 零 `cc`，未修改 `game/replay.ts` 或桶导出。
