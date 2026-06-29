# M6-I1 桶导出整合（第十一批·架构整合点·采纳执行者建议#6）

- 状态：**blocked（待第十一批 A 线纯逻辑全部 merge 后由架构执行）**
- 派发模式：架构整合步（或派一名实现方）· worktree · 禁 cc · 仅 re-export
- 分支：`task/M6-I1-barrel-exports`（A 线全并后从 main 建）
- 文件域（**只允许改这些**）：`assets/scripts/{data,ai,game,ui}/index.ts`（仅加 `export * from './<新模块>'`）、必要时 `test/**/barrel-exports.test.ts`（新·验证桶可达）、report

## 背景
第十一批 A 线按「import 直引、不改 index.ts」派发（避免并行桶冲突）。本任务是约定好的**后置统一补桶**点（沿用第六批先例），把新模块的公开导出一次性补齐，供组件/未来消费方走 barrel。

## 行为要求（以 A 线实际并入 main 的模块为准·先 grep 确认存在再加）
- `data/index.ts` += `statsDigest`、`recordsQuery`
- `ai/index.ts` += `hintRank`、`bidding-advisor`
- `game/index.ts` += `trick-replay`
- `ui/index.ts` += `help-content`、`pause-menu`、（视图层并入后追加 `stats-detail-view`/`records-detail-view`/`bidding-advice-view`/`replay-view`）
- **仅 re-export**，不改任何模块实现/签名；不得引入命名冲突（加前先 grep 现有桶，若重名在 report 报架构，不强行覆盖）。
- typecheck 须净（barrel 消费方不破）；零 cc。

## 验收
- `npm --prefix test test` 全绿、`typecheck` 净、零 cc。
- 每个新模块经 `from '../<layer>'` barrel 可达（可加一个 import-from-barrel 的 smoke 测试）。
- report 列补齐的导出清单 + grep 无命名冲突证据。
