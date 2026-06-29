# 任务板（BOARD）

架构维护的任务真相源。状态：`todo`(待出 spec) · `ready`(spec+测试就绪可认领) · `claimed:<标识>` · `in-review` · `changes-requested` · `done`。

## 当前里程碑：M2 ✅ · M3/M4/M5 纯逻辑层推进 ✅ · 第三/四/优化/第五/第六批 ✅ 已并 main · M5-13/M5-14 已并 main · **第七批（编辑器集成 + 运行时桥接）✅ 已验收并并入 main**（85 文件 / 437 绿，2026-06-28；新脚本 .meta 编辑器已补全）· **第八批（交互层 + 文生图）✅ 已验收并并入 main**（`291b53b` 轨道 A 交互层 / `a181d45` 轨道 B ART-01 背景包，2026-06-29）· **第九批 ✅ 已验收并并入 main**（2026-06-29）：A 美术串行 ART-02→03→04（`6eb8995`，58 文件·预览包·未导入 assets/）· B M6 纯逻辑 L1-L4（`97b0895`/`7d93e65`/`99d13b8`/`c08de19`，462 绿·typecheck 净·零 cc 泄漏·桶冲突串行解）· C1-C4 编辑器串行待 L1/L2/L3 入 main 后 + D1 文档收尾 + L5 后置验证 · **第九批已通过架构验证（见下「第九批合并验证」），保持合并** · **第十批已派发**（L5 解锁 + L6 优化 + C1 解锁，见下「第十批」）

main 现状：**90 测试文件 / 462 用例全绿、typecheck 净、纯层零 cc**（仅 `ui/components/*`+`runtime/cocos-storage.ts`）、`flow→data` 零 import。第九批 L1-L4 已全部 `merge --no-ff` 入 main；L5 selfplay 长回归（1..50）待验证（L4 settle 修改已入 main）。**第九批美术 ART-02/03/04 已并 main**（`6eb8995`，58 文件·`asset-previews/` 预览包·未导入 `assets/`·视觉终审归用户）。**C1-C4 编辑器串行待执行**（依赖 L1/L2/L3 已在 main，C1→C2→C3→C4 串行）。

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
| M6-L5-selfplay-long | selfplay seeds 1..50 回归护栏 | `test/selfplay/selfplay-long.test.ts` | **ready**（第十批·L4 已 merge 解锁） |
| M6-L6-cue-id-union | CueId string→字面量联合 + cue 一致性绿护栏 | `ui/event-cues.ts`+`test/ui/cue-id-consistency.test.ts` | **ready**（第十批·优化任务书·L1/L2 已 merge） |

#### B-2 CC 接线/编辑器/构建串行单写者组（`task/M6-editor` · C1→C2→C3→C4）

| ID | 任务 | 文件域 | 状态 |
|----|----|----|----|
| M6-C1-sound-toggle-wiring | 音效开关写侧接线（消费 L1） | `game-scene-skeleton`+`lobby-scene`+`lobby.scene` | **ready**（L1 已入 main） |
| M6-C2-animation-wiring | 基础动画接线（消费 L2·串行于 C1） | `game-scene-skeleton`+`game.scene` | blocked（待 C1） |
| M6-C3-mobile-regression | 移动端回归+渲染性能（消费 L3·串行于 C2） | `game.scene`+`lobby.scene`+`game-scene-skeleton`+report | blocked（待 C2+L3） |
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
| M6-L5-selfplay-long | **新任务书**·纯逻辑 worktree·纯 spec | `test/selfplay/selfplay-long.test.ts`（新）+report | `task/M6-L5-selfplay-long` | **ready**（L4 已解锁） |
| M6-L6-cue-id-union | **优化任务书**·纯逻辑 worktree·纯 spec | `ui/event-cues.ts` + `test/ui/cue-id-consistency.test.ts`（新）+report | `task/M6-L6-cue-id-union` | **ready**（L1/L2 已 merge） |
| M6-C1-sound-toggle-wiring | 编辑器串行·消费 L1 | `game-scene-skeleton`+`lobby-scene`+`lobby.scene` | `task/M6-editor`（C1→C2→C3→C4） | **ready**（L1 已 merge·需新建 worktree） |

> **文件域不相交核对**：L5=`test/selfplay/`（新文件）；L6=`ui/event-cues.ts`+`test/ui/`（新文件），**不碰** L1/L2 刚并入的 `audio-gate.ts`/`animation-params.ts`（靠源头收紧 `CueId` 让其在 typecheck 期自动获益）；C1=`ui/components/*`+`assets/scene/`。两两不相交，L5/L6 可真并行（不同 worktree），C1 走编辑器单写者分支。
> **派发模式**：L5/L6 用 PROTOCOL bootstrap（纯逻辑 worktree·`<ID>` 换分支名·纯 spec 自写测试）；C1 用编辑器 bootstrap（Cocos Creator·新建 `../斗地主.worktrees/M6-editor`）。
> **L6 来由**：第九批验证登记的 latent 脆性——`CueId=string` 零编译期保护，L1/L2 的 cue 字面量集（EFFECT_CUES/VIBRATION_CUES/PULSE_SCALE）拼错会静默禁用对应音效/动效/震动。L6 在源头把 `CueId` 收紧为 11 字面量联合 + 加运行时绿护栏，让消费方 typecheck 期获保护。spec 见 `coordination/tasks/M6-L6-cue-id-union.md`。

## 后续（本批次之后）
- **设计型待办进展**：① 落盘数值不变量已闭合：`serialize`(passesInARow/bombsPlayed) 由 T4、`records`(multiplier/bombs/heroScore/playedAt) 由 T5、`save.savedAt` 与 `bidMultiplier` 由 T1/M5-12c 折叠实现；② 整屏 VM 集成层 M3-01 已并 main。
- **持久化 IO 收口**：storage 适配器（M5-06/07）+ resume(T1) + aggregate(T2) + session(M5-13) 已闭合；之后进编辑器接真实 localStorage。
- **架构债 M5-14（✅ 已验收并入 main `578d378`）**：合并后审查发现分层违规（`game→data`/`data→flow` type 边 + `data→game` 运行时边，均架构 spec 缺陷）+ 校验/原子性缺口（events 无元素校验、statsCodec unknown-version 静默丢、commit 非原子、records 写入不对称）——详见上「对抗式审查」段。0 blocker、均 latent，main 可发布；M5-14 已收口（DTO 上移 + events 校验 + 幂等原子 + serializeRecords 对称 + 损坏可观测），main 实测分层零违规、82/422 绿。余 1 行 statsCodec 注释 follow-up。
- **桶导出整合（架构 follow-up）**：
  - ✅ `ai/index.ts` += `hint`、`data/index.ts` += `difficultyConfig`（`5a4d2be`，仅 re-export、typecheck 净、336 绿；`hint` 名称不与现有 ai 导出冲突，`flow/driver`+`flow/policies`+`data/settings` 等 barrel 消费方 typecheck 通过）。
  - ✅ `ui/index.ts` 由 M3-01 创建，已导出 9 个 UI 岛、`screen-view`，以及第六批 `stats/records/settings/lobby-view`。
  - ✅ `data/index.ts` 已随 M5-11 导出 `aggregate`，并保留 `difficultyConfig`。
  - ✅ `game/index.ts` 已随 M5-10 导出 `resume`。
