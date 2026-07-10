# T-INTERACT-VIEWS — 真实斗地主交互的纯逻辑基座（要不起 / 报单报双 / 划选 / 降序理牌）

- **批次**：v1.4 第一波 W-UNIFY·纯逻辑批第 2 棒（自 T-THEME-TOKENS 尖建 `task/T-INTERACT-VIEWS` 链式续做）
- **类型**：纯逻辑（ui 纯岛·禁 `cc`）·**纯 spec 派发**（测试执行者自写）
- **执行者**：Cursor　**审查者**：Codex（按 `tasks/R-WAVE10.md`）

## 背景与动机
对照真实斗地主（如欢乐斗地主）的交互惯例，当前实现缺四件事的**纯逻辑基座**：
1. **要不起**：轮到玩家跟牌但无任何合法着法时，真实游戏会明确呈现「要不起」（出牌/提示禁用、过牌钮变文案并强调）。当前 `deriveActionButtons` 只把 `hint` 算成 false，UI 无「要不起」语义。
2. **报单/报双**：任一席剩 1/2 张时真实游戏有警示（徽标+音效）。快照已有 `handCounts`，无派生。
3. **划选多张**：真实游戏手指扫过手牌即连选。`hand-interaction.ts` 只有单点命中语义。
4. **降序理牌**：真实游戏手牌大→小从左到右。`selection.sortByRank` 为升序。

## 目标与文件域
- 新 `assets/scripts/ui/follow-ux.ts`（要不起 + 报单报双派生）
- `assets/scripts/ui/hand-interaction.ts`：**追加**纯函数（不改既有导出签名与行为）
- `assets/scripts/ui/selection.ts`：**追加** `sortForDisplay`（不动既有 `sortByRank`——别处可能按升序消费）
- `assets/scripts/ui/index.ts` 桶：仅允许追加导出行（铁律 4 授权）
- 新 `test/ui/interact-views.test.ts`（或按件拆 2–3 个测试文件，执行者自定）
- `coordination/reports/T-INTERACT-VIEWS.report.md`

## 契约
```ts
// follow-ux.ts —— 复用 rules 的 legalFollows；禁 cc
export interface SeatAlert { seat: SeatIndex; kind: 'lastOne' | 'lastTwo' }
export interface FollowUx { mustPass: boolean; alerts: SeatAlert[] }
export function deriveFollowUx(args: { snapshot: GameSnapshot; viewerSeat?: SeatIndex }): FollowUx;
```
- `mustPass`：`viewerSeat`（缺省 `snapshot.turn`）为当前回合、`snapshot.top !== null`、且 `legalFollows(viewerHand, top.pattern)` 为空 → true。**领出回合（top===null）恒 false**；非本席回合恒 false；`viewerHand` 缺省按空手牌处理（true 当且仅当满足前两条）——与 `deriveActionButtons` 同源同语义，不得出现「按钮可出但 mustPass=true」的矛盾态。
- `alerts`：遍历 `handCounts`，剩 1 张 → `lastOne`（报单），剩 2 张 → `lastTwo`（报双），0 张或 ≥3 张无警示；**phase 非出牌进行中（对局已结束 winner≠null）时返回空数组**，座位序稳定 0→2。

```ts
// hand-interaction.ts —— 追加
export function dragSelectCards(slots: InteractiveSlot[], fromX: number, toX: number): Card[];
```
- 语义：给定滑动起止 x（与 `layoutHandInteractive` 产出的 slot 同一坐标系），返回**被扫过区间命中的连续手牌**。`fromX > toX` 自动归一；起止越界夹取到首尾；区间不触任何 slot → 空数组；空 slots → 空数组。**纯计算，不持状态**——选中/反选的合成由 cc 层用既有 `selection.toggle` 组合。
- **规划者裁定（2026-07-10·采审查者建议 A·契约修订）**：仅凭 `slots.x` 在重叠布局下无法恢复末张全宽（审查已证），故授权 **`InteractiveSlot` 追加加法字段 `hitRight: number`**（绝对坐标命中右边界），由 `layoutHandInteractive` 产出——**非末张 = 下一张 slot 的 x；末张 = 自身 x + cardWidth**（cardWidth 为该函数已知值）。命中区间：非末张 `[x, hitRight)`，**末张右闭 `[x, hitRight]`**（扫到牌右沿仍命中）；**单张手牌按末张语义（有限宽，禁止 Infinity）**。`dragSelectCards` 签名不变，只消费 `slot.hitRight`，不得自行反推宽度。选 A 弃 B 的理由：命中几何的真相源留在 layout 单点，避免各调用点自传 `cardWidth` 与实际布局漂移。风险面已由规划者预核：既有测试对 slot 仅投影断言（`x`/`card.rank`），无锁形 `toEqual`，加法字段零破坏；`layoutHandInteractive` 既有消费方只读 slot，不受影响。

```ts
// selection.ts —— 追加
export function sortForDisplay(cards: Card[]): Card[];
```
- 语义：**降序**（大→小），王最左（大王>小王>2>A>…>3），同点数内花色顺序稳定（与 `sortByRank` 的同点内序一致，仅整体反向）；不修改入参数组；空入空出。

## 必须覆盖用例清单（缺一不收）
1. mustPass 真值表：领出回合 false；跟牌可压 false；跟牌不可压（如手牌全小且 top 为大对子）true；非 viewer 回合 false；viewerHand 未提供（undefined）时不抛错。
2. mustPass 与 `deriveActionButtons` 一致性：同一快照下 `mustPass===true` ⟹ `deriveActionButtons(...).hint===false` 且任意选牌 `play` 不可真（抽 1–2 组数据钉一致性）。
3. alerts：单席报单、单席报双、两席同时报（1+2）、0 张不报、对局结束（winner 非 null）返回空。
4. dragSelectCards：正向/反向扫过同区间结果相等；单点（fromX===toX）等价单张命中；越界夹取；区间落在缝隙外返回空；扫过全手牌返回全量且**保持手牌序**。
4b. **（裁定新增·缺一不收）**：① 重叠态末张右半区命中——`containerWidth=390, cardWidth=60, count=20` 时扫 `x=380` 命中末张（审查者复现例钉死）；② 单张手牌左右越界不命中（如 `x=1e6` 返回空——有限宽护栏）；③ `hitRight` 字段契约直接断言：非末张 === 下一张 `x`，末张 === 自身 `x + cardWidth`。
5. sortForDisplay：含双王+2+普通点的混合手降序正确；不改入参（断言原数组未变）；与 `sortByRank` 元素集合相等；**同点数内保持 `sortByRank` 稳定序不反转**（如 `[3♠,3♥,5♣]` → `[5♣,3♠,3♥]`——按 rank 降序、原 index 升序稳定排序，禁止整体 `.reverse()`）。
6. 三个新文件/函数源码零 `from 'cc'`（护栏断言）。

## 红线
- 不改 `deriveActionButtons`、`layoutHandInteractive`、`sortByRank`、`toggle` 等**既有导出**的签名与行为。
- 不动 `rules`/`game` 层；`legalFollows` 只消费不重实现。
- 禁 cc；不改既有测试。

## 验收
- 全量 test + typecheck 绿；报告含链式基点 commit（自 T-THEME-TOKENS 尖）与用例清单落实映射。
