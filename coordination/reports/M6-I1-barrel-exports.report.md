# M6-I1 桶导出整合

## 变更
- `assets/scripts/data/index.ts` 追加 `statsDigest`、`recordsQuery`。
- `assets/scripts/ai/index.ts` 追加 `bidding-advisor`、`hintRank`、`handStrength`、`cardMemory`、`endgame`、`bid-confidence`、`insight`。
- `assets/scripts/game/index.ts` 追加 `trick-replay`、`replay-codec`。
- `assets/scripts/ui/index.ts` 追加 help/pause/detail/replay/tutorial/timer/toast/difficulty/thinking/last-action/strength/card-memory/insight/strings 等第十一至十三批纯 UI 模块。
- 新增 `test/integration/barrel-exports.test.ts` 验证新增公开模块可从 barrel import。

## 验证
- `npm --prefix test test -- --run`：127 个测试文件 / 623 个用例通过。
- `npm --prefix test run typecheck`：通过。

## 说明
- 仅 re-export 与 smoke test，不改模块实现或签名。
- 零 `cc`。
