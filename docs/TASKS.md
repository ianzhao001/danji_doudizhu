# 项目任务清单

## 当前阶段：M2 ✅ + M4 三档基线 ✅ + 强化批次（M4-05 / M-FLOW / M5-01）已并 main ✅ + 下一并行批次（M5-02 / M-FLOW-02 / M2-07-D / M4-04 / M5-03）种子中（多 AI 协作，派发见 coordination/BOARD.md）

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
- [~] flow 出牌循环异常诊断：policy/apply 抛错包成 HeadlessRoundError（保留 cause）。〔M-FLOW-02 ready·下一并行批次可派发〕
- [~] selfplay 诊断消费：runner 用 HeadlessRoundError 字段组富 partial（非空 seed/turns/landlord/lastEvents）。〔M2-07-D ready·下一并行批次可派发〕

## M3 手机竖屏 UI

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
- [~] 用自对弈 harness 验证难度差异与无死循环。〔M4-04 已解锁（M-FLOW + M4-05 已并），ready·下一并行批次可派发〕

## M5 完整单机体验

- [x] 存档版本化（serialize 加 version + 反序列化浅校验，向后兼容往返）。〔M5-01 已并 main；浅校验 7/8 字段，`top` + 深层校验顺延 M5-02〕
- [~] 存档深校验（补 `top` 必需 + 有界深层结构校验，断局重开前置）。〔M5-02 ready·下一并行批次可派发〕
- [~] 本地设置（纯数据层：difficulty/音效/震动/动画开关 + 默认值 + 迁移版本）。〔M5-03 ready·下一并行批次可派发〕
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
