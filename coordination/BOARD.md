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
| M2-08 | bidding-pure：`game/bidding.ts` 去 WeakMap | M2-02 | **done** | （已并 main d9f861a） | BiddingState 纯数据化、可序列化 |
| M2-09 | ai-bid-policy：`ai/bidding.ts` | M2-02 | **done** | （已并 main e20046b） | 基线叫抢 `chooseBid`（强手 call/grab，弱手 pass）|
| M2-10 | data-stats：`data/{stats,index}.ts` | M2-01, M2-03 | **done** | （已并 main eeb7750） | 战绩累计（纯函数、不可变）|
| M2-06 | flow：`flow/**` + `test/flow/**` | M2-08, M2-03, M2-05 | **done** | （已并 main afcd864） | headless 回合驱动器 + 可注入时钟；deal 事件 `{ type: 'deal' }` |
| M2-07 | selfplay：`test/selfplay/{runner,selfplay.test}.ts` | M2-06 | **ready** | `task/M2-07-selfplay` | 种子就绪（桩 + 失败测试，seeds 1..30）；待派发实现 `runSeeds` |

> **M2-08/09/10/06 已按序评审合并入 main**（08→09→10→06，每步 typecheck + 全量测试复验绿）。deal 事件最终定为 `{ type: 'deal' }`（无 `landlordBottomTo`：deal 在叫抢前发出，底牌归属由后续 `landlordDecided` 表达）。当前 main：**15 测试文件 / 72 用例全绿**。**M2-07** 种子已就绪，是唯一待派发实现的 M2 任务。

## 派发记录
- M2-01..05：**done**，已并 main。
- M2-08/09/10/06：**done**，已按序 `merge --no-ff` 入 main（合并提交 d9f861a / e20046b / eeb7750 / afcd864）；main 72 测试绿。已合并的 `task/M2-08|09|10|06` 分支与 worktree 可清理。
- M2-07：**ready**，种子在 `task/M2-07-selfplay`（桩 `test/selfplay/runner.ts` + 失败测试 `test/selfplay/selfplay.test.ts`，断言 seeds 1..30 守恒/终止/可复现）；main 保持绿（红测试只在分支）。可立即派发实现。
- 派发：对每个 ready 任务，在新 AI 窗口粘贴 PROTOCOL.md 的 bootstrap 提示词，把 `<ID>` 换成对应分支名（如 `M2-07-selfplay`）。

## 后续里程碑备忘（未出 spec）
- **M4**：AI 难度分层（简单/普通/困难），叫抢与出牌策略升级（M2-05/09 仅基线）。
- **M5**：断局存档防线——给 `serialize` 加 `version`/schema 校验（M2-04 当前为纯 JSON 直出直入）；战绩持久化 IO（M2-10 仅内存累计）。
