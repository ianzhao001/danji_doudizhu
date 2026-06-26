# 任务板（BOARD）

架构维护的任务真相源。状态：`todo`(待出 spec) · `ready`(spec+测试就绪可认领) · `claimed:<标识>` · `in-review` · `changes-requested` · `done`。

## 当前里程碑：M2 ✅ · M4 ✅ · 第三/四/优化批 ✅ 已并 main · **第五批（15 任务）种子 ready · 可派发**

main 现状：**54 测试文件 / 296 用例全绿、typecheck 净、无 cc 泄漏**（纯逻辑层零 `cc`）。前批全部 `merge --no-ff` 入 main。**第五批 15 任务已种、全部 ready**（3 功能 + 4 加固 + 8 green-guard，文件域两两不相交；spec 入 main、各分支含失败测试/桩或 green-guard 测试，独立 typecheck 绿）。下一步见下「第五批派发表」。本批**不动 Cocos 编辑器**（场景/预制体属下一批 architect-only）。

## 第五批（15 任务 · 文件域互不相交 · 全部 ready · 可认领）

> 三路并行审计（代码优化/路线缺口/测试盲区）+ Plan agent 验证后派发。spec 入 main；15 分支已建于 main HEAD。**T1–T7** 含失败测试+桩（typecheck 绿、种入测试红、其余绿）；**T8–T15** 为 green-guard（现码即绿，锁回归）。文件域经核对两两不相交（`game/index.ts` 仅 T1 写、`data/index.ts` 仅 T2 写、`ui/index.ts` 由 T3 独占创建——无桶冲突）。**时序**：T1（resume）须在 T4（serialize 加固）**之后**合并（依赖 serialize 错误约定）。

| # | ID | 类型 | 实现文件域 | 分支 | 红/绿 |
|---|----|----|----|----|----|
| T1 | M5-10-resume | 功能(keystone) | `data/save.ts`、新 `game/resume.ts`、`game/index.ts` 桶 | `task/M5-10-resume` | 红桩（resumeRound not impl） |
| T2 | M5-11-aggregate | 功能 | 新 `data/aggregate.ts`、`data/index.ts` 桶 | `task/M5-11-aggregate` | 红桩（3 fn not impl） |
| T3 | M3-01-screen-view | 功能 | 新 `ui/screen-view.ts`、新 `ui/index.ts` 桶 | `task/M3-01-screen-view` | 红桩（deriveScreenVM not impl） |
| T4 | M5-12a-serialize-hardening | 加固 | `game/serialize.ts` | `task/M5-12a-serialize-hardening` | green-guard（整数字段已拒；Settled 往返锁） |
| T5 | M5-12b-data-codec-hardening | 加固 | `data/records.ts`、`data/statsCodec.ts` | `task/M5-12b-data-codec-hardening` | 红桩（records 数值 8 红：现接受负数/小数） |
| T6 | M3-00-table-layout-metrics | 加固 | `ui/table-layout.ts` | `task/M3-00-table-layout-metrics` | 红桩（LAYOUT_METRICS 未提取，3 红） |
| T7 | M4-10-bid-dispatch-dedup | 加固(重构) | `ai/bidding.ts`、`ai/bidding-levels.ts` | `task/M4-10-bid-dispatch-dedup` | green-guard（等价不变量；actionForStrength 已导出） |
| T8 | M5-G1-core-bombs | green-guard | 新 `test/game/core-bombs.test.ts` | `task/M5-G1-core-bombs` | 绿（3） |
| T9 | M5-G2-illegal-reasons | green-guard | 新 `test/game/illegal-action-reasons.test.ts` | `task/M5-G2-illegal-reasons` | 绿（8） |
| T10 | M5-G3-storage-empty-string | green-guard | 新 `test/data/{save,settings}-storage-empty-string.test.ts` | `task/M5-G3-storage-empty-string` | 绿（7） |
| T11 | M5-G4-compare-edges | green-guard | 新 `test/rules/compare-edges.test.ts` | `task/M5-G4-compare-edges` | 绿（4） |
| T12 | M5-G5-spring-boundaries | green-guard | 新 `test/game/settlement-spring-boundaries.test.ts` | `task/M5-G5-spring-boundaries` | 绿（5） |
| T13 | M5-G6-action-buttons-edges | green-guard | 新 `test/ui/action-buttons-edges.test.ts` | `task/M5-G6-action-buttons-edges` | 绿（4） |
| T14 | M5-G7-conservative-paths | green-guard | 新 `test/ai/conservative-action-paths.test.ts`（仅出牌阶段，**不碰 ai/bidding*.ts**） | `task/M5-G7-conservative-paths` | 绿（3） |
| T15 | M5-G8-driver-diagnostics | green-guard | 新 `test/flow/driver-diagnostics.test.ts`（仅 maxTurns:0+maxRedeals） | `task/M5-G8-driver-diagnostics` | 绿（2） |

> 派发用 PROTOCOL bootstrap（`<ID>` 换上表分支名）。**T5 是唯一会改产品码的红桩**（records 数值收紧，heroScore 允许负）；T1/T2/T3 为新功能填桩；T4/T6/T7/T8–T15 实现方主要在测试侧/微重构。**跨域提示**：T14 不得 import `ai/bidding*.ts`（T7 域）；T1 后于 T4 合并。

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
- **逐分支红绿态已验证**：T1/T2/T3/T5/T6 为红桩（typecheck 绿、种入测试红、main 基线绿）；T4/T7/T8–T15 为 green-guard（全绿，锁现码）。main 仍 296 绿、typecheck 净。
- **核查修正（种子质量门）**：① T1 新 `SaveSlot` 字段定 **optional**（否则既有 `save.test.ts:30` 字面量 `import type SaveSlot` 编译失败，且不可改）；② T4 整数字段实为 **green-guard**（现码已拒非整数，原以为 red）；③ T6 `LAYOUT_METRICS` 桩须让「派生一致」断言红（`typeof null==='object'` 陷阱，改用空对象+派生断言）；④ T13 `hint` 用例手牌须含 2(15) 压 A(14)（K<A 压不住，原用例误）；⑤ T12 无春用例须地主赢+农民≥1 手（地主 1 手+农民赢=anti-spring，非 none）。**T1 须后于 T4 合并**（resume 依赖 serialize 错误约定）。
- 按上「第五批派发表」+ PROTOCOL bootstrap（`<ID>` 换分支名）派发到各实现方窗口。**T5 是唯一会改产品码的红桩**；其余填桩或测试侧。

## 后续（本批次之后）
- **M3 UI 主体**：第四批 UI 纯逻辑岛（card-view/table-layout/action-buttons/hand-interaction/bidding-view/result-view/event-cues）落齐后，进入 Cocos 编辑器场景/预制体/组件（import cc，非 worktree）；view-model/replay 已在第四批。
- **M5 持久化 IO**：M5-06/M5-07 adapter + M5-04 槽位 + M5-05 codec + M5-08/M5-09 → 真实 localStorage 接入 + 断局重开（消费 M5-02/02C 校验）。
- 加固项收口：Wire 收紧（M5-04 canonical）已 `05a3ae9`、hand-layout 前置条件已 `aaac57f`；AiLevel/叫抢阈值 exhaustive → 并入 **M4-09**。
- **设计型待办（需专门 spec，暂未种）**：① 落盘数值字段不变量（`passesInARow`/`bombsPlayed`/`savedAt` 非负整数、`netScore` 允许负，收紧 serialize/save/stats/records 校验）；② 进 Cocos 前的整屏 VM 集成层（`GameSnapshot+selected+settings → {手牌slots,按钮态,叫抢VM,桌面区域,cue队列}`，让组件变薄）。二者涉及跨域设计，待出 spec 再开。
