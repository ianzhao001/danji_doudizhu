# 任务板（BOARD）

架构维护的任务真相源。状态：`todo`(待出 spec) · `ready`(spec+测试就绪可认领) · `claimed:<标识>` · `in-review` · `changes-requested` · `done`。

## 当前里程碑：M2 完成 ✅ · M4 三档基线完成 ✅ · 强化批次（M4-05 / M-FLOW / M5-01）并行进行中

main 现状：**19 测试文件 / 85 用例全绿**（rules + game + ai 三档 + flow + selfplay）。M2 单局状态机全部并入 main；M4 三档难度 AI 基线（simple/normal/hard）全部并入 main。本轮按审查建议派发第一批 3 个文件域互不相交的强化任务。

## M2 单局状态机（全部 done）

| ID | 模块 / 文件域 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M2-01 | game-core：`game/{types,core,index}.ts` | **done** | 已并 main | 契约 `game/types.ts` 固定 |
| M2-02 | bidding：`game/bidding.ts` | **done** | 已并 main | 叫/抢/反抢翻倍；M2-08 纯化 |
| M2-03 | settlement：`game/settlement.ts` | **done** | 已并 main | 倍数连乘 + 春天 + 胜负 |
| M2-04 | serialization：`game/serialize.ts` | **done** | 已并 main | RoundState ↔ JSON 往返（M5-01 加版本化）|
| M2-05 | ai-baseline：`ai/baseline.ts` | **done** | 已并 main | 随机合法 AI |
| M2-06 | flow：`flow/**` | **done** | afcd864 | headless 驱动器 + 可注入时钟；deal `{ type: 'deal' }` |
| M2-07 | selfplay：`test/selfplay/**` | **done** | 6ac5832 | runSeeds 复用 runHeadlessRound，零和/终止/可复现，seeds 1..30 |
| M2-08 | bidding-pure：`game/bidding.ts` | **done** | d9f861a | BiddingState 纯数据化、可序列化 |
| M2-09 | ai-bid-policy：`ai/bidding.ts` | **done** | e20046b | 基线叫抢 chooseBid |
| M2-10 | data-stats：`data/{stats,index}.ts` | **done** | eeb7750 | 战绩累计（纯函数）|

## M4 难度 AI 基线（三档 done）

接口契约 `ai/strategy.ts`（`AiLevel`/`AiStrategy`/`strategyFor`/`chooseActionByLevel`）已入 main。

| ID | 模块 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M4-01 | ai-simple：`ai/levels/simple.ts` | **done** | 2aafc7f | 最小化·确定性 |
| M4-02 | ai-normal：`ai/levels/normal.ts` | **done** | 7ec2148 | 保炸弹决策树 |
| M4-03 | ai-hard：`ai/levels/hard.ts` | **done** | 0849a1e | pressing 出最小炸弹，否则自包含保守 |
| M4-04 | 难度差异 selfplay 回归 | **todo** | — | 依赖 M-FLOW(playPolicy) + M4-05；用 playPolicy 让座位用不同 strategyFor 难度 |

## 强化批次（第一批 · 三者 ready · 文件域互不相交，可同时认领）

按审查建议种子：失败测试只在对应分支，main 保持 85 绿。

| ID | 模块 / 文件域 | 依赖 | 状态 | 分支（失败测试 commit）| 失败测试 | 备注 |
|----|----|----|----|----|----|----|
| M4-05 | ai 强化：`ai/levels/**`（新 `_shared.ts`）| M4-01/02/03 | **ready** | `task/M4-05-ai-hardening` (79589bf) | `test/ai/hardening.test.ts` | _shared 收敛 + 全序 compareMoves + hard 跟牌大牌压制 |
| M-FLOW | flow 增强：`flow/{driver,types}.ts` | M2-06/07 | **ready** | `task/M-FLOW-diagnostics` (a1b0b57) | `test/flow/diagnostics.test.ts` | 接口已落桩(c47d92b)；driver 消费 playPolicy + 抛 HeadlessRoundError |
| M5-01 | 存档版本化：`game/serialize.ts` | M2-04 | **ready** | `task/M5-01-serialize-version` (196ffad) | `test/game/serialize-version.test.ts` | {version,state} 包装 + 反序列化校验，往返保绿 |

> 三者文件域 `ai/levels` vs `flow` vs `game/serialize` 互不相交，可并行派发。各行为契约见对应 `coordination/tasks/*.md`。

## 派发记录
- M2-01..10、M4-01/02/03：**done**，已并 main；main 85 用例绿；已合并分支/worktree 均已清理。
- 本轮按序 `merge --no-ff` 入 main：M2-07 (6ac5832) → M4-01 (2aafc7f) → M4-02 (7ec2148) → M4-03 (0849a1e)，每步 typecheck + 全量复验绿；4 个 worktree/分支已 `worktree remove` + `branch -d`。
- M4-05 / M-FLOW / M5-01：**ready**，种子已落（spec 入 main + 失败测试在各自分支，main 保持绿）。M-FLOW 额外在 main 落了 flow 接口桩（c47d92b：`PlayPolicy`/`playPolicy?`/`HeadlessRoundError`）使分支测试 typecheck 绿、driver 行为待实现。可立即并行派发。
- 派发方式：对每个 ready 任务，在新 AI 窗口粘贴 PROTOCOL.md 的 bootstrap 提示词，把 `<ID>` 换成分支名（`M4-05-ai-hardening` / `M-FLOW-diagnostics` / `M5-01-serialize-version`）。

## 后续批次（前置合并后再种）
- **M2-07-D** 诊断单测 + runner 消费（依赖 M-FLOW）：runner 利用 `HeadlessRoundError` 取 partial 诊断；`test/selfplay/diagnostics.test.ts` 验证错误含 seed/turns/lastEvents。文件域 `test/selfplay/**`。
- **M4-04** 难度差异 selfplay（依赖 M-FLOW playPolicy + M4-05 三档定稿）：用 playPolicy 让座位用不同难度，跑足量 seeds 断言难度单调性/控权差异。文件域 `test/selfplay/difficulty*.ts`。
- **M3** 手机竖屏 UI（Cocos 编辑器场景/预制体/组件，import cc，非 worktree 纯逻辑模式）；难度接入 flow/UI（玩家选难度 → flow playPolicy）；M5 数据持久化 IO。
