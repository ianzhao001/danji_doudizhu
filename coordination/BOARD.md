# 任务板（BOARD）

架构维护的任务真相源。状态：`todo`(待出 spec) · `ready`(spec+测试就绪可认领) · `claimed:<标识>` · `in-review` · `changes-requested` · `done`。

## 当前里程碑：M2 单局状态机（多 AI 协作）

| ID | 模块 / 文件域 | 依赖 | 状态 | 分支 | 备注 |
|----|----|----|----|----|----|
| M2-01 | game-core：`assets/scripts/game/{types,core,index}.ts` | rules | **done** | （已合并 main） | 契约 `game/types.ts` 已固定 |
| M2-02 | bidding：`assets/scripts/game/bidding.ts` + `test/game/bidding.test.ts` | M2-01 | **ready** | `task/M2-02-bidding` | 叫/抢/反抢翻倍、定地主 |
| M2-03 | settlement：`assets/scripts/game/settlement.ts` + test | M2-01 | **ready** | `task/M2-03-settlement` | 倍数连乘 + 春天 + 胜负结算 |
| M2-04 | serialization：`assets/scripts/game/serialize.ts` + test | M2-01 | **ready** | `task/M2-04-serialization` | RoundState ↔ JSON 往返 |
| M2-05 | ai-baseline：`assets/scripts/ai/**` + `test/ai/**` | M2-01 | **ready** | `task/M2-05-ai-baseline` | 随机合法 AI（出牌阶段）|
| M2-06 | flow：`assets/scripts/flow/**` + `test/flow/**` | M2-01, M2-05 | todo | — | 回合驱动器 + 可控时钟思考时延 |
| M2-07 | selfplay-harness：`test/selfplay/**` | M2-01,05,06 | todo | — | N 局 AI vs AI 稳定性 |

> M2-02..05 互不相交，可**并行**认领（均依赖已固定的 `game/types.ts`）。M2-06/07 待其依赖合并后再置 `ready`。

## 派发记录
- M2-01：**done**，已 `merge --no-ff` 入 main（main 37 测试绿）。
- M2-02/03/04/05：**ready**，spec 在 `coordination/tasks/`，失败测试在各自 `task/<ID>` 分支。
- 派发：对每个任务，在新 AI 窗口粘贴 PROTOCOL.md 的 bootstrap 提示词，把 `<ID>` 换成对应分支名（如 `M2-02-bidding`）。
