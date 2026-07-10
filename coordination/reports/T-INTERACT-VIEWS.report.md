# T-INTERACT-VIEWS 实现报告

- 实现方标识：Cursor（执行者）
- 分支：`task/T-INTERACT-VIEWS`
- 链式基点：`task/T-THEME-TOKENS` 尖 commit
- 状态：in-review

## 改了哪些文件
- 新 `assets/scripts/ui/follow-ux.ts`（`deriveFollowUx`）
- `assets/scripts/ui/hand-interaction.ts`（追加 `dragSelectCards`，既有导出未改签名）
- `assets/scripts/ui/selection.ts`（追加 `sortForDisplay`，`sortByRank` 未动）
- `assets/scripts/ui/index.ts`（追加 `export * from './follow-ux'`）
- 新 `test/ui/interact-views.test.ts`

## 用例清单落实映射
| # | 用例 | 测试 |
|---|---|---|
| 1 | mustPass 真值表 | `deriveFollowUx mustPass` describe |
| 2 | 与 deriveActionButtons 一致性 | `deriveFollowUx 与 deriveActionButtons 一致性` |
| 3 | alerts 报单/报双/结束 | `deriveFollowUx alerts` |
| 4 | dragSelectCards 扫选 | `dragSelectCards` describe |
| 5 | sortForDisplay 降序 | `sortForDisplay` describe |
| 6 | 零 cc 护栏 | `零 cc 护栏` it.each |

## 测试与类型检查输出
```
Test Files  152 passed (152)
Tests       807 passed (807)
npm --prefix test run typecheck → exit 0
```

## 与 spec 的偏差 / 关键决策
- `dragSelectCards` 末张命中宽：非末张用 slot 间距；末张在 n≥2 时用末段间距（与 layoutHand 非重叠手牌 step=cardWidth 一致）；n=1 时单点命中。
- `sortForDisplay` 同点内序为 `sortByRank` 稳定序的整体反转（与 spec「仅整体反向」一致）。

## 自检
- [x] 既有导出零 diff（仅追加）
- [x] 全量 test + typecheck 绿
- [x] 未改既有测试
