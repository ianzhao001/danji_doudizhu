# Known Limitations

本文件记录当前版本的已知限制与后续债务，不作为缺陷清单。

## Product Scope

- 当前版本为离线单机、横屏、经典三人斗地主。
- 不包含联网、账号、支付、广告、匹配、排行榜或云存档。
- 战绩、设置与断局恢复均为本地存储。

## Platform And Layout

- 当前发布基线为 `844x390` 横屏 `web-mobile`。
- 桌面大屏、平板专属布局与折叠屏适配不在当前版本范围内。

## AI And Gameplay

- 策略只基于可见快照与玩家手牌做决策，不读取对手隐藏手牌。
- 三档难度属于启发式策略，不承诺最优解。
- 困难档已包含更强的出牌结构、残局判断与提示联动，但仍有继续增强空间。
- turn timer 仅作提示，不会超时自动代打。

## Save And Resume

- `RoundState` 目前重点覆盖 Playing 与 Settled 路径。
- bidding 阶段的恢复不是当前重点场景。
- 存档损坏按 data 层约定抛错或降级处理。

## Assets And Audio

- 部分资源仍保留后续统一空间，例如大厅与游戏内素材风格的一致性优化。
- 当前音频基线为 WAV，后续可再做体积与平台优化。
- `.scene`、`.prefab`、`.meta` 仍要求由 Cocos Creator 维护。

## Release Gates

- 当前版本已具备 `web-mobile` 构建基线，启动场景为 `lobby.scene`。
- 后续界面任务仍需补充横屏视口验证与人工体验确认。

## Deferred Refactors

- `ui/components/game-scene-skeleton.ts` 与 `flow/round-runtime.ts` 体量偏大，适合在后续版本继续拆分。
- `legalFollows` 仍采用全量枚举策略，若后续 profiling 证明确有瓶颈，再做等价剪枝优化。
- `save.ts` 仍有后续整理空间，可在数据层清理时统一处理。
- `P-STRAY-LABEL`：大厅场景底缘仍有一个来源未完全定位的游离文字节点，需在后续版本继续排查与清理。
