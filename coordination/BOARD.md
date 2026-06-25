# 任务板（BOARD）

架构维护的任务真相源。状态：`todo`(待出 spec) · `ready`(spec+测试就绪可认领) · `claimed:<标识>` · `in-review` · `changes-requested` · `done`。

## 当前里程碑：M2 单局状态机（多 AI 协作）

| ID | 模块 / 文件域 | 依赖 | 状态 | 分支 | 备注 |
|----|----|----|----|----|----|
| M2-01 | game-core：`game/{types,core,index}.ts` | rules | **done** | （已并 main） | 契约 `game/types.ts` 已固定 |
| M2-02 | bidding：`game/bidding.ts` | M2-01 | **done** | （已并 main） | 叫/抢/反抢翻倍；状态纯化见 M2-08 |
| M2-03 | settlement：`game/settlement.ts` | M2-01 | **done** | （已并 main） | 倍数连乘+春天+胜负；测试已加固 |
| M2-04 | serialization：`game/serialize.ts` | M2-01 | **done** | （已并 main） | RoundState ↔ JSON 往返 |
| M2-05 | ai-baseline：`ai/baseline.ts` | M2-01 | **done** | （已并 main） | 随机合法 AI（出牌阶段）|
| M2-08 | bidding-pure：`game/bidding.ts` 去 WeakMap | M2-02 | **ready** | `task/M2-08-bidding-pure` | BiddingState 纯数据化（阻塞 flow）|
| M2-09 | ai-bid-policy：`ai/bidding.ts` | M2-02 | **ready** | `task/M2-09-ai-bid-policy` | 基线叫抢决策 `chooseBid` |
| M2-10 | data-stats：`data/{stats,index}.ts` | M2-01, M2-03 | **ready** | `task/M2-10-data-stats` | 战绩累计（纯函数）|
| M2-06 | flow：`flow/**` + `test/flow/**` | **M2-08, M2-03, M2-05** | **ready** | `task/M2-06-flow` | 回合驱动器 + 可注入时钟；待 08 合并后认领 |
| M2-07 | selfplay：`test/selfplay/**` | M2-06 | todo | `task/M2-07-selfplay` | N 局稳定性；待 06 合并后置 ready |

> **可并行**：M2-08 / M2-09 / M2-10 文件域不相交（`game/bidding.ts` vs `ai/bidding.ts` vs `data/**`），可同时认领。M2-06 依赖 M2-08 的纯数据 BiddingState，建议 08 合并后再认领（种子分支已按最终契约编码，亦可并行但需在 08 合并后 rebase 复验）。M2-07 待 06 合并。

## 派发记录
- M2-01..05：**done**，已 `merge --no-ff` 入 main（main 57 测试绿，含 settlement 加固）。
- M2-08/09/10：**ready**，spec 在 `coordination/tasks/`，失败测试在各自 `task/<ID>` 分支。
- M2-06：**ready**，契约桩 + 失败测试在 `task/M2-06-flow`（依赖 08）。
- M2-07：**todo**，失败测试在 `task/M2-07-selfplay`（依赖 06）。
- 派发：对每个 ready 任务，在新 AI 窗口粘贴 PROTOCOL.md 的 bootstrap 提示词，把 `<ID>` 换成对应分支名（如 `M2-08-bidding-pure`）。

## 后续里程碑备忘（未出 spec）
- **M4**：AI 难度分层（简单/普通/困难），叫抢与出牌策略升级（M2-05/09 仅基线）。
- **M5**：断局存档防线——给 `serialize` 加 `version`/schema 校验（M2-04 当前为纯 JSON 直出直入）；战绩持久化 IO（M2-10 仅内存累计）。
