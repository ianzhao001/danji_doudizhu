# 后续架构设计

## 本期边界

本期只落盘架构说明，不创建代码文件，不创建脚本目录，不修改 Cocos 项目配置。下文的目录结构、接口与模块仅为后续实现的约定，本期不落地。

## 分层原则

后续代码实现按“纯规则逻辑”和“Cocos 表现层”分离：

- 规则层不依赖 Cocos 节点、组件、资源或场景。
- 状态机只处理游戏流程和动作合法性。
- AI 只通过规则层和状态快照做决策。
- UI 只负责展示、输入和动画，不直接判断复杂规则。
- 本地数据层统一处理设置、战绩和存档。

## 模块依赖方向

为避免循环依赖，允许的依赖方向固定如下：

- `rules`：不依赖任何其他模块（纯函数，零副作用）。
- `game`：依赖 `rules`。
- `ai`：依赖 `rules` 与只读的 `GameSnapshot`，不触碰 `game` 的内部可变状态。
- `flow`：依赖 `game` 与 `ai`，只做编排，不重复规则判断。
- `data`：只依赖可序列化的 DTO（存档、设置、战绩），不反向依赖表现层。
- `ui`：可依赖以上所有层。
- 任何纯逻辑层（`rules`/`game`/`ai`/`data`）都不得依赖 `ui`，也不得 import `cc`。

## 建议模块

### rules

负责：

- 牌模型。
- 牌型识别。
- 牌型比较。
- 洗牌发牌（使用可注入、可设种子的随机源，便于测试复现）。
- 合法着法与跟牌枚举（同时供 AI 决策和 UI“提示”复用）。
- 叫抢地主规则。
- 计分规则。

关键接口：

- `Card`
- `CardRank`
- `HandPattern`
- `Move`
- `RuleResult`
- `enumerateMoves`（枚举手牌可出的合法着法）
- `legalFollows`（针对当前牌权枚举可压制的跟牌）

### game

负责：

- 玩家座位。
- 对局状态。
- 回合流转。
- 动作提交与校验（调用 `rules`）。
- 胜负判断。
- 结算。
- 产出状态快照与事件流。

关键接口：

- `PlayerSeat`
- `RoundState`（必须可序列化，作为断局重开的存档载体）
- `GameSnapshot`（某一时刻的只读状态视图）
- `GameEvent`（发牌、定地主、抢/反抢、出牌、过牌、炸弹、火箭、春天、结算等“发生了什么”的事件）
- `RoundAction`
- `Settlement`

`game` 每应用一个 `RoundAction`，除更新内部状态外，同时产出新的 `GameSnapshot` 与一段 `GameEvent` 序列：快照表达“当前是什么”，事件表达“刚刚发生了什么”，供表现层驱动动画与音效。

### ai

负责：

- 根据难度选择动作。
- 基于 `rules` 的着法枚举从候选中做选择（不自行重写规则）。
- 决定叫地主、抢地主、过牌或出牌。

关键接口：

- `AiLevel`
- `AiDecision`
- `AiContext`（含只读 `GameSnapshot` 与难度，无副作用、不持久化）
- `AiStrategy`

### flow

负责：

- 编排单局节奏：发牌 → 叫抢地主 → 出牌轮转 → 结算。
- 在 AI 座位处插入“思考时延”后再向 `game` 提交动作（AI 为异步驱动，不在 `game` 内部同步内联）。
- 把玩家输入与 AI 决策统一汇入 `game`。

`flow` 是连接 `game`、`ai` 与 `ui` 的薄驱动层，只做编排与节奏控制，不做规则判断。可由 UI 持有，也可独立运行，以便 headless 自对弈复用同一套编排。

### ui

负责：

- 大厅。
- 游戏桌面。
- 手牌交互。
- 出牌反馈（消费 `GameEvent` 播放动画与音效）。
- 结算弹窗。
- 设置面板。
- “提示”按钮复用 `rules` 的 `legalFollows`，不另写规则。

### data

负责：

- 本地设置。
- 战绩统计。
- 难度配置。
- 对局恢复数据（序列化的 `RoundState` 存档）。

## 数据流

推荐流程：

1. UI 收集玩家输入，或 `flow` 从 `ai` 取得 AI 决策（AI 座位先经过思考时延）。
2. 动作以 `RoundAction` 提交给 `game` 状态机。
3. `game` 调用 `rules` 校验动作合法性。
4. `game` 更新状态，产出新的 `GameSnapshot` 与 `GameEvent` 序列。
5. UI 用 `GameEvent` 播放动画/音效，用 `GameSnapshot` 校正最终显示。
6. 轮到 AI 座位时，`flow` 依据 `GameSnapshot` 让 `ai` 生成动作并提交回 `game`。

UI 与 AI 都只对快照与事件做反应，绝不直接访问内部可变状态。

## 确定性与序列化

- 洗牌发牌的随机源可注入、可设种子：相同种子复现同一局，便于单测与问题复盘。
- `RoundState`（及其派生的 `GameSnapshot`）必须可序列化为纯数据，作为 `data` 层断局重开的存档载体。该约束在 M2 设计状态机时即满足，不留到 M5 返工。

## 建议目录结构（后续实现期落地，本期不创建）

- `assets/scripts/rules/`、`assets/scripts/game/`、`assets/scripts/ai/`、`assets/scripts/flow/`、`assets/scripts/ui/`、`assets/scripts/data/`：纯逻辑层与表现层物理分离。
- 测试与自对弈 harness 置于仓库根 `test/` 或各模块 `__tests__/`，由独立测试运行器收集，不进入 Cocos 构建。

## 测试策略

- `rules`、`game`、`ai` 不 import `cc`，因此用独立于 Cocos 的测试运行器（推荐 Vitest）在编辑器之外直接跑纯逻辑单测与自对弈；需要独立的 tsconfig/入口，不污染 Cocos 工程。
- `rules` 和 `game` 优先做纯逻辑测试。
- AI 做合法性和稳定性测试，并以自对弈 harness 跑 N 局 AI vs AI，断言无非法状态、无死循环、无无限等待。
- UI 做人工验收和关键尺寸截图检查。
- Cocos 资源文件尽量由 Editor 创建和维护，避免手写元数据。
