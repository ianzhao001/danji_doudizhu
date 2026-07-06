# 项目任务清单

## 当前阶段：M2 ✅ + M4 ✅ + 第三/四/优化/第五/第六批 ✅ 已并 main · M5-13/M5-14 已并 main · **第七批（编辑器集成 + 运行时桥接）✅ 已验收并入 main（`fc821cc`，85 文件 / 437 绿、typecheck 净、纯层零 cc）**：M5-20 runtime 存储 + M5-21 round-runtime 门面 + M3-29/30/31 资源/大厅/游戏骨架 + M5-14-followup（.meta 编辑器已补全）· **第八批 ✅ 已验收并入 main**：A 交互层 M3-32~36 已并 main（`291b53b`，全链路可玩通一整局）+ B 文生图 ART-01 背景包已并 main（`a181d45`，`asset-previews/...v2/backgrounds/`，详见 coordination/BOARD.md）；ART-01 风格锚已被用户采纳· **第九批 ✅ 已验收并并入 main**（2026-06-29）：A 美术串行 ART-02→03→04（`6eb8995`，58 文件·预览包·未导入 assets/）· B M6 纯逻辑 L1-L4（`97b0895`/`7d93e65`/`99d13b8`/`c08de19`，462 绿·typecheck 净·零 cc 泄漏·桶冲突串行解）· C1-C4 编辑器串行待执行 · D1 文档收尾 + L5 后置验证待完成，详见 coordination/BOARD.md · **第九批已通过架构验证（462 绿/typecheck 净/纯层零 cc·保持合并）** · **第十批**：M6-L5（selfplay 1..50·`20af2e9`）+ M6-L6（CueId 收紧·`4c840ed`）✅ 已并 main（92 文件/469 绿）；M6-C1 ✅ 已并 main `31b5668`（用户 Cocos Creator 验证编译/渲染/开关持久化通过），C2 解锁 · **第十一批已派发（26 任务·spec 全部入 main）**：A 纯逻辑增强（L7-L12 + M3-40~44 战绩/历史/帮助/回放/叫抢建议/暂停）·G 集成硬化护栏（G9-G12）·C 编辑器屏（C2-C4 + M3-45/46）·R 美术导入（ART-IMPORT-02~04·待用户视觉终审）·D 文档（D1-D3），详见 coordination/BOARD.md「第十一批」 · **第十一批验收推进**：A 线纯逻辑 7（L7-L12+M3-42）+ G 4（G9-G12）+ D2/D3 ✅ 已并 main（103 文件/507 用例全绿·typecheck 净·纯层零 cc·桶未动留 M6-I1 补）；M3-40/41/43/44 已并 main；C2/C3a/C3b 已并 main（C3b `b51dce5`），C4 已并 main `4c314b9`；R 待用户视觉终审；新增 M6-I1 桶整合 · **第十二批已派发（18 任务·spec 全部入 main）**：P AI 纵深（M4-30 手牌强度/M4-31 已出牌记忆/M4-32 残局检测）·V 视图（M3-50 教程/51 强度条/52 计时/53 提示/54 已出牌/58 难度面板）·L（M6-L13 文案表）·G（G13 VM 不可变/G14 AI 隔离护栏）·C 编辑器（M3-55/56/57/59）·D（M6-D4 架构决策+已知限制）·R（ART-05 杂项美术·gated），详见 coordination/BOARD.md「第十二批」 · **第十三批已派发（10 任务·纯逻辑尾部）**：M2-12 回放编解码·M6-G15 难度平衡护栏·M3-60 AI 思考/M3-62 上一手视图·M6-D5 冒烟脚本已并 main + M4-40 出牌建议综合/M4-41 叫抢置信度/M3-61 建议视图（链式已完成）+ M3-63/64 编辑器接线，详见 coordination/BOARD.md「第十三批」

> 2026-07-07 文档同步：v1.1 横屏化已闭合（`d3e1fed`，134/660 绿，`orientation=landscape`）；v1.2 七波 UI 真皮肤/布局重造/流程对标/AI 强化已收版并打包发布（收版基线 141/739 绿，发布包 `designResolution=844×390`、`orientation=landscape`、四横屏 V6 全链 `productErrors=[]`）；v1.3 技术债清偿版已开 A/B 波，A 波含 T-MEMORY-REAL（done `408a2ea`，困难档真历史记牌机制闭合）、T-RUNTIME-SPLIT、T-VIEW-SEAT、T-PROFILE-FOLLOWS、T-DOCS-SYNC，B 波含 UI helpers 与 game-scene 拆分。当前执行状态以 `coordination/BOARD.md` 为准。

> 2026-07-04 UI-REMAKE 开批：用户终审认为当前游戏内 UI 元素与布局问题较大，要求**不改变功能**重造游戏内牌桌 + 结算；保持现有 pink 粉色卡通风格，仅参考上传截图的布局和元素组织。任务见 `coordination/BOARD.md`「UI-REMAKE」与 `coordination/tasks/ART-GAME-REMAKE.md`、`T-LAYOUT3.md`、`ART-IMPORT-GAME-REMAKE.md`、`P-G4-UI-REMAKE.md`。当前 gate：`ART-GAME-REMAKE` preview 等用户视觉终审；未通过前不得导入 `assets/resources` 或接线。

> 2026-07-01 收口更新：M6-editor 后续编辑器 UI 已审查通过并入 main `a817c98`（M3-57 toast/timer、M3-63 AI thinking/last action、M3-64 advisor、M3-55 tutorial、M3-46a help、M3-46b pause overlay、M3-59 difficulty picker、M3-45 stats/records；均为运行时注入，未改 scene/meta/root 配置；390×844 截图 + CDP errors `[]`）。最终验证 **128 测试文件 / 632 用例全绿、typecheck 净**。剩余本地 gate：ART-IMPORT-02/03/04 与 ART-05 待用户视觉终审，M6-D1 发布/QA 文档收尾待最终发布 gate。

> 2026-07-01 发布收口推进：**M4-42 困难 AI 中盘纵深**审查通过并入 main `641b6a8`；**ART-IMPORT-02/03/04/05 美术导入**用户视觉终审通过 →（返工 sprite-frame 修正后）审查通过并入 main `4334e81`（30 PNG 导入 `art/{avatars,ui,cards,misc}/`·22 场景 sprite 为 sprite-frame·50/50 唯一 UUID·133 文件/653 绿）。**发布收口最后 gate 关闭，仅剩 M6-D1 发布验收记录（架构文档收尾）待执行。**

> 2026-07-01 M6-D1 发布验收收口：架构复核 C4 构建证据并在当前 main 重新生成 `build/web-mobile/`（47M / 202 文件；`CocosEngine 3.8.8`、`platform web-mobile`、390×844 设计分辨率）。首轮复审发现 release `launchScene=game.scene` 跳过大厅，按用户裁定返工：用 `startScene=dc62324b-10d4-4870-9518-1a34ce682067` 重构建后，`settings.json` 已为 `db://assets/scene/lobby.scene`；执行 Web Mobile 三档大厅烟测截图（`/tmp/doudizhu-d1-lobby-launch-smoke/lobby-{390x844,412x915,360x780}.png`，三档 `errorEvents: []`）并补 390×844 `lobby → 新对局 → game → 暂停 → 退出确认 → lobby` 链路烟测。当前状态：**首版可发布**。

> 2026-07-01 第十五批派发（M6-editor 两轮审查转化·5 任务·均非阻塞）：第二批编辑器 UI（M3-45/46a/46b/55/57/59/63/64）+ 第三轮 round-runtime/运行时审查**均通过**，发现转出 5 个文件域互不相交的打磨/硬化任务——纯逻辑 **M6-G18**（round-runtime 诊断可见性 + replay 盲区）·**M3-68**（screen-view 去 dead `cues`）已 **ready** 可即认领；编辑器串行 **M3-65**（lobby home 重排 + 子屏不透出）·**M3-66**（HUD 叠压消除 + 暂停冻结计时）·**M3-67**（去每帧存储 I/O + 修 submitting 死锁 + 音频并发）**blocked** 待本批入 main。详见 coordination/BOARD.md「第十五批」。

> 2026-07-01 第十五批 wave 1 验收并入 main：**M3-65 + M3-66 已并 main `7b9a111`**（审查通过·128/632 绿·typecheck 净·`diff --check` 净·纯层零 cc·未改 scene/meta/root·4 张 390×844 截图 + CDP errors `[]`·timer 冻结 CDP `3151ms→3151ms` 实证）。**M3-67 解锁翻 ready**（依赖第二批已在 main·编辑器串行接其后）。

> 2026-07-01 第十六批派发（第四轮全量审查转化·18 项逐条裁决）：采纳并立任务 4（纯逻辑·均 ready/todo）——**M6-G19**（跨层类型守卫去重）·**M6-G20**（core.ts 不可变结构共享去冗余拷贝）·**M6-G21**（cardMemory 不可变 + straightLength 鲁棒 + 评分权重具名）·**M4-42**（困难 AI 中盘纵深·产品 gated）；2 项已在第十五批覆盖（#5→M3-67、#18→M6-G18）；4 项采纳但暂不立任务（#1/#10 上帝组件/runtime 拆分=发布后重构、#4 legalFollows 剪枝=过早优化、#6 save 双序列化=低价值格式变更）；6 项驳回（#2 双 render 不存在、#13 春天判定正确、#14/#15/#16/#17 非问题/微优化）。详见 coordination/BOARD.md「第十六批」。

> 2026-07-01 第十六批审查（6 实现分支·独立复核）：**4 合 / 1 改 / 1 裁决**，合并后 main **131 files / 645 tests 绿·typecheck 净·纯层零 cc**。已并：**M3-67 `08b333e`**（运行时卫生）·**M6-G20 `e9bf6d7`**·**M6-G19 `80c71a0`**（+`.meta` `c2e37fd`）·**M6-G21 `b0bbd41`**。**M3-68 打回**（caller `game-scene-skeleton:284` 仍传已删的 `recentEvents`→Cocos TS2353；test 绿是假阴性因该 cc 组件不在 test tsc 程序内；根因 M3-68 任务书写错·已订正）。**M6-G18 契约裁定**：resume-settled 的 `settled` **不**入 replay（重开已结束局重播胜负 cue 是错的·结算走 settlement()/onSettled·该路径实际不可达）→ 撤销 #2、保留 #1/#3·spec 已更新。详见 coordination/BOARD.md「第十六批审查记录」。

> 2026-07-01 第十六批返工复审：两 changes-requested 分支返工后**均复审通过并入 main**——**M6-G18 `1e5fa96`**（裁定落实仅 `'deal'` replay·resume-settled 维持 events=[]·新测试锁契约）·**M3-68 `ffdb66d`**（方案 A 保留入参·caller 零改·无 TS2353）。合并后 main = `ffdb66d`：**132 files / 648 tests 绿·typecheck 净·纯层零 cc**。**第十六批 7 任务 6 done，仅剩 M4-42（产品 gated）**。

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
- [x] 叫抢策略切到难度分层（bidPolicy → chooseBidByLevel）。〔M-FLOW-04 已并 main a2f4828〕
- [x] 回放/调试 trace（事件流→可复盘 trace + 摘要）。〔M2-11 已并 main（第四批）〕

## M3 手机界面（历史竖屏基线，v1.1/v1.2 已横屏化）

> M3-00 纯逻辑岛先行（worktree 模式，禁 cc）：hand-layout / selection 已 ready，见 BOARD.md 第三批；后续 view-model 等同模式。场景/预制体属编辑器（非 worktree）。

- [x] 手牌布局算法（390×844 居中/步距/压缩，纯函数）。〔M3-00-hand-layout 已并 main 32b78bc；输入前置条件守卫 aaac57f〕
- [x] 手牌选中模型（选中/取消/排序，纯不可变）。〔M3-00-selection 已并 main f5d9252〕
- [x] 牌面视图模型（Card→assetKey/rankLabel/suitKey/sortKey）。〔M3-00-card-view 已并 main（第四批）〕
- [x] 桌面布局坐标模型（390×844 各区）。〔M3-00-table-layout 已并 main（第四批）〕
- [x] 操作按钮状态模型（出牌/过牌/提示 enabled）。〔M3-00-action-buttons 已并 main（第四批）〕
- [x] 手牌交互桥（layout+selection 组合，选中上浮）。〔M3-00-selection-layout-bridge 已并 main（第四批）〕
- [x] 叫抢视图模型（按钮文案/可用/座提示）。〔M3-00-bidding-view 已并 main（第四批）〕
- [x] 结算弹窗视图模型（Settlement→VM）。〔M3-00-result-view 已并 main（第四批）〕
- [x] 事件提示映射（GameEvent/FlowEvent→cue id）。〔M3-00-event-cues 已并 main（第四批）〕
- [x] 整屏 VM 集成层（9 个 UI 岛 → 单一渲染 VM）。〔M3-01-screen-view 已并 main；`ui/index.ts` 已含第六批 view 导出〕
- [x] 资源基线导入（预览包 → assets/resources + asset-keys 对照表）。〔M3-29 已并 main `fc821cc`：7 牌面/9 音效WAV/2 字体 + ui/asset-keys.ts〕
- [x] 创建大厅场景。〔M3-30 已并 main `fc821cc`：lobby.scene + lobby-scene.ts 绑 lobby/stats/records/settings-view；390×844 截图〕
- [x] 创建游戏主场景（骨架）。〔M3-31 已并 main `fc821cc`：game.scene + game-scene-skeleton.ts 绑 screen-view；390×844 截图〕
- [x] 创建手牌交互。〔M3-32 已并 main `291b53b`：真实 round-runtime 接线 + 选牌上浮·keystone〕
- [x] 创建操作按钮。〔M3-33 已并 main `291b53b`：出牌/不要/提示→submitPlayerAction〕
- [x] 提示按钮复用 `rules` 着法枚举。〔M3-33 已并 main `291b53b`：复用 ai/hint(M4-20) + legalFollows〕
- [x] 接入 `GameEvent` 驱动动画与音效。〔M3-35 已并 main `291b53b`：FlowEvent→cueForFlowEvent→音效+轻动效〕
- [x] 创建结算弹窗。〔M3-34 已并 main `291b53b`：叫抢输入 + result-view 结算弹窗 + 重开/返回〕
- [x] 完成 390x844 竖屏适配检查。〔M3-36 已并 main `291b53b`：Canvas/Widget/安全区自适应；当前发布形态已由 v1.1/v1.2 迁移为横屏 844×390〕

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
- [x] AI 合法性不变量审计（三档横切护栏）。〔M4-08 已并 main（第四批，绿护栏）〕
- [x] 叫抢判强逻辑单一真相源 + 阈值 exhaustive。〔M4-09 已并 main（优化批）：抽 isStrongHand，chooseBid/chooseBidByLevel 复用〕
- [x] 叫抢 dispatch 去重。〔M4-10 已并 main：`actionForStrength` 单一真相源，chooseBid/chooseBidByLevel 复用〕
- [x] 困难 AI 中盘策略纵深（第四轮审查转化·第十六批·**审查通过并入 main `641b6a8`·2026-07-01**）。〔M4-42 消费 M4-30/31/32（手牌强度/记牌/残局）增强 Hard 中盘——手牌塑形/控权意识/记牌消费/终局规划·selfplay Hard 地主 7/12 均分 0.83 vs Normal 3/12 -1.83·合法性/确定性/G14 隐藏态全绿·133/652〕

## M5 完整单机体验

- [x] 存档版本化（serialize 加 version + 反序列化浅校验，向后兼容往返）。〔M5-01 已并 main；浅校验 7/8 字段，`top` + 深层校验顺延 M5-02〕
- [x] 存档深校验（补 `top` 必需 + 有界深层结构校验，断局重开前置）。〔M5-02 已并 main 44b86b8；`top.pattern` 完整形（length/cards）顺延 M5-02B〕
- [x] 存档 top.pattern 完整形校验（length/cards/牌结构/一致性）。〔M5-02B 已并 main a934a70；语义校验（recognize 比对）顺延 M5-02C〕
- [x] 存档 top.pattern 语义校验（recognize(cards) 与声明 pattern 一致）。〔M5-02C 已并 main（第四批）〕
- [x] 本地设置（纯数据层：difficulty/音效/震动/动画开关 + 默认值 + 迁移版本）。〔M5-03 已并 main ed456c0〕
- [x] 本地设置编解码（serialize/deserialize + 复用 migrateSettings，为 localStorage 前置）。〔M5-05 已并 main 5aaae99〕
- [x] 断局存档槽位纯模型（{version,savedAt,round} + 编解码，无 IO）。〔M5-04 已并 main 9b73391；canonical wire 收紧 05a3ae9；回归护栏 M5-04B（优化批）〕
- [x] 设置存储适配器（注入 StorageLike，load/save/remove，无浏览器依赖）。〔M5-06 已并 main（第四批）；StorageLike 已统一单一真相源〕
- [x] 断局槽位存储适配器（损坏抛错，区别设置）。〔M5-07 已并 main 4c92572；StorageLike 改 import settingsStorage〕
- [x] 战绩统计编解码（JSON + 容错迁移）。〔M5-08 已并 main（第四批）〕
- [x] 对局历史记录纯模型（追加/裁剪/倒序/迁移）。〔M5-09 已并 main（第四批）〕
- [x] 战绩统计聚合。〔M5-11 aggregate 已并 main：FlowResult→stats/records〕
- [x] 断局重开（复用序列化存档）。〔M5-10 resume 已并 main：SaveSlot→可继续对局〕
- [x] 单局会话持久化集成。〔M5-13 已并 main：save↔resume↔aggregate 串联，注入 StorageLike〕
- [x] 落盘倍数字段正整数迁移。〔M5-12c 已折叠进 M5-10/M5-12b：`bidMultiplier`/`multiplier` 非法值回 1〕
- [x] Cocos 存储适配器（sys.localStorage → StorageLike，runtime 桥接层）。〔M5-20 已并 main `d9033c3`：storage-adapter(禁cc·可测)/cocos-storage(cc 隔离)〕
- [x] 交互式单局运行时门面（round-runtime：start/resume/玩家动作/AI 自动，对齐 deriveScreenVM）。〔M5-21 已并 main `0f31900`：重构 driver 抽 step helper·flow→data 零 import·dispose 中断〕
- [x] statsCodec unknown-version 注释订正（容灾兜底非可逆迁移）。〔M5-14-followup 已并 main `b51032c`·纯文档 1 行·行为零改〕
- [x] 音效开关写侧接线 + 热重载。〔M6-C1 已并 main `31b5668`·用户 Creator 验证（编译零报错/390×844 渲染/开关切换持久化）·playCue 改调 decideCuePlayback·vibration 跨平台降级·settings 热重读·修 defaultSettings bug·lobby/game 运行时注入设置控件〕
- [x] 基础动画接线 + card/弹窗级动效。〔M6-C2 已并 main `17b96f3`·Creator 3.8.8 预览·390×844 bomb 局部动效截图·Console 零 Error〕
- [x] 发布验收记录。〔M6-D1 已收口·C4 当前构建产物 + D1 三档 Web Mobile 大厅烟测 + lobby 启动场景返工关闭 + QA/ROADMAP/BOARD 一致更新〕

## M6 发布前打磨

- [x] 移动端适配纯逻辑件。〔M6-L3 已并 main `99d13b8`·tableLayout 参数化+多分辨率 sweep·15/15 绿〕
- [x] 移动端适配回归 + 渲染性能。〔M6-C3a 已并 main `98b0ec1`（6 张三档截图 + SafeArea/fit-width）；M6-C3b 已并 main `b51dce5`（Creator 3.8.8 三分辨率 Preview + 相对布局 + render 差分复用）〕
- [x] 性能检查。〔M6-C3b 已并 main `b51dce5`·render 差分更新/稳定节点复用；M6-L5 selfplay 长回归 1..50·**已并 main `20af2e9`**·2/2 绿·10.8s〕
- [x] CueId 类型收紧 + cue 一致性护栏。〔M6-L6 已并 main `4c840ed`·`CueId` string→11 字面量联合（CUE_IDS 派生）·绿护栏锁 audio-gate/animation 引用真实·5/5 绿·零 cc〕
- [x] 异常流程检查。〔M6-L4 已并 main `c08de19`·resume-to-settled/redead 超限/bidding reason·5/5 绿〕
- [x] 构建验证。〔M6-C4 已并 main `4c314b9`·Creator 3.8.8 web-mobile build success·390×844 运行烟测·交叉审查 approve〕
- [x] 发布硬化（三方审查转化·第十四批）。〔M6-G16 已并 main `d9cc851`·`round-runtime.ts` 生命周期/错误边界/死状态（RR-1..10）·RR-1 settled replay 登记后续契约取舍；M6-G17 已并 main `422411c`·`event-cues.ts` cue 编译期穷尽断言 + 签名诚实化（EC-1/EC-3，驳回 EC-2）·最终 128/632 绿·typecheck 净〕
- [x] 发布硬化（第三轮审查转化·第十六批）。〔M6-G18 已并 main `1e5fa96`·返工复审通过·terminationDetail() + 仅 `'deal'` replay（裁定 settled 不入）+ per-subscriber·新测试锁契约·648 绿〕
- [x] DRY 收口（第四轮审查转化·第十六批）。〔M6-G19 已并 main `80c71a0`（+`.meta` `c2e37fd`）·跨层守卫去重·层级/桶/hintRank 正确·偏差：isGameEvent 统一为 strict（收紧 save 校验·安全）·131 files/642 绿〕
- [x] 核心热路径硬化（第四轮审查转化·第十六批）。〔M6-G20 已并 main `e9bf6d7`·`core.ts` 结构共享·事件/状态语义逐字不变·635 绿〕
- [x] AI 启发式一致性硬化（第四轮审查转化·第十六批）。〔M6-G21 已并 main `b0bbd41`·cardMemory 冻结 + straightLength 显式 reset + 权重具名·三项行为保持〕
- [x] 发布验收记录。〔M6-D1 已收口·首版可发布；release 构建 `launchScene=lobby.scene`，证据见 `coordination/BOARD.md` 发布验收记录与 `coordination/reports/M6-D1-lobby-launch-rebuild.report.md`〕
- [x] 已知债务登记（第四轮审查·暂不重构）。〔M6-D4 已补登 `docs/KNOWN_LIMITATIONS.md`：#1 上帝组件 `game-scene-skeleton.ts`/#10 `round-runtime.ts` 拆分 = 发布后重构里程碑；#4 `legalFollows` 剪枝 = profiling 触发再做；#6 `save.ts` 双序列化 = 后续数据层清理〕
