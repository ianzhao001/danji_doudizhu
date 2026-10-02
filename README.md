# 单机斗地主

[English](README.en.md)

这是一个基于 Cocos Creator 3.8.8 开发的离线单机斗地主项目。玩家固定控制一个座位，另外两个座位由电脑 AI 控制；游戏遵循经典三人斗地主规则，支持完整单局流程、三档难度、本地设置、战绩记录与断局恢复。

当前发布版本为 v1.9-R4（新增本地对局记录与导出，并继续修正困难 AI 的协作、控牌和搜索行为，见 [发布说明](docs/RELEASE_NOTES.md)），目标是让普通玩家无需了解代码，也能下载源码并在 Cocos Creator 中运行游戏。

本分支另包含尚未发布的 AI 模拟、评测与残局搜索升级。最新候选在独立 2400 局固定叫牌镜像测试中，相对上一候选的胜率差为 +2.67 个百分点（95% 区间 +1.5 到 +4.0），各位置结果与限制见 [当前升级候选](docs/TASKS.md#ai-强度升级候选2026-10-02未发布)。Cocos 冷构建与提示点击采证尚待完成，不将下述历史发布验证视为本分支验收结果。

## 项目概览

| 项目 | 当前配置 |
| --- | --- |
| 游戏类型 | 离线单机、经典三人斗地主 |
| 引擎 | Cocos Creator 3.8.8 |
| 开发语言 | TypeScript |
| 屏幕方向 | 手机横屏 |
| 设计分辨率 | `844×390` |
| 启动场景 | `assets/scene/lobby.scene` |
| 构建目标 | `web-mobile` |
| AI 难度 | 简单、普通、困难 |
| v1.9-R4 历史发布验证 | 215 个测试文件、1301 个用例通过、3 个环境或空目录门控用例跳过，产线 typecheck 通过 |

## v1.9-R4 本期更新

- 自动在本机保存最近 30 局详细对局记录，包含初始手牌、出牌事件、结算和困难 AI 决策诊断；大厅可导出全部记录，结算页可导出当前一局，数据仍不上传服务器。
- 修正 PIMC 模拟过牌后的牌权起点、农民队友顶牌时的地主告急救场，以及困难档对 2 和王等绝对控牌的保护，减少边界局面的误判。
- 同一分析帧和多个候选之间复用明牌求解置换表，降低重复搜索；最终性能基线中决策 p95 约 29ms，提示延迟继续满足 400ms 门限。
- 新增回放坏例分析、坏例回归入口和有边界的 SPSA 调参工具。调参工具只生成候选，不自动改写正式参数；本期没有采纳缺乏统计增益的候选。

## 设计思路

项目围绕“规则可靠、流程可复现、表现层可替换、普通用户可运行”四个目标设计。

1. 游戏规则与画面分离。牌型判断、回合状态、AI、存档等核心逻辑不依赖 Cocos，界面只负责展示、输入、动画和音效。
2. 所有动作都经过同一套规则校验。玩家、AI 和提示功能共享合法着法枚举，避免不同入口出现不同规则。
3. 状态与事件分离。状态快照描述“现在是什么”，事件流描述“刚刚发生了什么”，UI 根据事件播放动画，再用快照校正最终画面。
4. 随机过程可复现。洗牌和自对弈支持固定随机种子，便于稳定测试和问题复盘。
5. 数据只保存在本机。设置、战绩和未完成对局不上传服务器，符合离线单机定位。
6. 横屏优先。手牌位于底部，两名 AI 位于左右上方，当前出牌区和操作区集中在牌桌中央，适配常见手机横屏尺寸。

## 游戏功能

### 核心玩法

- 一名真人玩家对战两名电脑玩家。
- 使用 54 张标准牌，三名玩家各 17 张，保留 3 张底牌。
- 支持叫地主、抢地主、无人叫地主重新发牌和地主获得底牌。
- 支持单牌、对子、三张、三带一、三带二、顺子、连对、飞机、四带二、炸弹和火箭等常见完整牌型。
- 支持出牌、不要、连续过牌后牌权回归、胜负判断和自动结算。
- 支持叫抢倍数、炸弹、火箭、春天与反春天结算。

### AI 与提示

- 简单：会打组合、懂基础配合，并带不拆炸弹、能清手必清手等防送分守卫。
- 普通：结构化拆牌（精确最少手数分解驱动的领出与跟牌）、护牌型、会喂队友。
- 困难：在普通档之上叠加毫手量纲评分、记牌、确定化蒙特卡洛猜牌（PIMC）、过牌推断、明牌世界精确解与残局必胜精确解，主动控牌权、算时机。
- AI 只读取允许公开的状态快照，不读取对手隐藏手牌；全部决策确定可复现（同一局面恒给同一决策）。
- 提示与困难档共用同一引擎（更高采样预算）：首按给最优推荐，连按在去重后的候选榜单中轮换；建议过牌和手动改选也有明确反馈。
- AI 设计思路、外部参考与采用边界详见 [docs/AI_DESIGN.md](docs/AI_DESIGN.md)。

### 单机体验

- 大厅开始游戏与难度切换。
- 手牌点击、滑动选择、取消选择和非法出牌防护。
- 暂停、继续、重新开始和返回大厅。
- 本地保存音效、震动、动画和难度设置。
- 本地战绩、对局历史、详细对局记录和 JSON 导出。
- 未完成对局保存与恢复。
- 发牌、出牌、炸弹、火箭、转场和结算动画。
- 操作、出牌、叫抢、胜负等音效与震动反馈。
- 多种横屏尺寸适配以及文字溢出、对比度和图片比例保护。

v1.6 为了保持大厅简洁，隐藏了战绩、历史、教程和帮助等次要入口；对应底层模块仍然保留，可供后续版本恢复或扩展。

## 第三方使用、算法参考与致谢

AI 在「无外部 API、不跑本地模型」约束下使用 TypeScript 实现。精确拆解、PIMC、残局搜索、明牌世界求解与毫手量纲评分均由本项目实现。v1.9-R4 未增加外部运行时依赖；以下仅列出实际随项目分发或确实援引的开源项目与论文，并区分直接使用和思想参考。

| 类型 | 项目 | 许可证或性质 | 本项目中的实际边界 |
| --- | --- | --- | --- |
| 随项目分发 | Source Han Sans CN | [SIL Open Font License 1.1](assets/resources/fonts/LICENSE-SourceHanSans.txt) | 仓库包含 Regular 与 Heavy 字体文件，用于游戏中文字显示 |
| 算法与评估参考 | [kwai/DouZero](https://github.com/kwai/DouZero) | Apache-2.0 | 参考固定发牌、角色评估与 14 类牌型枚举口径；镜像配对与聚类置信区间为本项目实现，未使用其强化学习模型或源代码 |
| 算法思想参考 | [ZhouWeikuan/DouDiZhu](https://github.com/ZhouWeikuan/DouDiZhu) | Apache-2.0 | 参考权重拆牌和剩余手牌权重排序思想；本项目在自己的精确拆解引擎上独立实现 |
| 基线调研参考 | [datamllab/rlcard](https://github.com/datamllab/rlcard) | MIT | 仅作为朴素规则 Agent 的基线参照；不是产品运行时依赖 |
| 论文参考 | [DeltaDou](https://www.ijcai.org/proceedings/2019/0176.pdf) | IJCAI 2019 论文 | 参考对手建模中的过牌推断思想；加权采样与有效样本护栏由本项目实现 |

测试工程另使用 TypeScript、Vitest 与 Node.js 类型定义作为开发依赖，它们不会进入 Cocos 游戏构建。完整设计与来源说明见 [docs/AI_DESIGN.md](docs/AI_DESIGN.md)，版本变化见 [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md)。

## 功能模块

| 模块 | 目录 | 职责 |
| --- | --- | --- |
| `rules` | `assets/scripts/rules/` | 牌模型、洗牌发牌、牌型识别、大小比较、合法着法、跟牌和计分规则 |
| `game` | `assets/scripts/game/` | 叫抢、回合状态机、动作校验、胜负结算、序列化、回放和恢复 |
| `ai` | `assets/scripts/ai/` | 三档出牌策略、叫抢判断、提示排序、手牌强度、记牌和残局策略 |
| `flow` | `assets/scripts/flow/` | 发牌到结算的流程编排、AI 思考延时、暂停门控、持久化和事件重放 |
| `data` | `assets/scripts/data/` | 设置、难度、战绩、统计、对局存档、查询和数据迁移 |
| `ui` | `assets/scripts/ui/` | 与 Cocos 无关的视图模型、布局、按钮状态、提示、计时器和文案 |
| `ui/components` | `assets/scripts/ui/components/` | 大厅与牌桌 Cocos 组件、节点创建、输入、动画、音效和场景切换 |
| `runtime` | `assets/scripts/runtime/` | Cocos 本地存储与纯数据层之间的适配 |
| `scene` | `assets/scene/` | 大厅和游戏主场景 |
| `resources` | `assets/resources/` | 卡牌、角色、界面、特效、字体和音频资源 |
| `test` | `test/` | 规则、状态机、AI、数据、UI 逻辑、集成和自对弈测试 |

模块依赖方向固定为：`rules → game → ai/flow → data/ui → Cocos components`。`rules`、`game`、`ai`、`flow` 和 `data` 等纯逻辑层不得导入 `cc`，也不得反向依赖界面实现。

## 数据流

一次玩家或 AI 行动按以下顺序执行：

1. 玩家在界面选择操作，或 `flow` 请求 AI 生成决策。
2. 动作以 `RoundAction` 提交给 `game` 状态机。
3. `game` 调用 `rules` 校验牌型、牌权和动作合法性。
4. 状态机更新 `GameSnapshot`，同时产生一组 `GameEvent`。
5. UI 使用事件播放动画和音效，并使用最新快照渲染稳定画面。
6. `data` 层在合适时机保存设置、战绩或可恢复对局。

## 不懂研发也能运行

### 需要准备

- Windows 或 macOS 电脑。
- 可正常访问 GitHub 和 Cocos 下载服务的网络。
- Cocos Dashboard 和 Cocos Creator 3.8.8。

Cocos 官方安装说明：[安装 Cocos Dashboard](https://docs.cocos.com/creator/3.8/manual/zh/getting-started/install/)。请安装准确的 3.8.8 版本，不要直接使用其他大版本打开并升级项目。

### 方法一：直接下载源码

1. 打开项目主页：<https://github.com/ianzhao001/danji_doudizhu>。
2. 点击 `Code`，再点击 `Download ZIP`。
3. 下载完成后解压 ZIP。不要直接在压缩包内运行。
4. 打开 Cocos Dashboard，在“安装”页面安装 Cocos Creator 3.8.8。
5. 进入 Dashboard 的“项目”页面，点击“导入项目”，选择解压后的项目根目录。正确目录中可以看到 `assets`、`package.json` 和 `cocos.config.json`。
6. 使用 Creator 3.8.8 打开项目，首次打开时等待资源导入和脚本编译完成。
7. 在编辑器的资源管理器中双击 `assets/scene/lobby.scene`。
8. 点击编辑器顶部的预览按钮，在浏览器中启动游戏。

看到大厅后，选择难度并点击开始游戏即可。整个运行过程不需要编辑代码，也不需要安装测试依赖。

### 方法二：使用 Git 克隆

已安装 Git 的用户可以执行：

```bash
git clone git@github.com:ianzhao001/danji_doudizhu.git
cd danji_doudizhu
```

如果没有配置 GitHub SSH 密钥，可以改用：

```bash
git clone https://github.com/ianzhao001/danji_doudizhu.git
cd danji_doudizhu
```

随后按照方法一的第 4 至第 8 步导入并运行。

## 构建网页版本

当前正式验证的发布目标是手机横屏网页版本。

1. 使用 Cocos Creator 3.8.8 打开项目。
2. 确认 `assets/scene/lobby.scene` 已保存。
3. 选择顶部菜单“项目 → 构建”，或使用 `Ctrl/Cmd + Shift + B`。
4. 平台选择 `Web Mobile`。
5. 确认启动场景包含 `lobby.scene`，方向为横屏，构建目录为项目下的 `build`。
6. 点击“构建”，等待构建任务显示成功。
7. 在构建任务页面点击运行或预览按钮。

构建结果默认位于 `build/web-mobile/`。`build/` 是本地生成目录，不提交到 Git。构建面板的详细说明见 [Cocos Creator 官方文档](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/build-panel.html)。

Android、iOS、微信小游戏和其他原生平台不是当前发布基线，需要各自的 SDK、签名和平台适配，不能视为已经验证完成。

## 开发者验证

普通玩家不需要执行本节。开发者需要 Node.js 和 npm，然后运行：

```bash
npm --prefix test ci
npm --prefix test test
npm --prefix test run typecheck
git diff --check
```

测试工程位于 `test/`，不会进入 Cocos 构建。v1.9-R4 历史发布验证为 215 个测试文件、1301 个用例通过，另有 3 个环境或空目录门控用例跳过；本分支候选结果见 [TASKS](docs/TASKS.md)。产线源码由 `tsconfig-scan.json` 的 strict TypeScript 门持续检查。

## 常见问题

### Dashboard 提示引擎版本不匹配

请在 Dashboard 的“安装”页面安装 Cocos Creator 3.8.8，并在项目列表中明确选择该版本打开。

### 首次打开时界面空白或资源缺失

先等待编辑器完成资源导入和 TypeScript 编译，再双击 `assets/scene/lobby.scene`。不要手动删除或修改 `.meta` 文件。

### 浏览器提示不支持 WebGL

更新显卡驱动，使用较新的 Chrome、Edge 或 Safari，并确认浏览器启用了硬件加速。

### 预览时没有进入大厅

确认当前打开的是 `lobby.scene`。正式构建时也要确认启动场景为 `lobby.scene`。

### 构建缓存导致表现异常

先在构建任务页使用“清理构建缓存”后重新构建。不要手工修改 `library/`、`temp/`、`build/`、`profiles/` 或 `local/` 中的生成文件。

## 当前范围与限制

- 仅支持离线单机，不包含联网匹配或真人对战。
- 不包含账号、支付、广告、排行榜、分享奖励和云存档。
- 设置、战绩和断局恢复数据只保存在当前设备浏览器的本地存储中。
- 三档 AI 为启发式策略，不承诺最优出牌。
- 当前正式布局基线是手机横屏；桌面大屏、平板和折叠屏没有单独设计。
- turn timer 用于提示，不会在超时后自动代打。
- 更多技术限制见 [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md)。

## 详细文档

- [当前任务与发布状态](docs/TASKS.md)
- [游戏设计](docs/GAME_DESIGN.md)
- [斗地主规则](docs/RULES.md)
- [架构说明](docs/ARCHITECTURE.md)
- [质量检查清单](docs/QA_CHECKLIST.md)
- [已知限制](docs/KNOWN_LIMITATIONS.md)
- [资源清单](docs/ASSET_LIST.md)

## 维护者推送流程

本仓库使用更新记录保护机制。维护者首次克隆后执行：

```bash
node scripts/install-git-hooks.mjs
```

以后需要把本地主线推送到 `origin/main` 时，不直接执行 `git push`，而是执行：

```bash
node scripts/push-with-readme.mjs
```

该命令会刷新远端状态，把最新发布摘要和覆盖提交写到中英文 README 更新记录顶部，创建独立记录提交后再推送。工作树不干净、远端领先或主线分叉时会停止，不会自动改写历史。

有意使用 `git push --no-verify`、直接在 GitHub 网页修改文件或从未安装 hook 的工作区推送，不在此机制的保证范围内。

## 更新记录

更新记录从 v1.6 正式发布基线开始，不回填此前的全部开发提交。

<!-- readme-changelog-insert-here -->

### 2026-07-22 18:23:57 +08:00

- 目标：`origin/main`
- 覆盖提交：`af2172ab3d6520ee4611131f4d2fb0970c3ba6ad`
- 本期更新：发布 v1.9-R4：新增本地详细对局记录与 JSON 导出，修正困难 AI 协作、控牌和搜索边界，并加入回放坏例分析与产线类型门。
- 验证：见本页“开发者验证”与对应版本发布说明。

### 2026-07-20 13:55:00 +08:00

- 目标：`origin/main`
- 覆盖提交：`c95075832c212e982e0ef221fbd98250b3177227`
- 本期更新：release(v1.9-r3): harden AI analysis and speed up hints
- 验证：见本页“开发者验证”与对应版本发布说明。

### 2026-07-18 03:10:45 +08:00

- 目标：`origin/main`
- 覆盖提交：`639edf65510743cff9e7ab600e61b1c4a7f567cf`
- 本期更新：发布 v1.9，强化困难 AI 评分、明牌世界求解、过牌推断与提示交互，并同步视觉和公开文档。
- 验证：195 个测试文件、1227 个用例通过、2 个环境门控用例跳过，typecheck 通过。

### 2026-07-14 16:04:36 +08:00

- 目标：`origin/main`
- 覆盖提交：`601252026ab73156caa8e0be5a24c032f5cf9a01`
- 本期更新：提示与困难档决策引擎统一，补强运行时委托、候选轮换与过牌反馈。
- 验证：提示运行时采证、AI 回归测试和界面交互门通过。

### 2026-07-13 21:29:06 +08:00

- 目标：`origin/main`
- 覆盖提交：`c5ca73d0d09d9e1ef3a9b5f9cf6eedb72087548c`
- 本期更新：加入精确手牌拆解、结构化 AI、存档迁移和架构约束，并建立双语发布记录保护。
- 验证：规则、状态机、AI、存档与架构测试通过。

### 2026-07-13 18:01:55 +08:00

- 目标：`origin/main`
- 覆盖提交：`063017ab2dd5a0c1397370686316d7af9e346992`
- 本期更新：发布 v1.6，完成视觉收光、交互打磨和横屏适配。
- 验证：Cocos Creator 3.8.8 `web-mobile`，启动场景 `lobby.scene`。

<!-- readme-changelog-covered-through: af2172ab3d6520ee4611131f4d2fb0970c3ba6ad -->
