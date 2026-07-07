# P-BID-POLISH — 叫抢建议接线 + 阈值对齐 + 观感微调（同分支批次）

- 状态：blocked（等 P-GS-SPLIT2 落 main——消费拆后结构）
- 任务模式：editor-evidence（**双层视觉预审从严**）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts` + `assets/scripts/ui/components/game-scene/*.ts`
  - `assets/scripts/ai/bidding-advisor.ts`（**G3 骑士**：`adviseBid` 加 `level: AiLevel` 参数·按档取阈值）
  - `coordination/reports/P-BID-POLISH.report.md`
  - **测试规划者改种（C 波扩 spec·2026-07-07）**：`test/ai/bidding-advisor.test.ts`（原 `:24-25` 锁死阈值 2 的断言改为按档断言：Simple 阈 3/Normal 阈 2/Hard 阈 1）
- 依赖：P-GS-SPLIT2 done
- 分支：`task/P-BID-POLISH`（届时自 main 建）

## 行为要求

**① 叫抢建议接线 + G3 阈值对齐**（接既有能力·非新功能：`ai/bidding-advisor` + `ui/bidding-advice-view` 纯层带测试建好未接）：
- **G3 阈值对齐（纯层·先做）**：`ai/bidding-advisor.ts` 的 `adviseBid(hand, phase)` 改签名为 `adviseBid(hand, phase, level: AiLevel)`——不再硬编码 `isStrongHand(hand, 2)`，改用 `ai/bidding-levels.ts` 的 `thresholdFor(level)`（Simple 3/Normal 2/Hard 1），与三档 AI 叫牌阈值**同一真相源**。规划者重种 `test/ai/bidding-advisor.test.ts`：原锁死阈值 2 的断言改为「按当前难度档断言」（Simple 档建议更保守/Hard 档更激进）。
- **G2 接线（UI）**：叫抢期、轮到玩家时显示建议轻面板（如「建议：叫地主（手牌强）」）；消费 `adviseBid(hand, phase, currentLevel)`（**按当前难度档**派生），**UI 不重算规则**；
- **默认低打扰**：沿 advisor 开关先例（默认关或轻提示态，可点开）；落点用既有 zone（statusLine 邻域/advisorDock），**不新增任何重叠**（零重叠硬门沿用）；
- 相位互斥不回归：面板仅叫抢期存在，playing/settled 无该节点。

**② 观感微调**（V4-R3 起登记的非硬伤观察）：
- 顶部右角**半裁小徽标**修复（定位该节点：溢出屏缘/被裁的 badge——修正定位或尺寸，四档核）；
- playing **左列密度**微调（强度/剩牌/左家名牌四层堆叠区适度拉开呼吸感——微调间距，不重排结构、不破 T-LAYOUT4 无重叠契约）；
- **termination 按钮 decorated 收编**（T-TERM-FEEDBACK 视觉审②记录·2026-07-07）：`termination-feedback-lobby/restart` 未入 `isDecoratedButton` 名单 → 默认 `btnSecondaryV13` 压扁绘制致顶部宝石高光与居中白字轻微交叠（四档一致·可辨认·非硬伤）。修法一行：进 decorated 名单（labelY=-8 避顶饰）或 `buttonSkinPath` 特判；修后补 844×390 异常终止截图对照。**注意 P-GS-SPLIT2 拆分后该函数可能已迁 `game-scene/*.ts`，按拆后落点改**。

## 红线（C 波扩 spec 增补）
- **G4 出牌建议保持默认关**（`advisorEnabled=false` 不改·红线·用户裁决 2026-07-07）：本任务**不**改出牌建议默认值、不加首局引导；只接叫抢建议 + 对齐阈值。
- `ai/bidding-advisor.ts` 改签名属纯层加参（与 T-LIVE-MULT 同形·既有两参调用方需更新——但 `adviseBid` 当前**零 UI 消费**（G2 接线本任务才首次消费），故无既有消费方回退；`test/ai/bidding-advisor.test.ts` 由规划者重种）。
- 不改 `ai/bidding-levels.ts`（`thresholdFor` 复用不改）；不改 `ai/bidding.ts`（`isStrongHand` 不改）。

## 验收
- 四横屏 × {叫抢（建议面板开/关两态）、playing（左列 zoom）、顶部右角 zoom} 截图 + `productErrors=[]`；
- 不变量：settled 门控/相位互斥/逆时针/零重叠全不回归；全量 vitest/typecheck 零回归。
- **G3 种子**：`test/ai/bidding-advisor.test.ts` 按档断言全绿（Simple/Normal/Hard 三档阈值对齐 `bidding-levels`）。
- **双层视觉预审**（执行者自审四类硬伤+新面板零重叠 → 规划者逐张 zoom 审）→ 审查 R-WAVE8 R:P-BID-POLISH + R-WAVE9 P-BID-POLISH 骑士补充（常规）。
