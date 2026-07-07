# 任务板（BOARD）

架构维护的任务真相源。状态列使用精确机器态，禁止混入阶段说明或含 `approved` 的自然语言，避免 agentctl 误判。状态：`todo`(待出 spec) · `ready`(spec+测试就绪可认领) · `in-progress`(执行中或分阶段未完成) · `changes-requested` · `blocked` · `approved`(审查者批准，可由审查者进入合并双闸) · `approved-pending-planner`(高风险任务待规划者批量把关，不可合并) · `merge-claimed:<ID>`(单一 merge lane 锁，合并后清除) · `done <commit>`(终态)。

## 当前里程碑：M2 ✅ · M3/M4/M5 纯逻辑层推进 ✅ · 第三/四/优化/第五/第六批 ✅ 已并 main · M5-13/M5-14 已并 main · **第七批（编辑器集成 + 运行时桥接）✅ 已验收并并入 main**（85 文件 / 437 绿，2026-06-28；新脚本 .meta 编辑器已补全）· **第八批（交互层 + 文生图）✅ 已验收并并入 main**（`291b53b` 轨道 A 交互层 / `a181d45` 轨道 B ART-01 背景包，2026-06-29）· **第九批 ✅ 已验收并并入 main**（2026-06-29）：A 美术串行 ART-02→03→04（`6eb8995`，58 文件·预览包·未导入 assets/）· B M6 纯逻辑 L1-L4（`97b0895`/`7d93e65`/`99d13b8`/`c08de19`，462 绿·typecheck 净·零 cc 泄漏·桶冲突串行解）· C1-C4 编辑器串行待 L1/L2/L3 入 main 后 + D1 文档收尾 + L5 后置验证 · **第九批已通过架构验证（见下「第九批合并验证」），保持合并** · **第十批 ✅ 全部已并 main**：L5/L6（`20af2e9`/`4c840ed`）+ C1（`31b5668`·用户 Cocos Creator 验证编译/渲染/开关持久化通过），C2 解锁，见下「第十批」 · **第十一批进行中**：A 线纯逻辑 7（L7-L12+M3-42）+ G 4（G9-G12）+ D2/D3 ✅ 已并 main（103 文件/507 绿）；M3-40/41/43/44 已并 main；C2/C3a/C3b 已并 main（C3b `b51dce5`），C4 ready；R 待用户视觉终审；新增桶整合 M6-I1 已并 main（见下「第十一批」+「验收记录」） · **第十二批已派发**（18 任务·P AI 纵深 / V 视图 / L 文案 / G 护栏 / C 编辑器 / D 文档 / R 美术·spec 全部入 main，见下「第十二批」） · **第十三批已派发**（10 任务·AI 模块组合/平衡度量/回放编码/剩余视图·M6-D5 已并 main·见下「第十三批」·纯逻辑尾部） · **第十四批 ✅ 已验收并并入 main**（G16 `d9cc851` round-runtime 生命周期/错误边界 + G17 `422411c` cue 编译期穷尽断言，128 文件 / 632 绿·typecheck 净） · **UI-REMAKE 新批次已开**（2026-07-04：保持 pink 风格，仅重造游戏内牌桌 + 结算；ART-GAME-REMAKE preview gate 等用户视觉终审）

main 现状：**代码/测试/文档/发布打包 gate 均已闭合，首版可发布**。当前 main 已含 M4-42 `641b6a8`、ART-IMPORT `4334e81`、M6-D1 文档收口 `ef0f93b` 与 M6-D1 发布打包返工；当前验证口径：**133 测试文件 / 653 用例全绿、typecheck 净、纯层零 cc**。Cocos Creator 3.8.8 `web-mobile` 构建在当前 main 复测生成 `build/web-mobile/`（47M / 202 文件），`launch.launchScene` 已改为 `db://assets/scene/lobby.scene`；D1 三档 Web Mobile 大厅烟测截图已落 `/tmp/doudizhu-d1-lobby-launch-smoke/`，390 档覆盖 lobby → game → pause quit → lobby 链路，三档 `errorEvents: []`。已知限制已归档到 `docs/KNOWN_LIMITATIONS.md`，均为发布后债务，不阻塞 v1。

## 第十四批（三方审查转化 · 发布硬化 · 架构派发 · 2026-06-30）

> 三方审查者 AI 对 `flow/round-runtime.ts`（10 项）与 `ui/event-cues.ts`（3 项）的发现，架构逐条核实后采纳（详见对话裁决表）。转成两个**纯逻辑 worktree** 任务，文件域两两不相交、可并行。**派发模式**：纯 spec（架构只出任务定义，实现方自写 vitest 测试 + 实现），与第六批同。

| ID | 类型 | 文件域 | 分支 | 状态 |
|----|----|----|----|----|
| M6-G16-round-runtime-hardening | 发布硬化(改产品码) | `flow/round-runtime.ts` + 新 `test/flow/round-runtime-hardening.test.ts`（可加不可改 `round-runtime-exceptions.test.ts`） | `task/M6-G16-round-runtime-hardening` | **done `d9cc851`**（RR-1..10 硬化·128/632 绿·交叉审查 approve；RR-1 settled replay 登记后续契约取舍） |
| M6-G17-cue-exhaustiveness | 发布硬化(改产品码+护栏测试) | `ui/event-cues.ts` + `test/ui/cue-id-consistency.test.ts`（扩展不弱化） | `task/M6-G17-cue-exhaustiveness` | **done `422411c`**（cue 编译期穷尽断言 + `cueForFlowEvent` 签名诚实化·128/632 绿·交叉审查 approve） |

> **架构裁决要点（落进 spec）**：
> - **G16 诊断不走新 FlowEvent/cue**：redeal 耗尽/推进异常用「终止相位 + `terminationReason()` 访问器」暴露，**不**新增 `FlowEvent` 成员、**不**碰 `event-cues.ts`/`CUE_IDS`/一致性测试——避免触动 `flow/types.ts` 契约与 cue 跨文件不变量，使 G16 文件域严格收敛在 `round-runtime.ts`，且与 G17 解耦可并行。
> - **G17 遵循 ADR-002**：保留字面量联合 `CueId`，只**新增编译期穷尽断言** + 收紧 `cueForFlowEvent` 死 `| null` 签名。
> - **驳回三方审查 EC-2**：字面量联合 `CueId` 下 `return event.type` 对未同步事件类型已在 tsc 报 TS2322（已编译验证），非"静默失效"。
> - **未纳入的次要项**：单类拆分（拒绝·避免 churn 已验收 keystone）、`legalInputs` 缓存（过早优化）、逐步持久化粒度（产品决策·待确认）、submit seat 校验（低·G16 内可顺手）。
> **派发**：用 PROTOCOL bootstrap（`<ID>` 换上表分支名）。两任务无依赖，可同时认领。

## 第十五批（编辑器 UI 打磨 · M6-editor 第二批审查转化 · 2026-07-01）

> M6-editor 第二批（M3-45/46a/46b/55/57/59/63/64 + 截图归一化）审查**通过**（128 文件/632 绿·typecheck 净·`diff --check` 净·护栏 grep 无命中·8 屏 390×844 截图齐·CDP errors `[]`）。审查 4 项**非阻塞**观感/密度发现转成 2 个编辑器串行收口任务，按文件域拆分、互不相交。

| ID | 文件域 | 依赖（入 main 后解锁） | 分支 | 状态 |
|----|----|----|----|----|
| M3-65-lobby-home-density | `ui/components/lobby-scene.ts` + `.meta`/report | M3-45/M3-55/M3-59/M3-46a | `task/M6-editor` | **done `7b9a111`**（审查通过·home 三排重排不交叠 + 隐藏冗余 label + 子屏不透出·CDP errors []） |
| M3-66-game-hud-polish | `ui/components/game-scene-skeleton.ts` + `.meta`/report | M3-56/M3-57/M3-64/M3-46b | `task/M6-editor` | **done `7b9a111`**（审查通过·advisor×展开剩牌消叠压 + 暂停冻结 turn-timer，CDP `3151ms→3151ms` 实证冻结） |

> **审查裁决要点（落进 spec）**：① 4 项均非阻塞观感/密度，**不拦本批合并**；② 按文件域拆 2 任务（lobby / game-scene 各一），编辑器单写者串行做；③ **M3-65** ＝ home 难度面板/toggle/四入口三排重排不交叠 + 常驻 `难度` label 不被面板裁切 + 子屏（战绩/历史/教程/帮助）不透出 home 数据；④ **M3-66** ＝ advisor×展开剩牌消叠压 + 暂停态冻结 turn-timer（仍守「超时仅视觉、绝不自动出牌/过牌」契约）。
> **未纳入**：`update(dt)` 周期 render × 出牌飞行 tween（审查期 CDP 无错 + 交互正常，仅登记观察，不立任务）。
> **解锁/派发**：本批 M6-editor 合并 main 后两任务由 blocked 翻 ready；编辑器任务交付按「📐 编辑器任务验收模板」附 390×844 截图与 Console 证据。

### 第十五批·第二波（第三轮审查转化 · round-runtime 诊断 + 运行时卫生 · 2026-07-01）

> 第三轮审查（G16/G17 已并 main 后，未改码）对 `flow/round-runtime.ts`（3 项）+ `ui/components/game-scene-skeleton.ts`（4 项）+ `ui/screen-view.ts`（1 项）的发现，架构**逐条核实代码后全部采纳**（8/8），转 3 个文件域互不相交的任务。`event-cues.ts` 经审查**无新缺陷**（G17 编译期穷尽断言到位）。

| ID | 类型 | 文件域 | 分支 | 状态 | 覆盖发现 |
|----|----|----|----|----|----|
| M6-G18-round-runtime-diagnostics | 发布硬化(改产品码·纯 spec) | `flow/round-runtime.ts` + 新 `test/flow/round-runtime-diagnostics.test.ts` | `task/M6-G18-round-runtime-diagnostics` | **done `1e5fa96`**（返工复审通过·裁定落实+新测试锁契约·648 绿） | #1 terminationDetail·**#2 撤销**·#3 per-subscriber deal replay |
| M3-67-game-scene-runtime-hygiene | 编辑器(运行时卫生) | `ui/components/game-scene-skeleton.ts` | `task/M6-editor` | **done `08b333e`**（审查通过·去每帧 I/O + 修 submitting + playOneShot·Creator 390×844·console []） | #4 每帧存储 I/O(M)·#5 submitting 死锁(M)·#7 音频并发(L)·#8 未做(可选) |
| M3-68-screen-view-drop-cues | 纯岛清理(纯 spec) | `ui/screen-view.ts` + `test/ui/screen-view.test.ts` | `task/M3-68-screen-view-drop-cues` | **done `ffdb66d`**（返工复审通过·方案 A 保留入参·caller 零改·645 绿） | #6 dead `vm.cues`(L) |

> **架构裁决要点（落进 spec）**：① **#1** 倾向「存错误 + `terminationDetail(): unknown` 访问器」（`RoundRuntime` 接口 additive 非破坏，**不碰 `flow/types.ts`**，续 G16 纪律），`console.warn` 仅可选且勿刷 selfplay；② **#2** 放宽 replay 入队覆盖构造期同步 emit（`'deal'`+`'settled'`），**严守 M3-56 不变量**（非 round 事件不串入 `fullGameEvents`、fresh 仍恰一次 deal）；③ **#3** 多订阅者 replay 语义二选一（per-subscriber 补发 / 显式注释单投递），属 by-design 澄清；④ **#4/#5/#7** 编辑器运行时卫生，纯去 I/O + 一行修锁 + `playOneShot`，**不改布局/交互**；⑤ **#8** 列为**可选 stretch**——仅在确证不产生 stale 按钮时做，否则保持现状（LOW 价值 vs 热路径回归风险）。
> **优先级**：#4（每帧 I/O·性能）与 #1（错误可诊断性）最高，分落 M3-67 / M6-G18；#5 一行修锁次之。
> **派发**：M6-G18 与 M3-68 即可认领（纯逻辑·PROTOCOL bootstrap）；M3-67 待 M6-editor 第二批入 main 后翻 ready，接在 M3-65/M3-66 之后的编辑器串行队列。

## 第十六批（第四轮全量审查转化 · 18 项逐条裁决 · 2026-07-01）

> 第四轮三方审查（读 84 文件/7086 行·未改码）提 18 项。架构**逐条核实代码后裁决**：采纳并立任务 4 项 · 已在第十五批覆盖 2 项 · 采纳但暂不立任务（记录理由）4 项 · 驳回（核实为非问题）6 项 · 另 #16 装饰性可顺手收。

### 采纳并派发（4 任务·均纯逻辑·worktree）
| ID | 文件域 | 分支 | 状态 | 覆盖 |
|----|----|----|----|----|
| M6-G19-typeguard-consolidation | 新 `rules/guards.ts`+`game/seat.ts` + 多消费方改 import | `task/M6-G19-typeguard-consolidation` | **done `80c71a0`**（+`.meta` `c2e37fd`·偏差：isGameEvent 统一为 strict·见记录） | #3 重复守卫去重（isRecord×6/isSeat×4/nextSeat×2/cardKey×3/isGameEvent×2） |
| M6-G20-core-structural-sharing | `game/core.ts` | `task/M6-G20-core-structural-sharing` | **done `e9bf6d7`**（审查通过·语义逐字不变·635 绿） | #7 不可变结构共享（去 pass/未变座位冗余手牌拷贝） |
| M6-G21-ai-heuristic-hardening | `ai/cardMemory.ts`+`ai/handStrength.ts` | `task/M6-G21-ai-heuristic-hardening` | **done `b0bbd41`**（审查通过·三项行为保持） | #8 cardMemory 不可变·#11 straightLength 去隐式顺序依赖·#12 评分权重具名 |
| M4-42-hard-ai-depth | `ai/levels/hard.ts` | `task/M4-42-hard-ai-depth` | **done `641b6a8`**（审查通过·独立复核·133/652 绿·selfplay Hard 地主 7/12 均分 0.83 vs Normal 3/12 -1.83） | #9 Hard 中盘纵深（消费 M4-30/31/32·selfplay 胜率验收） |

> **串行约束**：G19 与 G20 均触 `game/core.ts`，**不并行**（report 注明顺序）。G21 与 M4-42 均 ai/ 但文件域不交（G21=cardMemory/handStrength，M4-42=levels/hard）可并行。G19/G20/G21 为发布前清理类，M4-42 显著更大、按产品优先级单独排期。

### 已在第十五批覆盖（不重复立项）
- **#5**（game-scene 每帧设置 I/O）= **M3-67** 已含。
- **#18**（`terminateWithError` 错误吞没）= **M6-G18** 已含。

### 采纳但暂不立任务（记录理由·留后续）
- **#1 上帝组件 `game-scene-skeleton.ts`(1278 行) / #10 `round-runtime.ts`(427 行) 拆分**：有效债务，但**发布前做高风险大重构不当**——组件/runtime 均可用且经多轮审查+截图+CDP 净；单组件运行时注入是项目刻意决策、round-runtime 刚被 G16 硬化。**登记为已知债务**，留发布后重构里程碑（建议补进 M6-D4 已知限制）。
- **#4 `legalFollows` 全量枚举无剪枝**：真实但**过早优化**——selfplay 1..50 仅 ~10.8s 无实测瓶颈；keystone rules 层改动须逐一证明等价；与项目既有立场一致（G16 已以「过早优化」否决 legalInputs 缓存）。**留待 profiling 触发**再做等价守护版定向生成。
- **#6 `save.ts` 双重序列化**：真实瑕疵（round 字段被转义两次 + 兼容分支），但**低价值**——单存档槽体积膨胀可忽略；属受测数据 codec 的**格式变更**，发布前性价比低（修法本身向后兼容、安全）。**留后续数据层清理**。

### 驳回（核实为非问题·附依据）
- **#2 submitPlay 双 `render()`**：**不存在**。`game-scene-skeleton.ts:795-807` 全方法仅一处 render；所引片段与代码不符。
- **#13 春天判定基于出牌次数**：**逻辑正确**。地主必首家领出 → `landlordPlays===1` 恰表「仅领出一手后被农民清牌」= 标准反春天，非 bug；仅可加一行说明注释。
- **#14 selection 过滤无 dirty 检测**：**非问题**。过滤在 `render()` 开头、`renderHand` 前同一调用内完成，无跨帧不一致（评审亦承认全量重绘下不出问题）。
- **#15 `validatePlay` 双遍历**：微优化，合并会耦合 ownership 与 recognize，收益微乎；否决。
- **#16 `vibrate()` 双重断言**：装饰性；`?.()` 可选调用本就安全，可在 M3-67 顺手收紧，不值独立任务。
- **#17 冻结 `RoundState`**：给核心热路径加 deep-freeze 开销，换 G13/G14 护栏+约定已提供的防护；发布前否决。

### 🔍 第十六批审查记录（架构验收 6 实现分支 · 2026-07-01）

> 独立复核（重读 diff + 验语义 + 重跑 full suite，不采信报告）。**4 合 / 1 改 / 1 裁决**。合并后 main：**131 files / 645 tests 绿·typecheck 净·纯层零 cc**。

**✅ 已合并（merge --no-ff）**
- **M3-67 `08b333e`**：去 render/playCue 每帧 `reloadSettings`（改读 `this.settings`）+ `startGame` 重置 `submitting` + cue 改 `playOneShot`。行为保持·Creator 390×844·console []。
- **M6-G20 `e9bf6d7`**：core.ts 结构共享（pass 不拷手牌·`replaceSeatHand` 仅替换出牌座位·未变座位保持引用）。事件/状态语义逐字不变。
- **M6-G19 `80c71a0`**（+ Creator `.meta` `c2e37fd`）：守卫去重，层级正确（`rules/guards.ts`→rules、`game/seat.ts`→game+guards）、index.ts 桶未动、hintRank 的 `cardKey(Move)` 保留、game-scene 内部 `cardKey` 由 `-` 改 `:` 分隔（纯运行时签名·一致即可·无碍）。**偏差（接受并登记）**：去重 surfaced 既有分歧——`isGameEvent` 旧在 save.ts 用 loose `isRecord(pattern)`、replay-codec 用 strict `isPattern`；无法在单一函数同时保两种语义，执行方统一为 **strict `isHandPattern`**，收紧 save 校验。合法存档（serializeSave 出的 pattern 必为合法 HandPattern）与 642 测试均不受影响，属安全改进，非「逐字等价」——架构采纳。
- **M6-G21 `b0bbd41`**：trackPlayed 返回 `Object.freeze`（值不变）+ straightLength 显式 reset（输出不变·去枚举顺序隐式依赖）+ evaluateHand 权重具名（公式不变）。

**🔁 changes-requested：M3-68-screen-view-drop-cues（spec 缺陷·我方）**
- 执行方按 spec 移除了 `deriveScreenVM` 的 `recentEvents` 入参，但**调用方 `game-scene-skeleton.ts:284` 仍传 `recentEvents:`**——caller/callee 不匹配（任一 full typecheck 该组件即 TS2353 excess-property）。测试 green 是**假阴性**：test tsconfig 在 `test/` 下 `include:["**/*.ts"]`，仅编译 `test/**` + 被测试 import 的文件；**无测试 import game-scene-skeleton**（cc 组件），故不在 test tsc 程序内、错误未暴露。
- **根因是 M3-68 任务书写错**（误写「调用方无需改」——把 `cues` 输出与 `recentEvents` 输入混为一谈）。已订正 spec。
- **修法（择一·已写进 spec）**：**A.** 保留 `recentEvents` 入参类型（仅删 `cues` 字段 + map/filter + `cueForFlowEvent`/`CueId` import），caller 零改、自洽于纯岛；**B.** 删入参 + 同步删 `game-scene-skeleton.ts` 调用处 `recentEvents:` 一行（touch cc 组件·需 Creator 复核）。建议 A。

**⚖️ 契约裁决：M6-G18 的「resume-settled 是否进 replay」→ 裁定 NO**
- 冲突：M6-G18 实现把 `'settled'` 也纳入 `isReplayableStartupEvent` → resume-settled 首订阅者收到 `settled`；但既有 `test/flow/runtime-resume-phases.test.ts:143` 断言同场景 `events=[]`。
- **裁决：settled 不进 replay，既有测试正确，撤销 G18 finding #2。** 理由：① replay 机制目的是让晚挂载的首订阅者补回构造期 `'deal'` 以驱动初始渲染；② resume 一个**已结束**的局重放 `settled` 事件 = 重新触发胜负 cue（音效/动画），**重开已完成对局时再播一次胜利动画是错的**；③ 结算面板本就由 `settlement()` 访问器 + `onSettled` 提供，不依赖事件流；④ 现行 save 仅在 enterPlaying 落盘（永不 settled），resume-settled 实际不可达，所谓「盲区」非真缺陷。
- **要求执行方**：把 `isReplayableStartupEvent` 改回 **仅 `'deal'`**；**保留** #1 `terminationDetail()`（已正确实现）与 #3 `replayClosed` 机制（与既有测试兼容）。改后 full suite 应转绿。spec 已更新。

**✅ 返工复审（2026-07-01·两分支均通过并入 main）**
- **M6-G18 `1e5fa96`**：`isReplayableStartupEvent` 已改回仅 `'deal'`；resume-settled 维持 `events=[]`（既有 resume-phases 测试未改且过）；保留 `terminationDetail()` + per-subscriber deal replay；未碰 `flow/types.ts`。新增 `round-runtime-diagnostics.test.ts` **锁定契约**（`不重放 settled`/`每订阅者补 deal 一次`/`terminationDetail 返回原始 error`）——未来若再把 settled 塞回 replay 会被此测试拦下。独立复跑 648 绿·typecheck 净。
- **M3-68 `ffdb66d`**：采方案 A——`deriveScreenVM` 保留 `recentEvents: FlowEvent[]` 入参类型（不再使用），caller `game-scene-skeleton.ts` 经 diff 确认**零改**、无 TS2353；仅删 `cues` 字段/映射/`cueForFlowEvent`·`CueId` import；测试去 cues 断言、其余覆盖不减。独立复跑 645 绿·typecheck 净。
- **合并后 main = `ffdb66d`：132 files / 648 tests 绿·typecheck 净·纯层零 cc。第十六批仅剩 M4-42（产品 gated）未动。**
- **2026-07-01 产品解 gate → M4-42 翻 ready 并派发**（与发布收尾文档「两条并行」）：分支 `task/M4-42-hard-ai-depth` 建于 `0960a4a`（纯 spec·无种子测试·实现方自写 selfplay 验证）；同批架构落发布收尾——第十六批 deferred refactors（#1/#10 拆分 · #4 legalFollows 剪枝 · #6 save 双序列化）已补登 `docs/KNOWN_LIMITATIONS.md`，M6-D1 收口剩余 gate 收敛为 {ART-IMPORT 用户视觉终审, M4-42 落地} 两项。
- **2026-07-01 M4-42 审查通过并入 main `641b6a8`**（独立复核·非采信报告）：文件域仅 `ai/levels/hard.ts` + 新 `test/ai/hard-depth.test.ts` + report·未改 `_shared`/Normal 签名·无 cc；合法性（finishing 走 legalFollows/recognize·lead 走 enumerateMoves·余 conservativeAction）、确定性（不用 rng·排序带 compareMoves tiebreak）、无隐藏态（`trackPlayed([],hand)` 公开推断·守 G14）均核实。复跑 main **133 files / 652 tests 绿·typecheck 净·纯层零 cc·diff --check 净**。Selfplay Hard 地主 7/12 均分 0.83 vs Normal 基线 3/12 均分 -1.83，G15/M4-08 护栏未弱化。**第十六批 7 任务全 done。** 非阻塞观察已登记：cardMemory 消费偏浅（快照无出牌历史→`trackPlayed` 恒空 played）留待快照带 play history 后深化（见 `docs/KNOWN_LIMITATIONS.md`）。**发布收口唯一剩余外部 gate = ART-IMPORT 用户视觉终审。**

### ART-IMPORT 审查（`task/art-final-review-assets` · 提交 `9773c03` · 2026-07-01 · **changes-requested·先修后合**）
> 用户视觉终审通过（`/tmp/doudizhu-art-final-review-final/index.html` →「视觉通过，继续导入」）。架构独立复审 6/7 项过：card-back 返工去黑角/黑边且**预览↔导入字节一致**（md5 `176fd809…`）；位置正确 `art/{avatars,ui,cards,misc}/`；meta 为 Creator 3.8.8 生成、**116/116 UUID 唯一无重复**；`asset-keys.ts` 纯增键（既有 cardBack/cardTemplate/joker/cardAssetPath 未动）；reports 证据齐；worktree 复跑 **133 files / 653 tests 绿·typecheck 净·diff --check 净·无 cc**。
>
> **🔴 唯一阻塞（导入类型不符 loader 契约）**：runtime 经 `resources.load(path, SpriteFrame)` 加载美术（`lobby-scene.ts:660`、`game-scene-skeleton.ts:1273`），既有被加载资源（backgrounds/cardTemplate）均 `type:sprite-frame`。但本批 **22 个场景 sprite 被导入为 `type:texture`（无 `@f9941` sprite-frame 子资产）→ 无法作 SpriteFrame 加载**。当前无组件消费它们（故 653 绿/截图净·非活跃崩溃），但接线即失效。
> **需重导为 sprite-frame（Creator Inspector: Type texture→sprite-frame·重生 meta·勿手写）**：
> - avatars(3)：`avatar-frame`、`farmer-role-badge`、`landlord-role-badge`
> - ui(16)：`btn-{primary,secondary,disabled}`、`icon-{play,pass,hint,bid,back,settings}`、`badge-{multiplier,turn,countdown-ring}`、`emphasis-{bomb,rocket,spring}`、`panel-popup`
> - misc(3)：`badge-win`、`badge-lose`、`empty-records`
> - **可留 texture(2)**：`misc/app-icon`、`misc/splash`（build/平台设置·非 resources.load(SpriteFrame) 目标）
> **决策**：用户选「先修后合」。分支/worktree 保留待重导后重新提交；架构复验每个 meta `userData.type=="sprite-frame"` + 含 sprite-frame 子资产 + UUID 仍唯一 + 653 绿后再 `merge --no-ff`。M6-D1 sign-off 在此前不得声称美术可用。
>
> **✅ 返工复审通过并入 main `4334e81`（2026-07-01）**：返工 `37d7d24` 用 Creator asset-db（save-asset-meta + reimport）把 22 个 sprite 转 `type:sprite-frame`（真实 `@f9941` 子资产·trim 几何真实·与既有 card-template 结构逐字同型·loader 可用）；delta **严格仅 22 `.png.meta` + 1 report**（无 PNG/asset-keys/测试/纯层改动）；app-icon/splash 仍 texture；**50 meta / 50 唯一 base UUID·零跨文件碰撞·sub-uuid 均自 base 派生**；无手写痕迹/临时扩展残留。复跑 **133 files / 653 tests 绿·typecheck 净·diff --check 净·无 cc**。worktree/分支已清理。**ART-IMPORT-02/03/04/05 全部 done。发布收口最后一个 gate 关闭 → M6-D1 可执行。**

### ✅ M6-D1 发布验收记录（架构收口 · 2026-07-01）

> 结论：**通过，首版可发布**。M6-D1 按“不虚标”规则先复核支持证据，再收口 `docs/ROADMAP.md`、`docs/TASKS.md`、`docs/QA_CHECKLIST.md` 与本 BOARD。

最终落地主线：
- M4-42 困难 AI 纵深：`641b6a8`
- ART-IMPORT-02/03/04/05：`4334e81`
- M6-D1 发布文档收口：本次 release-docs 提交

构建与运行证据：
- C4 历史构建记录：`coordination/reports/M6-02-build-verification.report.md`（Creator 3.8.8，platform `web-mobile`，build success，390×844 运行截图）。
- D1 当前 main 复测：`env -u ELECTRON_RUN_AS_NODE ... CocosCreator --project /Users/admin/Documents/Cocos/斗地主 --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"`。
- 当前构建产物：`build/web-mobile/`（ignored，不入库；47M / 202 文件）。
- 当前构建配置：`build/web-mobile/src/settings.json` → `CocosEngine: 3.8.8`、`engine.platform: web-mobile`、`engine.debug: false`、`launch.launchScene: db://assets/scene/lobby.scene`、`screen.designResolution: 390×844`。
- D1 Web Mobile 大厅烟测截图：`/tmp/doudizhu-d1-lobby-launch-smoke/lobby-390x844.png`、`/tmp/doudizhu-d1-lobby-launch-smoke/lobby-412x915.png`、`/tmp/doudizhu-d1-lobby-launch-smoke/lobby-360x780.png`；链路截图：`lobby-390x844-after-new-game.png`、`lobby-390x844-pause.png`、`lobby-390x844-pause-confirm.png`、`lobby-390x844-back-lobby.png`。
- D1 CDP 摘要：`/tmp/doudizhu-d1-lobby-launch-smoke/summary.json`；三档页面标题 `Cocos Creator | 斗地主`，canvas client 尺寸分别为 390×844 / 412×915 / 360×780，均启动到 `sceneName: "lobby"` 且 `errorEvents: []`；390 档实测已有静态 `新对局` 入口可进 `game.scene`，并可经暂停退出确认回到大厅。
- D1 发布打包返工报告：`coordination/reports/M6-D1-lobby-launch-rebuild.report.md`。
- C3a 多分辨率截图：`coordination/reports/M6-C3a-{game,lobby}-{390x844,412x915,360x780}.png`。
- M6-D5 手动冒烟脚本：`docs/PLAYTEST.md`；本次 D1 执行构建态三档 smoke 作为发布验收附件，自动化多局与规则/状态机/AI 稳定性由 653 测试覆盖。

已知限制与发布后债务：
- `docs/KNOWN_LIMITATIONS.md` 已登记：`game-scene-skeleton.ts` / `round-runtime.ts` 发布后拆分、`legalFollows` profiling 触发后再剪枝、`save.ts` 双序列化后续数据层清理、Hard AI 记牌消费偏浅等。
- 本批不引入联网、账号、支付、广告或匹配；首版范围仍为完整离线单机斗地主。

#### ⚠️ M6-D1 复审（架构独立复核 · 2026-07-01 · 结论：文档 APPROVE / **发布打包 CHANGES REQUESTED**）
> 复核 `ef0f93b`：**文件域**严格 4 文档（BOARD/ROADMAP/TASKS/QA_CHECKLIST）·**不虚标**逐条核实——所有勾选项引用的证据文件真实存在（M6-C3a×3 / M3-59 / M3-65×2 截图、`M6-02-build-verification.report.md`、133/653 口径），QA_CHECKLIST 未越界声称「大厅启动/导航」；构建产物真实（47M/202·gitignore 未入库）·settings.json 口径属实·390×844 构建态渲染经**目视确认为完整游戏画面**（非黑屏·pixel sample 全黑是取样点落在暗背景所致）·三档 errorEvents 仅 390 favicon 404。**测试 133/653 绿·typecheck 净·diff --check 净·纯层零 cc**。→ M6-D1 **文档收口本身合格**。
>
> **🔴 当时发布打包 gate（复审发现）**：release 构建 `launch.launchScene = db://assets/scene/game.scene`，开机直进出牌局、**跳过大厅**；而 `docs/GAME_DESIGN.md:17` 核心循环步骤 1 = 「进入大厅」，lobby 承载难度选择/设置/战绩/历史/续局，是 v1 一等入口。且三档构建态烟测**均为 game.scene**，大厅**从未在构建态验证**。故当时**不能确认可打包/归档 v1**。
> **用户裁定（2026-07-01）**：改启动场景为 `lobby.scene` 后重构建 + 补大厅构建态烟测，再打包。
> **重构建 spec（交 Creator 环境执行）**：
> - 起始场景 UUID：`lobby.scene`=`dc62324b-10d4-4870-9518-1a34ce682067`（现 `game.scene`=`76483838-c412-4de3-83ff-2ab3f683a1cd`）。编辑器 Build 面板「起始场景」设为 lobby（或 CLI build 传 `startScene=dc62324b-...`）后 web-mobile 重构建。
> - 复验：新 `build/web-mobile/src/settings.json` → `launch.launchScene` = lobby.scene；大厅构建态三档（390×844/412×915/360×780）烟测截图渲染正常 + errorEvents `[]`（favicon 404 可忽略）；随后再走 lobby→game→结算→lobby 一次链路烟测更佳。
> - 复验通过后架构解除本 gate、把 ROADMAP/BOARD 口径回填「首版可发布」并归档 v1。
>
> **✅ 返工关闭（2026-07-01）**：已用 Creator 3.8.8 CLI 传 `startScene=dc62324b-10d4-4870-9518-1a34ce682067` 重构建 `web-mobile`；`settings.json` 已为 `db://assets/scene/lobby.scene`；三档大厅烟测 `390×844/412×915/360×780` 全部 `sceneName="lobby"` 且 `errorEvents: []`；390 档链路 `lobby → 新对局 → game → 暂停 → 退出确认 → lobby` 通过。执行方同时补 runtime-only 触摸接线，让既有 `开始新局/新对局` Label 可进入 `game.scene`，未改 scene/meta/root 配置。验证：133 files / 653 tests 绿、typecheck 净、diff check 净、纯层零 cc。证据见 `coordination/reports/M6-D1-lobby-launch-rebuild.report.md` 与 `/tmp/doudizhu-d1-lobby-launch-smoke/summary.json`。**发布打包 gate 关闭，v1 可归档。**

### 🔍 第九批合并验证（架构 · 2026-06-29 · 用户指令「验证最新次合入」）
> 结论：**第九批（L1-L4 + ART-02/03/04）合并干净，无 blocker，保持合并不撤销。**
- **客观门全绿**：`npm --prefix test test` **90 文件 / 462 全绿**；`typecheck` exit 0；纯层（`rules/game/ai/flow/data`）+ `ui/{audio-gate,animation-params,table-layout,screen-view,event-cues}` grep **零 `from 'cc'`**；`flow→data` 零 import；工作树净；新文件 `.meta` 齐全（audio-gate/animation-params）；ART 仅在 `asset-previews/`，**未污染 `assets/`**。
- **逐改动审查**：① **L4**（`round-runtime.ts` +1 行 `finishIfSettled()` 于 resume 路径）——幂等（`settledNotified` 守卫）、非 settled 即 no-op、需 `winEventFrom` 才投影、`emit(bucket?)` 容忍 undefined，正确补 resume-to-settled 缺口；② **L3**（table-layout 函数重载 + screen-view 透传 `containerHeight?`）——无参/恰 390×844 走固定布局保后向兼容，参数化路径夹取合理；③ **L1 audio-gate / L2 animation-params**——纯函数，引用的 `Settings.{sound,vibration,animation}` 与 cue id（`deal/play/bomb/rocket`）经核对**全部真实可产出**（`deal`=FlowEvent、`play/bomb/rocket`=GameEvent，经 `cueForFlowEvent` 解包一致），门控不会静默失效。
- **登记一处 latent 脆性（非 bug·转 M6-L6 优化）**：`event-cues.ts:10` `CueId=string` 零编译期保护，L1/L2 的 cue 字面量集靠人工核对正确、无机制护住 → 第十批 **M6-L6** 收紧为字面量联合 + 绿护栏。

## 第五批（15 任务 · 文件域互不相交）—— ✅ 全部已并 main

> 三路并行审计（代码优化/路线缺口/测试盲区）+ Plan agent 验证后派发。T4 已先行并入；余 14 个旧任务分支在执行前均已备份为 `backup/<ID>-seed` 并从当时最新 `main` 刷新，避免旧基线删除第六批成果。T1/T2/T5 完成后解锁 M5-13；M5-12c 的倍数正整数规则按最高权限授权直接折叠进 T1/T5。

> 已经「**加固+提升雄心**」升级（见下「第五批升级」）。红/绿态、测试数为**升级后**真实值。

| # | ID | 类型 | 实现文件域 | 分支 | 红/绿（升级后） |
|---|----|----|----|----|----|
| T1 | M5-10-resume | 功能(keystone) | `data/save.ts`、新 `game/resume.ts`、`game/index.ts` 桶 | `task/M5-10-resume` | ✅ done · 已并 main（SaveSlot 扩展、resumeRound、savedAt 整数化、bidMultiplier 正整数迁移） |
| T2 | M5-11-aggregate | 功能 | 新 `data/aggregate.ts`、`data/index.ts` 桶 | `task/M5-11-aggregate` | ✅ done · 已并 main（FlowResult→stats/records 聚合） |
| T3 | M3-01-screen-view | 功能 | 新 `ui/screen-view.ts`、新 `ui/index.ts` 桶 | `task/M3-01-screen-view` | ✅ done · 已并 main（9 UI 岛 + 第六批 view 桶导出） |
| ~~T4~~ | M5-12a-serialize-hardening | 加固(改产品码) | `game/serialize.ts` | — | ✅ **done · 已并 main `2820b8c`**（实现方 Codex：整数化+错误约定统一；审查通过，305 绿） |
| T5 | M5-12b-data-codec-hardening | 加固(**改产品码**) | `data/records.ts`、`data/statsCodec.ts` | `task/M5-12b-data-codec-hardening` | ✅ done · 已并 main（records 数值收紧；multiplier 按 M5-12c 正整数落地） |
| T6 | M3-00-table-layout-metrics | 加固(**改产品码**) | `ui/table-layout.ts` | `task/M3-00-table-layout-metrics` | ✅ done · 已并 main（LAYOUT_METRICS 提取） |
| T7 | M4-10-bid-dispatch-dedup | 加固(重构产品码) | `ai/bidding.ts`、`ai/bidding-levels.ts` | `task/M4-10-bid-dispatch-dedup` | ✅ done · 已并 main（actionForStrength 单一真相源） |
| T8 | M5-G1-core-bombs | green-guard | 新 `test/game/core-bombs.test.ts` | `task/M5-G1-core-bombs` | ✅ done · 已并 main |
| T9 | M5-G2-illegal-reasons | green-guard | 新 `test/game/illegal-action-reasons.test.ts` | `task/M5-G2-illegal-reasons` | ✅ done · 已并 main |
| T10 | M5-G3-storage-empty-string | green-guard | 新 `test/data/{save,settings}-storage-empty-string.test.ts` | `task/M5-G3-storage-empty-string` | ✅ done · 已并 main |
| T11 | M5-G4-compare-edges | green-guard | 新 `test/rules/compare-edges.test.ts` | `task/M5-G4-compare-edges` | ✅ done · 已并 main |
| T12 | M5-G5-spring-boundaries | green-guard | 新 `test/game/settlement-spring-boundaries.test.ts` | `task/M5-G5-spring-boundaries` | ✅ done · 已并 main |
| T13 | M5-G6-action-buttons-edges | green-guard | 新 `test/ui/action-buttons-edges.test.ts` | `task/M5-G6-action-buttons-edges` | ✅ done · 已并 main |
| T14 | M5-G7-conservative-paths | green-guard | 新 `test/ai/conservative-action-paths.test.ts`（仅出牌阶段，**不碰 ai/bidding*.ts**） | `task/M5-G7-conservative-paths` | ✅ done · 已并 main |
| T15 | M5-G8-driver-diagnostics | green-guard | 新 `test/flow/driver-diagnostics.test.ts`（仅 maxTurns:0+maxRedeals） | `task/M5-G8-driver-diagnostics` | ✅ done · 已并 main |

> 派发用 PROTOCOL bootstrap（`<ID>` 换上表分支名）。**会改产品码的任务：T4（serialize 整数化）/T5（records 收紧）/T6（table-layout 提取）/T7（bidding 去重）+ T1（save.ts savedAt）**——非"T5 唯一"（原 BOARD 此断言已订正）；T1/T2/T3 另含新功能填桩。**跨域提示**：T14 不得 import `ai/bidding*.ts`（T7 域）；T1 后于 T4 合并。

## M2 单局状态机（全部 done）


| ID | 模块 / 文件域 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M2-01 | game-core | **done** | 已并 main | 契约 `game/types.ts` 固定 |
| M2-02 | bidding：`game/bidding.ts` | **done** | 已并 main | 叫/抢/反抢翻倍；M2-08 纯化 |
| M2-03 | settlement：`game/settlement.ts` | **done** | 已并 main | 倍数连乘 + 春天 + 胜负 |
| M2-04 | serialization：`game/serialize.ts` | **done** | 已并 main | RoundState ↔ JSON（M5-01/M5-02/M5-02B 已加版本化+深校验+pattern 形状）|
| M2-05 | ai-baseline | **done** | 已并 main | 随机合法 AI |
| M2-06 | flow：`flow/**` | **done** | afcd864 | headless 驱动器 + 可注入时钟 |
| M2-07 | selfplay | **done** | 6ac5832 | runSeeds 复用 runHeadlessRound |
| M2-08/09/10 | bidding-pure / ai-bid / data-stats | **done** | 已并 main | |
| M-FLOW/M-FLOW-02 | flow 增强 + 出牌循环异常诊断 | **done** | merged | playPolicy + HeadlessRoundError(cause) |
| M2-07-D | selfplay 诊断消费 | **done** | b2df6d8 | runner 消费 HeadlessRoundError |

## M4 难度 AI（三档 + 强化 + selfplay + legality 护栏 done）

| ID | 模块 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M4-01/02/03 | simple/normal/hard | **done** | 已并 main | |
| M4-05 | ai 强化 `_shared`+全序+hard 压制 | **done** | merged | |
| M4-04 | 难度差异 selfplay | **done** | 815df75 | routing playPolicy + 不变量 |
| M4-04B | 难度 routing 按座位分发证明 | **done** | b775254 | buildRoutingPolicy 逐座位深相等 |
| M4-07 | 叫抢难度分层 `ai/bidding-levels.ts` | **done** | 5fe97b6 | chooseBidByLevel；Normal 委派 chooseBid |

## M5 完整单机体验（数据层推进中）

| ID | 模块 / 文件域 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M5-01 | 存档版本化 | **done** | merged | |
| M5-02 | 存档深校验 | **done** | 44b86b8 | top 必需 + 有界深层结构 |
| M5-02B | top.pattern 完整形校验 | **done** | a934a70 | length/cards/牌结构/一致性；**语义校验顺延 M5-02C** |
| M5-03 | 本地设置纯数据 | **done** | ed456c0 | Settings/default/migrate 容错 |
| M5-05 | 设置编解码 | **done** | 5aaae99 | serialize/deserialize + 复用 migrateSettings |
| M5-04 | 断局存档槽位纯模型 | **done** | 9b73391 | {version,savedAt,round}+编解码，无 IO |

## M3 手机竖屏 UI（纯逻辑岛先行，done）

| ID | 模块 / 文件域 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M3-00-hand-layout | `ui/hand-layout.ts` | **done** | 32b78bc | 390×844 居中/步距/压缩 |
| M3-00-selection | `ui/selection.ts` | **done** | f5d9252 | 选中/取消/排序纯不可变 |

## flow 策略工厂

| ID | 模块 | 状态 | 合并 | 备注 |
|----|----|----|----|----|
| M-FLOW-03 | `flow/policies.ts` | **done** | a10b8db | levelPolicies→{bidPolicy,playPolicy}；**bidPolicy 仍委派 chooseBid，切 chooseBidByLevel 顺延 M-FLOW-04** |

## 第四批（13 任务）—— ✅ 全部已并 main（下表存档；逐一评审通过：API/类型/文件域/红绿态核对无误）

> 种子已落：每任务 spec 入 main、失败测试+桩在各自分支（14 分支独立 typecheck 绿、种子测试红；M4-08 为绿护栏锁不变量）。文件域两两不相交，可同时认领。spec 见 `coordination/tasks/<ID>.md`。**优先级**（执行者建议+架构认同）：第一波 `M-FLOW-04`/`M5-02C`/`M5-06`/`M5-07`（接主线「可玩 UI + 可保存」最快）；第二波 `M3-00-card-view/table-layout/action-buttons`；其余 M3-00 视图模型 + M2-11/M4-08/M5-08/M5-09 可同批。

| ID | 实现文件域 | 依赖 | 分支 | 备注 |
|----|----|----|----|----|
| M5-02C | `game/serialize.ts` | M5-02B | `task/M5-02C-serialize-pattern-semantic` | `recognize(cards)` 与声明 pattern 比对（评审意见 #1 语义层）|
| M-FLOW-04 ✅**done** | `flow/policies.ts` | M-FLOW-03+M4-07 | 已并 main `a2f4828`（**未走分支**：实现方直接落 main） | bidPolicy 切 `chooseBidByLevel`（评审意见 #5 闭合）；分支 `task/M-FLOW-04-bid-level-policy` 已废弃 |
| M5-06 | `data/settingsStorage.ts`（新；桶已加）| M5-05 | `task/M5-06-settings-storage-adapter` | 设置 load/save/remove 注入 StorageLike，无浏览器依赖 |
| M5-07 ✅**done** | `data/saveStorage.ts` | M5-04 | 已并 main `4c92572`（**未走分支**：实现方直接落 main） | 槽位 load/save/remove；损坏抛错（区别设置）；分支 `task/M5-07-save-storage-adapter` 已废弃；StorageLike 仍自含，待 M5-06 并后统一 |
| M5-08 | `data/statsCodec.ts`（新；桶已加）| M2-10 | `task/M5-08-stats-codec` | 战绩 JSON 编解码 + 容错迁移 |
| M5-09 | `data/records.ts`（新；桶已加）| M2-03 | `task/M5-09-records-model` | 对局历史纯模型（追加/裁剪/倒序/迁移）|
| M3-00-card-view | `ui/card-view.ts`（新）| — | `task/M3-00-card-view-model` | Card→assetKey/rankLabel/suitKey/sortKey |
| M3-00-table-layout | `ui/table-layout.ts`（新）| — | `task/M3-00-table-layout` | 390×844 各区坐标纯模型 |
| M3-00-action-buttons | `ui/action-buttons.ts`（新）| selection+rules | `task/M3-00-action-buttons` | 出牌/过牌/提示 enabled 推导 |
| M3-00-hand-interaction | `ui/hand-interaction.ts`（新）| hand-layout+selection | `task/M3-00-selection-layout-bridge` | layout+selection 组合，选中牌上浮 |
| M3-00-bidding-view | `ui/bidding-view.ts`（新）| M2-02 | `task/M3-00-bidding-view-model` | 叫抢按钮文案/可用/座提示 |
| M3-00-result-view | `ui/result-view.ts`（新）| M2-03 | `task/M3-00-result-view-model` | Settlement→结算弹窗 VM |
| M3-00-event-cues | `ui/event-cues.ts`（新）| M2-01+M-FLOW | `task/M3-00-event-cues` | GameEvent/FlowEvent→动画/音效 cue id |
| M2-11 | `game/replay.ts`（新；桶已加）| M2-01 | `task/M2-11-replay-trace` | 事件流→可复盘 trace + 摘要 |
| M4-08 | `test/ai/legality-matrix.test.ts`（新·绿护栏）| M4 三档+rules | `task/M4-08-ai-legality-audit` | 三档 AI 合法性不变量审计（已绿，锁回归）|

> 互斥实现域：`game/serialize.ts` ｜ `flow/policies.ts` ｜ `data/{settingsStorage,saveStorage,statsCodec,records}.ts` ｜ `game/replay.ts` ｜ `ui/{card-view,table-layout,action-buttons,hand-interaction,bidding-view,result-view,event-cues}.ts` ｜ `test/ai/legality-matrix.test.ts`。桶导出由架构在各分支内随种子提交（M5-06/07/08/09 共用 `data/index.ts` 加不同行、M2-11 改 `game/index.ts`——合并时一行接一行，无冲突）。M5-07 独立定义 `StorageLike`（与 M5-06 同形），合并时由架构统一为单一真相源。

## 评审遗留处理（本批 · 执行者 5 意见）
- **#1 top.pattern 偏浅** → M5-02B 已补**形状**；**语义**层（recognize 比对）→ 开 **M5-02C**。
- **#2 save wire format 未钉死** → ✅ **已落实（`05a3ae9`）**：`serializeSave` 恒写 `SAVE_VERSION`（不再透传 `slot.version`），与 `deserializeSave` 归一对称、自洽闭环；非法 JSON 归一为 `corrupted('invalid JSON')`。**遗留**：「`slot.version≠SAVE_VERSION` 仍输出 `SAVE_VERSION`」尚无专用回归断言（见「整合后待办」）。
- **#3 非法 AiLevel 静默保守化** → M4-07 非 Hard 落 Simple 阈值；记入后续改 exhaustive switch 或由 settings 层保证（低优先，type 层已挡）。
- **#4 hand-layout 输入域理想化** → ✅ **前置条件守卫已并 main（`aaac57f`）**：非法 `count`/尺寸、`count>1` 且 `cardWidth>containerWidth` 一律抛错。**遗留**：throw 路径尚无测试（见「整合后待办」）。后续 UI 纯函数 spec 模板仍统一要求提前定义异常输入。
- **#5 M-FLOW-03 未接 M4-07 易遗忘** → 立即开 **M-FLOW-04** 集成任务。

## 规划者优化（本批落实，写入后续 spec 模板）
- 数据 wire task 写清：canonical 输出 / 兼容输入 / 错误前缀 / 是否 normalize version（M5-04/05/08 spec 已含）。
- 新脚本合并后由架构统一补 `.meta`（本批已补 7 个）。
- 「测试 helper 位于 `test/**`」任务标注：可改 helper、不可改断言测试（M4-04B/M4-08 spec 已注明）。
- 故意拆「不接入」任务时同步开 integration task（M-FLOW-03↔M-FLOW-04 已配对）。
- UI 纯逻辑岛提前定义坐标系/异常输入/浮点误差/目标尺寸（第四批 UI spec 已含 PORTRAIT 390×844、入参不变、整数坐标等）。

## 派发记录
- 第三批按序 `merge --no-ff` 入 main：M5-05→M5-04→M5-02B→M4-04B→M4-07→M-FLOW-03→M3-00-hand-layout→M3-00-selection（121→160 绿）；M5-04 合并冲突（`data/index.ts` 两行）已解；8 worktree+分支已清理；7 个新脚本 `.meta` 已补提。
- 第四批（15 任务）：**种子已落、全部 ready**（15 spec 入 main `5ca731f`；各分支含失败测试+桩+桶导出，独立 typecheck 绿；14 红护栏 + M4-08 绿护栏）。按 PROTOCOL bootstrap 提示词（把 `<ID>` 换成上表分支名）派发到各实现方窗口。
- **第四批种子评审（规划者复核，派发前）**：逐一核对 15 个 spec×branch 的公共 API/类型/文件域/桶导出/红绿态与 main 实际代码。修正两类问题，**测试为契约一律未改**：
  - 结构：**M5-09 分支漏了 `data/index.ts` 桶导出**（其种子 commit 消息写了「data 桶导出」却未落地，且测试只直引 `./records` 故无测试能发现）→ 补 `export * from './records';`，amend 入种子 `f7e2e29`，分支 typecheck 仍绿。
  - 文案：4 处 spec 与实际 API 不符（种入的测试本身是对的）→ ① `M3-00-action-buttons`/`M4-08` 把 `validatePlay(...).valid` 更正为 `.ok`（`RuleResult.ok`）；② `M3-00-result-view` 删去并不存在的 `winner` 入参说明，改为「按 `settlement.scores[heroSeat]` 符号判胜负」；③ `M3-00-card-view` 更正「双王 rankLabel 与 RANK_LABEL 一致」的错述（`RANK_LABEL` 中王为 `'x'/'X'`）。
  - 复核后 main 仍 **160 绿**；其余 11 个种子（含 M-FLOW-04 不破坏既有 `policies.test.ts`、M5-02C/06/07/08 等）核对无误。
- **第四批首批整合（实现方直接落 main、架构复核后拆分提交）**：M5-07 saveStorage（`4c92572`）、M-FLOW-04 bidPolicy 分层（`a2f4828`）按任务拆独立提交；另含两项**超域整合项**——save canonical wire（`05a3ae9`，闭合 #2）、hand-layout 输入守卫（`aaac57f`，闭合 #4）。实现方**未走 worktree/分支、直接改 main 工作区**（不合 PROTOCOL），架构复核后按文件域拆 4 commit 落盘：种入测试逐字未改、`.meta` 由编辑器生成（UUID 唯一）、`38 files / 168 tests` 全绿、typecheck 净、无 cc。**废弃分支** `task/M5-07-*`、`task/M-FLOW-04-*` 已**删除**（worktree 移除 + 分支 `-D`）：经核对其分支产物与 main 等价（M5-07 `saveStorage.ts` 与 main 逐字相同；M-FLOW-04 分支劣于 main 已审版本），main 为唯一真相源，避免双份 `merge`。
- **整合后待办 → 已全部闭合**：①→M5-04B、②→M3-00-hand-layout-guards、③④→M-FLOW-05、⑥→M4-09 均已并 main；⑤ `StorageLike` 统一在第四批合并时**随手闭合**（M5-06+M5-07 共存触发 TS2308，按 M5-07 spec 既定方案统一到 settingsStorage 单一源）。
- **第四批 + 优化批合并（架构评审后批量并入）**：17 分支逐一审范围/实现/红绿，再 `merge --no-ff` 入 main（168→**296 绿**）。先并 14 个无桶冲突任务，后并 3 个 data 桶任务（M5-09 桶冲突解为 8 导出并存）；集成期补一处架构修复（StorageLike 统一，`save-storage` 测试同步改 import 源）。`.meta` 11 个补提、17 worktree+分支清理。**实现方均规范走 worktree/分支 + 落 report**，文件域零越界、种入测试零篡改。

## 优化批（4 任务）—— ✅ 全部已并 main

> 由「整合后待办 + 执行方评审建议」转化。spec 入 main `51e3af5`；4 分支已建于 main HEAD。**M4-09** 含失败测试+桩（`1b5531b`：typecheck 绿、`bidding-strength` 3 红、余 168 绿）；其余 3 个为**测试补全/维护型**（行为已实现，分支=main HEAD 无桩，实现方新建/就地改测试应直接全绿）。派发用 PROTOCOL bootstrap（`<ID>` 换分支名）。

| ID | 类型 | 实现文件域 | 分支 | 备注 |
|----|----|----|----|----|
| M5-04B | 绿护栏(测试) | `test/data/save-wire.test.ts`（新） | `task/M5-04B-save-wire-regression` | 锁 canonical wire（`05a3ae9`）：version 归一输出 + invalid JSON |
| M3-00-hand-layout-guards | 绿护栏(测试) | `test/ui/hand-layout-guards.test.ts`（新） | `task/M3-00-hand-layout-guards` | 锁输入守卫（`aaac57f`）throw 路径 |
| M4-09 | 重构 | `ai/bidding.ts` + `ai/bidding-levels.ts`（+`test/ai/bidding-strength.test.ts`） | `task/M4-09-bidding-strength-helper` | 抽 `isStrongHand` 单一真相源 + 阈值 exhaustive；既有 bidding 测试须保持绿 |
| M-FLOW-05 | 测试/文档维护 | `test/flow/policies.test.ts`（**例外授权改指定断言**）+ `tasks/M-FLOW-04-*.md` | `task/M-FLOW-05-bid-test-align` | 低优先：断言改述 `chooseBidByLevel`、spec #3 文案对齐 |

> 文件域与在跑的 13 个第四批任务**互不相交**（M4-09 的 `ai/bidding*.ts` 无人占用；测试新增文件独立）。M-FLOW-05 为唯一「改既有测试」任务，spec 已**显式授权**且限定就地改一条断言。

## 第五批派发记录
- **种子已落、全部 ready**（15 spec 入 main；15 分支建于 main HEAD，各领先 1 commit）。三路并行审计（代码优化/路线缺口/测试盲区）+ Plan agent 验证文件域不相交、类型接地、合并时序后派发。
- **逐分支红绿态（升级后已重新验证）**：T1/T2/T3/T4/T5/T6 为红（typecheck 绿、种入测试红、main 基线绿）；T7/T8–T15 为 green-guard（全绿，锁现码）。main 仍 296 绿、typecheck 净。⚠️ 原记「T4 为 green-guard」**有误**，见下「升级」。
- **核查修正（种子质量门·派发前）**：① T1 新 `SaveSlot` 字段定 **optional**（否则既有 `save.test.ts:30` 字面量编译失败，不可改）；③ T6 `LAYOUT_METRICS` 桩用空对象+派生断言（`typeof null==='object'` 陷阱）；④ T13 `hint` 用例手牌须含 2(15) 压 A(14)；⑤ T12 无春用例须地主赢+农民≥1 手。**T1 须后于 T4 合并**（resume 依赖 serialize 错误约定）。〔原 ② 关于 T4「现码已拒非整数」的判断**作废**——见下「升级」false-green 修正。〕

## 第五批升级（加固+提升雄心 · 已落各分支）

> 用户指令「全面升级」。逐分支审计 spec×种子×main 真实代码后，**修 2 个会阻断实现方的 false-seed bug** + 富化全部 15 任务测试契约。各分支已 +1 升级 commit；main 同步 12 个升级 spec + 本 BOARD/TASKS。**main 仍 296 绿、typecheck 净**（未动 main 产品码/测试）。

- **🔴 false-green（T4）**：`serialize-integer-fields.test.ts` 的 `roundWith` 产出**裸 round**（非 `{version,state}` wire），`deserializeRound` 先因 "missing version" 抛错，永远到不了整数校验——`2.5/1.5` 两条「应抛错」因**错误原因**变绿。这正是原 BOARD 误把 T4 当 green-guard（note ②「现码已拒非整数」）的根因：跑见绿即误判。**已修 helper**（版本化包裹）→ 2.5/1.5 真红，逼 `assertNonNegativeNumber→Integer`。T4 实为「红 + 改产品码」。
- **🔴 false-red（T5）**：「各字段缺失→默认」测试传 `winner:'landlord'`（合法）却断言 `'farmer'`，`sideOrDefault('landlord')==='landlord'` 故**永红无解**——实现方收紧数值后该条仍红、不可改测试 → 阻断。**已修**为缺省 winner（→farmer）+ 合法/非法对照。原「8 红」订正为 **7 红**。
- **🟡 漏种文件（T1）**：spec 验收承诺的 `save-resume-fields.test.ts` 从未种入、`resume.test` 无 savedAt 断言、种子 `save.ts` 未收紧——「savedAt 整数化」形同空文。**已补该文件**（2 红逼收紧 + 4 绿 canonical wire 护栏）。
- **提升雄心**（均已跑验证·红绿态见上表）：green-guard 补边界（炸弹压制序/四带二非炸/INVALID_PATTERN+CANNOT_BEAT/炸弹倍数+得分符号/play:true 正例/诊断字段/redeal 子态/空白坏 JSON）；T14 软断言「可能/以代码为准」→**确定值**（pressing 对手 2→出 K、3→出 5）；功能 T2/T3 补语义契约（stats 胜负计数+netScore 符号 / 空 VM+保序+入参不变量），各 4→8 红。
- **spec 文案订正**：T6 魔法数列表补 45/55；T4 行号 121→121–127；多处验收按真实红绿态重写。

- 按上「第五批派发表」+ PROTOCOL bootstrap（`<ID>` 换分支名）派发到各实现方窗口。会改产品码者见上表注。

## 第五批合并记录
- **T4 / M5-12a ✅ 并入 main `2820b8c`**（实现方 Codex，worktree 规范）：`serialize.ts` 两数值字段 `assertNonNegativeNumber→assertNonNegativeInteger`、`assertVersionedSave` 4 处裸 `throw` 统一 `fail()`。审查：文件域仅 `serialize.ts`(+report)、未碰测试/签名、无 cc；worktree 与并入后 main 均 **56 文件 / 305 用例全绿、typecheck 净**。worktree+分支已按 PROTOCOL 清理。**T1（resume）合并前置已满足**（T4 先行）。
- **余 14 ready + 解锁 M5-13 ✅ 批量并入 main（Codex）**：先备份并刷新旧任务分支，避免旧基线删除第六批成果；逐任务提交并 `merge --no-ff` 入 main。完成 M5-10/M5-11/M3-01/M5-12b/M3-00-table-layout-metrics/M4-10 与 M5-G1..G8；随后解锁并完成 M5-13。M5-12c 不再单独开冲突分支，按用户授权折叠进 M5-10/M5-12b。最终验证 **79 测试文件 / 416 用例全绿、typecheck 净、无 cc 泄漏**。

## 第六批（后续派发 · 纯 spec 模式 · 规划者派发）

> 用户指令「派发后续任务·尽可能多·架构不写代码」。**纯 spec 派发**：架构只出任务定义（API 契约/文件域/验收/依赖），**不种失败测试/桩**；实现方按 spec 自写 vitest 测试 + 实现。所有新文件 **import 直引、不改 `index.ts` 桶**（架构合并时统一补桶导出，避免桶冲突）。文件域经核对：6 个 ready 任务两两不相交，且与第五批在跑的 14 任务不相交。spec 入 main `f829a91`。

### ✅ 已并 main ×6（`2e4cc93` · `merge --no-ff` 各分支 · 纯 spec：实现方自写测试+实现）
> 审查：6 个新文件均纯函数、零 `cc`、文件域无越界（仅各自新文件 + 自写测试 + report）；导入符号全部对齐 main 真实类型（`AiLevel` 枚举、`isBombLike(category)`、`compareMoves`、`Settings`/`RecordEntry`/`SaveSlot`/`MatchStats` 形状均核对）。各分支基于「本地 BOARD 旧版」的改动已在合并时丢弃（保留 main BOARD 字节不变）。并入后 main **62 文件 / 336 用例全绿、typecheck 净**（+6 测试文件 / +31 用例）。worktree + 分支已按 PROTOCOL 清理。

| ID | 类型 | 文件 | 审查要点 |
|----|----|----|----|
| M5-15-difficulty-config | 数据 | `data/difficultyConfig.ts` | 三档配置 + `difficultyConfig()`/`difficultyOptions()`，非法 level 回 Normal |
| M3-20-stats-view | UI-VM | `ui/stats-view.ts` | `deriveStatsView`：胜/负/胜率/净分标签，rounds=0→0% |
| M3-21-records-view | UI-VM | `ui/records-view.ts` | `deriveRecordsView`：倒序行 VM + 可选 limit（≤0→空） |
| M3-22-settings-view | UI-VM | `ui/settings-view.ts` | toggles + 不可变 `toggleSetting`/`setDifficulty` |
| M3-23-lobby-view | UI-VM | `ui/lobby-view.ts` | `deriveLobbyView`：续局标签 + 战绩摘要 |
| M4-20-hint-suggest | ai | `ai/hint.ts` | `hintSuggestions`/`nextHint`：炸弹靠后稳定序、循环回绕、未碰 bidding |

> ⚠️ **桶导出待补（架构 follow-up · 非阻塞）**：6 模块按 spec 未入各自 `index.ts` 桶（测试均 import 直引、不影响绿）。桶统一导出留作架构整合步——见「后续」。

### ✅ 解锁并闭合 ×2
| ID | 文件 | 结果 |
|----|----|----|
| M5-13-persist-session | `data/session.ts`（新） | ✅ 已在 T1(resume)+T2(aggregate) 并 main 后解锁并并 main；新增 `persistRound`/`restoreRound`/`commitFinishedRound` |
| M5-12c-multiplier-positive | `save.ts`+`records.ts` | ✅ 按用户最高权限授权折叠进 T1+T5：`bidMultiplier`/`multiplier` 合法域统一为正整数（≥1），非法回退 1 |

### 🟢 产品决策 · M5-12c 倍数下界（架构据 RULES 拍板 · 2026-06-27）
> 用户授权架构自行决策并执行。

- **决策：倍数（`multiplier` / save `bidMultiplier`）合法域 = 正整数（≥1）；下界 = 1。**
- **依据**：RULES.md「倍数从 1 起；叫地主=1、每抢/反抢翻倍、每炸/火箭翻倍、春天/反春天翻倍——最终为各来源连乘」。倍数是若干 **≥1 因子的连乘，永不为 0**，故 `0`/负/小数/非数均非法。
- **非法值处置：统一回退默认 `1`**（不标 corrupted）——与 codec 层既有宽松迁移一致（`records.ts` 已 `finiteNumberOrDefault(value.multiplier, 1)`）。**解决 spec 中 save `bidMultiplier:0` 的「corrupted vs 回退」二选一 → 取回退 1。**
- **效果**：M5-12c 已闭合。执行时未再单独建冲突分支，而是按用户授权直接折叠进 T1(save `bidMultiplier`) 与 T5(records `multiplier`)：`0`/负数/小数/非数均迁移回默认 `1`。

### 🔍 第六/五批合并后对抗式审查（2026-06-27 · 架构 6 维审查 workflow · 36 agent / 25 确认 / 4 驳回）
> 用户指令「检查优化后合并代码」。实测：第五批 15 + M5-13 + M5-12c 已由实现方 Codex 全部 `merge --no-ff` 入 main（`57fff44`），工作树净、**79 文件 / 416 用例全绿、typecheck 净、纯逻辑层零 `cc`、无运行时环**——**main 本身可发布**，无 blocker。架构对 `b511c08..main`（14 产品文件 / +296−26）跑 6 维（正确性/数据完整性/分层/契约/边界/测试覆盖）对抗式审查 + 逐条验证 + 完整性 critic。**25 条确认均为 latent（无产品调用方走 resume/commit 流），0 blocker / 0 high-correctness**。按「不写代码」约束，**未自改产品码**，转为登记架构债 + 派发 M5-14 修正任务。

**审查结论分级（确认项·均经独立 agent 验证 grounding）**
- **分层违规（架构 spec 缺陷·非实现方过错）**：① `game/resume.ts:5` `import type { SaveSlot } from '../data/save'`（game→data type 边，违反「game 只依赖 rules」）；② `data/aggregate.ts:5`+`data/session.ts:5` `import type { FlowResult } from '../flow'`（data→flow type 边）；③ `data/session.ts:6` `import { resumeRound } from '../game'`（data→game 运行时边）。**均为本架构 M5-10/M5-13 spec 明确指派写出**——是 spec 缺陷，非 Codex 过错。无运行时环（game→data 仅 type-only 擦除；data→game serialize 既存）。→ **派发 M5-14 修正**（DTO 上移 + 窄输入 DTO）。
- **校验缺口（medium·latent）**：① `data/save.ts` `deserializeSave` 对 `events` 仅 `Array.isArray`+裸转 `as GameEvent[]`，**无元素校验**（与已收紧的数值字段不对称）；② `data/statsCodec.ts` unknown-version 静默 `emptyStats()` 丢弃全部战绩，**注释辩「可推导」不成立**（records 无胜负方归因，version 恒 1 故 latent）；③ `data/session.ts` `commitFinishedRound` **非原子**（stats→records→清槽，中途失败重试双计 stats）；④ `loadRecords` 损坏静默吞历史（与 save 槽「损坏抛错」不一致）。→ 均入 M5-14。
- **low/nit（登记·不入紧急修）**：`resume.ts` heroSeat 缺省回退 `round.landlord`（spec 强制、test 锁；latent）；`screen-view.ts` `landlord ?? 0` settlement-without-snapshot 误标（无产品调用方，留编辑器阶段）；records 写入裸 `JSON.stringify` 与读 `migrateRecords` 不对称；`ui/index.ts` 导出 14 模块而 M3-01 spec 写「10」（实现方 report 已自披露，无功能影响）；`M5-10-resume.md` 验收 #48 文案 stale（代码正确遵循 M5-12c）。
- **驳回 4 条（审查噪声·记录备查）**：`playedAt:0`/`savedAt:0` 哨位混淆（无调用方传 0、属既定 fallback 语义）；`bidding-levels` Normal 不再委派 chooseBid（M4-10 去重**正确**、非缺陷）；session commit 仅在已 persist 后测（测试覆盖充分性误读）。
- **完整性 critic 补强**：cc 规则经独立 grep 显式确认（零泄漏）；`ai/` 波（M4-10 三文件）行为保持已验证；events-Validation 的「→settle 错算」叙事在 HEAD 不成立（resume 无产品消费方）；`data→ai` 既存边（difficultyConfig）非本批引入。

### 📋 M5-14 持久化层分层校正 + 校验/原子性加固（架构债收口 · ✅ 已验收并并入 main `578d378`）
- 派发 M5-14（`coordination/tasks/M5-14-resume-layering.md`），实现方 Codex 完成，架构验收通过并 `merge --no-ff` 入 main。
- **验收结论**：① **分层修复落地**——`grep game→data` / `data→flow` 在 main 上**零命中**；`ResumePayload`/`RoundFinishInput` 两 DTO 上移到 `game/types.ts`，`resumeRound` 改收 `ResumePayload`，`data/save.ts` 加 `toResumePayload` 投影，`aggregate`/`session` 改用 `RoundFinishInput`（去 `FlowResult`）；② **events 逐元素校验**——`parseEvents`/`isGameEvent` 5 种违规形态（null/未知 type/seat 非法/side 非法/play 缺 pattern）均 `corrupted` 抛错并测；③ **commit 幂等原子**——`removeSave` 先行 + 记录级 `sameRecord` 去重，注入 `setItem` 失败重试不双计 `stats.rounds`（测覆盖）；④ **records 对称**——`serializeRecords`（过 `migrateRecords` 规范化）与读对称；⑤ **损坏可观测**——`loadRecords` 损坏 `console.warn`（禁 cc）区分 absent/corrupt。
- **遗留 follow-up（低·仅文档）**：spec 验收 C-② 的 `statsCodec.ts` 误导性注释（「stats are derivable」**不成立**）未改——实现方 report 自披露「不在文件域·未改」（spec 列了但漏做）。行为已由既有 `stats-codec.test.ts:42-43` 锁（unknown-version→emptyStats），故仅**一行注释订正**未做。登记为 `M5-14-followup-statscodec-comment`（待派发·纯文档改 1 行，可并入下一批）。

### 编辑器阶段 backlog（M3 UI 主体 · import cc · 编辑器执行者 · 依赖 T3 screen-view + 各 view-model）
> 进 Cocos 编辑器建场景/预制体/组件，绑定既有 view-model（组件变薄）。**不走 worktree 纯逻辑协议**，需专门 spec + 编辑器操作。
- **M3-29 / M3-30 / M3-31 已在第七批派发**（见下「第七批」）。
- 仍 backlog：**M3-32** 手牌交互组件（绑 hand-interaction）｜ **M3-33** 操作按钮+提示组件（绑 action-buttons + M4-20 hint）｜ **M3-34** 结算弹窗（绑 result-view）｜ **M3-35** GameEvent/FlowEvent→动画/音效驱动（绑 event-cues）｜ **M3-36** 390×844 适配回归。

### M6 发布前打磨 backlog（待 M3 主体落地后）
- **M6-01** 异常流程检查清单 ｜ **M6-02** 构建验证 + 发布验收记录 ｜ **M6-03** 性能/移动端适配回归。

## 第七批（编辑器集成 + 运行时桥接 · 规划者派发 · 2026-06-27）

> 从「纯逻辑并行 worktree」切到「编辑器集成 + 运行时桥接」，目标跑通第一版可玩闭环：大厅→新局/续局→游戏桌面→操作/AI→结算→本地保存。计划见 `~/.claude/plans/main-noble-starlight.md`，已据仓库现状核对，**premises 全部成立**（main 净、82/422 绿、所引文件签名一致、6 个新号在 `tasks/` 不存在）。

**执行路径**：① 两 worktree 纯逻辑**并行**（M5-20 runtime/storage、M5-21 flow 门面）；② 单分支 `task/M3-editor-integration` **串行**编辑器三任务（M3-29→30→31，单写者保 .meta UUID 一致）。M5-14-followup 为独立微任务。

**对原计划两处订正（架构据分层硬律 + 用户指令落定）：**
- **M5-21 resume 签名**：计划草案 `resumeRoundRuntime(storage, keys, config)` 会逼 flow→data 运行时 import（调 `restoreRound`），违反计划自定的「flow→data 仅 type」硬律。**改为** `resumeRoundRuntime(resume: ResumeSnapshot, config)`——组合根先 `restoreRound` 再传入。结果 flow→data **零 import**（优于「type-only」）。persist/commit 仍走注入回调（`persist`/`onSettled`，类型 `RoundFinishInput`）。
- **编辑器三任务派发对象**：计划写「architect-only 亲自推进」；按用户指令「规划者不写代码、全部派发执行者」，**改为派发编辑器执行者**（需 Cocos Creator）。单写者约束由「单分支 + 单执行者串行」保证，不再由架构自做。

| ID | 类型 | 实现文件域 | 分支 | 状态 |
|----|----|----|----|----|
| M5-14-followup-statscodec-comment | 纯文档(1 行) | `data/statsCodec.ts` 注释 | `task/M5-14-followup-statscodec-comment` | ✅ **done·并 main `b51032c`** |
| M5-20-cocos-storage-adapter | runtime 桥接(import cc·薄) | 新 `runtime/storage-adapter.ts`(禁cc)+`runtime/cocos-storage.ts`(cc) | `task/M5-20-cocos-storage-adapter` | ✅ **done·并 main `d9033c3`** |
| M5-21-round-runtime-session | flow 门面(无cc·Vitest) | 新 `flow/round-runtime.ts` + 重构 `flow/driver.ts` | `task/M5-21-round-runtime-session` | ✅ **done·并 main `0f31900`** |
| M3-29-resource-baseline-import | 编辑器·资源 | `assets/resources/{art/cards,audio,fonts}` + 新 `ui/asset-keys.ts` | `task/M3-editor-integration` | ✅ **done·并 main `fc821cc`** |
| M3-30-lobby-scene | 编辑器·场景 | `assets/scene/lobby.scene` + `ui/components/lobby-scene.ts`(cc) | `task/M3-editor-integration` | ✅ **done·并 main `fc821cc`** |
| M3-31-game-scene-skeleton | 编辑器·场景 | `assets/scene/game.scene` + `ui/components/game-scene-skeleton.ts`(cc) | `task/M3-editor-integration` | ✅ **done·并 main `fc821cc`** |

> **文件域不相交核对**：M5-20=新 `runtime/`；M5-21=`flow/{round-runtime(新),driver(重构)}`；M3-29/30/31=`assets/resources` + `assets/scene` + `ui/{asset-keys(新),components/(新)}`；M5-14-followup=`data/statsCodec.ts` 注释。两两不相交。M5-20/M5-21 可真并行；编辑器三任务因共享 .scene/.meta 串行单分支。
> **硬验收**：纯逻辑层零 cc（`runtime/storage-adapter.ts`/`flow/round-runtime.ts` 零 cc，仅 `runtime/cocos-storage.ts` import cc 且**无测试 import**）；M5-21 `driver.test.ts`/`driver-diagnostics.test.ts` 重构后全绿；M5-20 对 `../data` 仅 type import、M5-21 对 `../data` 零 import；编辑器任务出 390×844 截图。
> **第二批（本批不派）**：M3-32 手牌交互、M3-33 操作按钮+提示、M3-34 叫抢/结算弹窗、M3-35 动画音效、M3-36 适配——待大厅/游戏骨架能打开后接。

### ✅ 验收并入 main（2026-06-28 · 架构 6 维审查 + 客观门）
> 4 分支逐一审范围/实现/红绿后 `merge --no-ff` 入 main（`b51032c`→`d9033c3`→`0f31900`→`fc821cc`）。文件域两两不相交、零越界、既有测试零篡改、PROTOCOL 规范走 worktree+report。

- **客观门全绿**：`npm --prefix test test` **85 文件 / 437 用例全绿**（+3 测试文件 / +15 用例：storage-adapter / round-runtime / asset-keys）；`typecheck` 净。
- **分层/cc 不变量**（整合后 grep 实测）：纯逻辑层 `rules/game/ai/flow/data` **零 cc**；cc 仅现于 `ui/components/*`(组件) 与 `runtime/cocos-storage.ts`(桥接)，均为允许层；`flow/round-runtime.ts` 对 `../data` **零 import**（守分层硬律）；`runtime/*` 对 `../data` 仅 `import type`；`test/` **零** import `cocos-storage.ts`/`ui/components/*`（故 Vitest/tsc 不触 cc）。
- **M5-21 driver 重构验证**：`flow/types.ts`（FlowResult/FlowEvent 契约）零改；`driver.test.ts`/`driver-diagnostics.test.ts`/`selfplay` 全绿——抽 step helper 后对外行为/形状不变。
- **M5-21 门面要点核对**：`resumeRoundRuntime(ResumeSnapshot, config)`（非 storage）落地；`persist` 在 `enterPlaying`(landlordDecided 后)、`onSettled` 在 `finishIfSettled`(settled 后) 各一次；dispose 后 `advanceUntilPause` 于每次 `sleep` 之后查 disposed 即返回、`emit` 守 disposed——中断正确。
- **M3 编辑器**：7 牌面 + 9 音效(WAV) + 2 字体物理导入 `assets/resources/`，.meta 由编辑器生成；`lobby.scene`/`game.scene` + 两 cc 组件绑既有 view-model；`ui/asset-keys.ts` 纯对照表（键→`resources/` 路径）；各出 390×844 截图（见 reports）。

> **遗留 follow-up**：① ✅ **已闭合**——`runtime/storage-adapter.ts`、`runtime/cocos-storage.ts`、`flow/round-runtime.ts` 及 `runtime/` 文件夹 .meta 由运行中的 Cocos 编辑器在合并后**自动生成并已提交**（`typescript`/`directory` importer、唯一 uuid，非手写）。② 音效为 WAV（mp3 转码 follow-up，见 M3-29 report）；实际播放置 M3-35。③ `ui/index.ts` 桶未导出 `asset-keys`（测试直引，不阻塞·架构整合步补）。

## 第八批（M3 交互层 + 文生图美术生成 · 规划者派发 · 2026-06-28）

> 两条独立轨道并行：**A** 让游戏从「能打开」到「能玩通一整局」；**B** 让 Codex 文生图把占位美术升级为 production 预览包。文件域不相交（A=`assets/scene`+`ui/components`；B=`asset-previews/`），可同时派发给不同执行者。

### 轨道 A · M3 交互层（编辑器执行者 · 串行 `task/M3-interaction` · 单写者保 game.scene 一致）
> 建立在 M3-31 骨架 + M5-21 `round-runtime` + M5-20 `cocosStorage` + M5-13 `session` + 各 view-model 之上；M3-32 把 mock 门面换真实运行时（keystone），其余按序补交互。

| ID | 任务 | 依赖 | 状态 |
|----|----|----|----|
| M3-32-playable-loop-hand | 运行时接线 + 手牌交互（keystone） | M5-21/20/13 + 骨架 | **done `291b53b`** |
| M3-33-action-buttons-hint | 出牌/不要/提示 → submitPlayerAction | M3-32 | **done `291b53b`** |
| M3-34-bidding-settlement-popups | 叫抢输入 + 结算弹窗 + 重开/返回 | M3-32 | **done `291b53b`** |
| M3-35-event-cues-av | FlowEvent→cue→音效 + 轻动效 | M3-32 | **done `291b53b`** |
| M3-36-portrait-adaptation | 390×844 竖屏适配回归 | M3-32~35 | **done `291b53b`** |

### 轨道 B · 文生图美术生成（Codex 执行者 · 串行 `task/art-gen-v2` · 单执行者保风格一致）
> 输出 **只写** `asset-previews/pink-cartoon-production-v2/`，**不进 `assets/`**（导入另开任务，照 M3-29 流程）。沿用 v1 粉卡通方向 + `image_gen`/chroma-key 工作流（见 `pink-cartoon-production-v1/PROMPTS.md`）。**验收特殊**：架构只验技术规格（尺寸/透明/命名/无字），**视觉终审归用户**，过技术门后置 `in-review` 待用户拍板。

| ID | 任务 | 输出子目录 | 状态 |
|----|----|----|----|
| ART-01-backgrounds | 大厅/桌面/结算面板 | `…v2/backgrounds/` | **done `a181d45`（技术验收过·`in-review` 待用户视觉终审）** |
| ART-02-avatars | 玩家/两AI/地主农民/头像框 | `…v2/avatars/` | blocked（待用户对 ART-01 风格锚视觉确认） |
| ART-03-ui-elements | 按钮/图标/状态徽章/面板 | `…v2/ui/` | blocked（待用户对 ART-01 风格锚视觉确认） |
| ART-04-cards | 牌背/大小王/牌框 | `…v2/cards/` | blocked（待用户对 ART-01 风格锚视觉确认） |

> **派发要点**：轨道 A 用编辑器 bootstrap（worktree 开 Cocos）；轨道 B 用 Codex `image_gen` bootstrap（worktree + imagegen 技能）。两轨可并行（不同执行者）。A 内部 / B 内部各自串行单分支。
> **不阻塞关系**：A 用已导入的占位美术，**不**等 B 的 v2 产出；B 的 v2 导入与重绑是后续独立任务。

> **第八批验收记录（2026-06-29）**：
> - **轨道 A（`task/M3-interaction`）✅ 已并 main `291b53b`**：keystone `game-scene-skeleton.ts` 移除 mock 门面，接线真实 `round-runtime`+`cocosStorage`+`session`，全链路可玩通一整局（叫抢→出牌→过牌→提示→结算→重开/返回）；事件→`cueForFlowEvent`→音效+轻动效；Canvas/Widget 390×844 竖屏自适应。门控：437 绿、typecheck 净、纯层零 `cc`（仅 `ui/components/*`+`runtime/cocos-storage.ts`）、`flow→data` 零 import。worktree/分支已清理。
> - **轨道 B（`task/art-gen-v2`）✅ ART-01 已并 main `a181d45`**：三件背景（lobby-bg/game-table-bg 1080×2340 不透明、settlement-panel 900×1200 真·透明 chroma-key 抠净）+source 备查 + `PROMPTS.md` 可复现 + 技术验收 report。三方合并非冲突（main 未触碰 `asset-previews/`，零脚本/零 `assets/`/零测试影响）。架构只验技术规格通过，置 `in-review`；**视觉终审归用户**。
> - **ART-02/03/04 未交付**：执行者正确在 ART-01 风格锚处停笔，待用户对背景视觉拍板后串行续做（头像/UI 元素/牌面）。worktree/分支已清理。

## 第九批（美术串行 + M6 发布前打磨 · 规划者派发 · 2026-06-29）

> 用户决定（AskUserQuestion 回执）：① **采纳 ART-01 风格锚** → 解锁 ART-02/03/04；② **美术 + M6 并行** → 两条独立轨道。规划者用多 AI 侦察工作流（5 只读读客 + 1 设计）扫描音频/动画/移动端/发布硬化/美术续做，所有结论已对照源码逐条核验（playCue:420 已读 sound、vibration 死数据、addCard:334 双重 lift、round-runtime:121 resume-to-settled gap、asset-keys:5 cardTemplate 键名冲突）后落 spec。

### 轨道 A · 美术串行（Codex 执行者 · `task/art-gen-v2` 串行 02→03→04 · 单执行者保风格一致）
> ART-01 风格锚 `a181d45` 已被用户采纳。三规格已 Phase-0 更新：flip blocked→ready、具体引用 `v2/backgrounds/PROMPTS.md` Shared Art Direction、指明 v1 包路径、补 source/+report 约定；ART-02 厘清 role-badge vs role-avatar；ART-03 补「概念板→单图透明 sprite」升级；**ART-04 命名对齐 card-template.png（与 `asset-keys.ts:5` cardTemplate 键一致，否则导入断）**。

| ID | 任务 | 输出子目录 | 状态 |
|----|----|----|----|
| ART-02-avatars | 头像/两AI/地主农民徽章/头像框 | `…v2/avatars/` | **done `6eb8995`**（6 张·256²/128²·全透明·`in-review` 待用户视觉终审） |
| ART-03-ui-elements | 按钮/图标/状态徽章/面板（单图透明 sprite） | `…v2/ui/` | **done `6eb8995`**（15 张·240×96/96²/128²/900×1100·全透明·`in-review`） |
| ART-04-cards | 牌背/大小王/牌框（card-template 命名对齐） | `…v2/cards/` | **done `6eb8995`**（4 张·400×560·card-template 命名对齐·`in-review`） |

### 轨道 B · M6 发布前打磨（拆两组：纯逻辑 worktree 并行 + CC 编辑器串行）
> 纯逻辑组 L1-L5 架构已 seed 失败测试（先红后绿），文件域两两不相交（仅 L1/L2 共享 `ui/index.ts` 桶→串行 merge 解决）。CC 组 C1-C4 串行单写者于 `task/M6-editor`（共享 keystone `game-scene-skeleton.ts`+`game.scene`/`lobby.scene`/`.meta`，任一并行即 UUID 冲突）。D1 文档收尾由架构在所有轨 merge 后统一写入。

#### B-1 纯逻辑 worktree 并行组（零 cc import · 失败测试先行）

| ID | 任务 | 文件域 | 状态 |
|----|----|----|----|
| M6-L1-audio-gate | sound/animation/vibration 门控决策纯函数 | `ui/audio-gate.ts`+`index.ts`+test | **done `97b0895`**（6/6 绿） |
| M6-L2-animation-params | cue→tween 参数纯映射表 | `ui/animation-params.ts`+`index.ts`+test | **done `7d93e65`**（7/7 绿·桶冲突串行解） |
| M6-L3-table-layout-resolutions | tableLayout 参数化+多分辨率 sweep | `ui/table-layout.ts`+`screen-view.ts`+test | **done `99d13b8`**（15/15 绿·兼容性铁律） |
| M6-L4-round-runtime-exceptions | resume-to-settled/redead 超限/bidding reason | `flow/round-runtime.ts`+`game/bidding.ts`+test | **done `c08de19`**（5/5 绿·+1 行 settle 投影） |
| M6-L5-selfplay-long | selfplay seeds 1..50 回归护栏 | `test/selfplay/selfplay-long.test.ts` | **done `20af2e9`**（第十批已并 main） |
| M6-L6-cue-id-union | CueId string→字面量联合 + cue 一致性绿护栏 | `ui/event-cues.ts`+`test/ui/cue-id-consistency.test.ts` | **done `4c840ed`**（第十批已并 main） |

#### B-2 CC 接线/编辑器/构建串行单写者组（`task/M6-editor`）
> **⚠️ 历史存档（勿据此认领）**——C2-C4 的**当前**状态以「第十一批 › C 编辑器/UI」表 + 各批验收记录为准（采纳建议#1 统一状态源）：**C1 done · C2 done · C3a/C3b done · C4 ready**。下表为批9 派发时快照，仅留档。
| ID | 任务 | 文件域 | 状态（当前·见上） |
|----|----|----|----|
| M6-C1-sound-toggle-wiring | 音效开关写侧接线（消费 L1） | `game-scene-skeleton`+`lobby-scene`（运行时注入·未改 scene） | **done `31b5668`** |
| M6-C2-animation-wiring | 基础动画接线（消费 L2·串行于 C1） | `game-scene-skeleton`+`game.scene` | **done `17b96f3`**（Creator 3.8.8 + 390×844 bomb 局部动效截图） |
| M6-C3-mobile-regression | 移动端回归+渲染性能（消费 L3·串行于 C2） | — | **已拆 → C3a + C3b**（见第十一批 C 表） |
| M6-C4-build-verification | 构建验证+发布验收记录 | `cocos.config.json`+report | blocked（待 C1-C3） |
| M6-D1-release-docs | 发布/QA 文档收尾（架构·非派发） | `docs/*`+`BOARD.md` | blocked（待所有轨） |

> **派发顺序**：Phase-0（架构·已完成）更新 ART 规格 + seed L1-L5 失败测试。Phase-1 并行：Track A 串行 02→03→04 ‖ Track B 五逻辑 worktree 并行（L1/L2 串行 merge）。Phase-2 串行编辑器 C1→C2→C3（待 L1/L2/L3 入 main）。Phase-3 C4 构建。Phase-4 D1 文档收尾。
> **文件域零碰撞**：Track A（`asset-previews/+coordination 的 ART-*`）与 Track B（`assets/scripts+test+assets/scene+cocos.config.json+docs`）不相交。Track B 内 L1/L2 共享 `ui/index.ts` 桶（串行 merge）；C1-C3 共享 keystone（串行单写者）。无与 main 现有文件的写冲突。
> **门控现状（Phase-0 修正后）**：main `74da789` 恢复常绿——85 测试文件 / 437 全绿、typecheck 净。seed 测试已从 main 移出，住各自 task 分支（详见下方修正记录）。

> **Phase-0 修正记录（2026-06-29，用户验收反馈后）**：
> - **恢复 main 常绿（核心）**：原 Phase-0 把 5 个 seed 测试种进 main（`f10a9ad`），致 main 停红、违反 PROTOCOL line 6「架构维护 main 常绿」。修正：main `74da789` 删 6 个 seed 测试 → main 回 437 全绿、typecheck 净。seed 测试改为住各自 task 分支（前批 M3-00 先例：失败测试住分支而非 main）；每个 L merge 时测试随实现一起并入 main 并转绿。
> - **M6-L1 解 parse 死锁**：原 seed 用保留字 `function with(...)` → tsc TS1359 parse 失败，即便实现 audio-gate.ts 也 typecheck 红，协议禁改测试 → 死锁。架构在 `task/M6-L1`（`ac561a3`）改名 `with`→`settingsWith`（5 处），解死锁；测试仍红（import 失败，预期先红）。
> - **M6-L4 重写 redead 测试**：原 `alwaysPassBid` 期望三家自动 pass，但 runtime 遇 hero bidding turn 暂停（`round-runtime.ts:242`）→ 测试卡在 bidding 没进 redead。重写为循环里检测 hero turn 显式 `submitPlayerAction(pass)`、AI 回合 flush。验证后：缺口1 resume-to-settled（2 FAIL·真红·实现补 settle 投影后转绿）+ 缺口2 redead 超限（1 PASS·绿护栏·锁死现有「超限→disposed 不发 settled」契约）+ bidding-reasons（绿护栏）。
> - **M6-L5 改后置验证**：从「worktree 并行实现」改为「L4 merge 后的回归验证/报告任务」（L4 改 settle 行为，L5 须基于改后 main 跑 1..50），状态 ready→blocked（待 M6-L4 merge），删 `task/M6-L5` 分支。
> - **ART-02/03/04 补 `git add -f`**：`asset-previews/` 被 `.gitignore:35` 忽略（ART-01 当年 `add -f` 提交），三 spec 补「完成后必须 `git add -f asset-previews/...v2/<subdir>/ coordination/reports/<ID>.report.md`，否则生成成功但提交不含资产」。
> - **M6-C4 去 profiles/**：`profiles/` 被 `.gitignore:10` 忽略，`profiles/v2/packages/builder.json` 移出文件域——构建面板配置/截图只记入 report，提交仅含 `cocos.config.json`+report，不走 `add -f profiles/`（守 AGENTS「不手动编辑 profiles」）。
> - **清理残留 worktree**：`../斗地主.worktrees/M3-editor-integration`（非 git 登记、仅 Cocos 生成缓存）已删；C1-C3 spec 标注编辑器串行用新 worktree `../斗地主.worktrees/M6-editor`，不复用历史目录。
> - **task 分支基线**：`task/M6-L1/L2/L3/L4` + `task/art-gen-v2` + `task/M6-editor` 已 rebase 到 `74da789`（清理提交后），各分支已重 seed 对应测试（L1 改名版、L4 重写版、L2/L3 原版）。`task/M6-L5` 已删。

> **第九批验收记录（2026-06-29）**：
> - **Track A 美术串行（ART-02/03/04·`task/art-gen-v2`）✅ 已并 main `6eb8995`**：
>   · ART-02 avatars：6 张（256² 头像 + 128² 徽章 + 256² 框）全 RGBA 透明 + 6 source + PROMPTS + report
>   · ART-03 ui：15 张（240×96 按钮 + 96² 图标 + 128² 徽章 + 900×1100 面板）全透明 + 15 source + PROMPTS + report
>   · ART-04 cards：4 张（card-back 400×560 不透明 + joker-small/big + card-template 400×560 透明）+ 4 source + PROMPTS + report
>   · 命名对齐 `card-template.png`（与 `asset-keys.ts:5` cardTemplate 键一致）、PROMPTS 含 no-text constraints 可复现、三 report `in-review`
>   · 58 文件·`asset-previews/` 预览包·`git add -f` 提交（.gitignore 忽略）·未导入 `assets/`·零 cc·零测试影响
>   · 视觉终审归用户；架构验技术规格通过（尺寸/透明/命名/无字/PROMPTS），置 `in-review`
> - **Track B 纯逻辑 L1-L4（5 worktree 并行）✅ 全部已并 main：**
>   · **M6-L1** `97b0895`：`decideCuePlayback(settings,cue)→{sound,effect,vibrate}`，6/6 绿，零 cc，`audio-gate.ts` 19 行纯函数
>   · **M6-L2** `7d93e65`：`pulseParams(cue)`/`dealCardDelay`/`playFlyFromTo`，7/7 绿，零 cc；`ui/index.ts` 桶冲突串行解（保留两行 export）
>   · **M6-L3** `99d13b8`：`tableLayout(w?,h?)` 函数重载·无参兼容·多分辨率 9 绿 + 现有 6 不退化，零 cc
>   · **M6-L4** `c08de19`：`round-runtime.ts` +1 行 `this.finishIfSettled()` 补 resume-to-settled 缺口，5/5 绿 + 现有 5 不退化，零 cc
> - **门控**：90 测试文件 / 462 全绿（437 现有 + 25 新增）、typecheck 净、纯层零 cc（仅 `ui/components/*`+`runtime/cocos-storage.ts`）、`flow→data` 零 import
> - **L5 selfplay 长回归**（1..50）待 L4 merge 后验证（`test/selfplay/selfplay-long.test.ts` 已删除，待重新引入）
> - **C1-C4 编辑器串行**：C1 已解除 blocked（L1 在 main），C2/C3 仍 blocked（串行）；`task/M6-editor` 分支已删，编辑器执行者需重新 `git worktree add`（C1-C3 顺序执行于同一分支）
> - **worktree/分支已清理**：5 worktree 已 remove、6 task 分支已 delete；仅剩 main · 残留 `M3-editor-integration` 目录已删

## 第十批（L4 验证解锁后续 · 规划者派发 · 2026-06-29）

> 第九批合并经架构验证干净（见上「第九批合并验证」），保持合并。L4 入 main 解锁 L5；据验证发现起草优化任务 L6；L1 入 main 解锁编辑器 C1。三任务文件域两两不相交，可并行派发给不同执行者。

| ID | 类型 | 文件域 | 分支 | 状态 |
|----|----|----|----|----|
| M6-L5-selfplay-long | **新任务书**·纯逻辑 worktree·纯 spec | `test/selfplay/selfplay-long.test.ts`（新）+report | `task/M6-L5-selfplay-long` | **done `20af2e9`**（2/2 绿·1..50·10.8s） |
| M6-L6-cue-id-union | **优化任务书**·纯逻辑 worktree·纯 spec | `ui/event-cues.ts` + `test/ui/cue-id-consistency.test.ts`（新）+report | `task/M6-L6-cue-id-union` | **done `4c840ed`**（5/5 绿·CueId 联合·零 cc） |
| M6-C1-sound-toggle-wiring | 编辑器串行·消费 L1 | `game-scene-skeleton`+`lobby-scene`（运行时注入·未改 scene） | `task/M6-editor`（C1→C2→C3→C4） | **done `31b5668`**（用户 Creator 验证过·解锁 C2） |

> **文件域不相交核对**：L5=`test/selfplay/`（新文件）；L6=`ui/event-cues.ts`+`test/ui/`（新文件），**不碰** L1/L2 刚并入的 `audio-gate.ts`/`animation-params.ts`（靠源头收紧 `CueId` 让其在 typecheck 期自动获益）；C1=`ui/components/*`+`assets/scene/`。两两不相交，L5/L6 可真并行（不同 worktree），C1 走编辑器单写者分支。
> **派发模式**：L5/L6 用 PROTOCOL bootstrap（纯逻辑 worktree·`<ID>` 换分支名·纯 spec 自写测试）；C1 用编辑器 bootstrap（Cocos Creator·新建 `../斗地主.worktrees/M6-editor`）。
> **L6 来由**：第九批验证登记的 latent 脆性——`CueId=string` 零编译期保护，L1/L2 的 cue 字面量集（EFFECT_CUES/VIBRATION_CUES/PULSE_SCALE）拼错会静默禁用对应音效/动效/震动。L6 在源头把 `CueId` 收紧为 11 字面量联合 + 加运行时绿护栏，让消费方 typecheck 期获保护。spec 见 `coordination/tasks/M6-L6-cue-id-union.md`。

> **第十批验收记录（2026-06-29）**：
> - **L5/L6 ✅ 已验收并并入 main**：各在 worktree 独立验证（L5 typecheck 净/464 绿·selfplay-long 1..50 通过 10.8s；L6 typecheck 净/467 绿·cue-id-consistency 5/5）后 `merge --no-ff`（`20af2e9`→`4c840ed`）。集成验证：**92 测试文件 / 469 用例全绿、typecheck 净、纯层零 cc**（含 `event-cues/audio-gate/animation-params`）、`CueId` 已为 `(typeof CUE_IDS)[number]` 联合、工作树净。worktree+分支已清理。
>   · **L6 实现优于 spec**：除字面量联合，额外导出 `CUE_IDS` const 数组供遍历；护栏用 `satisfies readonly CueId[]` 加编译期校验，并锁 audio-gate/animation **引用真实**（deal/play/bomb/rocket→effect/pulse、bomb→vibrate、pass→inert）——彻底堵住「拼错→静默禁用」。
> - **C1 ✅ 已验收并并入 main `31b5668`（用户 Cocos Creator 验证）**：代码评审通过（playCue 改调 `decideCuePlayback`·vibration 跨平台降级·settings 热重读·修 `defaultSettings`→`loadSettings` bug·热切换持久化），cc 用法对 3.8 地道且与 `game-scene-skeleton` 既有运行时建节点模式一致。用户在 Cocos Creator 3.8.8 打开 `task/M6-editor` 验证：**编辑器状态栏零报错（编译通过）、lobby/game 场景 390×844 渲染正常、运行时 lobby 设置控件（音效/震动/动效 + 难度三档）显示并可切换持久化（动效 开→关 截图佐证）**。合并后客观门：92 文件 / 469 用例全绿、typecheck 净；cc 仅现于 `ui/components/{lobby-scene,game-scene-skeleton}.ts`+`runtime/cocos-storage.ts`（允许层），纯层 + ui 纯岛零 cc。与 L6 union CueId 兼容（`playEffect` 字面量比较均为 `CUE_IDS` 成员）。
>   · **设计决策已落定**：为守「不手写 scene/meta」铁律，lobby 设置控件用**组件运行时注入**而非编排进 `lobby.scene`（用户验证认可此路径）；C1 实际未改 scene 资产，仅改两个 cc 组件 `.ts`。
>   · **`task/M6-editor` 分支+worktree 保留**给 C2/C3/C4 串行续做；worktree 含 Creator 本地噪声（`package.json`/`settings/`，非 C1 deliverable，未入 main）。**C2 启动前须先把该 worktree 同步到 main**（取回 L5/L6 union CueId + C1 merge）。
>   · 实现方设计决策：为守「不手写 scene/meta」铁律，lobby 设置控件改**组件运行时注入**而非编排进 `lobby.scene`（故 C1 实际未改 scene 资产）——用户已认可此路径（选「先验证再合并」而非「改回场景编排」）。

## 第十一批（发布前打磨 + 单机品质增强 · 大批量派发 · 规划者派发 · 2026-06-29）

> 用户指令「尽可能多派发·不低于历史 2 倍」。26 任务，**每个均锚定真实代码/缺口**（侦察核对：RecordEntry 字段、replay buildTrace/traceSummary、isStrongHand、hint API、settlement、round-runtime L4 修复均已读）。分 A 纯逻辑增强 / G 集成硬化护栏 / C 编辑器屏 / R 美术导入 / D 文档 五轨。**ROADMAP M6 本为最小打磨范围**——Track A/部分 C 标【打磨】（超最小范围、提升 v1 单机品质，**不**引入联网/账号/支付/广告/匹配，守首版范围铁律）；Track G/D + C2-C4 + R 标【核心】。spec 全部入 main（`coordination/tasks/<ID>.md`），各任务 import 直引、不改 `index.ts` 桶（架构合并时统一补桶）。

### A 纯逻辑增强（worktree **并行**·禁 cc·纯 spec·新文件 import 直引）【打磨】
> 状态表达硬化（采纳建议#1）：依赖型任务用 `blocked: 待 Lx merge`，dep 入 main 后才翻 `ready`，避免实现方见 ready 提前起分支致重复 rebase/API 漂移。
| ID | 文件域 | 依赖 | 状态 |
|----|----|----|----|
| M6-L7-stats-digest | `data/statsDigest.ts`+test | records | **done `<批11>`** |
| M6-L8-records-query | `data/recordsQuery.ts`+test | records | **done** |
| M6-L9-hint-ranking | `ai/hintRank.ts`+test | hint/rules/_shared.compareMoves | **done** |
| M3-42-help-content | `ui/help-content.ts`+test | RULES.md | **done** |
| M6-L10-bidding-advisor | `ai/bidding-advisor.ts`+test | bidding.isStrongHand | **done** |
| M6-L11-trick-replay | `game/trick-replay.ts`+test | replay/events | **done** |
| M6-L12-pause-menu | `ui/pause-menu.ts`+test | — | **done** |
| M3-40-stats-detail-view | `ui/stats-detail-view.ts`+test | L7 | **done**（并 main·第一波） |
| M3-41-records-detail-view | `ui/records-detail-view.ts`+test | L8 | **done**（并 main·第一波） |
| M3-43-bidding-advice-view | `ui/bidding-advice-view.ts`+test | L10 | **done**（并 main·第一波） |
| M3-44-replay-view | `ui/replay-view.ts`+test | L11 | **done**（并 main·第一波） |

### G 集成/硬化护栏（worktree **并行**·禁 cc·绿护栏·不改产品码）【核心】
| ID | 文件域 | 状态 |
|----|----|----|
| M6-G9-save-resume-e2e | `test/integration/save-resume-e2e.test.ts`（新目录） | **done**（端到端·零和·aggregate） |
| M6-G10-multiplier-stacking | `test/game/multiplier-stacking.test.ts` | **done**（连乘穷举） |
| M6-G11-runtime-resume-phases | `test/flow/runtime-resume-phases.test.ts` | **done**（锁 L4 resume-to-settled·正确未测 bidding resume） |
| M6-G12-ai-no-starve | `test/selfplay/ai-no-starve.test.ts` | **done**（难度矩阵·必终止） |

### C 编辑器/UI（**串行单写者** `task/M6-editor`·需 Cocos Creator）【C2-C4 核心·M3-45/46 打磨】
> C3 已拆（采纳建议#3）→ C3a + C3b，降单任务审查/回归面。
| ID | 文件域 | 依赖 | 状态 |
|----|----|----|----|
| M6-C2-animation-wiring | `game-scene-skeleton`+`game.scene` | C1✓·L2✓ | **done `17b96f3`**（Creator 3.8.8 预览·390×844 bomb 局部动效截图·Console 零 Error） |
| M6-C3a-safearea-screenshots | `*.scene`+`.meta`+M3-36 report+QA | C2✓ | **done `98b0ec1`**（Creator 3.8.8 预览·6 张三档截图·SafeArea/fit-width；`settings/v2/packages/project.json` 范围例外已审查采纳） |
| M6-C3b-relative-layout-render-diff | `game-scene-skeleton`+report | L3✓·C2✓·C3a✓ | **done `b51dce5`**（Creator 3.8.8 三分辨率 Preview·相对布局+render 差分复用·交叉审查 approve） |
| M6-C4-build-verification | `cocos.config.json`+report | C1-C3 | **done `4c314b9`**（Creator 3.8.8 web-mobile build success·390×844 运行烟测·交叉审查 approve） |
| M3-45-stats-records-screens | scene+新 cc 组件 | L7✓/L8✓/M3-40/41 | **done `a817c98`**（运行时注入·战绩/历史过滤 390×844·CDP 零 Error） |
| M3-46a-help-screen（拆自 M3-46） | `lobby.scene`+新组件 | M3-42✓ | **done `a817c98`**（运行时注入·帮助滚动/返回 390×844·CDP 零 Error） |
| M3-46b-pause-overlay（拆自 M3-46） | `game.scene`+新组件 | L12✓ | **done `a817c98`**（运行时注入·暂停/二次确认/遮罩阻断 390×844·CDP 零 Error） |

### R 美术导入（编辑器·**gated 待用户视觉终审**·**串行**·照 M3-29 流程）【核心·依赖用户】
> 采纳建议#5：三导入都改 `asset-keys.ts`，**非完全并行域**，须串行 02→03→04（或架构合并时统一解 key 冲突）。统一 key 命名表见下，避免各分支各自加 key 致合并冲突。
> **审查#7**：每个导入 report 须记录 **① 用户视觉批准来源**（哪条消息/截图确认）② 导入清单 ③ key 映射 ④ `.meta` 由 Creator 生成——**不得仅凭技术规格通过**。
| ID | 文件域 | key 前缀（建议） | 状态 |
|----|----|----|----|
| ART-IMPORT-02-avatars | `assets/resources/art/avatars/`+`asset-keys.ts`+.meta | `avatar.*`（avatarHero/avatarAiLeft/avatarAiRight/badgeLandlord/badgeFarmer/avatarFrame） | blocked（待用户认可 ART-02·串行 #1） |
| ART-IMPORT-03-ui | `assets/resources/art/ui/`+`asset-keys.ts`+.meta | `ui.*`（btn*/icon*/badge*/panel*） | blocked（待用户认可 ART-03·串行 #2） |
| ART-IMPORT-04-cards | `assets/resources/art/cards/`+`asset-keys.ts`+.meta | `card.*`（cardBack/jokerSmall/jokerBig/cardTemplate——**cardTemplate 对齐既有键**） | blocked（待用户认可 ART-04·串行 #3） |

### D 文档（架构/文档执行者·改 docs）【核心】
| ID | 文件域 | 状态 |
|----|----|----|
| M6-D2-qa-checklist-refresh | `docs/QA_CHECKLIST.md`+report | **done**（证据对齐已合并测试·G 线证据已刷新为已并） |
| M6-D3-roadmap-update | `docs/ROADMAP.md`+report | **done** |
| M6-I1-barrel-exports | `{data,ai,game,ui}/index.ts` 仅 re-export+test | **done `7c7b427`**（新增公开模块已补桶·623 绿） |
| M6-D1-release-docs | `docs/*`+BOARD | blocked（待所有轨 merge·架构收尾） |

### 📐 编辑器任务验收模板（采纳建议#4 · C2/C3a/C3b/C4/M3-编辑器屏/ART-IMPORT 必填）
> 编辑器任务 report 必须含：① **Creator 版本**（3.8.8）；② **预览分辨率**与截图路径（≥指定档）；③ **是否改 scene/meta**（列出文件，未改注明「运行时注入」）；④ **worktree 是否残留本地未提交** `package.json`/`settings/`/`profiles/`（Creator 易生成，**只提交任务文件域**，残留须 `git checkout`/不 add）；⑤ 编辑器 Console 是否零报错。审查者据此核对，不接受「仅代码报告」。

### 🚦 编辑器线推进协议（采纳建议#3+#4 · 收紧发布 gate）
> `task/M6-editor` 是共享 keystone（`game-scene-skeleton.ts`+scene）的串行单写者分支，后续多任务叠加，纪律如下：
- **#2 C2 不直接并入 main**：保持 `in-review`，直到 Creator 3.8.8 复核 + 390×844 动效截图落盘 + Console 零报错 + 脏文件（`package.json`/`settings/`）处理方案明确。审查卡验收模板，缺截图=未闭环。
- **#3 同步/清洁门（每个编辑器任务启动前）**：① `git merge main`（取回纯逻辑/桶导出最新）；② 清掉或显式排除 `package.json`/`settings/`/`profiles/` 本地噪声（`git checkout -- package.json` / 不 add）；③ 跑 `npm --prefix test test` 全绿 + Creator 编译零报错。**不在不干净分支上叠新任务。**
- **#4 推进顺序（重排）**：**C2 验证/合并 → C3a（多分辨率 SafeArea 基线 + 截图）→ C3b（相对布局 + render 差分稳定）→ 之后才接 HUD(M3-56)/toast·timer(M3-57)/thinking·lastaction(M3-63)/advisor(M3-64)/教程(M3-55)/帮助·暂停(M3-46a/b)/难度面板(M3-59)/战绩历史屏(M3-45)**。理由：后续 UI 不应建立在旧硬编码坐标 + 全量重建 render 之上。
- **#1 状态源唯一**：编辑器任务状态以「第十一/十二/十三批」C 表 + 验收记录为准；批9 B-2 表已标历史存档。

### ✅ 第十一批验收记录（A 线 7 + G 4 + D2/D3 已并 main · 2026-06-29）
> 13 分支按建议#2 顺序逐一审 + `merge --no-ff`：先 A 基础（L7/L8/L9/M3-42/L10/L11/L12）→ G9-G12 → D3 → D2（G 并后证据复核）。审查纪律（建议）：逐分支 `git diff --stat` 核文件域、grep cc、确认未改 `index.ts` 桶/未篡改既有测试、读新源确认实现（非空跑）。
- **客观门**：`npm --prefix test test` **103 文件 / 507 用例全绿**（+11 文件 / +38 用例）；`typecheck` 净；纯层 + 新 ui 纯岛（help-content/pause-menu）**零 cc**；`index.ts` 桶**未被任务改**（留 M6-I1 统一补）。
- **逐项确认**：L7 streak/极值/分角色口径对齐 `recordRound`；L8 稳定排序 + limit 边界；L9 引用 `ai/levels/_shared.compareMoves` + `rules.isBombLike` **路径真实**（无 API 漂移）；L10 复用 `isStrongHand(,2)` 单一真相源；L11 按 reset/win 分墩；L12 状态机非法转移幂等；**G11 正确未测 bidding resume**（RoundState 仅 Playing/Settled，符合 spec 条件分支·采纳审查建议#3）且锁住 L4 resume-to-settled（multiplier 8 = bid4×anti-spring2、onSettled 恰一次）。
- **D2 守纪**（采纳审查建议#4）：3 处引用 G 线的项以**已合并** settlement/resume/selfplay 测试为主证据打勾，G 分支当时标「待合并」未当已完成；G 并入后已刷新为「已并 main」。
- **.meta**：Creator 为 A 线 7 个新脚本自动生成 `.meta`（typescript importer·唯一 uuid），架构提交（`2ca4ccf`）。
- **worktree/分支**：13 个已 remove+delete；仅剩 `task/M6-editor`（C2）。
- **M3-40/41/43/44 解锁**：依赖 L7/L8/L10/L11 已并 → 由 `blocked` 翻 `ready`（硬状态·采纳建议#1）。

## 第十二批（AI 纵深 + UX 打磨 + 集成收尾 · 大批量派发 · 规划者派发 · 2026-06-29）

> 用户三次要求「继续保持足够多数量」。纯逻辑核心已基本完备，本批 18 任务侧重 **AI 纵深**（强度评估/已出牌记忆/残局检测）+ **UX 打磨**（教程/强度条/计时/瞬时提示/已出牌 HUD/难度面板）+ **横切护栏 + 文档收尾**，并续上编辑器接线。**已砍掉无消费方的投机模块**（difficulty 调参/扩展 settings）。沿用「import 直引、不改 index.ts 桶（留 M6-I1 统一补）」「依赖型任务 `blocked: 待 X merge`，dep 并后才翻 ready」「编辑器任务按验收模板」。spec 全部入 main。范围声明：仍**不引入联网/账号/支付/广告/匹配**，turn-timer 仅提示不强制代打。

### P AI 纵深（worktree **并行**·禁 cc·纯 spec）【打磨】
| ID | 文件域 | 依赖 | 状态 |
|----|----|----|----|
| M4-30-hand-strength | `ai/handStrength.ts`+test | rules | **done**（并 main·第一波） |
| M4-31-card-memory | `ai/cardMemory.ts`+test | game events/rules | **done**（并 main·第一波） |
| M4-32-endgame-finisher | `ai/endgame.ts`+test | rules 枚举 | **done**（并 main·第一波） |

### V 视图模型（worktree **并行**·禁 cc·纯 spec）【打磨】
| ID | 文件域 | 依赖 | 状态 |
|----|----|----|----|
| M3-50-tutorial-steps | `ui/tutorial-steps.ts`+test | RULES/GAME_DESIGN | **done**（并 main·第一波） |
| M3-52-turn-timer-view | `ui/turn-timer.ts`+test | — | **done**（并 main·第一波） |
| M3-53-toast-queue | `ui/toast-queue.ts`+test | — | **done**（并 main·第一波） |
| M3-58-difficulty-picker-view | `ui/difficulty-picker-view.ts`+test | difficultyConfig | **done**（并 main·第一波） |
| M3-51-strength-meter-view | `ui/strength-meter-view.ts`+test | M4-30 | **done**（并 main·第二波） |
| M3-54-card-memory-view | `ui/card-memory-view.ts`+test | M4-31 | **done**（并 main·第二波） |

### L 可维护性 / G 横切护栏（worktree **并行**·禁 cc）【L 打磨·G 核心】
| ID | 文件域 | 状态 |
|----|----|----|
| M6-L13-string-table | `ui/strings.ts`+test（仅新增·不迁移组件） | **done**（并 main·第一波） |
| M6-G13-view-model-immutability | `test/ui/view-model-immutability.test.ts`（绿护栏·不改产品码） | **done**（并 main·第三波） |
| M6-G14-ai-hidden-state-isolation | `test/ai/ai-hidden-state-isolation.test.ts`（绿护栏·不改产品码） | **done**（并 main·第一波） |

### C 编辑器接线（**串行单写者** `task/M6-editor`·需 Creator·按验收模板）【打磨】
| ID | 文件域 | 依赖 | 状态 |
|----|----|----|----|
| M3-59-difficulty-picker-ui | `lobby-scene` 升级难度控件 | M3-58 | **done `a817c98`**（难度三档面板·持久化复核·390×844） |
| M3-55-tutorial-screen | `lobby.scene`+新组件 | M3-50 | **done `a817c98`**（教程首步/中间步·跳过返回·390×844） |
| M3-56-hud-meters | `game-scene-skeleton`/新 HUD 组件 | M3-51/54（+M4-30/31） | **done `87f3f56`**（Creator 3.8.8·390×844 HUD/展开/出牌递减已验） |
| M3-57-toast-timer-wiring | `game-scene-skeleton`/新组件 | M3-52/53 | **done `a817c98`**（toast/timer·超时仅提示·390×844·CDP 零 Error） |

### D 文档 / R 美术【D 核心·R 打磨·gated】
| ID | 文件域 | 状态 |
|----|----|----|
| M6-D4-arch-notes | `docs/ARCH_DECISIONS.md`+`docs/KNOWN_LIMITATIONS.md`（新）+report | **done**（并 main·第一波） |
| ART-05-misc-assets | `asset-previews/…v2/misc/`（splash/app-icon/空状态/角标）+PROMPTS+report | blocked（待用户对 ART 风格整体认可） |

> **文件域不相交核对**：P/V/L 各为新 `ai/`/`ui/` 文件 + 新 test（两两不碰）；G 各新 test；C 共享 keystone 串行；D 新增两份 docs；R 仅 `asset-previews/`。与第十一批未完成项（M3-40/41/43/44、M6-I1、C2-C4、M3-45/46、ART-IMPORT、D1）文件域亦不相交。
> **第一波可并行（无依赖）**：M4-30/31/32、M3-50/52/53/58、M6-L13、M6-G13/14、M6-D4 —— 11 个；第二波 M3-51/54（待 M4-30/31）；C 线串行待视图 + Creator 档期；R 待用户。
> **桶**：P/V/L 新模块按 import 直引、不改 `index.ts`；并入后随 **M6-I1** 一并补桶（M6-I1 范围相应扩到第十二批新模块）。

## 第十三批（AI 模块组合 + 平衡度量 + 回放编码 + 剩余视图 · 规划者派发 · 2026-06-29）

> 用户「A+B 一起」。这是纯逻辑的**真实尾部**：把第十二批的 AI 纯模块**组合成可用建议**、加**难度平衡客观护栏**、回放编解码、剩余 UX 视图。10 任务。**架构已向用户声明：纯逻辑核心到此基本见底，后续价值集中在编辑器/美术/构建/QA**（需 Creator/用户），不再靠堆纯 spec 推进。沿用全部既定规矩（硬状态/import 直引/编辑器验收模板/砍投机模块）。M6-I1 桶整合范围相应再扩到第十三批新模块。

| ID | 轨 | 文件域 | 依赖 | 状态 |
|----|----|----|----|----|
| M2-12-replay-codec | 离线 | `game/replay-codec.ts`+test | events/replay✓ | **done**（并 main·第一波） |
| M6-G15-selfplay-balance | G 核心 | `test/selfplay/balance.test.ts`（绿护栏） | selfplay✓ | **done**（并 main·第一波） |
| M3-60-ai-thinking-view | V 打磨 | `ui/ai-thinking-view.ts`+test | — | **done**（并 main·第一波） |
| M3-62-last-action-view | V 打磨 | `ui/last-action-view.ts`+test | events/card-view✓ | **done**（并 main·第一波） |
| M6-D5-playtest-script | D 核心 | `docs/PLAYTEST.md`+report | — | **done `8e9bc0f`**（发布前手动冒烟脚本骨架已并 main） |
| M4-40-action-insight | P 打磨 | `ai/insight.ts`+test（组合 M4-30/32+hintRank✓） | M4-30/32 | **done**（并 main·第二波） |
| M4-41-bid-confidence | P 打磨 | `ai/bid-confidence.ts`+test | M4-30 | **done**（并 main·第二波） |
| M3-61-insight-view | V 打磨 | `ui/insight-view.ts`+test | M4-40 | **done**（并 main·第三波） |
| M3-63-thinking-lastaction-ui | C 编辑器 | `game-scene-skeleton`/新组件 | M3-60/62 | **done `a817c98`**（AI 思考/上一手动作·390×844·CDP 零 Error） |
| M3-64-insight-advisor-ui | C 编辑器 | `game-scene-skeleton`/新组件 | M3-61 | **done `a817c98`**（advisor 默认关/开关态·390×844·CDP 零 Error） |

> **文件域不相交**：各为新 `ai/`/`ui/`/`game/` 文件 + 新 test + 新 docs，两两不碰，与批11/12 未完成项亦不相交。
> **本批 ready（无依赖·可并行）**：M2-12、M6-G15、M3-60、M3-62、M6-D5 —— 5 个均已并 main。其余链式（M4-30→M4-40→M3-61；M4-30→M4-41）已按硬状态串行完成。

### ✅ 第十二/十三批纯逻辑收口记录（2026-06-29 · 执行/架构）
> 按用户批准的「全量接收与执行顺序计划」执行：先第一波解锁器与独立纯任务，再第二波消费依赖，最后 M3-61→M6-G13→M6-I1。编辑器/美术/视觉 gate 未抢跑。
- **已并 main**：第十一批剩余 VM（M3-40/41/43/44）、第十二批纯逻辑/文档（M4-30/31/32、M3-50/51/52/53/54/58、M6-L13、M6-G13/14、M6-D4）、第十三批纯逻辑（M2-12、M6-G15、M3-60/62、M4-40/41、M3-61）以及 **M6-I1 桶整合**。
- **客观门**：最终 main `7c7b427` 上 `npm --prefix test test -- --run` **127 文件 / 623 用例全绿**；`npm --prefix test run typecheck` 通过；新增纯层/纯 UI 文件 `cc` 搜索零命中。
- **仍保持 gate**：C4、M3-56 与 M3-55/57/59/63/64、M3-45/46 已并 main（M6-editor 收口 `a817c98`）；ART-IMPORT-02/03/04 与 ART-05 等用户视觉终审；M6-D5 `PLAYTEST.md` 骨架已并 main，后续随发布验收填实测记录。
- **本地注意**：~~工作区若干未跟踪新脚本 `.meta`~~ → ✅ **已闭合**：20 个 Creator 生成 `.meta`（ver 4.0.24·typescript importer·uuid 唯一·零逻辑改动）已统一提交（采纳建议#6 late .meta sync）。

### 🔍 架构复核 + 执行者 13 条建议落实（2026-06-29）
> 用户给规划者 7 条 + 审查者 8 条建议，方向：纯逻辑核心已收口，下一阶段把 **C2-C4 发布 gate 做硬**（编辑器单写者纪律 / Creator 证据 / scene·meta 清洁 / 截图手测真实性）。
- **复核 main**：`3a44027` 实测 **127 文件 / 623 用例全绿**、typecheck 净、纯层零 cc；20 late `.meta` 已提交；工作树干净；仅 `task/M6-editor`(C2) 未合。
- **规划者建议落实**：#1 批9 B-2 表标「历史存档」+ 修正 L5/L6→done、C2→in-review、C3→已拆（状态源唯一指向第十一批 C 表）；#2 **C2 保持 in-review 不并入**；#3+#4 新增「🚦 编辑器线推进协议」（启动前同步/清洁门 + 重排 C2→C3a→C3b→HUD/toast/thinking/advisor）；#5 **M3-46 拆 M3-46a（帮助屏）+ M3-46b（暂停层）**；#6 late `.meta` 已提交；#7 **M6-D1 spec 重写**为最终发布范围（依赖 C2-C4/编辑器屏/美术导入/D5/构建）。
- **审查者建议落实**：#4 **M3-56 spec 改为必须喂全量 `GameEvent`（非 sliced recentEvents）+ ownHand 用当前手牌防双重扣减**；#7 ART 导入 report 须记用户视觉批准来源；#8 M6-D5 标「尽早做骨架」；#1/#2/#3 C2/`package.json`/C3b 行为审查点并入「编辑器线推进协议」+验收模板；#5 M3-57「计时仅提示不改 runtime」、#6 M3-64「advisor 默认低打扰」已在各 spec 锁定。
- **未改**：纯逻辑 main（已绿）、C2 代码（待用户 Creator 验证）。

### ✅ M6-editor UI 收口验收记录（2026-07-01）
> 用户转发审查结论：**通过，可合并**。已 `merge --no-ff task/M6-editor` 入 main：`a817c98`。
- **并入范围**：M3-57 toast/timer、M3-63 AI thinking/last action、M3-64 advisor、M3-55 tutorial、M3-46a help、M3-46b pause overlay、M3-59 difficulty picker、M3-45 stats/records，以及截图归一化提交 `9487170`。
- **范围护栏**：仅 `assets/scripts/ui/components/{game-scene-skeleton,lobby-scene}.ts` + `coordination/reports/*.md/png`；未改 `.scene`、`.meta`、root 配置、`settings/`、`profiles/`。
- **审查证据**：各任务 report 均含 Creator 3.8.8 / 390×844 截图 / CDP `errors: []`；执行者与审查者均复跑 `npm --prefix test run typecheck` + `npm --prefix test test`（128 文件 / 632 用例绿）+ `git diff --check`。
- **非阻塞后续建议**：大厅 home 区域按钮/难度面板密度偏挤；advisor 开启 + 剩牌展开同屏有轻微叠压；子屏面板半透明导致 home label 透出；暂停期间 timer 仍在遮罩后递减。均不阻塞合并，后续 UI polish 可单独派发。

## 后续（本批次之后）
- **设计型待办进展**：① 落盘数值不变量已闭合：`serialize`(passesInARow/bombsPlayed) 由 T4、`records`(multiplier/bombs/heroScore/playedAt) 由 T5、`save.savedAt` 与 `bidMultiplier` 由 T1/M5-12c 折叠实现；② 整屏 VM 集成层 M3-01 已并 main。
- **持久化 IO 收口**：storage 适配器（M5-06/07）+ resume(T1) + aggregate(T2) + session(M5-13) 已闭合；之后进编辑器接真实 localStorage。
- **架构债 M5-14（✅ 已验收并入 main `578d378`）**：合并后审查发现分层违规（`game→data`/`data→flow` type 边 + `data→game` 运行时边，均架构 spec 缺陷）+ 校验/原子性缺口（events 无元素校验、statsCodec unknown-version 静默丢、commit 非原子、records 写入不对称）——详见上「对抗式审查」段。0 blocker、均 latent，main 可发布；M5-14 已收口（DTO 上移 + events 校验 + 幂等原子 + serializeRecords 对称 + 损坏可观测），main 实测分层零违规、82/422 绿。余 1 行 statsCodec 注释 follow-up。
- **桶导出整合（架构 follow-up）**：
  - ✅ `ai/index.ts` += `hint`、`data/index.ts` += `difficultyConfig`（`5a4d2be`，仅 re-export、typecheck 净、336 绿；`hint` 名称不与现有 ai 导出冲突，`flow/driver`+`flow/policies`+`data/settings` 等 barrel 消费方 typecheck 通过）。
  - ✅ `ui/index.ts` 由 M3-01 创建，已导出 9 个 UI 岛、`screen-view`，以及第六批 `stats/records/settings/lobby-view`。
  - ✅ `data/index.ts` 已随 M5-11 导出 `aggregate`，并保留 `difficultyConfig`。
  - ✅ `game/index.ts` 已随 M5-10 导出 `resume`。

---

## v1.1 交互体验打磨批（横屏化 + 按钮化 + 资源规范 + Bug 清扫 · 2026-07-02）

> 规划书：`/Users/admin/.claude/plans/beta-1-bug-2-label-3-4-btn-5-ai-curious-muffin.md`（v5 终审通过·7 份执行者审查逐条收口）。目标：竖屏→横屏、点击区按钮化、资源命名/绑定 + 可见文案打磨、Bug 清扫；核心是交互体验，不做大功能。派发按 Wave 0→1→2→3。
> **协议修订（用户指定）**：审查通过后由**执行者合并 main**（脚本化 `claim/merge/release` 单 lane），经 **T-DOC 落 main 后启用**；T-DOC 未入 main 前一切按旧协议、执行者不自行合并。

| ID | Wave | 类型 | 文件域 | 依赖 | 状态 |
|----|----|----|----|----|----|
| T-DOC | 0 | 协议/脚本/模板 | `PROTOCOL.md`,`BOARD.md`,`agentctl.sh`,`templates/*` | — | **done `4b5188d`**（旧协议·架构合并·133/654 绿·typecheck 净·bash -n 通过） |
| V-0 | 0 | baseline 记录 | `reports/V-0-baseline.md` | — | **ready**（规划者/用户直接落盘·不 gate Wave 1） |
| E-0 | 1 | 设计分辨率(执行者·worktree) | `settings/v2/packages/project.json`（**不碰 .scene**·cc.Canvas 运行时自适配） | T-DOC ✅ | **done `6e6ea7a`** |
| T-A1 | 1 | 纯逻辑 | `ui/table-layout.ts`+`test/ui/table-layout*.test.ts` | T-DOC ✅ | **done `2e66085`** |
| T-0 | 1 | 编辑器/运行时重构 | 新 `ui/components/ui-helpers.ts`+两巨组件改 import | T-DOC ✅ | **done `dceff17`** |
| T-C0 | 1 | 契约/审计 | `ui/asset-keys.ts`(+test)+`reports/T-C0-asset-key-audit.md` | T-DOC ✅ | **done `8e386e8`** |
| T-A2 | 1 | 审计项 | —（确认 screen-view 透传无需改） | T-A1 ✅ | **done（审计闭合）**：`screen-view.ts:48-49` 纯透传 `tableLayout(w,h)`，T-A1 修好即自动生效，无需改 |
| P-G | 2 | 编辑器/运行时 | `ui/components/game-scene-skeleton.ts` | E-0✅,T-A1✅,T-0✅,T-C0✅ | **done `c17e4bd`** |
| P-L | 2 | 编辑器/运行时 | `ui/components/lobby-scene.ts` | E-0✅,T-0✅,T-C0✅ | **done `456afac`** |
| P-Text | 2 | 文案清单(P-G copy rider) | `coordination/tasks/P-Text-copy-list.md`(不单独分支·不改 strings.ts) | — | **已交付+已消费**：P-G `83f9e7d` 落地（seatName 你/左家/右家·去 AI/座位N/出牌区占位味） |
| ART-06-landscape-backgrounds | 美术(并行) | **文生图·执行者生成** | `asset-previews/*`+report | E-0 ✅ | **done `ba30494`** |
| ART-IMPORT-06 | 美术 | 导入+swap-in | `assets/resources/art/backgrounds/*`(+`.meta` Creator 生成)；`game-scene-skeleton.ts`/`lobby-scene.ts` 换回 `loadSprite` | ART-06 ✅`ba30494`, P-G ✅, P-L ✅ | **done `68f1436`** |
| V | 3 | 收口·验证 | `reports/V.report.md`（verify-only·不改产品码） | P-G✅,P-L✅,ART-IMPORT-06✅`68f1436` | **done `4b28584`** |
| E-ORIENT | scoped-fix(V#1) | 编辑器/配置 | `settings/v2/packages/builder.json` + report | E-0 ✅ | **done `2f10e2a`** |
| T-COPY-BID | scoped-fix(V#2) | 纯 view 文案 | `assets/scripts/ui/bidding-view.ts` + `test/ui/bidding-view.test.ts`(架构种) | — | **done `cdb88c8`** |
| T-FIX-GS | scoped-fix(V#3+#4) | view-model+运行时 | `screen-view.ts` + `game-scene-skeleton.ts` + `test/ui/screen-view.test.ts`(架构种) | — | **done `d94c790`** |

> **状态词表补充（T-DOC 落地后生效）**：新增过渡态 `approved`（架构给·报告级）、`merge-claimed:<ID>`（锁级·transient）；**终态仍 `done <commit>`**，不引入持久 `merged`。
> **派发**：Wave 0 T-DOC ✅ 已并 main（`4b5188d`）。**Wave 1 ✅ 全部落 main**：E-0 `6e6ea7a` / T-A1 `2e66085` / T-C0 `8e386e8` / T-0 `dceff17`；T-A2 审计闭合。main `38628a0`·134/659 绿·typecheck 净。
> **Wave 2 已派发（2026-07-02）**：**P-G ‖ P-L** 两条单写者流水线并行，文件域不相交（game-scene / lobby），依赖全 done。spec：`tasks/P-G.md`（消费 P-Text）、`tasks/P-L.md`。分支 `task/P-G`、`task/P-L` 已建。按新协议：分阶段送审 → 架构 `approved` → 执行者 `claim/merge/release`（共用单 lane，排队）。**V（Wave 3）待 P-G+P-L 入 main。**
> **美术策略（用户指定 2026-07-02）**：**竖转横的资源文件由执行者「文生图」生成**。横屏方向相关的只有背景（cards/avatars/ui/icons 方向无关，不重生）。ART-06 现在与 P-G/P-L **并行派发**出横版背景 preview → 用户视觉终审 → ART-IMPORT-06 导入并把 P-G/P-L 运行时占位换回真图。分支 `task/ART-06-landscape-backgrounds` 已建。
> **✅ v1.1 横屏化闭合（2026-07-03）**：Wave 3 收口 V `2c88109` + 三 scoped-fix 全落 main：T-COPY-BID `cdb88c8`（叫抢相对措辞）/ T-FIX-GS `d94c790`（地主未决隐藏 + 780×360 结算余量）/ E-ORIENT `2f10e2a`（`builder.json` web-mobile `orientation:landscape`）。**main `d3e1fed`·134/660 绿·typecheck 净**（架构独立复跑）。五目标全闭合（残留bug/命名文案/横屏/真按钮/交互）。**遗留发布前用户侧终检（非阻塞）**：① Creator GUI 构建一次确认 orientation 生效；② 主观 playtest 手感终审。

---

## v1.2 深度打磨批（UI 真皮肤 + 布局重造 + 流程对标 + AI 强化 + 设计债 · 2026-07-03）

> 规划书：`/Users/admin/.claude/plans/beta-1-bug-2-label-3-4-btn-5-ai-curious-muffin.md`（v1.2 版·用户已批）。用户暂停发布，五目标：①UI 文本框感→真皮肤（**33/45 张已导入美术从未接线**，接线为主+定向文生图）②17 对元素重叠→相位可见集布局契约 ③流程对标斗地主（叫抢期可见 17 张+亮底牌+逐手存档）④AI 只出单牌→三档差异化 ⑤设计债审查落任务书。用户三裁决：接线优先 / 最小流程版+逐手存档 / 三档差异化。
> **BOARD 纪律**：状态列禁用字面竖线（v1.1 教训：`\|` 切坏 awk 解析）。
> **三角色制（用户指定 2026-07-03·PROTOCOL 已修订）**：规划者只做方案+测试方案+双向派发任务书+终局定夺（不逐任务评审、不合并）；执行者写码+跑测试后**通知审查者**（不再合并）；**审查者**按 `tasks/R-WAVE1.md` 检查单+自主判断评审——不过=`changes-requested` 直接打回执行者（规划者不参与循环），过=写 `approved` 并**由审查者本人** `claim/merge/release` 合并+验收披露回复规划者。每轮披露后规划者在 BOARD 记裁定。Wave 1 五任务的审查检查单：`tasks/R-WAVE1.md`。

| ID | Wave | 类型 | 文件域 | 依赖 | 状态 |
|----|----|----|----|----|----|
| T-DEDUP | 1 | 纯逻辑+组件机械替换 | 新 `data/storage-keys.ts` + settings/difficultyConfig(isAiLevel 归一) + handStrength/cardMemory(rank 数组) + 两巨组件 ~7 行 import | — | **done `d8b892b`** |
| T-LAYOUT2 | 1 | 纯逻辑 | 新 `ui/table-zones.ts`(架构落桩) + `table-layout.ts` 数值微调 | — | **done `adfb876`**：11 zone·相位互斥·legacy 深相等·135/688 绿+typecheck 净 |
| T-FLOW-BID | 1 | 纯逻辑(flow) | `flow/round-runtime.ts` + `ui/screen-view.ts`（types.ts/driver.ts/policies.ts 只读·契约已由架构补） | — | **done `2f5f220`**：biddingDeal 读口+bottomRevealed 事件+逐手存档 rider；规划者种子修正 `4589323`（cue-id-consistency 三处补 bottomRevealed）→ 135/664 绿+typecheck 净 |
| T-AI-1 | 1 | 纯逻辑(ai) | 新 `ai/levels/lead-score.ts` + `normal.ts` 重写 + `_shared.ts` 只加 + `hard.ts` 两处机械替换 | Wave0 契约 ✅（已种） | **done `9353f76`**：组合首出+农民配合+质量门全绿；规划者裁定 `3ffe8e9`（hard-depth 排序断言迁移至 T-AI-2 质量门）→ 136/669 绿+typecheck 净 |
| T-AI-2 | 1.5 | 纯逻辑(ai) | `hard.ts` + `endgame.ts` + difficultyConfig 文案（仅 description） | T-AI-1 ✅`9353f76` | **done `7476412`**：压制领出+残局收割+三档排序门全绿·过渡态关闭（裁定 2026-07-04） |
| ART-UIKIT | 1 | 美术·文生图 | `asset-previews/v12-uikit/` + report（不碰 resources） | — | **done `7f71cf2`**：v12 preview 包齐（名字牌/底牌托架/btn×3/拉伸模拟/角部裁样）+ 用户视觉终审通过（2026-07-04）→ 139/703 绿+typecheck 净 |
| ART-IMPORT-UIKIT | 1.5 | 美术·导入 | `assets/resources/art/ui/*.png`(+`.meta` Creator·panel-popup 仅配 border) + `asset-keys.ts` 新 2 键；**禁碰两巨组件** | ART-UIKIT ✅`7f71cf2` | **done `5ad2223`**：sha256 逐字节一致·border 四值>0·双键契约绿（裁定 2026-07-04） |
| P-G3 | 2 | 巨组件流水线(四阶段) | `game-scene-skeleton.ts` + 新 `ui/components/game-scene/*.ts`(4 模块) | ①②✅approved；③依赖 ART-IMPORT-UIKIT ✅`5ad2223` | **done `38cc821`** |
| P-L3 | 2 | 巨组件流水线(两阶段) | `lobby-scene.ts` | ①✅approved；②依赖 ART-IMPORT-UIKIT ✅`5ad2223` | **done `62324c4`** |
| V2 | 3 | 收口·验证（verify-only·spec `tasks/V2.md`·审查单 `tasks/R-WAVE3.md`） | `reports/V2.report.md` + `reports/V2-*.png` | P-G3 ✅`38cc821` + P-L3 ✅`62324c4` + T-AI-2 ✅`7476412` | done 2f3dfa5 |
| T-FIX-SETTLE | 3 | scoped-fix(V2-ISSUE-1·editor-evidence·spec `tasks/T-FIX-SETTLE.md`·审查单 R-WAVE3) | `game-scene-skeleton.ts` + `ui/components/game-scene/*.ts` + report | V2 ✅`2f3dfa5` | done 6df0c88 |

> **延后项（设计债·带简报待派）**：记牌深度（GameSnapshot 需出牌历史，hard 现 `trackPlayed([],hand)` 传空=假记牌）；round-runtime(439 行) 拆分；save 双序列化与叫抢期存档**整并一次**升 v2（避免两次迁移税）；audio/卡面/tween 模块化；ui-helpers 皮肤化共享件（P-G3/P-L3 各自本地实现 addButton/addSprite/drawPanelSkin 重复 + 旧 addUiButton/drawPanel 成死导出——抽共享 + 清死码；审查者建议单 2026-07-04 规划者采纳归档，v1.3 与巨组件模块化同批派）；lobby v13 风格统一（第四波管线修正②派生——game-scene 走 v13 新键、lobby 留 v12，后续独立任务统一）。
> **Wave 1 派发（2026-07-03）**：五任务并行、文件域两两零交集（T-DEDUP 退出 ai/levels；ART-IMPORT 禁碰组件；T-FLOW-BID 的 driver/policies/types 只读）。merge lane 顺序：T-DEDUP → T-LAYOUT2 → T-FLOW-BID → T-AI-1（ART-UIKIT 审后随到随合）。P-G3 分支在 T-DEDUP+T-LAYOUT2+T-FLOW-BID 落 main 后创建。
> **Wave 1 裁定（规划者·2026-07-04·依审查者验收披露）**：①T-DEDUP **裁定：确认 done `d8b892b`**（合并后 135/662 绿）。②T-LAYOUT2 审查通过——待审查者按 lane 合并。③T-FLOW-BID 审查判「实现正确、种子缺陷」，**规划者已修种子** `4589323`（cue-id 一致性护栏补 bottomRevealed；根因=Wave0 种子只跑子集未跑全量，已记教训），分支全绿 135/664 → 请审查者复审合并。④T-AI-1 审查判「实现正确、跨任务合同冲突」，**规划者裁定**：hard-depth 12-seed 地主视角小样本代理在普通档强化后天然失效（实测 Hard 0.5 vs Normal 0.667），排序契约**迁移至 T-AI-2 质量门**，已修种子 `3ffe8e9`（保留不变量、摘除排序断言+墓碑注释），分支全绿 136/669 → 请审查者复审合并；T-AI-2 提级为 T-AI-1 落 main 后立即派发。⑤ART-UIKIT 技术门过，**等待用户视觉终审**（preview：`asset-previews/v12-uikit/`，看 `uikit-review-sheet.png` 总览 + `stretch-sim/` 拉伸模拟）。
> **Wave 1 终局裁定（规划者·2026-07-04·三 lane 合并后）**：T-LAYOUT2 **裁定：确认 done `adfb876`** / T-FLOW-BID **裁定：确认 done `2f5f220`** / T-AI-1 **裁定：确认 done `9353f76`**。审查者复审两处种子修正与规划者披露一致（纯测试提交、执行者实现逐字未动）。**main 基线 139 文件/703 全绿 + typecheck 净（规划者独立复跑确认）**。已合并三任务的 worktree+分支清理由审查者执行（`git worktree remove ../斗地主.worktrees/<ID>` + `git branch -d task/<ID>`，post-merge 安全）。
> **ART-UIKIT 终局裁定（规划者·2026-07-04）**：用户视觉终审通过，**裁定：确认 done `7f71cf2`**（评审证据 `0ee7d35`）；ART-IMPORT-UIKIT 随即派发（分支自含 previews 的 main `0f7734c` 创建）。
> **并发事故与纪律（2026-07-04）**：审查者的 ART-UIKIT 证据提交曾落到被规划者临时切走的主工作树分支 task/T-AI-2（杂散 `a391d12`，内容与 main `0ee7d35` 完全相同）——task/T-AI-2 已重置到 main 尖修复，无内容丢失。**新纪律（已入 PROTOCOL 落盘约定）：主工作树常驻 main，任何角色的分支作业（含规划者种子）一律走独立 worktree。**另：质量门修辞修正——Normal 组合率实测 ≈0.985 近天花板，「Hard≥Normal+5pp」数学不可达，改为「≥Normal−5pp（同带不回落）」（spec/R-WAVE2/种子已同步）。
> **Wave 2 派发（2026-07-04）**：**T-AI-2 ‖ P-G3 ‖ P-L3** 三路并行（文件域两两不相交：ai 层 / game-scene+新模块 / lobby）。P-G3①②与 P-L3① 立即可做；P-G3③/P-L3② 等 ART-IMPORT-UIKIT（用户图审后规划者补 spec）。审查任务书：`tasks/R-WAVE2.md`。lane：T-AI-2 随到随合；P-G3/P-L3 分阶段提审、末阶段后整分支合并、共用 lane 排队。
> **Wave 2 第一波终局裁定（规划者·2026-07-04·依审查者验收披露）**：T-AI-2 **裁定：确认 done `7476412`**——压制领出/残局收割/不挥霍守卫/三档文案全绿；质量门实测 Hard 组合首出率 0.993（门 ≥0.50 且 ≥Normal−5pp，Normal 0.985）、压队友率 0（门 ≤0.08）、胜率差 Hard−Normal **+0.133**（门 ≥+0.03）、Hard−Simple +0.633（门 ≥+0.10）→ **「Normal>Hard 过渡态」登记就此关闭**（基线曾为精确 0，胜率差门为证）。ART-IMPORT-UIKIT **裁定：确认 done `5ad2223`**——5 图与 preview sha256 逐字节一致、panel-popup 仅配 border 未换图、6 张 `.meta` border 四值>0、双键契约绿。main `1ef1a88` 基线 **140 文件/711 全绿 + typecheck 净（规划者独立复跑确认）**。
> **协议增补落盘（2026-07-04·`4264629`·协作方起草、规划者审阅采纳）**：批次作业（执行者一窗清整批、批末一次交接）、审查者长上下文多轮全量回扫、角色×模型能力校准、高风险任务三闸（`approved-pending-planner` 排队）、每回合 handoff 模板 `templates/handoff.md`。
> **Wave 2 第二波派发（2026-07-04·规划者确认）**：**P-G3③④ + P-L3②** 正式派发（ART-IMPORT-UIKIT 依赖已满足）。文件域零交集（game-scene/* 与 lobby-scene.ts）——可两窗并行，或按批次协议一窗顺序清（建议序 P-G3③→④→P-L3②，③④可交换）。**开工同步门**：各 worktree 先 `git merge main` 取 v12 美术+双键（规划者已核分支与 main 双向零文件重叠，干净合并）。lane 不变：末阶段 approved 后整分支合并、共用单 lane 先到先 claim。高风险判定：两任务均**常规**（纯 ui 组件域，未触共享契约/状态机/rules）→ 审查者双闸后直接合并，无需规划者把关闸。**V2 已预置**（`tasks/V2.md` + `tasks/R-WAVE3.md`），P-G3+P-L3 落 main 后即可直接派发。
>
> **Wave 2 第二波验收记录（审查者 GLM-5.2 · 2026-07-04 · 两任务 approved 并合并）**
> - **P-G3 `38cc821`（done）**：阶段③④ + 整分支①②③④ approved。③uikit 接线（33+图：btn 三态/panel 九宫格/seat-nameplate/bottom-cards-dock/badge×3/avatar×4/role-badge×2/emphasis×3/settlement-badge/empty-records/icon×6）；④语义命名+文案收尾（地主待定/地主你/倍数×N/手牌N）；可读性返修（BRIGHT_PANEL_TEXT 深粉系+TABLE_TEXT 深灰系，addUiLabel 正确消费 color 参数）。全量回扫：addUiButton/drawPanel 合并后只被 ui-helpers 保留（无害）；按钮名匹配 buttonSkinPath/buttonIconPath（bid-call/grab→primary+iconBid）；RESOURCE_PATHS 键逐键核验。证据：四横屏+交互+ART node probe，productErrors=[]。打回轮次 0。拿不准 2 项转规划者非阻断（addButton 重复代码 / 名字牌对比度→用户终审）。140/711 绿+typecheck 净。
> - **P-L3 `62324c4`（done）**：阶段② + 整分支①② approved。②uikit 接线（panel 九宫格/btn 三态/icon-back/icon-settings/empty-records 空态/toggle 开关态 selected=toggle.on）；可读性返修（PANEL_TEXT/PANEL_ACCENT/PANEL_GOOD/BAD 深色系，addLabel 默认色改 PANEL_TEXT）。全量回扫：返回按钮名匹配 -back-button 后缀；RESOURCE_PATHS 键核验。证据：四横屏×6 屏+交互，productErrors=[]。打回轮次 0。拿不准 1 项转规划者非阻断（addButton 重复代码）。140/711 绿+typecheck 净。
> - **合并后 main `ae9e9dd`**：140 文件 / 711 用例全绿 + typecheck 净 + diff --check 净（审查者独立复跑）。worktree+分支已清理。**V2 解锁**（P-G3+P-L3 落 main）。
> - **遗留**：main 工作树有规划者协议修订未提交（PROTOCOL/agentctl/templates，审查者 stash/pop 恢复，不属本审查范围）。
>
> **Wave 2 第二波终局裁定 + 三项仲裁（规划者·2026-07-04）**：P-G3 **裁定：确认 done `38cc821`**（③33+图 uikit 接线 + ④语义命名/文案 + 可读性返修；四横屏+交互证据 productErrors=[]，打回 0 轮）、P-L3 **裁定：确认 done `62324c4`**（②uikit 接线 + 可读性返修；四横屏×6 屏证据，打回 0 轮）。main `37c4e34` 基线 **140 文件/711 全绿 + typecheck 净（规划者独立复跑确认）**。**v1.2 五目标代码侧全部落地**，仅剩 V2 收口验证与用户终审。三项拿不准仲裁：**①** addButton/addSprite/drawPanelSkin 双组件重复 + ui-helpers 旧 addUiButton/drawPanel 死导出 → **采纳、归档设计债**（已并入上方延后项；不在 V2 收口前再动两巨组件，v1.3 抽共享）。**②** 名字牌 NAMEPLATE_TEXT 对比度 → **折入 V2 待用户主观终审清单**（`tasks/V2.md` 已加必含项，附放大截图）。**③** 主工作树未提交协议修订 → **规划者逐行审阅采纳，落盘 `0a1e2cc`**（能力边界收紧：执行者做全部 GUI 实操并配合用户终审、用户主观终审不可由 AI 替代；BOARD 状态列收紧为精确机器态，agentctl claim/merge 全等校验、release 写纯文本 `done <commit>`）。**今起新写状态列只用机器态**（todo/ready/in-progress/changes-requested/blocked/approved/approved-pending-planner/merge-claimed:ID/done commit），叙述性内容进注记或其它列；存量 done 行免改（脚本不再操作终态行）。
> **Wave 3 派发（2026-07-04·V2 收口）**：verify-only——固定 seed 四横屏真实一局 e2e（叫抢 17 张可见/亮底牌/per-seat 落点/结算清场）+ 17 对重叠复核 + 皮肤覆盖抽查 + AI 观察指标表（对照 T-AI-1/T-AI-2 门）+ PLAYTEST（待用户主观终审项必含名字牌对比度）。分支 `task/V2` 由规划者自 main 创建；常规任务（不触产品码）双闸随到随合。**V2 done 后：规划者做 v1.2 版本终局裁定 + 用户 PLAYTEST/美术观感终审 = v1.2 终点。**
> **V2 终局裁定 + V2-ISSUE-1 仲裁（规划者·2026-07-04）**：V2 **裁定：确认 done `2f3dfa5`**——verify-only 红线守住（diff 仅报告）；四横屏 e2e 全链 settled、`productErrors=[]`；叫抢锁定/可用态、亮底牌、三家落点机械核验齐；AI 指标表与 T-AI-1/T-AI-2 门逐项过（Hard 组合率 0.993、压队友 0、Hard−Normal +0.133、Hard−Simple +0.633）。main `fa00676` 基线 **140 文件/711 全绿 + typecheck 净（规划者独立复跑确认）**。**V2-ISSUE-1 仲裁（规划者亲验 844×390/780×360 e2e 与 playtest 三张结算截图）**：① 口径本体**接受**——「暗幕下透出牌桌」（面板外手牌/座位/顶栏经暗幕可见）是标准牌类结算样式，原契约「底层 HUD 不可见」措辞过严，修正口径 = **全屏暗幕 + 遮罩下不可交互 + 面板内容区无底层元素浮入**；② 但截图坐实一个**独立真缺陷**：statusLine「本局结算」与 last-action 药丸**浮于结算面板之上**、与胜负横幅/倍数/分数行互叠（playtest 图多枚叠入更重）——z 序/相位可见性缺口 → **派 scoped-fix T-FIX-SETTLE**（P-G3 文件域，spec + R 检查单已就绪，分支已建）。**v1.2 收口放行条件 = T-FIX-SETTLE done + 用户主观终审通过**（单次、修后进行：名字牌对比度 + 修后结算画面 + 整体手感；用户主观终审不可由 AI 替代，执行者配合并记录）。

---

## UI-REMAKE（v13 pink 游戏内 UI 重造 · 2026-07-04）

> 用户终审反馈：当前游戏内 UI 元素与布局问题较大；本轮**不改变功能**，只优化游戏内牌桌与结算。明确约束：保持现有 **pink 粉色卡通设计风格**，只参考用户上传截图的布局和元素组织，不换蓝色写实风，不复刻第三方 IP/角色/logo/图标，不新增商店/托管/聊天/更多等功能入口。导入与代码接线受 `ART-GAME-REMAKE` 用户视觉终审 gate 约束。

| ID | Wave | 类型 | 文件域 | 依赖 | 状态 |
|----|----|----|----|----|----|
| ART-GAME-REMAKE | 0 | 美术 preview-only | `asset-previews/v13-pink-game-remake/` + report | T-FIX-SETTLE ✅`6df0c88` | done a629ef3 |
| ART-IMPORT-GAME-REMAKE | 1 | 美术导入（**新文件`-v13`+纯增键·不同名覆盖**·spec 修订版） | `art/*/*-v13.png` + `.meta` + `asset-keys.ts` 纯增 v13 键 + report | ART-GAME-REMAKE ✅`a629ef3` 用户图审 passed | done 8437b85 |
| T-LAYOUT3 | 1 | 纯 UI 布局（种子已验红 16/16·typecheck 净） | `table-zones.ts` + 新 `test/ui/table-zones-v13.test.ts` + report | — | done 1b523df |
| P-G4-UI-REMAKE | 2 | 游戏内 UI 接线（spec 修订版） | `game-scene-skeleton.ts` + `ui/components/game-scene/*.ts` + report | ART-IMPORT-GAME-REMAKE ✅`8437b85` + T-LAYOUT3 ✅`1b523df` | done 3e6cc0f |
| V3 | 3 | 收口·验证（verify-only·spec `tasks/V3.md`·审查单 R-UI-REMAKE R:V3） | `reports/V3.report.md` + `reports/V3-*.png` | P-G4-UI-REMAKE ✅`3e6cc0f` | done 3ddfe9c |

### v1.2 第五波 —— UI-FIX（v13 视觉硬伤整改 + 双层视觉预审补关 · 2026-07-05）

> V3 技术门全绿 + `productErrors=[]` 却被**用户视觉终审 7 项全否**（`reports/V3-user-review.md`）。根因=流程漏洞：审查者 GLM 不能看图、执行者只截图不判美观、规划者末端才介入 → 无「长眼睛」角色在用户前把关。用户三裁决（2026-07-05）：①双层视觉预审（执行者自审→规划者审→双达标才交用户，写入 PROTOCOL 能力校准段·`c0-commit`）；②彻底整改；③名字牌**分离不重叠**（推翻规划者早先「贴附允许重叠」裁定）。规划者亲验 4 张 844×390 截图定位全部代码级根因（见 plan）。

| ID | Wave | 类型 | 文件域 | 依赖 | 状态 |
|----|----|----|----|----|----|
| T-LAYOUT4 | 5 | 纯 UI 布局（种子收紧·分离/不撞/外移上移） | `table-zones.ts` + `test/ui/table-zones-v13.test.ts` + report | — | done 9d5e70b |
| P-G5-UIFIX | 5 | 游戏内 UI 硬伤整改（editor-evidence·双层视觉预审前置） | `game-scene-skeleton.ts` + `ui/components/game-scene/*.ts` + report | T-LAYOUT4 ✅`9d5e70b` | done b13896c |
| V4 | 5 | 收口·验证（verify-only·spec `tasks/V4.md`·审查单 R-WAVE5 R:V4） | `reports/V4.report.md` + `reports/V4-*.png` | P-G5-UIFIX ✅`b13896c` | done 14b71f2 |

### v1.2 第六波 —— UI-FIX2（V4 用户签收 5 项不通过整改 · 2026-07-05）

> V4 收口 done 但**用户审美签收 2 通过/5 不通过**（`reports/V4-user-review.md`）：人物位置/名字牌/按钮/结算/手感不过（**按钮+人物位置为复发项**）。**规划者视觉预审关自省**：R1 判按钮「可接受」、R1-R3 判结算「达标」均被用户否——gate 标准偏松、漏判。本波 gate 从严（逐项对照用户否点 + 针对性 zoom）。

| ID | Wave | 类型 | 文件域 | 依赖 | 状态 |
|----|----|----|----|----|----|
| P-G6-UIFIX2 | 6 | 游戏内二轮视觉整改（editor-evidence·双层视觉预审从严） | `game-scene-skeleton.ts` + `ui/components/game-scene/*.ts` + report | P-G5-UIFIX ✅`b13896c` | done 1951f88 |
| V5 | 6 | 收口·验证（verify-only·spec `tasks/V5.md`·审查单 R-WAVE6 R:V5） | `reports/V5.report.md` + `reports/V5-*.png` | P-G6-UIFIX2 ✅`1951f88` | done 3a23c6f |

> **派发顺序**：先做 `ART-GAME-REMAKE` preview 并等用户视觉终审；`T-LAYOUT3` 可并行做纯布局契约；资源导入必须等用户图审通过；`P-G4-UI-REMAKE` 等导入 + 布局均 done 后再做。审查单：`coordination/tasks/R-UI-REMAKE.md`。
> **种子证据**：`ART-GAME-REMAKE` preview gate 已入 main `ff43262`；`task/T-LAYOUT3` 已建并种红测试 `eca5345`（`test/ui/table-zones-v13.test.ts` 16 红，typecheck 净）。
>
> **第四波收编裁定（规划者·2026-07-05·执行 plan 已获用户批准）**：
> - **T-FIX-SETTLE 终局裁定：确认 done `6df0c88`**——settled 相位门控 20 瞬时节点 + overlay 置顶 + 面板底衬 + loadSprite 安全包装；四横屏 transient 全 0 且暗幕下牌桌保留（正合 V2-ISSUE-1 仲裁口径）；再来一局/返回大厅回归链齐；打回 0 轮。main `7b2f03a` 基线 **140 文件/711 全绿 + typecheck 净（规划者独立复跑确认）**。v1.2 收口条件①闭合；条件②用户终审=**观感不过**（「UI 过于难看」）→ 触发本第四波；**用户裁决（2026-07-05）：并入 v1.2 顺延，v1.2 终点 = V3 done + 用户终审通过**。
> - **UI-REMAKE 批次追认**：执行者预谋划骨架（4 spec + R 单 + T-LAYOUT3 种子）**追认有效**；种子实跑验证 **16/16 红 + typecheck 净**（规划者 2026-07-05）。纪律注记：preview 直落 main `ff43262` 属用户特批一次性豁免，后续一律任务分支+lane。
> - **方向稿定档（用户 2026-07-05）**：`source/ai-direction-sheet.png` 即 v13 目标方向，逐件成品只做**单轮图审**；**范围=全量重做**（用户裁决：含卡面模板/牌背/花色/Joker/托架）。
> - **管线修正①（文生图）**：Pillow 脚本分项图/合成图降级为**布局示意**（质感低于现役 v12 + 文字互叠，规划者亲验裁定），正式资产一律 image_gen 逐件文生图（沿 v12 ART-UIKIT 流程先例）。
> - **管线修正②（新键不覆盖）**：import 由「同名替换」改为 **`-v13` 新文件 + asset-keys 纯增 `xxxV13` 键**——btn-*/panel-popup 为大厅共用键，同名替换会静默重皮大厅（违反不改大厅约束）且不可回滚；「lobby v13 风格统一」登记设计债。
> - **修订落盘**：ART-GAME-REMAKE / ART-IMPORT-GAME-REMAKE / P-G4-UI-REMAKE / R-UI-REMAKE 四 spec 修订版 + V3 预置（`tasks/V3.md` + R:V3）。lane：T-LAYOUT3 随到随合；ART 链按 逐件文生图→用户图审→import→P-G4 整分支→V3；均常规任务双闸。分支：`task/ART-GAME-REMAKE` 由规划者自 main 建；`task/T-LAYOUT3` 已存在（种子 `eca5345`）。
>
> **T-LAYOUT3 终局裁定 + 两项仲裁（规划者·2026-07-05）**：T-LAYOUT3 **裁定：确认 done `1b523df`**——审查者打回 1 轮（heroBody×opponentLeftBody 四档重叠，域内致命，抓得对）；执行者返工把 opponentLeftBody 右移形成「左下玩家、左上偏中 AI、右上 AI」围桌结构，三立绘交叉面积四档全 0（数值证据在报告）；种子 16 红→绿、legacy 6 字段与 T-LAYOUT2 zones 零改动兼容。main `0e0471f` 基线 **141 文件/727 全绿 + typecheck 净（规划者独立复跑确认，+16=v13 契约）**。两项仲裁：**①名字牌=贴附件**——渲染于宿主 body 上层（z 序），与宿主免 8px 间距；与非宿主 zone 仍守间距（方向稿即此形态，P-G4 spec 已落口径）。**②settlementShowcase=settled 相位专属可见集**——与 bidding/playing 集 zone（body/nameplate/dock）重叠合法，靠相位互斥+暗幕保证，P-G4 接线继承 T-FIX-SETTLE settled 门控（spec 已落口径）；bottomCardsDock×showcase 同理。两口径均**不改种子测试**（种子未断言贴附/跨相位间距，现契约与口径一致）。另：主工作树 `test/package-lock.json` 39 行 install 噪声已恢复原状。ART-GAME-REMAKE 进展注记：task 分支已有 3 提交（imagegen 逐件生成 + 两轮对齐参考图人物关系），待执行者交你单轮图审。
>
> **ART-GAME-REMAKE 终局裁定 + ART-IMPORT 派发（规划者·2026-07-05）**：ART-GAME-REMAKE **裁定：确认 done `a629ef3`**——**用户单轮图审逐项 passed**（7 大项记录表：总览/三合成/卡牌 8 件/九宫格 7 件/主观项；图审期两轮返工——人物重叠、底牌托架辨识度——均有用户反馈原文+修复+机械校验复跑）；审查者 0 打回，证据链核验齐（image_gen 出处、正式清单、PROMPTS/manifest sha256、旧 Pillow 件已标注非正式）；文件域纯净（零代码触碰，merge dry-run 无冲突）；本任务起已按纪律走任务分支+lane（`ff43262` 豁免不再复用）。main `a915019` 基线 **141 文件/727 全绿 + typecheck 净（规划者独立复跑确认）**。**ART-IMPORT-GAME-REMAKE 正式派发**（依赖已满足，行翻 `ready`，分支 `task/ART-IMPORT-GAME-REMAKE` 由规划者自 main 建）：按修订版 spec 执行——只导入图审 passed 件、`-v13` 新文件逐字节拷贝、`asset-keys.ts` 纯增 `xxxV13` 键、`.meta` 仅 Creator 生成、九宫格件检视器配 border、lobby 键/文件零改动。lane 顺序不变：ART-IMPORT → P-G4-UI-REMAKE → V3。
>
> **P-G4-UI-REMAKE 终局裁定 + V3 派发（规划者·2026-07-05）**：P-G4-UI-REMAKE **裁定：确认 done `3e6cc0f`**——审查者 0 打回（5 文件 / +440−134，v13 键/zone 消费全核、非阻断观察 1 项 renderPlayArea 死 label）；**规划者抽查佐证**：game-scene 源文件 27 处 v13/V13 键引用、lobby-scene.ts 零触碰、T-FIX-SETTLE settled 门控 5 处关键代码完整保留（`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES`/`showTransientHud`/相位判断/`event.type===settled`/`deriveAiThinking settled`）。main `29c6ebf` 基线 **141 文件/727 全绿 + typecheck 净**。**V3 正式派发**（spec/tasks/V3.md 已于第四波收编时预置；行翻 ready，分支 `task/V3` 由规划者自 main 建）。V3 是 fourth wave 最后一步——verify-only 固定 seed e2e + 皮肤覆盖 + AI 指标 + PLAYTEST + 待你主观终审。**V3 done + 你终审通过 = v1.2 终点**。
>
> **ART-IMPORT-GAME-REMAKE 终局裁定 + P-G4 派发（规划者·2026-07-05）**：ART-IMPORT-GAME-REMAKE **裁定：确认 done `8437b85`**——审查者 0 打回（sha256 逐字节/meta 结构真实性/border/键契约全过，48 文件 +3364 行，回扫无分流项）；**规划者独立抽查佐证**：`-v13` 文件 46 项落位、`asset-keys.ts` 23 处 V13 键**纯增零删行**、lobby-scene.ts 经合并**零触碰**（管线修正②执行到位）。main `d0ad9f3` 基线 **141 文件/727 全绿 + typecheck 净（规划者独立复跑确认）**。**P-G4-UI-REMAKE 正式派发**（两依赖均 done，行翻 `ready`，分支 `task/P-G4-UI-REMAKE` 由规划者自 main 建）：按修订版 spec 接线 v13 新键组 + v13 zone；审查重点（R:P-G4-UI-REMAKE）：相位互斥、per-seat 落点、bottomRevealed、**T-FIX-SETTLE settled 门控不回归**、名字牌贴附/settlementShowcase 相位口径（T-LAYOUT3 仲裁）、四横屏 GUI 证据 + `productErrors=[]` + 再来一局/返回大厅回归链。P-G4 done 后 V3 即解锁（spec 已预置）。
>
> **V3 终局裁定 + 第五波 UI-FIX 派发（规划者·2026-07-05）**：V3 **裁定：确认 done `3ddfe9c`**（verify-only 技术门全绿·四横屏 e2e `productErrors=[]`·AI 指标达门）——**但 v1.2 终局条件未满足**：用户视觉终审 7 项**全否**（元素重叠/文字盖文字/btn 背景不包裹文字+对比不足/底牌三张闪烁 bug/角色需外移上移/名字牌不可重叠/手牌中间不要数字/结算观感）。**流程根因裁定**：审查者 GLM 不感知图像、执行者只截图不判美观、规划者末端才看图 → 视觉硬伤穿过所有门。**PROTOCOL 补关（用户裁决①）**：新增「双层视觉预审关」——UI 任务交用户前必过 执行者自审四类硬伤（重叠/对比/包裹/闪烁）→ 规划者视觉审（Opus 逐张看图，不达标打回执行者），双达标才用户审美签收；GLM 仍只核结构不判美观（templates 加执行者自审勾销表）。**名字牌裁定更正**：推翻早先 T-LAYOUT3「名字牌贴附 body 允许重叠」，改为**分离不重叠**（用户裁决③·T-LAYOUT4 种子加 `rectGap≥8` 断言）。**第五波派发**：T-LAYOUT4（纯逻辑·收紧种子：名字牌 vs body 分离、3 HUD 区 vs body 不撞、opponent body 外移上移）→ P-G5-UIFIX（删卡面中心数字 890 行/按钮 9-slice 高度≥60 容 border 24/底牌幂等渲染消闪烁/HUD 消费新区/结算横幅不切叠+暗幕加深/叫抢字提对比/顶部信息条松绑·双层视觉预审前置）→ V4 收口。审查单 `tasks/R-WAVE5.md`。规划者亲验根因表见 plan。main 基线 **141 文件/727 全绿 + typecheck 净（规划者独立复跑确认）**。**T-LAYOUT4 种子已验红**（`task/T-LAYOUT4` `99dd541`：名字牌 vs 宿主 body + 强度/剩牌/建议 vs 对家 body 各 4 横屏共 **8 断言红**，既有 16 + 名字牌不压手牌守卫 + T-LAYOUT2 全绿，typecheck 净）；spec `tasks/{T-LAYOUT4,P-G5-UIFIX,V4}.md` 已入 main `8ea47e6`；分支 `task/T-LAYOUT4` worktree 就绪待执行者进驻。
>
> **T-LAYOUT4 终局裁定 + P-G5-UIFIX 派发（规划者·2026-07-05）**：T-LAYOUT4 **裁定：确认 done `9d5e70b`**——审查者 0 打回；**规划者独立 dump 佐证**：名字牌 vs 宿主 body `rectGap` 四档全 =8（分离达标）、强度/剩牌/建议 vs 对家 body 54-59（远清）、立绘成左下(hero x8,y230)/左上(x8,y29)/右上(x730,y29) 围桌——确实外移(x→屏缘)上移(y 47→27-29)；手法=bodyWidth 0.142→0.125 缩窄 + bodyHeight 0.49→0.41 缩矮 + topBodyY 0.12→0.075，legacy 6 字段 + `tableZones` 函数体零改动、T-LAYOUT2 语义全绿。种子 12 断言全绿（8 目标 + 4 守卫）。main `fa01f44` 基线 **141 文件/739 全绿 + typecheck 净 + diff --check 净（规划者独立复跑确认）**。**P-G5-UIFIX 正式派发**（依赖满足，行翻 `ready`，分支 `task/P-G5-UIFIX` 由规划者自 main 建）：按 spec 整改 8 项硬伤（删卡面中心数字 890/按钮盒高≥60 容 9-slice+标签包裹+对比/底牌幂等消闪烁/HUD 消费 T-LAYOUT4 新区/名字牌分离渲染/结算横幅不切叠+暗幕加深/叫抢字底衬/顶部信息条松绑）。**交付前置=双层视觉预审**（执行者自审四类硬伤填勾销表→规划者逐张视觉审达标才交用户）——审查者 GLM 只核结构不判美观（R:P-G5-UIFIX）。lane：末段整分支合。
>
> **P-G5-UIFIX 规划者视觉审 R1（规划者·2026-07-05·`task/P-G5-UIFIX` `c70e58a`）：changes-requested——不达标，不上交用户、不转审查者，打回执行者返工**。规划者逐张看了 `/tmp/doudizhu-pg5-uifix-evidence-final/` 844×390+780×360 四相位截图。**已达标勿回退**：卡面中心大数字已删（仅角标+花色）、三立绘到四角、叫抢字加深色底衬对比 OK、结算标题/横幅分层不切叠、手牌横铺不居右、按钮可接受（灰白态=AI 回合 disabled 正常，enabled 有色可读——此项撤回原疑虑）。**必须返工 2 硬伤**：① **底左名字牌压 hero 立绘（class① 重叠·用户红线）**——四档「你 N张」「左家 N张」两枚名字牌叠在 hero 立绘上，且**左家名字牌疑似错位到底左**（顶左对家立绘下方无名字牌）；要求每名字牌落各自立绘下方/外侧、渲染实测不压任何立绘 sprite（zone gap=8 但立绘贴图溢出 zone → 需缩贴图或加净空）。② **结算暗幕未盖底部手牌（用户「暗幕不足底层透亮」）**——面板下方底部手牌行仍全亮；暗幕须全屏覆盖（守 T-FIX-SETTLE：牌桌可见但压暗、面板内无浮入）。**一并处理（用户新反馈软要求）**：③ 左上/右上人物再向牌桌中心靠一点（现贴屏缘）；④ 确认手牌屏幕居中（底左 hero 与最左手牌略挤，确认无压牌）；⑤（可选）按钮顶部爱心九宫格被拉成「帐篷帽」略失真。返工后执行者重填自审勾销表 → 规划者复审 → 双达标才转审查者 R-WAVE5 R:P-G5-UIFIX。**这是双层预审关首次拦截生效**（V3 曾无此关 7 项全否到用户）。
>
> **P-G5-UIFIX 规划者视觉复审 R2（规划者·2026-07-05·`task/P-G5-UIFIX` `3dfa09c`）：changes-requested——1 残留重叠，仍不上交用户**。逐张看 `/tmp/doudizhu-pg5-uifix-evidence-r1-fix/` 四横屏 + zoom（r1-nameplates-zoom / r1-settlement-dim-zoom）。**R1 两硬伤已清（勿回退）**：① 名字牌**已移出立绘 sprite**（bidding zoom 三档确认，左/右/hero 名字牌浮于牌桌felt、不压人物；左家名字牌不再错位到底左）；② 结算暗幕**已加深**（alpha 176→218，dim zoom 确认底部手牌被压暗、可见但明显变暗，守 T-FIX-SETTLE 口径）；立绘向桌心靠拢+缩放亦已做。**新残留 1 硬伤（R1 relocation 引入）**：playing 相位**四档**底左 hero「你 N张」名字牌**压住「剩牌 大王11:22A2K4Q3」记牌文本**（R1 把 hero 名字牌移到"玩家立绘右侧外部"正好落进 memoryDock 文本列）——text-over-text，踩用户「元素不可重叠」。**concrete fix（打回执行者）**：hero 名字牌落**底左角 hero 立绘正下方/内侧**（T-LAYOUT4 heroNameplate zone，x≈gap，手牌上方净空），**清出 memoryDock 文本列**；确保 hero 名字牌 vs（记牌文本 + 强度条）**渲染实测 gap≥8**；R3 证据须附 **playing 相位底左 zoom**（R1 nameplate zoom 是 bidding 相位无记牌文本，故未暴露此项）。可选：hero「你 N张」与顶部「手牌N」信息重复，允许简化。**其余全部 accepted**（卡面/按钮/结算/HUD 让位/立绘/顶部条勿动）。R2 返工后重填自审表 → 规划者 R3 复审 → 双达标才转审查者。
>
> **P-G5-UIFIX 规划者视觉审 R3 = 达标·PASS（规划者·2026-07-05·`task/P-G5-UIFIX` `36c5703`）——此为「规划者视觉审结论」（R:P-G5-UIFIX 检查单据此核销）**。逐张看 `/tmp/doudizhu-pg5-uifix-evidence-r2-fix/` 四横屏 + `r2-playing-bottom-left-zoom`（我上轮指定的 playing 相位底左 zoom）。**R2 必修项已清**：playing 相位四档，hero 压缩为小「你」名字牌，落玩家立绘右侧、强度/记牌 HUD 左侧，与「剩牌/展开/大王11:22A2K4Q3」记牌文本列**分离不再压**（zoom 确认「你」badge 与「大王…」之间有间隙，报告称几何 gap=8）。**R1 accepted 项未回退**（四横屏复核）：卡面仅角标+花色无中心数字、三立绘到四角且靠拢、名字牌不压立绘、结算暗幕全屏压暗底部手牌、按钮/顶部条稳定。**双层视觉预审四类硬伤（重叠/对比/包裹/闪烁）已全清**。**转审查者 R-WAVE5 R:P-G5-UIFIX**（结构/契约/T-FIX-SETTLE 门控/相位互斥/证据链核）。**留给用户审美签收的非硬伤观察（供 V4 终审知情·非打回项）**：① 左列偏密（强度/左家名牌/剩牌/你+记牌四层堆叠，无重叠但紧凑）；② 名字牌 ribbon 用深字浅底（合方向稿设计、可读）；③ 顶部右角有一枚半裁徽标（四档一致·极小）——三者均属用户可选的审美取舍，不阻断合并。历经 R1（2 硬伤）→R2（1 残留）→R3 达标，**双层预审关三轮拦下全部硬伤才放行**，正是防第三次用户翻车的设计目的。
>
> **P-G5-UIFIX 终局裁定 + V4 派发（规划者·2026-07-05）**：P-G5-UIFIX **裁定：确认 done `b13896c`**——审查者 0 打回（三轮视觉返工由规划者视觉审 R1/R2/R3 拦截，审查者不重复视觉判断，只核结构：5 文件 game-scene 域 +260−136、test/纯层/lobby/meta/resources/asset-keys 零改动、无新美术）；**规划者独立抽查佐证**：main 上 `card-face-rank` 0 命中（中心数字已删）、`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES`/`showTransientHud` 10 命中（T-FIX-SETTLE settled 门控完整保留）。另：主工作树 `cocos.config.json` 的 gizmo 编辑器噪声已 checkout 还原（非任务改动）。main `5db3e53` 基线 **141 文件/739 全绿 + typecheck 净 + diff --check 净（规划者独立复跑确认）**。**V4 正式派发**（spec `tasks/V4.md` 已第五波预置；行翻 `ready`，分支 `task/V4` 由规划者自 main 建）：verify-only 固定 seed 四横屏全相位 e2e（v13 整改后布局）+ 双层视觉预审通过记录复述（R1/R2/R3）+ AI 指标不低于 T-AI-1/T-AI-2 门 + PLAYTEST + **用户审美签收项**明确列出（整体观感对照方向稿/名字牌/手牌/按钮/结算/手感 + R3 已登记 3 项非硬伤观察供知情），不代判。审查按 R-WAVE5 R:V4。**V4 done + 用户审美签收通过 = v1.2 终点**。
>
> **V4 用户签收裁定 + 第六波 UI-FIX2 派发（规划者·2026-07-05）**：V4 **裁定：确认 done `14b71f2`**（verify-only 技术门全绿）——**但 v1.2 终局条件未满足**：用户审美签收 **2 通过（整体 pink 观感/手牌可读性）/5 不通过**（人物与牌桌关系·名字牌·按钮·结算·手感，`reports/V4-user-review.md`）。**规划者视觉预审关自省（重要）**：R1 判按钮「可接受」、R1-R3 判结算「达标」被用户否——**gate 标准比用户松、漏判按钮与结算细节**（按钮+人物位置为复发项）。裁决：**重开 scoped-fix 第六波**，gate 从严。**逐条诊断 + 代码根因**：① 人物再外移上移（seats render 偏移不足）；② 名字牌须清晰显示地主/农民 + 左右家名字牌过深入 felt 移近立绘/屏缘（seats）；③ 出牌区牌面点数须可见（现 dropZone 牌缩放 0.74+仅小角标看不清）+ 手牌角标增大；④ **按钮背景必须包裹文字 + 底色文字高对比**（`addButton`·复发·本轮务必彻底）；⑤ 结算 5 子项——文字重叠/「失败」横幅文字溢出底图/顶部「本局结算」压底纹低对比/「返回大厅」去冗余返回箭头(`buttonIconPath` result-lobby→iconBack 删)/同层按钮文字色统一(`BUTTON_PRIMARY_TEXT(116,36,82)` vs `BUTTON_SECONDARY_TEXT(白)` 不一致→结算两键统一)；⑥ 全相位零重叠硬门。**派发 P-G6-UIFIX2**（game-scene render 域·spec `tasks/P-G6-UIFIX2.md`·审查单 `tasks/R-WAVE6.md`·分支自 main 建）→ V5 收口 → 用户再签收。main `da27055` 基线 **141 文件/739 全绿 + typecheck 净（规划者独立复跑确认）**。**双层视觉预审本波从严**：规划者逐项对照用户 5 否点 + 按钮/结算/出牌区/人物名字牌针对性 zoom，达标才交用户。
>
> **P-G6-UIFIX2 规划者视觉审 R1 = 达标·PASS（规划者·2026-07-05·`task/P-G6-UIFIX2` `7d869ef`）——此为「规划者视觉审结论」（R:P-G6-UIFIX2 检查单据此核销）**。本轮 gate **从严**（针对上轮漏判按钮/结算）：逐项对照用户 5 否点 + 逐个针对性 zoom（enabled 按钮 zoom、结算面板 zoom、出牌区 zoom、人物名字牌 zoom、四横屏 playing/settlement sweep）。**5 否点逐项达标**：① 人物**外移上移**（左右立绘到屏角+缩视觉占位，`780-bidding-characters-nameplates`）；② 名字牌**显角色**（待定/农民/地主）**且贴屏缘不深felt**（同 zoom）；③ 出牌区点数可见（AI 出牌牌面缩放 0.74→0.92，`780-ai-play-card-rank` 6♦ 角标清晰）+ 手牌角标增大；④ 按钮**enabled 态**（叫地主粉底白字/不叫紫底白字）文字完整包裹+高对比（`780-bidding-buttons`），**disabled 态灰白为正常**；结算两键统一深栗字（`780-settlement-buttons`）；⑤ 结算 5 子项全清（标题深底提对比/失败字缩入横幅/去「继续加油」重叠/删返回箭头/两键同色·`780-settlement-panel`）；⑥ 四横屏 playing+settlement sweep **零重叠**，hero 名字牌移屏缘显地主、与记牌文本分离（P-G5 R2 残留未复发）。执行者内部自审已抓修一处 HUD「展开9」叠字（r1→r2）。**转审查者 R-WAVE6 R:P-G6-UIFIX2**。**留用户 V5 签收的非硬伤观察（非打回）**：顶部右角半裁小徽标（沿旧）、playing 左列偏密（无重叠）、结算失败字紫底红字对比中等——均用户可选。gate 校准生效：本轮以 enabled-button/settlement-panel zoom 逐颗核实，非上轮泛看。
>
> **P-G6-UIFIX2 终局裁定 + V5 派发（规划者·2026-07-05）**：P-G6-UIFIX2 **裁定：确认 done `1951f88`**——审查者 0 打回（5 文件域 +215−55、全仓回扫 0 分流、T-FIX-SETTLE/相位/per-seat/T-LAYOUT4 不回归）；规划者视觉审 R1=PASS 作双层预审第二层结论核销；**规划者独立抽查佐证**：main 上 `card-face-rank` 0（中心数字仍删）、settled 门控 10（完整）、`result-lobby` 的 iconBack **0 命中**（返回大厅冗余返回箭头已删·正合用户 #6d）。config gizmo 编辑器噪声已还原。main `3b1ab4b` 基线 **141 文件/739 全绿 + typecheck 净 + diff --check 净（规划者独立复跑确认）**。**V5 正式派发**（spec `tasks/V5.md` 已第六波预置·行翻 `ready`·分支 `task/V5` 由规划者自 main 建）：verify-only 固定 seed 四横屏全相位 e2e（v13 二轮整改后）+ 双层视觉预审通过记录复述（R1）+ V4 五否点逐项复核证据 + AI 指标对照 T-AI-1/T-AI-2 门 + PLAYTEST + **用户审美签收项**明确列出（7 项 + V4 五否点复核 + R1 三项非硬伤观察供知情），不代判。审查按 R-WAVE6 R:V5。**V5 done + 用户审美签收通过 = v1.2 终点**（规划者做版本终局裁定收版）。
>
> ### v1.2 第七波 —— UI-FIX3（V5 用户签收 4 项不通过整改 · 2026-07-06）
> V5 done `3a23c6f` 但**用户本机体验签收不通过**（`reports/V5-user-review.md`）：① 暂停面板 6 按钮丑/文字不包裹/两组不同色（用户裁决**另生美术**）；② 右家出牌多时牌型文字（顺子）与牌重叠、多牌内文字互压；③ 出牌顺序应逆时针（现顺时针错）；④ 左右家文字/btn 显示异常。
>
> | ID | Wave | 类型 | 文件域 | 依赖 | 状态 |
> |----|----|----|----|----|----|
> | ART-PAUSE-BTN | 7 | 美术 preview（用户图审·文生图） | `asset-previews/v13-pause-buttons/` + report | — | done 69d02fe |
> | ART-IMPORT-PAUSE-BTN | 7 | 美术导入（新文件+纯增键） | `art/ui/pause-btn-*.png`+`.meta`+`asset-keys.ts` 纯增+report | ART-PAUSE-BTN 用户图审通过 | done aa1401b |
> | P-G7-UIFIX3 | 7 | 游戏内三轮整改（①done `93cc7c2`·②暂停接线） | `game-scene-skeleton.ts`+`ui/components/game-scene/*.ts`+report | ①P-G6 ✅；②ART-IMPORT-PAUSE-BTN ✅`aa1401b` | done 5b42a35 |
> | V6 | 7 | 收口·验证（verify-only·spec `tasks/V6.md`·审查单 R-WAVE7 R:V6·**重跑**） | `reports/V6.report.md`+`reports/V6-*.png` | P-G7-UIFIX3 ✅`5b42a35` + T-FIX-DROP-HUD ✅`1959205` | done 471b384 |
> | T-FIX-DROP-HUD | 7 | scoped-fix（左家多牌×HUD 重叠·V6 阻断残留·editor-evidence·双层视觉预审） | `game-scene-skeleton.ts`+`game-scene/*`+report | P-G7-UIFIX3 ✅`5b42a35` | done 1959205 |
>
> **V5 用户签收裁定 + 第七波派发（规划者·2026-07-06）**：V5 **裁定：确认 done `3a23c6f`**（verify-only 技术门全绿）——**但 v1.2 终局未达**：用户 4 否点。**逐条诊断+代码根因**：**#3 出牌顺序**经查是 **UI 座位映射非 game 逻辑**（`game/seat.ts nextSeat=(seat+1)%3` 抽象轮转正确；UI `seats-renderer.ts seatName` seat1=左家渲染到左→视觉顺时针；标准斗地主逆时针=下家在右）→ **UI 翻转 seat1→右/seat2→左，game 层不动**（低风险·nextSeat 不改）。**#2** `renderPlayArea`(:578) 多牌+牌型标签重叠→布局避让。**#4** 左右家文字/btn 异常→复现修（疑与座位映射/nameplate 相关）。**#1** 暂停 6 按钮（`renderPauseMenu`:770 现 72×30/176×42 沿用 v13 皮肤太小 9-slice 压变形）——**用户裁决另生美术**（AskUserQuestion 2026-07-06）→ ART-PAUSE-BTN→用户图审→import→P-G7② 接线+包裹+两组同色。**派发**：ART-PAUSE-BTN（并行·用户图审外部时钟）+ P-G7-UIFIX3 阶段①（#2/#3/#4 即开·分支自 main 建）→ ART-IMPORT-PAUSE-BTN（图审后）→ P-G7② 暂停接线 → V6 收口 → 用户再签收。审查单 `tasks/R-WAVE7.md`。**双层视觉预审从严延续**（规划者逐项对照 4 否点+针对性 zoom）。main `90110ff` 基线 **141 文件/739 全绿 + typecheck 净（规划者独立复跑确认）**。**V6 done + 用户签收 = v1.2 终点**。
> **P-G7-UIFIX3 阶段① 规划者视觉审 R1 = 达标·PASS（规划者·2026-07-06·`task/P-G7-UIFIX3` `acadcc1`）——此为「规划者视觉审结论」（R:P-G7-UIFIX3 阶段① 据此核销）**。逐项 zoom 复核 `/tmp/doudizhu-pg7-uifix3-evidence/`。**#3 逆时针✅**：右家(seat1)先出（A♠A♦）、左家(seat2)后（右家play截图）；牌落正确侧；新 `seat-display.ts` 映射 seat1→右/seat2→左，人物/名字牌/last-action/thinking/落点/结算席位名统一消费；**game/rules/flow 层 diff 零改动**（nextSeat 不动·独立核验）。**#2 多牌不重叠✅**：连对4张铺开+牌型标签在牌上方（844-right-multi-zoom）、8张顺子自动分2行（left-seat-multi-card 四档一致·角标可读不互压）。**#4 左右家文字/btn✅（带保留）**：名字牌四档清晰对称、左右文案集中入 `seatDisplayName`；**但用户 #4 红框截图未入仓库、执行者无法复现其确切异常**——现渲染干净且最可能根因（座位翻转后左右文案错配）已修，**留 V6 用户签收确认**。settled 门控/相位/T-LAYOUT4 无重叠/卡面无中心数字不回归；四档 productErrors=[]。**转审查者 R-WAVE7 R:P-G7-UIFIX3 阶段①**。**合并提示**：分支建于 `f3f182e`（早于 V5-user-review.md 提交 `0993fd0`），`git diff` 显示该文件 -43 系分支落后 main、非执行者删除——审查者合并前 `git merge main` 或核 3-way 合并保留该文件。非硬伤观察沿旧：顶部右角半裁小徽标（四档一致·极小）。
> **P-G7-UIFIX3 阶段① 终局裁定 + ART-PAUSE-BTN 图审代批 + 阶段②/V6 时序（规划者·2026-07-06）**：
> - **P-G7-UIFIX3 阶段① 裁定：确认 done `93cc7c2`**——审查者 0 打回（6 文件域、**game 层零改动**独立核验、V5-user-review 3-way 合并存活、四档 productErrors=[]）；规划者视觉审 R1=PASS 作结论核销；新脚本 `seat-display.ts` 的 Creator `.meta` 已补提。main `fc67eb1` 基线 **141 文件/739 全绿 + typecheck 净（规划者独立复跑确认）**。#2/#3/#4 阶段①闭合（#4 带保留留 V6）。
> - **审查者非阻断建议（采纳·登记设计债·非阻断 v1.2）**：`ai-thinking-view.ts:13` `deriveAiThinking` label 仍用旧映射（1=左家/2=右家），但 `renderAiThinking` 不消费 `thinking.label`（改用 `seatDisplayName`）→ **当前零渲染影响**；latent 不一致。**裁决：登记 v1.3 纯 view 小清理**（`ai-thinking-view.ts`+测试统一映射），非阻断 v1.2；用户要求可随时插纯逻辑小任务。
> - **ART-PAUSE-BTN 图审代批（用户 2026-07-06 放弃本轮图审、授权规划者代判）**：规划者审 `task/ART-PAUSE-BTN` `a918566` 的 review-sheet + 拉伸模拟——**通过**：2 皮肤（`pause-btn-toggle` 浅奶油底=音效/动效/震动组、`pause-btn-action` 金黄底=继续/重开/退出组），176px 拉伸模拟**文字完整包裹药体、深字高对比**、粉色卡通合 v13、两组各自同风；64px 极小档略挤（实际按钮更宽·非问题）。**正对用户 #1 诉求**（包裹+两组同色+不丑）。→ **转审查者 R:ART-PAUSE-BTN 结构审**（image_gen 出处/sha256/文件域）approved 合并后 **ART-IMPORT-PAUSE-BTN 派发**（新文件+纯增键）。
> - **阶段②/V6 时序**：ART-IMPORT-PAUSE-BTN 落 main 后 → 派 **P-G7-UIFIX3 阶段②**（暂停 6 按钮消费新键+背景包裹文字+两组各同色高对比+四横屏暂停面板 menu/confirm 截图·双层视觉预审）→ 合并 → **V6 收口**（verify-only·固定 seed 四横屏全相位 + V5 四否点逐项复核[#4 重点] + 用户审美签收）。**V6 done + 用户签收 = v1.2 终点**。
> **ART-PAUSE-BTN 终局裁定 + ART-IMPORT-PAUSE-BTN 派发（规划者·2026-07-06）**：ART-PAUSE-BTN **裁定：确认 done `1a81e8d`**（图审由规划者代批·用户授权）——审查者结构审 0 打回；**规划者独立抽查佐证**：preview 正式件在 main、sha256 `pause-btn-toggle=dfc59c31…`/`pause-btn-action=3ff4a240…`（与派发指令一致）、asset-keys 现 `pauseBtn` 键 0 命中（import 将纯增）。main `f24b818` 基线 **141 文件/739 全绿 + typecheck 净（规划者独立复跑确认）**。**ART-IMPORT-PAUSE-BTN 正式派发**（依赖满足·分支 `task/ART-IMPORT-PAUSE-BTN` 自 main 建）：导入 2 件为 `assets/resources/art/ui/pause-btn-{toggle,action}.png`（sha256 逐字节一致）+ `.meta` Creator 生成 sprite-frame border≥24 + `asset-keys.ts` **纯增** `pauseBtnToggle`/`pauseBtnAction` 两键（旧键/lobby 零改动）+ 全量不回归。审查 R:ART-IMPORT-PAUSE-BTN。落 main 后即派 P-G7② 暂停接线。
> **ART-IMPORT-PAUSE-BTN 终局裁定 + P-G7-UIFIX3 阶段② 派发（规划者·2026-07-06）**：ART-IMPORT-PAUSE-BTN **裁定：确认 done `aa1401b`**——审查者 0 打回；**规划者独立抽查佐证**：`pause-btn-{toggle,action}.png` 已入 `assets/resources/art/ui/`、sha256 与 preview **逐字节一致**（toggle `dfc59c31…`/action `3ff4a240…`）、`asset-keys.ts` **纯增** `pauseBtnToggle`/`pauseBtnAction` 两键、`.meta` border 24/24/24/24（sprite-frame 九宫格）、lobby-scene 经合并零触碰。main `d4d2f55` 基线 **141 文件/739 全绿 + typecheck 净（规划者独立复跑确认）**。**P-G7-UIFIX3 阶段② 正式派发**（依赖满足·`task/P-G7-UIFIX3` 由规划者自 main 重建·阶段①已 done `93cc7c2`）：`renderPauseMenu` 6 按钮消费 `pauseBtnToggle`（音效/动效/震动 组·浅奶油底）/`pauseBtnAction`（继续/重开/退出 组·金黄底）；**背景完整包裹文字**（按钮盒加高容 border24+label 居中于药体）、**两组各同色高对比**；四横屏暂停面板 menu+confirm 截图 + **双层视觉预审**（执行者自审→规划者视觉审）。文件域仅 game-scene-skeleton+game-scene/*+report，test/纯层/lobby/meta/resources/**asset-keys 零改动**（键已就位）。审查 R-WAVE7 R:P-G7-UIFIX3 阶段②。**阶段②落 main → V6 收口（含 #4 重点复核）→ 用户签收 = v1.2 终点**。
> **P-G7-UIFIX3 阶段① 验收披露 + 合并（审查者 GLM-5.2 · 2026-07-06）**：P-G7-UIFIX3 阶段① **approved 已合并 `93cc7c2`**（`--no-ff`，6 文件 +257−55：game-scene-skeleton + 4 个 game-scene/* 渲染器含新 seat-display.ts + 报告）。打回 0 轮。R-WAVE7 R:P-G7-UIFIX3 阶段① 检查单全过：①文件域仅 game-scene-skeleton+game-scene/*+report（**game 层 `nextSeat`/出牌轮转 diff 零改动·独立核验 exit=0**；test/纯层/lobby/scene/meta/resources/asset-keys/table-zones 零改动、未重做美术）；②#3 座位映射翻转一致（seat-display.ts seat1→right/seat2→left；seats-renderer leftSeat=2/rightSeat=1 名字牌翻转+seatNameplateRect visualSideForSeat；renderPlayArea dropZoneForSeat 落点翻转；lastActionPosition/aiThinkingPosition 同步翻转+y 上移 20px 避让牌面；bid-actions swapLegacySideText 翻转纯层 prompt；result-overlay/game-scene-skeleton eventToastText/landlord 标签 seatDisplayName）；③#2 多牌不重叠（playAreaLayout 动态缩放 0.58-0.94+8 张分 2 行+safe area 避让人物）；④#4 左右家文字/btn✅（带保留·同规划者 R1 结论·留 V6 用户签收）；⑤T-FIX-SETTLE settled 门控 10 处命中+相位互斥+T-LAYOUT4 table-zones 零改动不回归+卡面无中心数字；⑥报告含 6 项自审勾销表+BOARD 规划者 R1=PASS（`668a610`）；⑦四档四档×10 captures 全 `productErrors=[]`/`failedResponses=[]`+settled=1/restart=True+vitest 141/739 绿（28.74s）+typecheck 净+diff --check 净（报告 trailing whitespace/EOF 已修复 `4eed53d`）。全量回扫 0 域内/0 域外/**1 拿不准（非阻断·转规划者建议单）**：`ai-thinking-view.ts:13` deriveAiThinking label 仍用旧映射，但 UI renderAiThinking 不消费 thinking.label 而用 seatDisplayName 生成文字，不影响渲染，建议后续统一（另拆任务）。**合并提示已处理**：分支建于 f3f182e（早于 V5-user-review.md `0993fd0` 和 BOARD R1 `668a610`），3-way merge 自动保留 main 版本，无冲突。合并证据：claim `ef41043`→merge `93cc7c2`→release 待提交。合并后 main `93cc7c2`：**141 文件/739 用例全绿（28.74s）+ typecheck 净 + diff --check 净**。**P-G7-UIFIX3 阶段① done。下一步：阶段②（暂停面板 6 按钮）待 ART-IMPORT-PAUSE-BTN 落 main 后开工；V6 收口在阶段②合并后。V6 done+用户签收=v1.2 终点。用户主观终审不可由 AI 代判。**
> **P-G7-UIFIX3 阶段② 规划者视觉审 = 达标·PASS（规划者·2026-07-06·`task/P-G7-UIFIX3` `0a0a801`）——此为「规划者视觉审结论」（R:P-G7-UIFIX3 阶段② 据此核销）**。逐张核 `/tmp/doudizhu-pg7-stage2-pause-evidence/` 四横屏 menu+confirm（8 图 + contact-sheet）。**用户 #1 诉求全达标**：① **背景完整包裹文字**——6 按钮（音效开/动效开/震动开·继续/重开/退出）+ confirm（确认/取消）文字均落在药体内、无溢出、四档一致；② **两组各同色高对比**——toggle 组=浅奶油底(pauseBtnToggle)深字、action 组=金黄底(pauseBtnAction)深字（844 全res 确认 action 确是金黄·contact-sheet 小图红边显粉系误差），组内一致、深字高对比；③ **confirm 确认/取消无压缩无重叠**（金黄药体·居中·间距足）；④ **无透底/无闪烁**（面板不透明·背景压暗）。**文件域独立核**：diff 仅 game-scene-skeleton(+43)+report，**asset-keys/game 层零改动**（键上轮已就位）。settled 门控/相位/T-LAYOUT4 无重叠/#3 座位映射不回归。**转审查者 R-WAVE7 R:P-G7-UIFIX3 阶段②**。阶段②闭合后 → V6 收口（#4 重点复核）→ 用户签收 = v1.2 终点。
> **P-G7-UIFIX3 阶段② 终局裁定 + V6 派发（规划者·2026-07-06）**：P-G7-UIFIX3 阶段② **裁定：确认 done `5b42a35`**（全任务两阶段闭合）——审查者 0 打回；规划者视觉审 PASS 作结论核销；**规划者独立抽查佐证 main 不变量**：`pauseBtnToggle/Action` 消费 2 处、`seat-display` 映射 3 处（#3 逆时针）、settled 门控 10、`card-face-rank` 0（卡面无中心数字）。main `72523ed` 基线 **141 文件/739 全绿 + typecheck 净（规划者独立复跑确认）**。**V6 正式派发**（v1.2 **最后一个任务**·spec `tasks/V6.md` 已第七波预置·行翻 `ready`·分支 `task/V6` 自 main 建）：verify-only·固定 seed=20260705 四横屏全相位 e2e + **V5 四否点逐项复核证据**（#1 暂停按钮包裹/两组同色·#2 多牌不重叠·#3 逆时针出牌·**#4 左右家文字/btn 重点**——阶段①带保留项，V6 交用户签收确认）+ AI 指标对照 T-AI-1/T-AI-2 门 + PLAYTEST + 双层视觉预审记录复述（P-G7①R1/②PASS + ART-PAUSE-BTN 代批）+ 用户审美签收项明确列出（不代判）。审查 R-WAVE7 R:V6。**V6 done + 用户签收 = v1.2 终点**（规划者做版本终局裁定收版）。
> **V6 结果裁定 = 阻断·派 scoped-fix T-FIX-DROP-HUD（规划者·2026-07-06）**：V6 客观门全绿（四横屏 seed=20260705 e2e·productErrors=[]·141/739·typecheck 净·diff --check 净），**但执行者视觉自审发现 #2 残留、规划者亲验裁定阻断**——逆时针映射后 seat2=左家出牌落 dropZoneLeft，与左侧 强度/剩牌 HUD 同侧；左家出 8 张顺子（分 2 行）时**下排牌面被「强度 偏弱X%」药丸覆盖**（`V6-zoom-780-left-multi-seat2.png` 亲验：强度压 10♥/J♥ 下排），牌不可辨、踩用户「元素不可重叠」。seat1（右家）无此问题。**裁定：阻断 v1.2 签收**（不能带此重叠交用户），V6 置 blocked 待修后重跑。**gate 校准（自省）**：P-G7① 我审过左家 8 张顺子但**未核 HUD×多牌**、执行者 P-G7① 自审亦漏——本次由 V6 自审兜住（双层第一层生效）；**今后多牌审必核与 HUD 净空**。**派 T-FIX-DROP-HUD**（spec `tasks/T-FIX-DROP-HUD.md`·审查单 R-WAVE7·分支自 main 建）：side-seat 多牌安全区扩展避让 strength/memory HUD（及右侧 timer/advisor），rectGap≥8/牌全可读，#2 既有不回归；game 层/#3 映射/暂停面板/settled 门控不回归。双层视觉预审（左家 8 张顺子×HUD 净空 zoom 必核）。**修后 → V6 重跑收口 → 用户签收 = v1.2 终点**。main `72523ed` 基线 141/739 全绿+typecheck 净（规划者独立复跑确认）。
> **T-FIX-DROP-HUD 规划者视觉审 = 达标·PASS（规划者·2026-07-06·`task/T-FIX-DROP-HUD` `685542d`）——此为「规划者视觉审结论」（R:T-FIX-DROP-HUD 据此核销）**。逐张核 `reports/T-FIX-DROP-HUD-evidence/`。**阻断残留已清**：左家 8 张顺子四档（`left-straight8-zoom-contact`）2 行牌面**全在强度/剩牌 HUD 之上、净空分离**、8 张点数+花色全可读、下排不再被「强度」药丸覆盖。**780 八形态 sweep**（`780-side-shapes-contact`：左/右 × 单/对/顺子8/飞机8）**全部无 HUD 覆盖、无牌间互压**——修法=多牌区上移至 HUD 之上安全带、保留 per-seat 左右倾向。**文件域独立核**：game/rules/flow + asset-keys **零改动**；#3 座位映射（seat-display 3 命中）、settled 门控/暂停按钮（12 命中）不回归；#2 既有不回归。**转审查者 R-WAVE7 R:T-FIX-DROP-HUD**。修后 → **V6 重跑收口**（`task/V6` worktree 保留·执行者重采 e2e）→ 用户签收（#4 重点）= v1.2 终点。
> **T-FIX-DROP-HUD 终局裁定 + V6 重跑派发（规划者·2026-07-06）**：T-FIX-DROP-HUD **裁定：确认 done `1959205`**——审查者 0 打回；规划者视觉审 PASS 作结论核销；**规划者独立抽查 main 不变量**：seat-display 映射 3（#3 逆时针）、settled+pause 12、card-face-rank 0。main `12428c2` 基线 **141 文件/739 全绿 + typecheck 净（规划者独立复跑确认）**。**V6 解阻断·重跑派发**（行翻 `ready`）：**⚠️ `task/V6` worktree 仍在旧尖 `85b1844`（早于 T-FIX-DROP-HUD 合并）→ 执行者重采前必须先 `git merge main` 拉入修复（否则验的是旧坏构建）**，再 web-mobile 重建 + 重采四横屏 seed=20260705 全相位 e2e，**重点复采左家多牌×HUD 净空**（T-FIX-DROP-HUD 已修）+ V5 四否点逐项复核（#1 暂停/#2 多牌/#3 逆时针/#4 左右家）+ AI 指标 + PLAYTEST + 用户签收项。审查 R-WAVE7 R:V6。**V6 done + 用户签收 = v1.2 终点**。
> **V4 验收披露 + 合并（审查者 GLM-5.2 · 2026-07-05）**：V4 **approved 已合并 `14b71f2`**（`--no-ff`，60 文件 +2996 行全 `coordination/reports/V4*`，零产品码/测试/资源/scene/meta 改动）。打回 0 轮。R-WAVE5 R:V4 检查单 8 项全过：①verify-only 文件域（diff --check 净）；②固定 seed=20260705 四横屏×11 captures=44 全 `productErrors=[]`/`failedResponses=[]`，两轮均 settled，`aiPlayCaptured`/`playerPlayCaptured`=true，`cardPressEvidence` y=40→58；③v13 整改 8 项+V3 七项否点逐项对应 contact sheet 证据；④T-FIX-SETTLE settled 门控（四档×两轮 `transientActive=0`、bidding 7/playing 10/per-seat topSeat 1→2）；⑤双层视觉预审 R1→R2→R3 PASS 记录在案；⑥AI 指标审查者独立复跑实测与报告一致（T-AI-1: Simple 0.0/Normal 0.9846/override 0/winRate +0.6111；T-AI-2: Hard 0.9934/override 0/Hard−Normal +0.1333/Hard−Simple +0.6333，全过门）；⑦PLAYTEST 自动链路真实；⑧用户审美签收 7 项+3 项 R3 知情明确列出、不代判。全量回扫 0 域内/0 域外/0 拿不准。合并证据：claim `cb43ccf`→merge `14b71f2`→release `b70bf54`；worktree+分支已清理。合并后 main `b70bf54`：**141 文件/739 用例全绿（26.78s）+ typecheck 净 + diff --check 净**。**V4 done。下一步：执行者配合用户审美签收（7 项+3 项 R3 知情），用户通过后转规划者做 v1.2 版本终局裁定收版。用户主观终审不可由 AI 代判。**
>
> **P-G6-UIFIX2 验收披露 + 合并（审查者 GLM-5.2 · 2026-07-05）**：P-G6-UIFIX2 **approved 已合并 `1951f88`**（`--no-ff`，5 文件 +215−55：4 渲染器 + 报告）。打回 0 轮。R-WAVE6 R:P-G6-UIFIX2 检查单 5 项全过：①文件域仅 game-scene-skeleton+game-scene/*+report（test/纯层/lobby/scene/meta/resources/asset-keys/table-zones 零改动、未重做美术）；②diff 逐条对应 6 项（人物外移上移 `inward 0.42`→`outward 0.03`+上移/名字牌角色清晰+贴屏缘 `0.64`→`0.04`+compactHero 显角色/出牌缩放 `0.74`→`0.92`+角标 `11`→`13`/按钮 `showIcon` 阈值 `104`→`136`+`labelHeight` 约束+`result-lobby`→primary 同肤+删 iconBack/结算 5 子项/HUD 删 `+N` 叠字）；③T-FIX-SETTLE `SETTLEMENT_TRANSIENT_HUD_NODE_NAMES`/`showTransientHud` 仍在+相位互斥+per-seat `dropZoneLeft/Right/Hero`+T-LAYOUT4 `table-zones.ts` 零改动不回归；④报告含 7 项自审勾销表+BOARD 规划者视觉审 R1=PASS（`a270843`）；⑤四横屏四档×11 captures 全 `productErrors=[]`/`failedResponses=[]`+每档 2 settled `transientActive=0`+vitest 141/739 绿+typecheck 净+diff --check 净。全量回扫 0 域内/0 域外/0 拿不准。合并证据：claim `b261e8d`→merge `1951f88`→release `5264864`；worktree+分支已清理。合并后 main `5264864`：**141 文件/739 用例全绿（27.64s）+ typecheck 净 + diff --check 净**。**P-G6-UIFIX2 done。下一步：V5 收口（verify-only·固定 seed 四横屏全相位 e2e+双层视觉预审通过记录复述+AI 指标+用户审美签收项含 V4 5 否点逐项复核证据），审查按 R-WAVE6 R:V5。V5 done+用户审美签收→规划者做 v1.2 版本终局裁定。**
>
> **V5 验收披露 + 合并（审查者 GLM-5.2 · 2026-07-06）**：V5 **approved 已合并 `3a23c6f`**（`--no-ff`，62 文件 +179 行全 `coordination/reports/V5*`：1 报告 + 44 原始四横屏截图 + 8 contact sheet + 9 针对性 zoom，零产品码/测试/scene/meta/resources 改动）。打回 0 轮。R-WAVE6 R:V5 检查单 5 项全过：①verify-only 文件域（62 文件全 `reports/V5*`，`git diff --check` 净）；②固定 seed=20260705 四横屏×11 captures=44 全 `productErrors=[]`/`failedResponses=[]`，每档 2 局 settled `transientActive=0`，restart→game/return→lobby 链路通，`/tmp/doudizhu-v5-evidence/summary.json` 复核一致；③双层视觉预审 R1=PASS 记录在案（BOARD P-G6-UIFIX2）+V4 五否点逐项复核表 6 行每项附 zoom 证据；④AI 指标审查者独立复跑与报告一致（T-AI-1: Simple 0.0/Normal 0.9846/override 0/winRate +0.6111；T-AI-2: Hard 0.9934/override 0/Hard−Normal +0.1333/Hard−Simple +0.6333，全 8 项过门）+PLAYTEST 真实（cardPressEvidence y=40→58/playerPlayCaptured/aiPlayCaptured 均 true）；⑤用户审美签收 7 项+R1 三项非硬伤观察明确列出、不代判。全量回扫 0 域内/0 域外/0 拿不准（verify-only 无码改无回归面）。合并证据：claim `0f16f52`→merge `3a23c6f`（报告 add/add 冲突取 ours 保留审查段）→release `afcec08`；worktree+分支已清理。合并后 main `afcec08`：**141 文件/739 用例全绿（26.95s）+ typecheck 净 + diff --check 净**。**V5 done。下一步：执行者配合用户做 7 项审美签收（含 V4 五否点逐项复核证据+R1 三项非硬伤观察供知情），用户通过后转规划者做 v1.2 版本终局裁定收版。用户主观终审不可由 AI 代判。**
>
> ---
>
> ## 🏁 v1.2 版本终局裁定（规划者·2026-07-06·**收版**）
>
> **① 用户授权接受**：用户放弃 V6 逐项审美终审、授权规划者代判（原文记录 `reports/V6-user-review.md`·`3538dc1`；先例=ART-PAUSE-BTN 图审代批）。规划者以**最后一轮全量亲验扫图**行使代判（非橡皮章），覆盖 8 项签收维度。**保留条款**：#4 左右家为阶段①带保留项——三轮证据（bidding/playing zoom + V6 复采）均未复现异常且渲染干净对称；若用户日后实机再遇，随时按 scoped-fix 重开（收版不消灭该权利）。
>
> **② 8 项代判结论（全部通过·证据指针）**：1 整体 pink 观感 ✅（四档全相位一致、对齐方向稿）；2 人物与牌桌关系 ✅（三立绘四角围桌·外移上移）；3 名字牌 ✅（角色行清晰·贴屏缘不深felt·不压立绘）；4 手牌/出牌可读 ✅（卡面无中心数字·出牌 0.92 放大·左家 8 张×HUD 净空 12px `V6-zoom-780-left-multi-seat2`）；5 按钮 ✅（enabled 包裹高对比·暂停两组 cream/gold 各同色 `V6-zoom-780-pause-menu-buttons`）；6 结算 ✅（标题深底·横幅容字·分数清晰·同色双键·暗幕盖底 `V6-contact-round1-settlement` 四档）；7 整体手感 ✅（四档两局 settled+再来一局/返回大厅链+productErrors=[]×4+PLAYTEST 记录）；8 V5 四否点复核 ✅（#1/#2/#3 证据齐·#4 见保留条款）。
>
> **③ 版本裁定：v1.2 收版**。七波全链闭合：Wave1（T-DEDUP/T-LAYOUT2/T-FLOW-BID/T-AI-1/ART-UIKIT）→ Wave2（T-AI-2/ART-IMPORT-UIKIT/P-G3/P-L3）→ Wave3（V2+T-FIX-SETTLE）→ Wave4（v13 重造：ART-GAME-REMAKE/IMPORT/T-LAYOUT3/P-G4/V3）→ Wave5（T-LAYOUT4/P-G5+双层视觉预审关入 PROTOCOL）→ Wave6（P-G6/V5）→ Wave7（ART-PAUSE-BTN/IMPORT/P-G7①②/T-FIX-DROP-HUD/V6）。**用户五目标闭合**：①UI 真皮肤（v12+v13 两轮文生图全量重做·38 件 v13 资产）②布局零重叠（T-LAYOUT2/3/4 三代 zone 契约+渲染避让）③流程对标（叫抢期 17 张可见/亮底牌/逐手存档/**逆时针出牌**）④AI 三档差异化（质量门实测：Hard 组合率 0.993·压队友 0·Hard−Normal 胜率差 +0.133·Hard−Simple +0.633）⑤设计债全部任务书化（本表+v1.3 清单）。**最终基线：141 文件/739 用例全绿 + typecheck 净（规划者收版复跑确认·含本次种入的 selfplay 显式预算 30s——V6 审查建议单闭环，用例实测 4308ms 稳过）**。流程资产沉淀：三角色制+批次作业+精确机器态 BOARD+**双层视觉预审关**（第五波起三轮拦截+V6 自审兜底实证有效）+同屏验收页布局（入规划者记忆，后续终审沿用）。
>
> **④ v1.3 债务清单（汇总登记·按需派发）**：lobby v13 风格统一（game-scene 已 v13、lobby 留 v12）；ui-helpers 皮肤共享件抽取+死导出清理；ai-thinking-view 旧座位映射统一；记牌深度（GameSnapshot 出牌历史）；round-runtime(439 行) 拆分；save 双序列化+叫抢期存档整并升版；audio/卡面/tween 模块化；观感微调项（顶部右角半裁小徽标·playing 左列密度）。
>
> **⑤ 发布注记**：v1.2 收版后如需打包发布，按 v1.1 M6-D1 先例走 Creator web-mobile 构建+lobby 启动场景+三档烟测，由用户决定时机。
>
> **⑤ 发布注记执行（规划者·2026-07-06·`RELEASE-v1.2`）**：用户指令「打包发布」已执行——Creator 3.8.8 CLI web-mobile 构建自收版 main `24bf5e8`：`launchScene=lobby.scene`·`designResolution=844×390`·**`orientation=landscape`**（首建 auto 复现 E-ORIENT 的「CLI 不读 builder.json」caveat，按其已验证 inline packages 命令重建修正）。发布冒烟=发布产物上跑 V6 全链 harness：**四横屏 ×16 captures 全过，productErrors=[]×4**（两局 settled+逆时针链+暂停链）；规划者目检发布态 lobby 首屏正常。归档 `build/doudizhu-v1.2-web-mobile.zip`（43M·sha256 `5d5cd3f0…b69c`·不入库）。记录 `reports/RELEASE-v1.2.report.md`。**v1.2 发布包就绪。**

---

## 第八批·v1.3（技术债清偿版 · 规划者派发 · 2026-07-06）

> 用户指令「不实现新功能，核心修复历史技术债务 + 打磨已有模块与代码规范」。规划者现状侦察（file:line 级·修正旧账）+ 四裁决问询后落本表。**用户四裁决（2026-07-06）**：① 困难档 AI 真记牌 **做**（本版唯一高风险项·三闸）；② lobby v13 统一 **本版不动**（留美术专版）；③ save 双序列化 **维持延后**（守「与叫抢存档一次升版」策略）；④ 可选债 **全选**（round-runtime 拆分 / 文案迁 strings.ts / 叫抢建议接线 / legalFollows 性能剥削 profiling 先行）。

### 现状侦察（2026-07-06 实测·file:line）

| 债项 | 当前实况 |
|---|---|
| skeleton 肥大 | `game-scene-skeleton.ts` 又长回 **1670 行**（P-G5/6/7 三轮整改增重）；audio/卡面/tween/暂停/顶栏未模块化 |
| AI 假记牌 | **仅剩 AI 侧**：`hard.ts:88 trackPlayed([], hand)`（快照无历史）；HUD 记牌器已消费真实事件（`hud-renderer.ts:63 trackPlayed(ctx.fullGameEvents, hand)`）——修法走 flow 传递，**不动 game 状态机契约** |
| helper 重复/死码 | `addButton/addSprite/drawPanelSkin` 在 skeleton 与 lobby 各有本地实现；`ui-helpers.addUiButton` **死导出**；`drawPanel` 是**活的**（渲染器 6 处消费·旧账有误差已修正） |
| strings 零采用 | `ui/strings.ts` 30 行建成后 **0 消费**，两巨组件文案全硬编码 |
| runtime 肥大 | `flow/round-runtime.ts` **462 行**（叫抢驱动/持久化/事件重放/终止诊断混居） |
| 旧映射残留 | `ai-thinking-view.ts:13` label 仍 1=左家（v1.2 已改逆时针 1=右家）；渲染层未消费该 label 故零渲染影响，属 latent |
| 文档过时 | `docs/KNOWN_LIMITATIONS.md`/`GAME_DESIGN.md`/`CLAUDE.md` 仍写「竖屏 390×844」；v1.2 横屏/landscape/v13 皮肤/逆时针未回填 |
| 未接线能力 | `bidding-advisor`+`bidding-advice-view` 纯层带测试建好未接（P-G3② optional 遗留） |
| 观感微调 | 顶部右角半裁小徽标（四档一致）、playing 左列密度（V4-R3 起登记的非硬伤观察） |
| 性能存疑 | `legalFollows` 全量枚举无剪枝——既有立场：无实测瓶颈不动 keystone → 本版先 profiling 拿数据 |

### 任务表（A/B 双波·文件域不相交·双窗并行）

| ID | 波 | 类型 | 文件域 | 依赖 | 分支 | 状态 |
|----|----|----|----|----|----|----|
| T-MEMORY-REAL | A | 高风险(改产品码·flow+ai) | `flow/{types,driver,round-runtime,policies}.ts` + `ai/levels/hard.ts` + report | —（A 波首任务） | `task/T-MEMORY-REAL` | done 408a2ea |
| T-RUNTIME-SPLIT | A | move-only 强化 | `flow/round-runtime.ts` + 新 `flow/runtime/*.ts` + report | T-MEMORY-REAL（done） | `task/T-RUNTIME-SPLIT`（已建自 main `93d5fff`） | done 6cc314f |
| T-VIEW-SEAT | A | 常规 | `ui/ai-thinking-view.ts` + report（+规划者改种 `test/ui/ai-thinking-view.test.ts`） | — | `task/T-VIEW-SEAT` | **ready·种子 `7afd853`**（2 红/3 绿·typecheck 净） |
| T-PROFILE-FOLLOWS | A | 零风险(不改产品) | `test/bench/*`（新）+ report | — | `task/T-PROFILE-FOLLOWS` | ready（无种子·bench 不入默认套件） |
| T-DOCS-SYNC | A | 常规(不虚标) | `docs/*.md` + `CLAUDE.md` + report | —（KNOWN_LIMITATIONS 记牌条目在 T-MEMORY-REAL 合并后收尾） | `task/T-DOCS-SYNC` | done 081afe8 |
| T-UIHELPERS | B | editor-evidence(机械重构) | `ui/components/ui-helpers.ts` + `game-scene-skeleton.ts` + `lobby-scene.ts` + `ui/strings.ts` + report | —（B 波首任务） | `task/T-UIHELPERS` | ready |
| P-GS-SPLIT2 | B | move-only 强化(editor-evidence) | `game-scene-skeleton.ts` + 新 `game-scene/*.ts` + `ui/strings.ts`(rider) + report | T-UIHELPERS | `task/P-GS-SPLIT2`（届时自 main 建） | blocked |
| P-BID-POLISH | B | editor-evidence(双层视觉预审从严) | `game-scene-skeleton.ts` + `game-scene/*.ts` + `ai/bidding-advisor.ts`(G3 骑士) + report | P-GS-SPLIT2 | `task/P-BID-POLISH`（届时自 main 建） | blocked |
| V7 | C | verify-only | `reports/V7.report.md` + `reports/V7-*.png` | 全部 done | `task/V7`（届时自 main 建） | blocked |
| T-PAUSE-GATE | C | 高风险(改产品码·flow 接口) | `flow/round-runtime.ts` + `flow/runtime/bidding-driver.ts` + report | —（C 波首任务） | `task/T-PAUSE-GATE`（已建自 main `411c972`） | done 7aa5adf |
| T-LIVE-MULT | C | 高风险(改共享契约·game/types)·**三闸** | `game/types.ts` + `game/core.ts` + `flow/runtime/bidding-driver.ts`(runtimeSnapshot enrich) + report | T-PAUSE-GATE（done 7aa5adf·共域 bidding-driver） | `task/T-LIVE-MULT`（已建自 main `f2faf02`·种子 `7de950a`·实现 `152c38e`·审查 `053de68`） | done 8637f6a |
| T-ADVANCE-REENTRY | C | 高风险(纯逻辑·flow 推进核心·裁量三闸)·**三闸** | `flow/runtime/bidding-driver.ts` + `flow/round-runtime.ts` + report | T-LIVE-MULT（done 8637f6a·共域 bidding-driver）·须先于 T-TERM-FEEDBACK 接线合 | `task/T-ADVANCE-REENTRY`（已建自 main `1c9bdc9`·种子 `4b8a735`·实现 `69468e5`·审查 `3a97a02`） | approved |
| T-RESUME-REPLAY | C | 常规(UI 接线·双层视觉预审) | `game-scene-skeleton.ts`(recentEvents 重建+底牌保守) + report | T-LIVE-MULT·须在 P-GS-SPLIT2 前合 | `task/T-RESUME-REPLAY`（届时自含 LIVE-MULT 的 main 建） | blocked |
| T-HUD-LIVE | C | 常规(UI 接线·双层视觉预审) | `screen-view.ts` + `game-scene-skeleton.ts`(顶栏渲染) + report | T-LIVE-MULT·T-RESUME-REPLAY·须在 P-GS-SPLIT2 前合 | `task/T-HUD-LIVE`（届时自含 RESUME-REPLAY 的 main 建） | blocked |
| T-TERM-FEEDBACK | C | 常规(UI 接线·双层视觉预审) | `game-scene-skeleton.ts`(terminationReason 轮询+暂停接线骑士) + report | T-HUD-LIVE·T-ADVANCE-REENTRY·须在 P-GS-SPLIT2 前合 | `task/T-TERM-FEEDBACK`（届时自含 HUD-LIVE 的 main 建） | blocked |

> **派发注记**：
> - **A 波**（纯逻辑/文档域·flow/ai/docs）：T-MEMORY-REAL → T-RUNTIME-SPLIT **串行**（同文件域·MEMORY-REAL 先扩 `PlayPolicy` 入参，SPLIT 再拆 runtime）；T-VIEW-SEAT / T-PROFILE-FOLLOWS / T-DOCS-SYNC **批次随到随合**（文件域互不相交）。
> - **B 波**（组件规范域·ui/components）：T-UIHELPERS → P-GS-SPLIT2 → P-BID-POLISH **串行流水线**（共享化先缩体积→再拆 skeleton→再接叫抢建议+微调）；全程**双层视觉预审**（执行者自审四类硬伤→规划者逐张视觉审→双达标才转审查者）。
> - **A/B 双窗并行**，共用单 merge lane 排队（PROTOCOL 精确机器态）。
> - **T-MEMORY-REAL 三闸**（本版首次实际启用 `approved-pending-planner`）：审查者置 `approved-pending-planner` 排队 → 规划者结构性把关（接口宽化可选参保旧行为 / `trackPlayed` 本体未改 / game·rules 零触碰 / 质量门三档不回退）→ 认可改 `approved` → 合并。
> - **T-PROFILE-FOLLOWS 两段式**：第一段 profiling harness 实测 selfplay 60 seeds 总时长 + `legalFollows` 占比 → 数据回报 → **规划者裁定**：占比>40% 或总时长>30s 才派第二段等价剪枝（守护种子=枚举结果集合相等），否则记录归档不剪。
> - **红线**：不加新功能入口（叫抢建议=接既有能力·面板默认低打扰）；不动 `game/`、`rules/` 语义；save/lobby 皮肤/叫抢存档不碰；settled 门控/相位互斥/逆时针映射/卡面无中心数字/暂停按钮等 v1.2 成果全不回归（各 R 单列不变量清单）。
> - 审查单：`tasks/R-WAVE8.md`（9 任务 R 检查单·T-MEMORY-REAL 标三闸）+ `tasks/R-WAVE9.md`（C 波 5 任务 R 检查单·PAUSE-GATE/LIVE-MULT 标三闸）。
> - 终点：V7 done + 用户轻签收 → 规划者 v1.3 版本终局裁定。

> **A 波续派记录（规划者·2026-07-07）**：T-MEMORY-REAL 三闸闭环 **`done 408a2ea`**（验收披露在案·main 基线 143/746 绿+typecheck 净·打回 0 轮·回扫 0/0/0）。**T-RUNTIME-SPLIT 派发**：分支 `task/T-RUNTIME-SPLIT` 已自 main `93d5fff` 建，row→ready（move-only·无种子·`round-runtime-hardening`/`-diagnostics`/`runtime-resume-phases`/`bidding-visibility` 全家零改动全绿即行为快照锚）；**搬移警示**：起点已含 T-MEMORY-REAL 改动——AI 出牌处 `decidePlayAction({ ..., history: this.gameEvents })`（round-runtime.ts:320 附近）与 `gameEvents` 累积语义须**原样搬迁**，不得改动传参链路。**T-DOCS-SYNC 记牌条目解锁**：KNOWN_LIMITATIONS 可改写为「困难档已消费真历史（`estimateMemoryPressure(hand, history)` + 绝对最大单接管）；simple/normal 仍不记牌」，依据=`done 408a2ea`+三闸把关记录+`reports/T-MEMORY-REAL.report.md`；**量化强度主张待 V7 真历史基线，文档只写机制闭合、不虚标**（卡已加解锁注记）。

> **A 波续合并记录（审查者·2026-07-07）**：T-RUNTIME-SPLIT **`done 6cc314f`** + T-DOCS-SYNC **`done 081afe8`** 批量合并（main `411c972`·143/746 绿+typecheck 净·两任务均打回 0 轮·回扫 0/0/0）。A 波已完成 3/5（MEMORY-REAL+RUNTIME-SPLIT+DOCS-SYNC）；剩 T-VIEW-SEAT（worktree 在·种子 `7afd853`·2 红/3 绿）与 T-PROFILE-FOLLOWS（ready·零风险 bench）随到随合。**遗留**：main 工作树 stash@{0} 为 `package.json` 配置噪音（非 HUD/runtime 工作叠加·已核 `git stash show -p` 全仓 grep 无 round-runtime/bidding-driver/multiplier/pause/critical 命中）——原所有者无需在新 main 重新应用，可清。

> **C 波派发记录（规划者·2026-07-07·接第三方「画面与可玩性审查」输入稿）**：审查稿 4 致命缺陷（BUG-01~04）+ F/G 项经两 Explore 代理逐条核验锚点（稿件行号因 T-RUNTIME-SPLIT 拆分后漂移·已按符号重新锚定·结论见下），用户三裁决：① P0 四项**并入 v1.3 作第九批修复波**（不插队不打断 A/B 波·C 波与 B 波双窗并行）；② **底牌面值恢复本波只修重建、底牌留存档升版**（守裁决③「与叫抢存档一次升版」·T-RESUME-REPLAY 底牌保守牌背·不伪造面值）；③ **G2+G3 并入 P-BID-POLISH、G4 保持默认关**（扩 P-BID-POLISH spec 加 G3 阈值对齐骑士·重种 `bidding-advisor.test.ts`·G4 出牌建议 `advisorEnabled=false` 不改）。**C 波五任务**：T-PAUSE-GATE（三闸·round-runtime 接口加 pause/resume/isPaused·gate 在 sleepForRuntimeAi 后决策前·submitPlayerAction 暂停态仍接受是契约）→ T-LIVE-MULT（三闸·GameSnapshot 加可选 bidMultiplier?/bombsPlayed?·game/core 填 bombsPlayed·flow 层 runtimeSnapshot enrich bidMultiplier·依赖方向不破）→ T-RESUME-REPLAY（常规·recentEvents 从 fullGameEvents 重建复用 deriveLastActions·底牌保守牌背）→ T-HUD-LIVE（常规·screen-view 分相取数 bidding.multiplier/snapshot.bidMultiplier+bombsPlayed/settlement·顶栏加 bombs label）→ T-TERM-FEEDBACK（常规·update 轮询 phase==disposed && terminationReason!==settled·复用既有 toast/overlay·去重一次）。**核验结论**：BUG-01 CONFIRMED（runtime 无 pause 方法·advanceRuntimeUntilPause `bidding-driver.ts:181-244` 对 UI 暂停零感知·UI `openPauseMenu` `skeleton:903-906` 只置 pauseState）；BUG-02 CONFIRMED-数据在纯层未上快照口（`runtime.bidMultiplier` `round-runtime.ts:94,116`·`bidding-driver.ts:259`·`RoundState.bombsPlayed` `core.ts:44,84,144`·`GameSnapshot` `game/types.ts:64-72` 无此二字段·`FlowEvent landlordDecided` 载 bidMultiplier `flow/types.ts:46`·顶栏 `screen-view.ts:61-65` 只读 settlement·稿件"顶栏炸弹恒 0"措辞不符：顶栏实际不画 bombs·仅结算覆盖层 `result-overlay-renderer.ts:71`）；BUG-03 PARTIAL（恢复构造 `round-runtime.ts:119-125` 回填 state/gameEvents/bidMultiplier 不重发历史·事件重放白名单只 deal `event-replay.ts:44-46`·`bottomRevealed` 是 FlowEvent 非 GameEvent 不落档·UI `skeleton:376-377` 重建 fullGameEvents 但 recentEvents 留空·三席最近出牌消费 recentEvents `seats-renderer.ts:261-262 deriveLastActions`·底牌消费 revealedBottomCards 恒 null→牌背·**存档缺底牌面值·events+bidMultiplier+bombsPlayed 都在**·三席最近出牌可纯 UI 重建·底牌面值需新数据源=本波不修）；BUG-04 CONFIRMED（`redealExhausted` `bidding-driver.ts:278-281`·`error/maxTurns` `:286-291,:188-190,:241-243`·`terminationReason()` 公共 API `round-runtime.ts:68,148`·零事件通知·后台推进出错无通道·全 ui/ 无 terminationReason 消费）；F3 CONFIRMED（`bidding-view.ts:23-27` legacy seat1=左 + `seat-display.ts:14-19 swapLegacySideText` 字符串互换补丁·真相源 `seatDisplayName` `seat-display.ts:7-12` 1=右/2=左·两轨并存·**F3 修复归 T-VIEW-SEAT 扩 scope 或单列·本波未单列任务·留作 V7 前补**）；G3 CONFIRMED（`bidding-advisor.ts:9-13` 硬编码 `isStrongHand(hand,2)`·三档真值 `bidding-levels.ts:17-34` Simple3/Normal2/Hard1·`test/ai/bidding-advisor.test.ts:24-25` 锁死阈值 2·归 P-BID-POLISH 骑士）；G2/G4 CONFIRMED（`bidding-advice-view` 零消费仅桶导出+测试·`advisorEnabled` 默认 false `skeleton:253,332`·G2 归 P-BID-POLISH·G4 保持默认关）；F4 PARTIAL（strengthMeter/turnTimer 是 actionBar 两翼·memoryDock/advisorDock 下沉一行·非"四件皆两翼"·稿措辞不准）；F6 REFUTED（按坐标无裁切证据·46px 右缘余量·`infoStrip` zone 从未被消费是布局不一致非裁切）。**串行图**：C 波纯层 T-PAUSE-GATE→T-LIVE-MULT（共域 bidding-driver）；C 波 UI T-RESUME-REPLAY→T-HUD-LIVE→T-TERM-FEEDBACK（共域 skeleton·**三任务必须在 B 波 P-GS-SPLIT2 之前合**·否则 skeleton 已拆为 game-scene/* 文件域漂移）；C 波与 B 波双窗并行共用单 lane。**V7 依赖更新**：V7 须等 C 波 5 任务 + P-BID-POLISH(G2/G3 骑士) 全 done。**下一步**：规划者种 T-PAUSE-GATE 种子 `test/flow/runtime-pause.test.ts`（2 红）→ 派发执行者；T-LIVE-MULT/T-RESUME-REPLAY/T-HUD-LIVE/T-TERM-FEEDBACK 种子在各自前置 done 后种。

> **C 波把关记录 ①（规划者·2026-07-07·T-PAUSE-GATE 三闸结构性把关 → approved）**：六项逐条亲核 diff（分支 `da61e4e`·真实 delta 恰 4 文件全加法）——① `RoundRuntime` 接口 3 方法纯加法·既有 14 方法签名零改·唯一实现 `RoundRuntimeImpl`·消费方（skeleton/seats-renderer）只读接口不受加法影响 ② gate 3 处（while 顶 `bidding-driver.ts:207-208` + 叫抢 sleep 醒后 `:230-232` + 出牌 sleep 醒后 `:246-248`）与 isDisposed 同形同位·决策前拦截 ③ `submitRuntimePlayerAction` 零 diff·暂停态仍接受=契约（种子第 3 例钉死）④ disposed 幂等（pause/resume 首行短路·dispose 清双 flag·isPaused disposed 恒 false）⑤ headless 零影响（`driver.ts` 自有循环零 pause 引用·`RuntimeDriverContext` 唯一构造点 `round-runtime.ts:166`·UI 层今日零 pause/resume 调用方）⑥ 规划者在 worktree 独立复跑：**144 文件/750 用例绿 + typecheck 净**。→ BOARD 置 `approved`，审查者可 claim/merge/release。
> **拿不准项裁定（采纳→立 T-ADVANCE-REENTRY）**：审查者「resume 双循环并发·pre-existing·非回归」定性经核实**修正为「机制 pre-existing、可达性新增」**——旧世界唯二调度点=构造器（一次）+ submit（首行 `NOT_PLAYER_TURN` 守卫·只在 player-gate 可达而彼时循环必已退出），双循环不可达；`resume()` 是首个能在旧 `clock.sleep` 未醒时启动第二循环的公共入口。危害路径：pause→窗口内 resume→双循环→旧循环推进一手后新循环醒来时 turn 可能已至 hero→sleep 后 gate 只查 disposed/paused 不复查 player-gate→`decidePlayAction` 替 hero 决策（违反「绝不自动出牌/过牌」硬契约）或异常终止；生产窗口真实（`thinkDelayMs` 三档均值 375–1000ms·暂停后 1s 内点继续即命中）。因 UI 今日零调用方（暂停接线未落）危害 inert → **不阻断本任务合并**；收口立 **T-ADVANCE-REENTRY**（高风险·规划者裁量升级三闸·排 T-LIVE-MULT 后共域串行·spec `tasks/T-ADVANCE-REENTRY.md` 已落·种子届时种）。
> **计划缺口补齐（BUG-01 端到端）**：核查发现 C 波五任务无一把暂停菜单接到 `runtime.pause()/resume()`（T-TERM-FEEDBACK 原 spec 仅终止轮询·红线禁碰 pause-menu）→ BUG-01 只修到 flow 层未闭合。已扩 **T-TERM-FEEDBACK spec 加「暂停接线骑士」**（skeleton 域内 openPauseMenu→pause·完全退出暂停→resume·返回大厅/重开走 dispose 不调 resume·届时补种 `test/ui/pause-wiring.test.ts`）+ 依赖加 T-ADVANCE-REENTRY；`R-WAVE9.md` 适用清单/lane 串行/R:T-ADVANCE-REENTRY 新检查单/R:T-TERM-FEEDBACK 接线检查项已同步。C 波纯层串行更新：**PAUSE-GATE→LIVE-MULT→ADVANCE-REENTRY**；V7 依赖「全部 done」自动涵盖新任务。
> **下一步**：审查者合并 T-PAUSE-GATE（claim/merge/release·合并前双绿）→ 回报后规划者种 T-LIVE-MULT 种子并建分支（自含 PAUSE-GATE 的 main）。

> **C 波续派记录（规划者·2026-07-07·T-PAUSE-GATE 终局裁定 + T-LIVE-MULT 派发）**：
> - **T-PAUSE-GATE 裁定：确认 done `7aa5adf`**。验收披露核毕：0 打回·三闸序列完整（`approved-pending-planner` `01f2d39` → 规划者把关 `approved` `1db017b` → claim `c6d934b` → merge `7aa5adf` → release `c9faa45`）·合并前后双闸皆绿·终基线 **144 文件/750 用例绿 + typecheck 净**（143/746 → +1 文件+4 用例=runtime-pause 种子）·回扫分流 0/0/1 已由把关记录①承接（T-ADVANCE-REENTRY）。
> - **T-LIVE-MULT 派发**：分支 `task/T-LIVE-MULT` 已自 main `f2faf02`（自含 PAUSE-GATE）建，种子 `test/game/snapshot-live-multiplier.test.ts` 提交 `7de950a`，row→**ready**。种子 3 用例=**2 红 1 绿**（规划者已在 worktree 实跑验证红因）：① 红·game 层 `apply` 炸弹真路径后 `snapshot().bombsPlayed` 0→1（现 undefined）② 红·flow 层 `runtimeSnapshot` enrich `bidMultiplier`——live 叫抢（SEED=11·同 bidding-visibility 前提 landlord=hero(0)·终值 4）后 = `landlordDecided.bidMultiplier`，且 resume 注入 `bidMultiplier:4` 后 = 存档回填值（**enrich 源钉死 `runtime.bidMultiplier` 非 `bidding.multiplier`**——恢复局无 bidding 态）③ 绿锚·`snapshot(state, viewer?)` 两参签名+既有七字段零改动+**纯 game snapshot 的 `bidMultiplier` 恒 undefined（依赖方向钉·实现后仍须成立）**。今日 typecheck 红=种子文件 8×TS2339（二字段未上类型·预期红·实现后须净）。worktree 已建且 `test/node_modules` 已装。
> - **后续排期确认**：T-ADVANCE-REENTRY（三闸）待 LIVE-MULT done 后种种子派发（共域 bidding-driver 串行）；T-RESUME-REPLAY 同待 LIVE-MULT done（UI 链首）；T-TERM-FEEDBACK 待 HUD-LIVE + ADVANCE-REENTRY 双前置（暂停接线骑士不得先于防重入）。C 波纯层串行不变：~~PAUSE-GATE~~→**LIVE-MULT**→ADVANCE-REENTRY。

> **C 波把关记录 ②（规划者·2026-07-07·T-LIVE-MULT 三闸结构性把关 → approved）**：逐项亲核 diff（分支 `053de68`·产品 delta 恰 3 文件 6 行）——① `GameSnapshot` 纯加法 2 可选字段（消费方 screen-view/action-buttons/ai strategy/baseline/flow types 均不解构新字段·零回退·145/753 全绿证无深等断言碰壁）② `game/core.ts` snapshot 单行 `bombsPlayed: state.bombsPlayed`·两参签名不动·**纯 game 不填 bidMultiplier**（种子③依赖方向钉实证）③ `runtimeSnapshot` spread-enrich 源=`runtime.bidMultiplier` 非 `bidding.multiplier`（resume-safe·种子②后半钉实证）④ 红线文件（RoundState/settle/FlowEvent/round-runtime/driver/policies/clock/event-replay/persistence）零 diff·game 零 import flow ⑤ 种子 `7de950a..053de68` 零 diff 未改 ⑥ 规划者 worktree 独立复跑 **145 文件/753 用例绿 + typecheck 净**。→ BOARD 置 `approved`。
> **合并注意（3-way BOARD 冲突·审查者执行）**：分支建于 `f2faf02`，BOARD 第 938 行 branch/main 两侧同改（base=blocked·branch=approved-pending-planner·main=approved）→ 合并前先在分支 worktree `git merge main`，`coordination/BOARD.md` 冲突**一律取 main 版**（branch 行信息已并入 main 行·续派/把关记录只在 main），重跑 test/typecheck 双绿后再 `claim/merge/release`。
> **流程观察（非阻断·记录归档）**：本任务 BOARD 状态更新（→approved-pending-planner）落在了**分支**而非 main（T-PAUSE-GATE 先例为 main `01f2d39`），量级 1 行且在本任务行内、无信息丢失，但制造了本次 3-way 冲突；后续任务状态行更新请一律在 **main 工作树**执行（agentctl 即如此），分支只承载种子/实现/报告。
> **下一步**：审查者按上述合并 → done 后 T-ADVANCE-REENTRY 依赖满足，规划者种 `test/flow/runtime-advance-reentry.test.ts` 种子并自含 LIVE-MULT 的 main 建分支派发。

> **C 波续派记录 ②（规划者·2026-07-07·T-LIVE-MULT 终局裁定 + T-ADVANCE-REENTRY 派发）**：
> - **T-LIVE-MULT 裁定：确认 done `8637f6a`**。验收披露核毕：0 打回·三闸序列完整（`approved-pending-planner` `053de68` → 把关 `approved` `10c1387` → claim `7beb1af` → merge `8637f6a` → release `8e89501`）·BOARD 3-way 冲突按把关记录②指令取 main 版解决·终基线 **145 文件/753 用例绿 + typecheck 净**·回扫 0/0/0。
> - **T-ADVANCE-REENTRY 派发**：分支 `task/T-ADVANCE-REENTRY` 已自 main `1c9bdc9`（自含 LIVE-MULT）建，种子 `test/flow/runtime-advance-reentry.test.ts` 提交 `4b8a735`，row→**ready**。种子 3 用例=**1 红 2 绿**（规划者实跑验证）：① 红·resume 在旧 sleep 未醒时起第二循环（`sleeps 2≠1`·**实证把关记录①诊断的双循环今日真实存在**·双循环世界会替 hero 决策）② 绿锚·旧循环 paused 退出后 resume 正常重启（无丢唤醒·防重入不得吞合法重启）③ 绿锚·player-gate submit 推进链路照常（彼时无活循环）。typecheck 今日净（纯内部守卫·种子零新 API 引用）。worktree 已建·`test/node_modules` 已装。
> - **后续排期**：T-RESUME-REPLAY 依赖已满足（T-LIVE-MULT done）·待规划者下一爆发种 UI 种子（**注意与 B 波 T-UIHELPERS 共域 `game-scene-skeleton.ts` 的执行/合并次序**——两窗并行时以 merge lane 串行·后合者担 rebase）；T-HUD-LIVE 待 RESUME-REPLAY；T-TERM-FEEDBACK 待 HUD-LIVE + **ADVANCE-REENTRY**（暂停接线骑士不得先于防重入）。

> **C 波把关记录 ③（规划者·2026-07-07·T-ADVANCE-REENTRY 三闸结构性把关 → approved）**：逐项亲核 diff（分支 `3a97a02`·产品 delta 恰 2 文件 6 行）——① **守卫早退在 try 之外**（`bidding-driver.ts:207-208` 检查+置位在 try 前·被吞调用不触 finally·不会误清 owner 循环 flag——本实现最易错点·做对）② finally 挂既有 try/catch（`:270-271`）·全退出路径清位（审查者逐行枚举 10 条 return/catch/throw 路径·规划者复核）③ 单一咽喉（`scheduleRuntimeAdvance` 零 diff·submit 直调与 resume 重调度共用入口守卫）④ `RoundRuntime` 公共接口零新增（仅 impl 私有字段）·pause/resume/isPaused 本体与 paused/disposed gate 零改动 ⑤ 「flag=true 时 submit 不可达」论证执行者复述+审查者核验+规划者三方一致（submit 守卫 NOT_PLAYER_TURN·活循环只在 AI turn sleep·player-gate 必 return 清 flag）⑥ 种子 `4b8a735..3a97a02` 零 diff·规划者 worktree 独立复跑 **146 文件/756 用例绿 + typecheck 净**。→ BOARD 置 `approved`。**危害链闭环**：把关记录①纸面诊断 → 续派记录②种子红实证 → 本任务修复+种子绿钉死。
> **合并注意（修正·无 BOARD 冲突）**：审查者交接稿称"BOARD 有 3-way 冲突需取 main 版"——**经核不成立**：本分支从未触碰 BOARD.md（真实 delta 恰 4 文件·BOARD 状态更新已按流程观察在 main 侧 `643bcab` 执行），merge base 落后 main 仅使 BOARD 单侧（main）演进，`--no-ff` 合并自动取 main、无冲突。**标准 claim/merge/release 即可**，合并前 main 双闸照跑；若审查者仍选择先在分支 `git merge main`，将无冲突快进合入。
> **下一步**：审查者合并 T-ADVANCE-REENTRY → C 波纯层三任务全闭环（PAUSE-GATE/LIVE-MULT/ADVANCE-REENTRY）→ 规划者下一爆发种 T-RESUME-REPLAY UI 种子（C 波 UI 链首）。
