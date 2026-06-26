# 项目任务清单

## 当前阶段：M2 ✅ + M4 三档+强化+legality 护栏 ✅ + 第三批（8 任务）已并 main ✅ + 第四批（15 任务）种子 ready（多 AI 协作，派发见 coordination/BOARD.md）

> M2 起按用户决定启用 git + 多 AI worktree 协作；协议见 coordination/PROTOCOL.md。

状态说明：

- `[ ]` 未开始
- `[~]` 进行中
- `[x]` 完成

## M0 任务

- [x] 确认项目为 Cocos Creator 3.8.8 骨架。
- [x] 确认 M0 原计划不写玩法代码，后续按用户确认进入 M1。
- [x] 确认本期不初始化 Git。
- [x] 评审并对齐架构、规则、路线图与任务（框架修订）。
- [x] 用户确认 M0 例外导入采纳图片资源到 `assets/resources/art/`，不写代码、不手写 `.meta`。
- [x] 生成牌面、音效 WAV、字体授权资源预览包到 `asset-previews/pink-cartoon-production-v1/`，不导入 `assets/`。
- [x] 用户采纳 `pink-cartoon-production-v1` 作为当前牌面、音效和字体素材基准。
- [x] 人工检查本地项目与规划文档。
- [x] 确认进入 M1 代码实现阶段。

## M1 核心规则闭环

- [x] 定义牌、点数、牌组数据结构。
- [x] 实现洗牌、发牌、底牌（可注入、可设种子的随机源）。
- [x] 实现牌型识别。
- [x] 实现牌型比较。
- [x] 实现合法着法与跟牌枚举（`enumerateMoves` / `legalFollows`）。
- [x] 实现非法出牌错误结果。
- [x] 搭建 Vitest 测试运行器（独立于 Cocos）。
- [x] 补充规则测试。

## M2 单局状态机

- [x] 设计对局状态枚举（`RoundState` 可序列化）。〔M2-01〕
- [x] 实现经典叫地主 / 抢地主（抢翻倍）流程。〔M2-02；已由 M2-08 纯数据化〕
- [x] 实现回合流转。〔M2-01〕
- [x] 实现过牌和当前最大出牌。〔M2-01〕
- [x] 实现胜负判断。〔M2-01〕
- [x] 实现结算（叫抢 × 炸弹/火箭 × 春天 连乘倍数）。〔M2-03，测试已加固〕
- [x] 实现 `GameEvent` 事件流。〔M2-01〕
- [x] 实现基线随机合法 AI（出牌阶段）。〔M2-05〕
- [x] 实现存档序列化与往返一致。〔M2-04〕
- [x] 实现 `flow` 回合驱动器雏形（含可注入时钟思考时延）。〔M2-06 已并 main〕
- [x] 叫抢状态纯数据化（去 WeakMap，可序列化）。〔M2-08 已并 main〕
- [x] 基线叫抢决策 `chooseBid`。〔M2-09 已并 main〕
- [x] 战绩统计累计（纯函数）。〔M2-10 已并 main〕
- [x] 实现自对弈 harness（N 局 AI vs AI）。〔M2-07 已并 main 6ac5832：runSeeds 复用 runHeadlessRound，零和/终止/可复现〕
- [x] flow 增强：HeadlessRoundError 诊断 + playPolicy 注入（为 M2-07-D 诊断与 M4-04 难度差异铺路）。〔M-FLOW 已并 main〕
- [x] flow 出牌循环异常诊断：policy/apply 抛错包成 HeadlessRoundError（保留 cause）。〔M-FLOW-02 已并 main 7fd395e〕
- [x] selfplay 诊断消费：runner 用 HeadlessRoundError 字段组富 partial（非空 seed/turns/landlord/lastEvents）。〔M2-07-D 已并 main b2df6d8〕
- [x] 难度策略工厂（levelPolicies→{bidPolicy,playPolicy} 按座位注入 flow）。〔M-FLOW-03 已并 main a10b8db；bidPolicy 仍委派 chooseBid，切 chooseBidByLevel 顺延 M-FLOW-04〕
- [~] 叫抢策略切到难度分层（bidPolicy → chooseBidByLevel）。〔M-FLOW-04 ready·第四批可派发〕
- [~] 回放/调试 trace（事件流→可复盘 trace + 摘要）。〔M2-11 ready·第四批可派发〕

## M3 手机竖屏 UI

> M3-00 纯逻辑岛先行（worktree 模式，禁 cc）：hand-layout / selection 已 ready，见 BOARD.md 第三批；后续 view-model 等同模式。场景/预制体属编辑器（非 worktree）。

- [x] 手牌布局算法（390×844 居中/步距/压缩，纯函数）。〔M3-00-hand-layout 已并 main 32b78bc〕
- [x] 手牌选中模型（选中/取消/排序，纯不可变）。〔M3-00-selection 已并 main f5d9252〕
- [~] 牌面视图模型（Card→assetKey/rankLabel/suitKey/sortKey）。〔M3-00-card-view ready·第四批〕
- [~] 桌面布局坐标模型（390×844 各区）。〔M3-00-table-layout ready·第四批〕
- [~] 操作按钮状态模型（出牌/过牌/提示 enabled）。〔M3-00-action-buttons ready·第四批〕
- [~] 手牌交互桥（layout+selection 组合，选中上浮）。〔M3-00-selection-layout-bridge ready·第四批〕
- [~] 叫抢视图模型（按钮文案/可用/座提示）。〔M3-00-bidding-view ready·第四批〕
- [~] 结算弹窗视图模型（Settlement→VM）。〔M3-00-result-view ready·第四批〕
- [~] 事件提示映射（GameEvent/FlowEvent→cue id）。〔M3-00-event-cues ready·第四批〕
- [ ] 创建大厅场景。
- [ ] 创建游戏主场景。
- [ ] 创建手牌交互。
- [ ] 创建操作按钮。
- [ ] 提示按钮复用 `rules` 着法枚举。
- [ ] 接入 `GameEvent` 驱动动画与音效。
- [ ] 创建结算弹窗。
- [ ] 完成 390x844 竖屏适配检查。

## M4 多难度 AI（三档基线已入 main；强化批次进行中）

- [x] 实现简单 AI（最小化·确定性）。〔M4-01 已并 main 2aafc7f〕
- [x] 实现普通 AI（保炸弹 + 基础拆牌）。〔M4-02 已并 main 7ec2148〕
- [x] 实现困难 AI（积极控权 + 择时炸弹）。〔M4-03 已并 main 0849a1e〕
- [x] 三档难度复用 `rules` 着法枚举做分级。〔接口 `ai/strategy.ts` 已入 main〕
- [x] 验证 AI 动作合法性。〔三档失败测试覆盖，已绿〕
- [x] AI 强化：`_shared` 收敛 + 全序 tie-breaker + hard 跟牌大牌压制。〔M4-05 已并 main；tie-breaker 回归测试已补〕
- [x] 叫抢难度分层（按 AiLevel 给叫抢策略分层；Normal 委派 chooseBid）。〔M4-07 已并 main 5fe97b6〕
- [x] 用自对弈 harness 验证难度差异与无死循环。〔M4-04 已并 main 815df75：routing playPolicy 按 seat 分发 + 不变量回归〕
- [x] 难度 routing 按座位分发证明（buildRoutingPolicy 逐座位深相等）。〔M4-04B 已并 main b775254〕
- [~] AI 合法性不变量审计（三档横切护栏）。〔M4-08 ready·第四批（绿护栏，锁回归）〕

## M5 完整单机体验

- [x] 存档版本化（serialize 加 version + 反序列化浅校验，向后兼容往返）。〔M5-01 已并 main；浅校验 7/8 字段，`top` + 深层校验顺延 M5-02〕
- [x] 存档深校验（补 `top` 必需 + 有界深层结构校验，断局重开前置）。〔M5-02 已并 main 44b86b8；`top.pattern` 完整形（length/cards）顺延 M5-02B〕
- [x] 存档 top.pattern 完整形校验（length/cards/牌结构/一致性）。〔M5-02B 已并 main a934a70；语义校验（recognize 比对）顺延 M5-02C〕
- [~] 存档 top.pattern 语义校验（recognize(cards) 与声明 pattern 一致）。〔M5-02C ready·第四批〕
- [x] 本地设置（纯数据层：difficulty/音效/震动/动画开关 + 默认值 + 迁移版本）。〔M5-03 已并 main ed456c0〕
- [x] 本地设置编解码（serialize/deserialize + 复用 migrateSettings，为 localStorage 前置）。〔M5-05 已并 main 5aaae99〕
- [x] 断局存档槽位纯模型（{version,savedAt,round} + 编解码，无 IO）。〔M5-04 已并 main 9b73391〕
- [~] 设置存储适配器（注入 StorageLike，load/save/remove，无浏览器依赖）。〔M5-06 ready·第四批〕
- [~] 断局槽位存储适配器（损坏抛错，区别设置）。〔M5-07 ready·第四批〕
- [~] 战绩统计编解码（JSON + 容错迁移）。〔M5-08 ready·第四批〕
- [~] 对局历史记录纯模型（追加/裁剪/倒序/迁移）。〔M5-09 ready·第四批〕
- [ ] 战绩统计。
- [ ] 断局重开（复用序列化存档）。
- [ ] 音效开关。
- [ ] 基础动画。

## M6 发布前打磨

- [ ] 移动端适配回归。
- [ ] 性能检查。
- [ ] 异常流程检查。
- [ ] 构建验证。
- [ ] 发布验收记录。
