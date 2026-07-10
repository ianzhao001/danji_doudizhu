# R-WAVE10 — v1.4 第一波审查任务书（Codex·按 PROTOCOL v1.4：diff 审 + 定向抽查，无全仓回扫）

适用任务：纯逻辑批 {T-THEME-TOKENS, T-INTERACT-VIEWS, T-LASTPLAY-CARDS}（链式分支，按序合并）；UI 批 {P-THEME-APPLY, P-PLAY-FEEL, P-TABLE-INFO}（链式分支，按序合并）。
通用口径（每任务必做）：`git diff <前棒尖或main>..task/<ID>` 逐行细读；文件域=spec 声明集（桶仅授权行）；既有测试零改动；全量 `npm --prefix test test` + `typecheck` 绿；**定向抽查** = 对每个新导出符号 grep 消费方、对每个被改文件 grep 其直接消费者，确认未破——**到此为止，不做全仓回扫**。执行者若置 `blocked` 或打回 2 轮不收敛 → 你直接**兜底**（原分支原文件域修复 + 报告「兜底修复披露」段）。高风险（触共享契约/game 核心/rules 比较/跨≥2模块，含兜底 diff）→ `approved-pending-planner` 排队规划者把关。

## R:T-THEME-TOKENS（常规）
- [ ] theme.ts 零 import（含 `cc`）；仅常量+类型；THEME 深冻结。
- [ ] 契约形状与 spec 一致（分组/键集）；色彩令牌 ≤24；通道 0-255 整数。
- [ ] 报告含「现存色值→令牌」盘点表；令牌值确实源自现状归并（抽 3 个对照 ui-helpers 现值，如 255,224,232 选中系），非凭空新配色。
- [ ] 必须覆盖用例清单 5 项逐一落实（冻结/值域/单调/无cc/快照锁形）。
- [ ] 桶 diff 恰一行导出；未触任何消费方。

## R:T-INTERACT-VIEWS（常规）
- [ ] 既有导出零改动：`deriveActionButtons`/`layoutHandInteractive`/`sortByRank`/`toggle` 的 diff 为纯追加。
- [ ] `mustPass` 语义与 `deriveActionButtons` 同源（都走 legalFollows；lead 恒 false；非本席 false）；一致性用例在测试里钉住。
- [ ] `alerts` 消费 `handCounts`；对局结束返回空；席序稳定。
- [ ] `dragSelectCards` 命中语义与 `layoutHandInteractive` slot 宽度语义一致（读两处代码对照）；归一/夹取/空入用例齐。
- [ ] `sortForDisplay` 不改入参；与 `sortByRank` 集合相等用例在。
- [ ] 用例清单 6 项逐一落实；零 cc。

## R:T-LASTPLAY-CARDS（常规）
- [ ] `deriveLastActions` 本体零 diff；新文件内部复用它做 text（无第二份文案 switch）。
- [ ] play→cards 引用透传未深拷、未修改事件对象；bomb/rocket 相邻事件正确置 emphasis（对照 `game/core.ts:132-136` 事件序）。
- [ ] reset 清三席、pass 覆盖、空流三席 null、恒长 3——用例齐。
- [ ] 定向抽查：`seats-renderer.ts:261` 等 `deriveLastActions` 既有消费点零受影响。

## 纯逻辑批合并序
T-THEME-TOKENS → T-INTERACT-VIEWS → T-LASTPLAY-CARDS（链式分支，`--no-ff` 逐个合并；每次合并前 main 双闸照跑）。

## R:P-THEME-APPLY（常规·UI）
- [ ] `grep -rn "new Color" assets/scripts/ui/components/` 残留仅转换点+报告豁免清单项。
- [ ] 纯岛与 theme.ts 零 diff；布局几何/交互零改动（diff 里只见常量来源替换与字号档归并）。
- [ ] 四横屏×六相位截图齐；改前后对照说明齐；CDP `productErrors=[]`；视觉自审①勾销表在。
- [ ] 你不判美观：证据链齐即转规划者视觉审②，缺证据打回。

## R:P-PLAY-FEEL（常规·UI）
- [ ] 划选走 `dragSelectCards` 纯函数（组件里无重复命中算法）；抬起一次结算；与单点 toggle 共存。
- [ ] 要不起为呈现层叠加：`deriveActionButtons` 仍是可用性真相源；无自动过牌/出牌路径（grep submit 调用点确认无定时器触发）。
- [ ] 降序理牌只在渲染排序处生效；选牌/校验链路按 Card 身份比对的验证说明在报告。
- [ ] strings.ts 纯追加 key；录屏两段+四横屏截图+CDP 净。

## R:P-TABLE-INFO（常规·UI）
- [ ] 迷你牌面消费 `deriveLastPlays`；pass 仍走药丸；`deriveLastActions` 链未删。
- [ ] 12 张长顺子最窄档截图无越界/相交；resume 恢复局对照截图在。
- [ ] 报单/报双状态驱动（render 全量重算）；**未新增 CueId**（grep event-cues.ts 零 diff）。
- [ ] settled 遮盖/席位映射零回归（对照既有截图基线抽查）。

## UI 批合并序
P-THEME-APPLY → P-PLAY-FEEL → P-TABLE-INFO。三任务证据齐后先交规划者视觉审②，②过再进入你合并三步；波末 V8（verify-only+用户签收）由规划者另行派发。
