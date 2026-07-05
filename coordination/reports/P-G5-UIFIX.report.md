# P-G5-UIFIX 实现报告

- 实现方标识：GPT-5.5 执行者
- 分支：`task/P-G5-UIFIX`
- 状态：ready-for-planner-visual-review-r1
- 记录时间：2026-07-05 18:45 CST

## 改了哪些文件

- `assets/scripts/ui/components/game-scene-skeleton.ts`
  - 删除卡面中心大号点数，仅保留角标与中心花色。
  - 装饰按钮高度统一兜底到 60px，文本下移到按钮主体区域，二级按钮文字改白色以提升对比。
  - 底牌托架增加 `lastBottomCardsSignature`，底牌 reveal 只在签名变化时播放一次动画。
  - 新增 v13 运行时贴图预加载，降低首局底牌/结算面板首帧白板或闪烁风险。
  - 手牌改用屏幕居中 frame 排列，不再以右侧 `heroHandLarge.x` 为起点。
  - 叫抢阶段不再额外渲染默认 `叫抢阶段`/`自由出牌` 文本，避免文字盖文字。
  - 顶部信息条拆开左右停靠，降低和底牌/人物/出牌区拥挤。
  - R1 返工：结算/暂停暗幕 alpha 加深，确保结算全屏压暗到底部手牌。
- `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`
  - 叫抢提示改为深色半透明底衬。
  - 叫抢/出牌按钮使用更高按钮盒并按 `tableActionBar` 可用宽度重新分配。
  - 建议开关避免使用小高度九宫格按钮。
- `assets/scripts/ui/components/game-scene/hud-renderer.ts`
  - 强度/记牌 HUD 适配 T-LAYOUT4 腾出的区域，修复窄宽下 bar 负宽/挤压。
  - 记牌收起按钮改为紧凑绘制按钮，避免 v13 九宫格在 28px 高度被压坏。
- `assets/scripts/ui/components/game-scene/result-overlay-renderer.ts`
  - 结算标题、胜负横幅、分数面板、按钮重新分层排布。
  - 面板暗幕加深；结算按钮使用 60px 高 v13 按钮。
- `assets/scripts/ui/components/game-scene/seats-renderer.ts`
  - 三个名字牌从人物节点中分离，按 T-LAYOUT4 nameplate zone 独立渲染。
  - 左上/右上人物在接线层轻微向桌心和桌面方向偏移，贴近参考关系。
  - AI 出牌反馈/思考条改停靠到 drop zone 附近，避免压人物。
  - R1 返工：按实际可视立绘矩形重新计算名字牌落点；hero 名字牌移到玩家外侧且让开手牌，左家名字牌强制清出底左 hero 区，右家名字牌跟随右侧立绘下方。

未改：`test/`、纯层、lobby、scene、`.meta`、`assets/resources/**`。

## 8 项整改对应

| 项 | 结论 | 证据 |
|---|---|---|
| 1. 卡面中心数字 | 已删 `card-face-rank` 渲染 | `rg card-face-rank` 无命中；截图中手牌仅角标 + 花色 |
| 2. 按钮包裹文字 + 对比 | 已改按钮高 >= 60；文字在按钮主体内；二级按钮白字 | 叫抢/出牌/结算 contact sheet |
| 3. 底牌消闪烁 | 已加底牌签名门控 + v13 贴图预加载 | 两轮结算/底牌截图稳定；无首帧白板 |
| 4. HUD 消费新区 | 已按 T-LAYOUT4 让开对家；修窄宽 bar | playing/selected/AI 出牌截图 |
| 5. 名字牌分离 | 已独立渲染 nameplate 节点 | 三座位 nameplate 计数=3，非 body 子布局 |
| 6. 结算整改 | 横幅/标题/分数/按钮分层；暗幕加深；transient 隐藏 | settlement 两轮 contact sheet |
| 7. 叫抢字对比 | 叫抢提示深色底衬 | bidding contact sheet |
| 8. 顶部信息条松绑 | 顶部 phase/地主/倍数/手牌分散停靠 | 四横屏全相位截图 |

补充响应用户最新反馈：
- 左上/右上人物：渲染层轻微向桌心和桌面方向偏移，保持不重做美术。
- 玩家手牌：改用左右等距的屏幕居中 frame，不再居右。

## 规划者视觉审 R1 打回记录

来源：`coordination/BOARD.md` UI-REMAKE 段「P-G5-UIFIX 规划者视觉审 R1」。

- 结论：`changes-requested`，不上交用户、不转审查者。
- 必修硬伤 1：底左名字牌压 hero 立绘，且左家名字牌疑似错位到底左；要求每名字牌落各自立绘下方/外侧，实测截图不压任何立绘 sprite。
- 必修硬伤 2：结算暗幕未盖底部手牌，面板下方底部手牌行仍全亮；要求暗幕全屏覆盖，守 T-FIX-SETTLE 口径。
- 软要求：左上/右上人物再向牌桌中心靠一点；确认手牌屏幕居中且不压牌；按钮顶部爱心九宫格失真可选处理。

## R1 返工实现

- 名字牌：
  - 不再直接使用 T-LAYOUT4 nameplate 原始 x/y 作为最终可视落点。
  - 先按实际渲染后的立绘尺寸和偏移计算 `seatBodyVisualRect`。
  - hero 名字牌放在玩家立绘右侧外部，并限制在手牌上方 12px 净空。
  - 左家名字牌放在左上立绘下方/外侧，并用 `heroBody.x + heroBody.width + 8` 作为最小 x，避免再次落到底左玩家区域。
  - 右家名字牌跟随右侧立绘下方/外侧。
- 立绘：
  - 左上/右上立绘继续向牌桌中心靠近，缩放为实际 zone 的 95%，向下轻贴桌面。
  - hero 立绘缩放为实际 zone 的 92%×90%，给外侧名字牌和手牌留净空。
- 结算暗幕：
  - `drawDimOverlay` alpha 由 176 加深到 218；R1 截图中底部手牌仍可辨但明显压暗，符合“牌桌可见但压暗、面板内无浮入”。

## 执行者视觉自审勾销表

证据目录：
- 全量截图：`/tmp/doudizhu-pg5-uifix-evidence-r1-fix/`
- 汇总：`/tmp/doudizhu-pg5-uifix-evidence-r1-fix/summary.json`
- contact sheets：
  - `/tmp/doudizhu-pg5-uifix-evidence-r1-fix/contact-sheets/round1-bidding.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r1-fix/contact-sheets/round1-playing.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r1-fix/contact-sheets/round1-player-selected.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r1-fix/contact-sheets/round1-ai-play.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r1-fix/contact-sheets/round1-settlement.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r1-fix/contact-sheets/round2-settlement.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r1-fix/contact-sheets/r1-nameplates-zoom.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r1-fix/contact-sheets/r1-settlement-dim-zoom.jpg`

| 横屏档 | 叫抢 | 出牌 | 选牌 | AI 出牌 | 结算 | 自审结论 |
|---|---|---|---|---|---|---|
| 844x390 | 重叠/对比/包裹/闪烁已核 | 已核 | 已核 | 已核 | 已核 | 通过执行者自审 |
| 812x375 | 重叠/对比/包裹/闪烁已核 | 已核 | 已核 | 已核 | 已核 | 通过执行者自审 |
| 915x412 | 重叠/对比/包裹/闪烁已核 | 已核 | 已核 | 已核 | 已核 | 通过执行者自审 |
| 780x360 | 重叠/对比/包裹/闪烁已核 | 已核 | 已核 | 已核 | 已核 | 通过执行者自审 |

自审要点：
- 重叠：叫抢不再出现多层状态字；AI 出牌态移除 `已出牌` 文本压牌，思考条不压右侧人物；R1 后三名字牌均在各自立绘外侧/下方，不压 hero/left/right 立绘。
- 对比：叫抢提示有深色底；按钮文字与按钮底色形成反差。
- 包裹：叫抢/出牌/结算按钮均由 v13 背景完整包裹文字。
- 闪烁：底牌托架以签名门控动画，v13 贴图预加载后首局/第二局结算面板一致；结算暗幕全屏覆盖并压暗底部手牌。
- 手牌：四档均保持居中牌列，不再贴右；R1 后 hero 名字牌不压选中/未选手牌。

## CDP 截图链汇总

固定 seed：`20260705`。脚本文件名仍带 `P-G4` 前缀，这是沿用既有 v13 e2e 脚本的命名，不代表任务号。R1 返工后证据目录为 `/tmp/doudizhu-pg5-uifix-evidence-r1-fix/`。

| 分辨率 | 截图数 | productErrors | failedResponses | 首局 | 第二局 | AI 出牌捕获 | 玩家出牌捕获 |
|---|---:|---|---|---|---|---|---|
| 844x390 | 11 | `[]` | `[]` | settled | settled | true | true |
| 812x375 | 11 | `[]` | `[]` | settled | settled | true | true |
| 915x412 | 11 | `[]` | `[]` | settled | settled | true | true |
| 780x360 | 11 | `[]` | `[]` | settled | settled | true | true |

覆盖：lobby、round1-bidding、round1-playing、round1-player-selected、round1-ai-play、round1-player-play、round1-settlement、round2-bidding、round2-settlement、round2-after-new-game、return-lobby。

## 构建与测试

```text
npm --prefix test test

Test Files  141 passed (141)
Tests  739 passed (739)
```

```text
npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

```text
git diff --check

<no output>
```

```text
Cocos Creator 3.8.8 web-mobile build
COCOS_EXIT=36
... build Task (web-mobile) Finished in (4 s)ms ...
```

说明：Cocos CLI 本机仍输出已知 `build-script` SIGTERM 调试行并返回 36；日志存在 `build Task (web-mobile) Finished` 且后续 CDP 截图链成功。

## 工作树状态

R1 提交前（相对上一提交 `c70e58a`）：

```text
 M assets/scripts/ui/components/game-scene-skeleton.ts
 M assets/scripts/ui/components/game-scene/seats-renderer.ts
 M coordination/reports/P-G5-UIFIX.report.md
```

提交后：

```text
git status --short --untracked-files=all

<no output>
```

## 规划者视觉审结论

- 状态：R1 返工后待规划者（Opus）逐张视觉复审。
- 执行者不替规划者/用户做最终主观判断。
- 规划者视觉审通过后，再交审查者 `R-WAVE5 R:P-G5-UIFIX` 做结构/证据审；不直接交用户、不直接交审查者。

## 偏差 / 风险

- 无越域代码改动。
- 未重做任何美术资源；只消费既有 v13 资源。
- 截图证据暂存 `/tmp/doudizhu-pg5-uifix-evidence-r1-fix/`，未纳入 git。
- `P-G4` 文件名前缀为脚本历史命名偏差，报告已披露。

## 下一步

- 下一步找：规划者（Opus）。
- 原因：P-G5 是双层视觉预审任务，执行者自审已完成，必须先由规划者逐张视觉审。

给下一窗口的可粘贴提示词：

```text
你是本仓库 斗地主 的规划者（Opus）。本任务：P-G5-UIFIX 规划者视觉审。
先读：coordination/PROTOCOL.md（双层视觉预审关）、coordination/tasks/P-G5-UIFIX.md、coordination/reports/P-G5-UIFIX.report.md、coordination/BOARD.md UI-REMAKE 段最新裁定。
请逐张查看报告中的 /tmp/doudizhu-pg5-uifix-evidence-r1-fix/ 四横屏截图与 contact sheets，重点核 R1 两个必修硬伤是否已清：名字牌不再压任何立绘/左家名字牌不再错位到底左、结算暗幕全屏压暗底部手牌；同时复核软项：左上/右上人物更靠牌桌中心、玩家手牌居中且不压牌、按钮无明显硬伤。
若达标，请在报告「规划者视觉审结论」段追加结论并转审查者 R-WAVE5 R:P-G5-UIFIX；若不达标，请列出具体截图/问题打回执行者返工。
```

## 自检

- [x] 文件域仅 game-scene-skeleton + game-scene/* + report
- [x] 未改 `test/`、纯层、lobby、scene、`.meta`、`assets/resources/**`
- [x] 未重做美术
- [x] T-FIX-SETTLE settled transient 隐藏口径保留
- [x] 相位互斥未回归
- [x] per-seat 落点保留并避开人物
- [x] 执行者视觉自审已填
- [ ] 规划者视觉审待填
