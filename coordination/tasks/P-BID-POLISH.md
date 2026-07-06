# P-BID-POLISH — 叫抢建议接线 + 观感微调（同分支批次）

- 状态：blocked（等 P-GS-SPLIT2 落 main——消费拆后结构）
- 任务模式：editor-evidence（**双层视觉预审从严**）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts` + `assets/scripts/ui/components/game-scene/*.ts`
  - `coordination/reports/P-BID-POLISH.report.md`
- 依赖：P-GS-SPLIT2 done
- 分支：`task/P-BID-POLISH`（届时自 main 建）

## 行为要求

**① 叫抢建议接线**（接既有能力·非新功能：`ai/bid-confidence` 或 `bidding-advisor` + `ui/bidding-advice-view` 纯层带测试建好未接）：
- 叫抢期、轮到玩家时显示建议轻面板（如「建议：叫地主（手牌强）」）；消费既有纯层派生，**UI 不重算规则**；
- **默认低打扰**：沿 advisor 开关先例（默认关或轻提示态，可点开）；落点用既有 zone（statusLine 邻域/advisorDock），**不新增任何重叠**（零重叠硬门沿用）；
- 相位互斥不回归：面板仅叫抢期存在，playing/settled 无该节点。

**② 观感微调**（V4-R3 起登记的非硬伤观察）：
- 顶部右角**半裁小徽标**修复（定位该节点：溢出屏缘/被裁的 badge——修正定位或尺寸，四档核）；
- playing **左列密度**微调（强度/剩牌/左家名牌四层堆叠区适度拉开呼吸感——微调间距，不重排结构、不破 T-LAYOUT4 无重叠契约）。

## 验收
- 四横屏 × {叫抢（建议面板开/关两态）、playing（左列 zoom）、顶部右角 zoom} 截图 + `productErrors=[]`；
- 不变量：settled 门控/相位互斥/逆时针/零重叠全不回归；全量 vitest/typecheck 零回归。
- **双层视觉预审**（执行者自审四类硬伤+新面板零重叠 → 规划者逐张 zoom 审）→ 审查 R-WAVE8 R:P-BID-POLISH（常规）。
