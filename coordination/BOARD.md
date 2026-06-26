# 任务板（BOARD）

架构维护的任务真相源。状态：`todo`(待出 spec) · `ready`(spec+测试就绪可认领) · `claimed:<标识>` · `in-review` · `changes-requested` · `done`。

## 当前里程碑：M2 ✅ · M4 三档+强化 ✅ · 第二批（M5-02/M-FLOW-02/M2-07-D/M4-04/M5-03）已并 main ✅ · 第三批（8 任务）全部 ready · 可派发

main 现状：**28 测试文件 / 121 用例全绿**（rules + game + ai 三档 + 强化 + flow + selfplay + data）。第二批 5 任务按序 `merge --no-ff` 入 main（M5-03→M5-02→M-FLOW-02→M2-07-D→M4-04，101→121 绿）；评审遗留 `.meta` 已补提（`_shared.ts.meta` + `settings.ts.meta`）。第三批 **8 个文件域互不相交**纯逻辑任务**已种、全部 ready**（见「下一并行批次」）。

## M2 单局状态机（全部 done）

| ID | 模块 / 文件域 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M2-01 | game-core：`game/{types,core,index}.ts` | **done** | 已并 main | 契约 `game/types.ts` 固定 |
| M2-02 | bidding：`game/bidding.ts` | **done** | 已并 main | 叫/抢/反抢翻倍；M2-08 纯化 |
| M2-03 | settlement：`game/settlement.ts` | **done** | 已并 main | 倍数连乘 + 春天 + 胜负 |
| M2-04 | serialization：`game/serialize.ts` | **done** | 已并 main | RoundState ↔ JSON 往返（M5-01/M5-02 已加版本化+深校验）|
| M2-05 | ai-baseline：`ai/baseline.ts` | **done** | 已并 main | 随机合法 AI |
| M2-06 | flow：`flow/**` | **done** | afcd864 | headless 驱动器 + 可注入时钟 |
| M2-07 | selfplay：`test/selfplay/**` | **done** | 6ac5832 | runSeeds 复用 runHeadlessRound，零和/终止/可复现 |
| M2-08 | bidding-pure：`game/bidding.ts` | **done** | d9f861a | BiddingState 纯数据化、可序列化 |
| M2-09 | ai-bid-policy：`ai/bidding.ts` | **done** | e20046b | 基线叫抢 chooseBid |
| M2-10 | data-stats：`data/{stats,index}.ts` | **done** | eeb7750 | 战绩累计（纯函数）|
| M-FLOW | flow 增强：`flow/{driver,types}.ts` | **done** | merged | playPolicy 注入 + HeadlessRoundError 诊断 |
| M-FLOW-02 | flow 出牌循环异常诊断：`flow/driver.ts` | **done** | 7fd395e | policy/apply 抛错包成 HeadlessRoundError（保留 cause）|
| M2-07-D | selfplay 诊断消费：`test/selfplay/runner.ts` | **done** | b2df6d8 | runner 消费 HeadlessRoundError 组富 partial |

## M4 难度 AI（三档基线 + 强化 + selfplay done）

接口契约 `ai/strategy.ts`（`AiLevel`/`AiStrategy`/`strategyFor`/`chooseActionByLevel`）已入 main。

| ID | 模块 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M4-01 | ai-simple：`ai/levels/simple.ts` | **done** | 2aafc7f | 最小化·确定性 |
| M4-02 | ai-normal：`ai/levels/normal.ts` | **done** | 7ec2148 | 保炸弹决策树 |
| M4-03 | ai-hard：`ai/levels/hard.ts` | **done** | 0849a1e | pressing 出最小炸弹，否则自包含保守 |
| M4-05 | ai 强化：`ai/levels/**`(+`_shared.ts`) | **done** | merged | _shared 收敛 + 全序 compareMoves + hard 大牌压制 |
| M4-04 | 难度差异 selfplay：`test/selfplay/difficulty.ts` | **done** | 815df75 | routing playPolicy 按 seat 分发 + 不变量回归 |

## M5 完整单机体验（数据层推进中）

| ID | 模块 / 文件域 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M5-01 | 存档版本化：`game/serialize.ts` | **done** | merged | {version,state} 包装 + 反序列化浅校验 |
| M5-02 | 存档深校验：`game/serialize.ts` | **done** | 44b86b8 | top 必需 + 有界深层结构 + 枚举/牌/计数守卫；**`top.pattern` 完整形顺延 M5-02B** |
| M5-03 | 本地设置纯数据：`data/settings.ts` | **done** | ed456c0 | Settings/defaultSettings/migrateSettings 容错迁移 |

## 下一并行批次（8 任务 · 文件域互不相交 · 全部 ready · 可认领）

> 种子已落：每任务 spec 入 main、失败测试+桩在各自分支（8 分支独立 typecheck 绿、种子测试红-for-right-reason）。文件域两两不相交，可同时认领。**规划者只出框架（spec/契约/失败测试/桩/分支），实现方填实现主体。** spec 见 `coordination/tasks/<ID>.md`。

| ID | 实现文件域 | 依赖 | 分支 | 备注 |
|----|----|----|----|----|
| M5-02B | `game/serialize.ts` | M5-02 | `task/M5-02B-serialize-pattern` | 补 `top.pattern.length/cards` + 牌结构 + length 一致性（评审意见 #2）|
| M4-04B | `test/selfplay/difficulty.ts`（加 `buildRoutingPolicy`）| M4-04 | `task/M4-04B-difficulty-routing` | 逐座位证明 routing 真按 seat 分发（评审意见 #1）|
| M5-04 | `data/save.ts`（新；桶已加 save 导出）| M5-02 | `task/M5-04-save-slot` | 存档槽 `{version,savedAt,round}` 纯模型 + 编解码，无 IO |
| M5-05 | `data/settingsCodec.ts`（新；桶已加 settingsCodec 导出）| M5-03 | `task/M5-05-settings-codec` | 设置字符串编解码 + 复用 migrateSettings；补非法布尔/旧 version 回归（评审意见 #4）|
| M4-07 | `ai/bidding-levels.ts`（新；桶已加 bidding-levels 导出）| M2-09 | `task/M4-07-bid-levels` | 叫抢按 AiLevel 分层（Simple<Normal<Hard）；Normal 委派 chooseBid |
| M-FLOW-03 | `flow/policies.ts`（新；桶已加 policies 导出）| M-FLOW + M4 三档 | `task/M-FLOW-03-level-policies` | `levelPolicies(levels)→{bidPolicy,playPolicy}` 按座位注入 flow |
| M3-00-a | `ui/hand-layout.ts`（新；ui 纯逻辑岛，禁 cc）| — | `task/M3-00-hand-layout` | 390×844 手牌位置/重叠算法（居中/步距/压缩）|
| M3-00-b | `ui/selection.ts`（新；ui 纯逻辑岛，禁 cc）| — | `task/M3-00-selection` | 手牌选中/取消/排序纯不可变模型 |

> 互斥实现域：`game/serialize.ts` ｜ `test/selfplay/difficulty.ts` ｜ `data/save.ts` ｜ `data/settingsCodec.ts` ｜ `ai/bidding-levels.ts` ｜ `flow/policies.ts` ｜ `ui/hand-layout.ts` ｜ `ui/selection.ts`。桶导出由架构在各分支内随种子提交（M5-04/M5-05 共用 `data/index.ts` 但加不同行 → 合并时一行接一行，无冲突）。

## 评审遗留处理（本批）
- **#1 难度 routing 未证** → 开 **M4-04B**（逐座位证明分发）。
- **#2 top.pattern 偏浅** → 开 **M5-02B**（完整 HandPattern 形状校验）。
- **#3 landlord:null 诊断** → 暂挂：当前 HeadlessRoundError 仅出牌阶段触发，`landlord` 必非空；若未来叫抢阶段迁移为 HeadlessRoundError，再独立 selfplay failure DTO 允许 `landlord:null`（已记入后续）。
- **#4 设置非法值覆盖** → fold 进 **M5-05**（`settings-codec.test.ts` 锁非法布尔/旧 version）。
- **#5 未跟踪 .meta** → 已决：编辑器生成的脚本 `.meta` 与既有 27 个一致，**入库**。已补提 `_shared.ts.meta`(60f9fa3) + `settings.ts.meta`(580bdeb)；后续合并新脚本时由架构补提对应 `.meta`。

## 派发记录
- M2-01..10、M4-01/02/03、强化批次：**done**，已并 main；worktree/分支均已清理。
- 第二批按序 `merge --no-ff` 入 main：**M5-03 (a6a4a90) → M5-02 (fabf02b) → M-FLOW-02 (0867548) → M2-07-D (25e7bdc) → M4-04 (0d5f658)**，每步 typecheck + 全量复验绿（101→121）；5 worktree + 分支已清理；评审 `.meta` 已补提。
- 第三批（8 任务）：**种子已落、全部 ready**（8 spec 入 main `0dfc3e9`；各分支含失败测试+桩+桶导出，独立 typecheck 绿、种子测试红）。按 PROTOCOL bootstrap 提示词（把 `<ID>` 换成上表分支名）派发到各实现方窗口。

## 后续（本批次之后）
- **M3** 手机竖屏 UI（Cocos 编辑器场景/预制体/组件，import cc，非 worktree 纯逻辑模式）：M3-00 hand-layout/selection 是 UI 纯逻辑岛先行；后续 view-model/replay/debug trace 等纯函数继续 worktree 模式；场景/预制体属编辑器。
- 难度接入 flow/UI（M-FLOW-03 产出 `levelPolicies` → UI 选难度 → flow 注入；M4-07 落地后 bidPolicy 切 `chooseBidByLevel`）。
- M5 数据持久化 IO（断局重开消费 M5-02/M5-02B 校验 + M5-04 槽位 + M5-05 codec → localStorage）。
