# T-INTERACT-VIEWS 实现报告

- 实现方标识：Cursor（执行者）
- 分支：`task/T-INTERACT-VIEWS`
- 链式基点：`task/T-THEME-TOKENS` 尖 commit `0b6121f`
- 复审基点：`b7bfc3a`
- 状态：in-review（规划者裁定 A 已落实，待 Codex 复审）

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

## 自检
- [x] `layoutHandInteractive` 仅追加 `hitRight` 产出，x/y/card/selected 语义未漂移
- [x] `dragSelectCards` 无 Infinity 残留
- [x] 未改既有测试
- [x] 待批末双闸复跑
