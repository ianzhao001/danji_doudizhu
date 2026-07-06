# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

单机斗地主游戏，基于 **Cocos Creator 3.8.8**（3D 工程类型，TypeScript）。一名真人玩家对战两个 AI，当前发布形态面向**手机横屏**（主基线 844×390）。首版完全单机——无联网、账号、支付、广告或匹配。

## 当前状态——动手写代码前必读

M0-M6、v1.1 横屏化与 v1.2 七波 UI/流程/AI 打磨均已完成；v1.2 发布包已就绪（Creator 3.8.8 `web-mobile`，`launchScene=lobby.scene`，`designResolution=844×390`，`orientation=landscape`）。当前进入 v1.3 技术债清偿版，采用**多 AI 协作 + git worktree**：规划者派发任务，执行者在独立 worktree 实现，审查者按协议评审与合并——见 [coordination/PROTOCOL.md](coordination/PROTOCOL.md)。

- 最新的任务/里程碑与派发状态以 [docs/TASKS.md](docs/TASKS.md) 和 [coordination/BOARD.md](coordination/BOARD.md) 为准，**动手前先看**。
- 仍然：不修改根 `package.json` / `tsconfig.json` / `cocos.config.json`；不手写 `.meta`（交给 Cocos 编辑器）；不手建 `.scene` / `.prefab`（属 M3）。
- 实现型 AI 按 PROTOCOL：只在自己任务的文件域 + worktree 分支内写，不改测试、不碰 `main`，纯逻辑层不 import `cc`。

`docs/` 是设计的唯一事实来源，遇到问题先查这里：

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 分层、模块契约与依赖方向（下方有摘要）
- [docs/RULES.md](docs/RULES.md) — 斗地主规则边界（牌组、牌型、比较、叫抢、计分）
- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) — 范围、核心循环、横屏布局原则
- [docs/ROADMAP.md](docs/ROADMAP.md) — 里程碑 M0→M6 及验收标准
- [docs/TASKS.md](docs/TASKS.md) — 各里程碑任务清单（当前进度）
- [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md) — 规则/流程/AI/UI 验收检查
- [docs/ASSET_LIST.md](docs/ASSET_LIST.md) — 规划中的美术/音频/字体资源

## 目标架构（后续代码必须遵守的契约）

核心设计原则是**纯规则逻辑**与 **Cocos 表现层**的硬隔离。非 Cocos 层（`rules`、`game`、`ai`、`flow`、`data`）**不得** import 或依赖 Cocos 节点、组件、资源或场景，以便脱离引擎做单元测试。依赖方向固定：`rules` 无依赖 → `game` 依赖 `rules` → `ai` 依赖 `rules`+只读快照 → `flow` 依赖 `game`+`ai` 做编排 → `ui` 依赖全部；纯逻辑层不得反向依赖 `ui`。

- **rules** — 围绕牌模型的纯函数：54 张牌组、洗牌/发牌/底牌（可注入、可设种子的 RNG）、牌型识别与比较、叫抢地主规则、计分，以及合法着法/跟牌枚举（`enumerateMoves`/`legalFollows`，供 AI 与 UI 提示复用）。关键类型：`Card`、`CardRank`、`HandPattern`、`Move`、`RuleResult`。
- **game** — 单局状态机：座位、发牌、叫/抢地主、回合流转、当前最大出牌、过牌处理、胜负、结算。每应用一个动作产出新的 `GameSnapshot`（当前态）与 `GameEvent` 序列（发生了什么）。关键类型：`PlayerSeat`、`RoundState`（必须可序列化、作存档）、`GameSnapshot`、`GameEvent`、`RoundAction`、`Settlement`。状态机用 `rules` 校验每个动作并拒绝非法出牌。
- **ai** — 仅依据 `rules` 的着法枚举和只读的 `GameSnapshot` 选择动作；M2 先有基线随机 AI，M4 再分简单/普通/困难三档。关键类型：`AiLevel`、`AiDecision`、`AiContext`、`AiStrategy`。AI 不得修改隐藏状态，也不得输出非法动作。
- **flow** — 薄回合驱动器：编排发牌→叫抢→出牌轮转→结算，并在 AI 座位插入思考时延后再提交动作（AI 异步驱动，不在 `game` 内同步内联）。只做编排，不做规则判断。
- **ui** — 只负责展示、输入与动画，不重新判断复杂规则；消费 `GameEvent` 播动画/音效，“提示”复用 `rules` 的 `legalFollows`。横屏布局：玩家手牌固定底部（最高优先级交互区），三立绘围桌，左/右家按逆时针视觉映射出牌，当前出牌区居中，底牌与倍数在顶部或牌桌上缘；UI/场景任务交用户前必须走执行者自审 + 规划者视觉审的双层视觉预审关。
- **data** — 本地设置、战绩统计、难度配置、存档/断局恢复数据（序列化的 `RoundState`）。

### 数据流

UI 收集输入 → 向 `game` 提交 `RoundAction` → `game` 调用 `rules` 校验 → `game` 更新状态并产出新的 `GameSnapshot` 与 `GameEvent` → UI 用事件播动画、用快照校正显示 → 轮到 AI 时 `flow` 依据快照让 `ai` 生成动作并提交回 `game`。UI 与 AI 都只对快照/事件做反应，绝不直接访问内部可变状态。

## 关键规则要点（完整规范见 docs/RULES.md）

- 一副 54 张牌；点数由小到大：3 4 5 6 7 8 9 10 J Q K A 2 小王 大王；花色不参与比较。
- 3 名玩家各 17 张 + 3 张底牌；地主拿底牌（→ 20 张）。
- 牌型：单、对、三张、三带一、三带二、顺子（≥5 连续单，不含 2 和王）、连对（≥3 对连续，不含 2 和王）、飞机（≥2 连续三张，可带单/对，翼数翼型须匹配）、四带二（非炸弹）、炸弹（四张同点）、火箭（双王）。
- 仅同牌型且张数兼容才能比较；炸弹压非炸弹，大炸弹压小炸弹，火箭最大。
- 倍数从 1 起；叫地主=1、每次抢/反抢翻倍；每个炸弹/火箭翻倍；春天/反春天翻倍；最终倍数为各来源连乘，最终分数 = 底分 × 倍数（保持可配置）。

## 构建 / 运行 / 测试

这是 Cocos Creator 工程。根 `package.json` 不配置 npm 脚本；`tsconfig.json` 继承编辑器生成的 `./temp/cli/tsconfig.cocos.json`，由 Cocos Editor 管理。

- **打开 / 运行 / 构建：** 使用 **Cocos Creator 3.8.8** 编辑器。编辑器会重新生成 `library/`、`temp/`、`build/`、`profiles/`、`local/`（均已 gitignore）——不要手动编辑这些目录。
- **规则测试：** M1 的 Vitest 工程隔离在 `test/` 下，运行 `cd test && npm test`。当前覆盖 `rules` 层的牌组、洗牌发牌、牌型识别、比较、出牌校验、`enumerateMoves` 和 `legalFollows`。测试运行时可能出现 Vite 读取根 `package.json` 中 Cocos `"type": "3d"` 的非阻塞警告。
- **后续测试：** M2 起为 `game` / `ai` 继续沿用 Cocos 无关测试，并加入基线随机 AI 和自对弈 harness；`ui` 走人工验收加关键分辨率截图。
- 场景/预制体/`.meta` 文件交给 Cocos 编辑器创建和维护，避免手写 Cocos 元数据。
