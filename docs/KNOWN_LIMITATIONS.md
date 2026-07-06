# Known Limitations

本文件记录已发布版本与后续债务。除非另开任务，本列表不是 bug 清单。

## Product Scope

- v1.2 已收版并打包为离线单机、横屏、经典三人斗地主。
- 不包含联网、账号、支付、广告、匹配、排行榜或云存档。
- 所有战绩、设置、断局恢复均为本地存储。

## Platform And Layout

- 当前发布包以 844×390 横屏为主基线，`web-mobile` 构建已记录 `orientation=landscape`。
- v1.2 发布冒烟在四个横屏视口跑 V6 全链 harness，`productErrors=[]`，覆盖两局 settled、逆时针链与暂停链。
- 桌面大屏、平板专属布局、折叠屏不是当前发布验收目标；需要另开适配任务。

## AI And Gameplay

- AI 只基于 `GameSnapshot` 与 `viewerHand` 决策，不读取隐藏手牌。
- 难度差异已由 selfplay 与策略测试覆盖，但仍是启发式 AI，不承诺最优解。
- Hard 困难档的记牌机制已闭合到真实历史链路：flow/round-runtime 传累积 `GameEvent`，困难策略用 `estimateMemoryPressure(hand, history)` 与 `trackPlayed(history, hand)` 估算外部剩牌，并在跟单牌时可用「绝对最大单」接管。simple/normal 仍不记牌。量化强度主张等待 V7 真历史基线，不在此处虚标“变强”数值。
- turn timer 仅做提示，不会超时自动代打，避免改变 `round-runtime` 契约。

## Save And Resume

- `RoundState` 当前只有 Playing/Settled 两个阶段；bidding resume 不支持。
- Resume 重点覆盖 playing 与 settled 路径；G11 已明确不测 bidding resume。
- 存档损坏会按 data 层约定抛错或降级，具体以 save/settings/records codec 为准。

## Assets And Audio

- v1.2 游戏内牌桌已接 v13 pink 资产；lobby 仍保留 v12 风格，统一到 v13 属后续设计债。
- 音效当前为 WAV 基线，转码为 mp3/平台优化属于后续发布打磨。
- `.scene`、`.prefab`、`.meta` 不手写，必须由 Cocos Creator 生成或由运行时注入替代。

## Release Gates

- v1.2 发布包已就绪：Creator 3.8.8 CLI `web-mobile` 构建，`launchScene=lobby.scene`，`designResolution=844×390`，`orientation=landscape`，归档 `build/doudizhu-v1.2-web-mobile.zip`（不入库）。
- 后续 UI/场景任务仍必须走双层视觉预审：执行者自审四类硬伤，规划者视觉审达标后才交用户主观签收。

## Deferred Refactors (Post-Release · 第十六批审查登记 2026-07-01)

以下为第四轮审查确认为**真实但发布前不做**的债务，逐条附裁决理由，留发布后重构里程碑（对应 coordination/BOARD.md「第十六批·采纳但暂不立任务」）：

- **上帝组件 / runtime 拆分**（审查 #1/#10）：`ui/components/game-scene-skeleton.ts` 与 `flow/round-runtime.ts` 体量偏大。二者均可用且经多轮审查 + 横屏截图 + CDP 净；单组件运行时注入是刻意决策。发布前大重构风险 > 收益，留发布后重构批；v1.3 已将 runtime 拆分列为 A 波任务。
- **`legalFollows` 全量枚举无剪枝**（审查 #4）：真实但属过早优化——selfplay 1..50 仅 ~10.8s 无实测瓶颈；rules 层为 keystone，改动须逐一证明等价。留待 profiling 触发后做等价守护版定向生成。
- **`save.ts` 双重序列化**（审查 #6）：round 字段被转义两次 + 兼容分支，属受测数据 codec 的格式瑕疵；单槽体积膨胀可忽略，修法向后兼容但发布前性价比低。留后续数据层清理。
- **lobby v13 风格统一**：game-scene 已接 v13 新键，lobby 留 v12；为避免发布前扩大回归面，作为独立后续任务处理。

> 另：#2 双 render / #13 春天判定 / #14 selection dirty / #15 validatePlay 双遍历 / #17 冻结 RoundState 经核实为**非问题或否决**（见 BOARD「第十六批·驳回」），不构成债务。
