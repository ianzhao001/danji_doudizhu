# T-INTERACT-VIEWS 实现报告

- 实现方标识：Cursor（执行者）
- 分支：`task/T-INTERACT-VIEWS`
- 链式基点：`task/T-THEME-TOKENS` 尖 commit `0b6121f`
- 复审基点：`b7bfc3a`
- 状态：approved

## 改了哪些文件
- `assets/scripts/ui/hand-interaction.ts`：`InteractiveSlot` 追加 `hitRight`；`layoutHandInteractive` 产出命中右边界；`dragSelectCards` 只消费 `hitRight`
- `assets/scripts/ui/selection.ts`：`sortForDisplay` 改为 rank 降序 + 原 index 稳定序（禁整体 reverse）
- `test/ui/interact-views.test.ts`：新增用例 4b 三项；修正用例 5 同点稳定序期望

## 裁定修复摘要
| 审查项 | 修复 |
|---|---|
| 重叠末张全宽 | `hitRight`：非末张=下张 x，末张=x+cardWidth；末张右闭 `[x,hitRight]` |
| 单张越界 | 区间完全落在 `[firstLeft,lastRight]` 外则空（`x=1e6` 不夹取命中） |
| 同点稳定序 | `sortForDisplay` 按 rank 降序、index 升序；`[3♠,3♥,5♣]→[5♣,3♠,3♥]` |

## 用例清单落实映射
| # | 用例 | 测试 |
|---|---|---|
| 1–3 | mustPass / 一致性 / alerts | 既有 describe 保留 |
| 4 | dragSelectCards 基础 | `dragSelectCards` describe |
| 4b | 重叠末张 / 单张越界 / hitRight 契约 | `dragSelectCards 4b（裁定新增）` |
| 5 | sortForDisplay 降序+稳定序 | `sortForDisplay` + `同点数内保持 sortByRank 稳定序不反转` |
| 6 | 零 cc | `零 cc 护栏` |

## 测试与类型检查输出
```
npm --prefix test test (vitest run)
 Test Files  151 passed (151)
      Tests  802 passed (802)
   Duration  ~29s
 highlight: ui/interact-views.test.ts (27 tests) — all passed

npm --prefix test run typecheck
> tsc --noEmit
 exit 0
```

## 评审结论（Codex 审查者·2026-07-10·首轮）
- 结论：`blocked` → 规划者裁定 A 后交执行者修复（见 BOARD 契约裁定记录）。
- 阻断项：末张命中宽度、同点稳定序反转（详见上文历史段）。

## 裁定后复审（Codex 审查者·2026-07-10）
- 结论：`approved`（常规 ui 纯岛，无高风险面）。
- 增量 diff 逐行审读：`b7bfc3a..3296680`；仅 `hand-interaction.ts` / `selection.ts` / 执行者自写测试 / 本报告，文件域合规，零 `cc` import，`git diff --check` 净。
- 裁定 A 核销：`InteractiveSlot.hitRight` 为加法字段；非末张=下张 x，末张=x+cardWidth；20 张重叠态 x=380 命中末张；单张 x=1e6 不命中；无 Infinity 残留。
- 稳定序核销：`sortForDisplay` 按 rank 降序 + 原 index 升序，`[3♠,3♥,5♣] → [5♣,3♠,3♥]`，不改入参且与 `sortByRank` 元素集合一致。
- 定向抽查：`screen-view.ts` 仅消费 `layoutHandInteractive` 返回值，既有 x/y/card/selected 语义零漂移；`dragSelectCards` / `sortForDisplay` 尚无产品消费方，符合 P-PLAY-FEEL 后置接线。
- 定向闸门：`interact-views` + `hand-interaction` + `screen-view` 共38/38 绿；左边界单点探针通过。
- 全量闸门：151 files / 802 tests 绿；`npm --prefix test run typecheck` exit 0；`git diff --check` 净。

## 兜底修复披露（Codex 审查者）
- 范围：仅 `assets/scripts/ui/hand-interaction.ts` 一处相交边界比较，未改测试、未越文件域。
- 摘要：非末张区间左边界按契约为闭，将 `slot.x < end` 改为 `slot.x <= end`；修复单点恰在首张/任一非末张 x 时返回空的边界缺口。
- 证据：修前探针 `firstX=135, hit=[]`；修后同探针命中首张，定向 38/38 + 全量 802/802 + typecheck 绿。

## 自检
- [x] `layoutHandInteractive` 仅追加 `hitRight` 产出，x/y/card/selected 语义未漂移
- [x] `dragSelectCards` 无 Infinity 残留
- [x] 未改既有测试
- [x] 批末双闸已复跑并全绿
