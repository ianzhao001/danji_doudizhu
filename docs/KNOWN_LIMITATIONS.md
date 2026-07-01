# Known Limitations

本文件记录 v1 发布前已知限制。除非另开任务，本列表不是 bug 清单。

## Product Scope

- v1 是离线单机、竖屏、经典三人斗地主。
- 不包含联网、账号、支付、广告、匹配、排行榜或云存档。
- 所有战绩、设置、断局恢复均为本地存储。

## Platform And Layout

- 当前 UI 以 390×844 竖屏为基线，并逐步补 412×915、360×780 回归截图。
- SafeArea、多分辨率截图、render diff 仍归 M6-C3a/C3b 串行闭合。
- 桌面横屏、平板横屏、折叠屏不是 v1 验收目标。

## AI And Gameplay

- AI 只基于 `GameSnapshot` 与 `viewerHand` 决策，不读取隐藏手牌。
- 难度差异已由 selfplay 与策略测试覆盖，但仍是启发式 AI，不承诺最优解。
- turn timer 仅做提示，不会超时自动代打，避免改变 `round-runtime` 契约。

## Save And Resume

- `RoundState` 当前只有 Playing/Settled 两个阶段；bidding resume 不支持。
- Resume 重点覆盖 playing 与 settled 路径；G11 已明确不测 bidding resume。
- 存档损坏会按 data 层约定抛错或降级，具体以 save/settings/records codec 为准。

## Assets And Audio

- ART-02/03/04 仍是 preview 包，导入 `assets/resources/` 需用户视觉终审后执行 ART-IMPORT 任务。
- 音效当前为 WAV 基线，转码为 mp3/平台优化属于后续发布打磨。
- `.scene`、`.prefab`、`.meta` 不手写，必须由 Cocos Creator 生成或由运行时注入替代。

## Release Gates

- C2/C3/C4 编辑器串行任务需要 Creator 3.8.8 预览、截图和 Console 零报错证据。
- D1 发布验收记录必须等代码、编辑器、美术导入、构建验证轨道完成后再收口。

## Deferred Refactors (Post-Release · 第十六批审查登记 2026-07-01)

以下为第四轮审查确认为**真实但发布前不做**的债务，逐条附裁决理由，留发布后重构里程碑（对应 coordination/BOARD.md「第十六批·采纳但暂不立任务」）：

- **上帝组件 / runtime 拆分**（审查 #1/#10）：`ui/components/game-scene-skeleton.ts`（~1278 行）与 `flow/round-runtime.ts`（~427 行）体量偏大。二者均可用且经多轮审查 + 390×844 截图 + CDP 净；单组件运行时注入是刻意决策、round-runtime 刚由 M6-G16 硬化。发布前大重构风险 > 收益，留发布后重构批。
- **`legalFollows` 全量枚举无剪枝**（审查 #4）：真实但属过早优化——selfplay 1..50 仅 ~10.8s 无实测瓶颈；rules 层为 keystone，改动须逐一证明等价。留待 profiling 触发后做等价守护版定向生成。
- **`save.ts` 双重序列化**（审查 #6）：round 字段被转义两次 + 兼容分支，属受测数据 codec 的格式瑕疵；单槽体积膨胀可忽略，修法向后兼容但发布前性价比低。留后续数据层清理。

> 另：#2 双 render / #13 春天判定 / #14 selection dirty / #15 validatePlay 双遍历 / #17 冻结 RoundState 经核实为**非问题或否决**（见 BOARD「第十六批·驳回」），不构成债务。
