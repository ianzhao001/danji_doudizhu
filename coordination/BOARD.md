# 任务板（BOARD）

架构维护的任务真相源。状态：`todo`(待出 spec) · `ready`(spec+测试就绪可认领) · `claimed:<标识>` · `in-review` · `changes-requested` · `done`。

## 当前里程碑：M2 单局状态机（多 AI 协作）

| ID | 模块 / 文件域 | 依赖 | 状态 | 分支 | 备注 |
|----|----|----|----|----|----|
| M2-01 | game-core：`assets/scripts/game/{types,core,index}.ts` + `test/game/core.test.ts` | rules | **ready** | `task/M2-01-game-core` | 基础任务，固定共享类型，先合并。spec → tasks/M2-01-game-core.md |
| M2-02 | bidding：`assets/scripts/game/bidding.ts` + `test/game/bidding.test.ts` | M2-01 | todo | — | 叫/抢/反抢翻倍、定地主、底牌归地主 |
| M2-03 | settlement：`assets/scripts/game/settlement.ts` + test | M2-01 | todo | — | 倍数连乘 + 春天/反春天 + 胜负结算 |
| M2-04 | serialization：`assets/scripts/game/serialize.ts` + test | M2-01 | todo | — | RoundState ↔ JSON 往返一致 |
| M2-05 | ai-baseline：`assets/scripts/ai/**` + `test/ai/**` | M2-01 | todo | — | 随机合法 AI；可与 game/ 任务并行 |
| M2-06 | flow：`assets/scripts/flow/**` + `test/flow/**` | M2-01, M2-05 | todo | — | 回合驱动器 + 可控时钟思考时延 |
| M2-07 | selfplay-harness：`test/selfplay/**` | M2-01,05,06 | todo | — | N 局 AI vs AI 稳定性 |

> M2-02..07 的 spec 与测试在 M2-01 合并、共享契约（`game/types.ts`）固定后，由架构补齐再置 `ready`。

## 派发记录
- M2-01：`ready`。spec + 失败测试已在分支 `task/M2-01-game-core`。派发方式见 PROTOCOL.md 的 bootstrap 提示词（`<ID>` = `M2-01-game-core`）。
