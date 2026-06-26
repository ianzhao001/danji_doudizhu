# 任务板（BOARD）

架构维护的任务真相源。状态：`todo`(待出 spec) · `ready`(spec+测试就绪可认领) · `claimed:<标识>` · `in-review` · `changes-requested` · `done`。

## 当前里程碑：M2 ✅ · M4 三档+强化+legality 护栏 ✅ · 第三批（8 任务）已并 main ✅ · 第四批（15 任务）全部 ready · 可派发

main 现状：**36 测试文件 / 160 用例全绿**（rules + game + ai 三档 + 强化 + flow + selfplay + data + ui 纯逻辑岛）。第三批 8 任务按序 `merge --no-ff` 入 main（M5-05→M5-04→M5-02B→M4-04B→M4-07→M-FLOW-03→M3-00-hand-layout→M3-00-selection，121→160 绿；M5-04 与 M5-05 共改 `data/index.ts` 已合并两行）；新脚本 `.meta` 已补提。第四批 **15 个文件域互不相交**纯逻辑任务**已种、全部 ready**（见「下一并行批次」）。

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

## 下一并行批次（15 任务 · 文件域互不相交 · 全部 ready · 可认领）

> 种子已落：每任务 spec 入 main、失败测试+桩在各自分支（14 分支独立 typecheck 绿、种子测试红；M4-08 为绿护栏锁不变量）。文件域两两不相交，可同时认领。spec 见 `coordination/tasks/<ID>.md`。**优先级**（执行者建议+架构认同）：第一波 `M-FLOW-04`/`M5-02C`/`M5-06`/`M5-07`（接主线「可玩 UI + 可保存」最快）；第二波 `M3-00-card-view/table-layout/action-buttons`；其余 M3-00 视图模型 + M2-11/M4-08/M5-08/M5-09 可同批。

| ID | 实现文件域 | 依赖 | 分支 | 备注 |
|----|----|----|----|----|
| M5-02C | `game/serialize.ts` | M5-02B | `task/M5-02C-serialize-pattern-semantic` | `recognize(cards)` 与声明 pattern 比对（评审意见 #1 语义层）|
| M-FLOW-04 | `flow/policies.ts` | M-FLOW-03+M4-07 | `task/M-FLOW-04-bid-level-policy` | bidPolicy 切 `chooseBidByLevel`（评审意见 #5 集成）|
| M5-06 | `data/settingsStorage.ts`（新；桶已加）| M5-05 | `task/M5-06-settings-storage-adapter` | 设置 load/save/remove 注入 StorageLike，无浏览器依赖 |
| M5-07 | `data/saveStorage.ts`（新；桶已加）| M5-04 | `task/M5-07-save-storage-adapter` | 槽位 load/save/remove；损坏抛错（区别设置）|
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
- **#2 save wire format 未钉死** → M5-04 当前 `serializeSave` 用 `slot.version`、`deserializeSave` 归一为 `SAVE_VERSION` 且兼容 string/object round；**canonical wire 钉死**记入后续（M5-04 已绿， Wire 收紧可作为 M5-07 adapter 合并后的小加固）。
- **#3 非法 AiLevel 静默保守化** → M4-07 非 Hard 落 Simple 阈值；记入后续改 exhaustive switch 或由 settings 层保证（低优先，type 层已挡）。
- **#4 hand-layout 输入域理想化** → M3-00-hand-layout 已并 main（满足 spec）；**前置条件/容错**纳入后续 UI 纯函数 spec 模板（评审建议「UI 纯逻辑岛提前定义异常输入」已写入第四批各 UI spec 的验收）。
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

## 后续（本批次之后）
- **M3 UI 主体**：第四批 UI 纯逻辑岛（card-view/table-layout/action-buttons/hand-interaction/bidding-view/result-view/event-cues）落齐后，进入 Cocos 编辑器场景/预制体/组件（import cc，非 worktree）；view-model/replay 已在第四批。
- **M5 持久化 IO**：M5-06/M5-07 adapter + M5-04 槽位 + M5-05 codec + M5-08/M5-09 → 真实 localStorage 接入 + 断局重开（消费 M5-02/02C 校验）。
- Wire 收紧（M5-04 canonical）、AiLevel 非法值 exhaustive（M4-07）、hand-layout 前置条件——低优先加固项，单列。
