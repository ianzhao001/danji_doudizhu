# M5-14-followup statsCodec 注释订正（纯文档·1 行）

- 状态：ready
- 派发模式：纯 spec·微任务（**行为零改**，仅订正误导注释）
- 文件域（**只允许改**）：`assets/scripts/data/statsCodec.ts`（仅第 39 行注释）
- 依赖：无。可由任一实现方 / 编辑器执行者顺手认领。
- 分支：`task/M5-14-followup-statscodec-comment`

## 背景
M5-14 验收遗留：`statsCodec.ts:39` 注释「stats are derivable, so a stale wire should not block boot」**失实**——stats **不可**从 records 重建（records 无胜负方归因）。unknown-version 回落 `emptyStats()` 是**容灾兜底（graceful degradation）**，非可逆迁移。行为已由 `test/data/stats-codec.test.ts:42-43`（unknown-version → emptyStats）锁定，**本任务零行为改动**。

## 要改（仅注释）
把第 39 行注释订正为表达三点（措辞可微调）：
1. unknown-version 回落 emptyStats 是**容灾兜底**，**非可逆迁移**；
2. stats **不可**从 records 推导（records 缺胜负方归因）；
3. 当前 `version` 恒为 `STATS_VERSION` 故此路径 latent；**若将来 bump 版本，应在此加显式迁移**，而非静默丢弃已累计战绩。

参考措辞：
```ts
// Unknown versions fall back to empty stats as graceful degradation (NOT a reversible
// migration): stats are not derivable from records, which lack winner-side attribution.
// version is currently always STATS_VERSION, so this path is latent — if STATS_VERSION
// is ever bumped, add an explicit migration here instead of silently dropping accumulated stats.
```

## 验收
- 仅 `statsCodec.ts` 注释改动；`deserializeStats` 逻辑零改。
- `npm --prefix test test` 全绿（`stats-codec.test.ts` 不变仍绿）、typecheck 净、零 cc。

## 测试命令
`npm --prefix test test`
