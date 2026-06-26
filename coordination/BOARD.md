# 任务板（BOARD）

架构维护的任务真相源。状态：`todo`(待出 spec) · `ready`(spec+测试就绪可认领) · `claimed:<标识>` · `in-review` · `changes-requested` · `done`。

## 当前里程碑：M2 ✅ · M4 三档基线 ✅ · 强化批次（M4-05 / M-FLOW / M5-01）已并 main ✅ · 下一并行批次（5 任务）全部 ready · 可派发

main 现状：**23 测试文件 / 101 用例全绿**（rules + game + ai 三档 + 强化 + flow + selfplay）。强化批次 M4-05 / M-FLOW / M5-01 已按序 `merge --no-ff` 入 main，并补 `test/ai/tie-breaker.test.ts` 全序回归。下一批 5 个文件域互不相交的纯逻辑任务**已种、全部 ready**（见「下一并行批次」）。

## M2 单局状态机（全部 done）

| ID | 模块 / 文件域 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M2-01 | game-core：`game/{types,core,index}.ts` | **done** | 已并 main | 契约 `game/types.ts` 固定 |
| M2-02 | bidding：`game/bidding.ts` | **done** | 已并 main | 叫/抢/反抢翻倍；M2-08 纯化 |
| M2-03 | settlement：`game/settlement.ts` | **done** | 已并 main | 倍数连乘 + 春天 + 胜负 |
| M2-04 | serialization：`game/serialize.ts` | **done** | 已并 main | RoundState ↔ JSON 往返（M5-01 已加版本化）|
| M2-05 | ai-baseline：`ai/baseline.ts` | **done** | 已并 main | 随机合法 AI |
| M2-06 | flow：`flow/**` | **done** | afcd864 | headless 驱动器 + 可注入时钟；deal `{ type: 'deal' }` |
| M2-07 | selfplay：`test/selfplay/**` | **done** | 6ac5832 | runSeeds 复用 runHeadlessRound，零和/终止/可复现，seeds 1..30 |
| M2-08 | bidding-pure：`game/bidding.ts` | **done** | d9f861a | BiddingState 纯数据化、可序列化 |
| M2-09 | ai-bid-policy：`ai/bidding.ts` | **done** | e20046b | 基线叫抢 chooseBid |
| M2-10 | data-stats：`data/{stats,index}.ts` | **done** | eeb7750 | 战绩累计（纯函数）|

## M4 难度 AI（三档基线 + 强化 done）

接口契约 `ai/strategy.ts`（`AiLevel`/`AiStrategy`/`strategyFor`/`chooseActionByLevel`）已入 main。

| ID | 模块 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M4-01 | ai-simple：`ai/levels/simple.ts` | **done** | 2aafc7f | 最小化·确定性 |
| M4-02 | ai-normal：`ai/levels/normal.ts` | **done** | 7ec2148 | 保炸弹决策树 |
| M4-03 | ai-hard：`ai/levels/hard.ts` | **done** | 0849a1e | pressing 出最小炸弹，否则自包含保守 |
| M4-05 | ai 强化：`ai/levels/**`(+`_shared.ts`) | **done** | merged | _shared 收敛 + 全序 compareMoves + hard 大牌压制；tie-breaker 回归已补 |
| M4-04 | 难度差异 selfplay 回归 | **todo（已解锁）** | — | 见「下一并行批次」 |

## 强化批次（第一批 · 全部 done · 已并 main）

按序 `merge --no-ff` 入 main：M5-01 → M-FLOW → M4-05；每步 typecheck + 全量复验绿（85→90→92→96），补 tie-breaker 后 101 绿。

| ID | 模块 / 文件域 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M4-05 | ai 强化：`ai/levels/**` | **done** | merged | 见 M4 表 |
| M-FLOW | flow 增强：`flow/{driver,types}.ts` | **done** | merged | playPolicy 注入 + HeadlessRoundError 诊断；**出牌循环异常包装顺延 M-FLOW-02** |
| M5-01 | 存档版本化：`game/serialize.ts` | **done** | merged | {version,state} 包装 + 反序列化**浅**校验（7/8 字段）；**`top` + 深层校验顺延 M5-02** |

## 下一并行批次（5 任务 · 文件域互不相交 · 全部 ready · 可认领）

> 种子已落：每任务 spec 入 main、失败测试在各自分支（main 保持 101 绿）。文件域两两不相交，可同时认领。**规划者只出框架（spec/契约/失败测试/分支），实现方填实现主体。** spec 见 `coordination/tasks/<ID>.md`。

| ID | 实现文件域 | 依赖 | 分支（失败测试 commit）| 失败测试 | 备注 |
|----|----|----|----|----|----|
| M5-02 | `game/serialize.ts` | M5-01 | `task/M5-02-serialize-deep` (c8af94a) | `test/game/serialize-deep.test.ts` | 补 `top` 必需 + 有界深层结构校验（seats 长 3 / index 0-2 / 枚举合法 / top.pattern 形状 / 非负计数）|
| M-FLOW-02 | `flow/driver.ts`（契约 `types.ts` 已加可选 cause）| M-FLOW | `task/M-FLOW-02-illegal-action` (eebfe6d) | `test/flow/illegal-action.test.ts` | 出牌循环 policy/apply 异常包成 HeadlessRoundError，填 seed/turns/landlord/lastEvents + 保留 cause |
| M2-07-D | `test/selfplay/runner.ts` | M-FLOW | `task/M2-07-D-selfplay-diagnostics` (65a2028) | `test/selfplay/diagnostics.test.ts` | runner 识别 HeadlessRoundError → 富 partial 替代空 `{}`；分支已含 runSeeds opts 脚手架 |
| M4-04 | `test/selfplay/difficulty.ts`（新，不碰 runner.ts）| M-FLOW + M4-05 | `task/M4-04-difficulty-selfplay` (e1e1cf1) | `test/selfplay/difficulty.test.ts` | 实现 routing playPolicy 收敛；不变量架构种入，难度信号实现方新增（防 flaky）|
| M5-03 | `data/settings.ts`（桶 `data/index.ts` 已加导出）| — | `task/M5-03-settings` (e388082) | `test/data/settings.test.ts` | `Settings`/`defaultSettings`/`migrateSettings` 容错迁移；difficulty 复用 `AiLevel`；无 cc |

> 互斥实现域：`game/serialize.ts` ｜ `flow/driver.ts` ｜ `test/selfplay/runner.ts` ｜ `test/selfplay/difficulty.ts` ｜ `data/settings.ts`。M4-04 直调 `runHeadlessRound`（routing playPolicy），**不依赖** M2-07-D 的 runner.ts 改动。

## 派发记录
- M2-01..10、M4-01/02/03：**done**，已并 main；worktree/分支均已清理。
- 强化批次按序 `merge --no-ff` 入 main：**M5-01 (4c349ec) → M-FLOW (a803d5c) → M4-05 (6223a1b)**，每步 typecheck + 全量复验绿；补 `test/ai/tie-breaker.test.ts`（101 绿）；3 个 worktree + 分支已 `worktree remove` + `branch -d`。
- 下一并行批次（M5-02 / M-FLOW-02 / M2-07-D / M4-04 / M5-03）：**种子已落、全部 ready**（5 spec 入 main + `HeadlessRoundError.cause` 契约扩展；失败测试在各自分支，main 101 绿）。按 PROTOCOL bootstrap 提示词（把 `<ID>` 换成上表分支名）派发到各实现方窗口。

## 后续（本批次之后）
- **M3** 手机竖屏 UI（Cocos 编辑器场景/预制体/组件，import cc，非 worktree 纯逻辑模式）；难度接入 flow/UI（玩家选难度 → flow playPolicy）；M5 数据持久化 IO（断局重开消费 M5-02 校验）。
