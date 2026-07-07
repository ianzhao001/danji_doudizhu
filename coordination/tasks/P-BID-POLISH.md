# P-BID-POLISH — 叫抢建议接线 + 阈值对齐 + 观感微调（同分支批次）

- 状态：ready（**B 窗批次连做**·2026-07-08 压缩轮次修订：与 P-GS-SPLIT2 同窗按序清完，无需批中等规划者）
- 任务模式：editor-evidence（**双层视觉预审从严**——本任务是 v1.3 唯一新画面）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts` + `assets/scripts/ui/components/game-scene/*.ts`
  - `assets/scripts/ai/bidding-advisor.ts`（**G3 骑士**：`adviseBid` 加 `level: AiLevel` 参数·按档取阈值）
  - `assets/scripts/ai/bidding-levels.ts`（**仅允许一处**：给 `thresholdFor` 加 `export` 关键字——2026-07-08 规划者修订：原红线「不改 bidding-levels」与「用 thresholdFor 同一真相源」矛盾，该函数现为私有；语义/数值/其余代码零改动）
  - `test/ai/bidding-advisor.test.ts`（**仅种子搬运**：将 `coordination/seeds/P-BID-POLISH-bidding-advisor.test.ts` **原样复制覆盖**，独立 commit `seed(P-BID-POLISH): relocate planner seed`，内容一字不改——规划者预写·审查者逐字节核）
  - `coordination/reports/P-BID-POLISH.report.md`
- 依赖：P-GS-SPLIT2（**同窗批次前序**·本分支自 `task/P-GS-SPLIT2` 完成尖建·合并串行 SPLIT2 先合）
- 分支：`task/P-BID-POLISH`（执行者自 SPLIT2 批次尖建）

## 批次连做流程（压缩轮次·2026-07-08）
1. 同窗完成 P-GS-SPLIT2（提交 + 报告）后，`git checkout -b task/P-BID-POLISH` 自 SPLIT2 尖建本分支；
2. 首个 commit 做种子搬运（见文件域）；跑 `npm --prefix test test -- bidding-advisor` 确认按档断言红（TS2554/TS2305 预期红）；
3. 实现转绿 + 微调三项 + 截图证据；批末**一次交接**覆盖两任务（SPLIT2 + BID-POLISH），规划者一次爆发做两任务视觉审②。

## 行为要求

**① 叫抢建议接线 + G3 阈值对齐**（接既有能力·非新功能）：
- **G3 阈值对齐（纯层·先做）**：`adviseBid(hand, phase)` → `adviseBid(hand, phase, level: AiLevel)`，用 `thresholdFor(level)`（Simple 3/Normal 2/Hard 1）替换硬编码 `isStrongHand(hand, 2)`，与三档 AI 叫牌**同一真相源**。种子（已预写）按档断言 + `strong ≡ isStrongHand(hand, thresholdFor(level))` 全对齐锁。
- **G2 接线（UI）**：叫抢期、轮到玩家时显示建议轻面板（如「建议：叫地主（手牌强）」）；消费 `adviseBid(hand, phase, currentLevel)`（按当前难度档），**UI 不重算规则**；
- **默认低打扰**：沿 advisor 开关先例（默认关或轻提示态，可点开）；落点用既有 zone（statusLine 邻域/advisorDock），**不新增任何重叠**（零重叠硬门沿用）；
- 相位互斥不回归：面板仅叫抢期存在，playing/settled 无该节点。

**② 观感微调**（V4-R3 起登记的非硬伤观察）：
- 顶部右角**半裁小徽标**修复（定位该节点：溢出屏缘/被裁的 badge——修正定位或尺寸，四档核）；
- playing **左列密度**微调（强度/剩牌/左家名牌四层堆叠区适度拉开呼吸感——微调间距，不重排结构、不破 T-LAYOUT4 无重叠契约）；
- **termination 按钮 decorated 收编**（T-TERM-FEEDBACK 视觉审②记录·2026-07-07）：`termination-feedback-lobby/restart` 未入 `isDecoratedButton` 名单 → 默认 `btnSecondaryV13` 压扁绘制致顶部宝石高光与居中白字轻微交叠（四档一致·可辨认·非硬伤）。修法一行：进 decorated 名单（labelY=-8 避顶饰）或 `buttonSkinPath` 特判；修后补 844×390 异常终止截图对照。**按 P-GS-SPLIT2 拆分后的实际落点改**；
- **顺手删**（拆分后清理批授权·C 波记录⑥归档债务）：`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` 中 3 个 dead 条目 `last-action-0/1/2`——删除须报告单列 + settled 相四横屏截图证明行为零变化。

## 红线
- **G4 出牌建议保持默认关**（`advisorEnabled=false` 不改·红线·用户裁决 2026-07-07）：不改出牌建议默认值、不加首局引导；只接叫抢建议 + 对齐阈值。
- `ai/bidding.ts`（`isStrongHand` 本体）不改；`bidding-levels.ts` 除 `export` 一词外零 diff（`chooseBidByLevel`/阈值数值不动）。
- `adviseBid` 加参无既有 UI 消费方（G2 本任务才首次消费），无回退面。

## 验收
- 种子搬运逐字节一致（`diff coordination/seeds/P-BID-POLISH-bidding-advisor.test.ts test/ai/bidding-advisor.test.ts` 为空）+ 按档断言全绿；
- 四横屏 × {叫抢（建议面板开/关两态）、playing（左列 zoom）、顶部右角 zoom、844×390 异常终止按钮对照} 截图 + `productErrors=[]`；
- 不变量：settled 门控/相位互斥/逆时针/零重叠全不回归；全量 vitest/typecheck 零回归；
- **双层视觉预审从严**（执行者自审四类硬伤 + 新面板零重叠 → 规划者批末逐张 zoom 审）→ 审查 R-WAVE8 R:P-BID-POLISH + R-WAVE9 骑士补充。
