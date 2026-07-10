# T-INTERACT-VIEWS 实现报告

- 实现方标识：Cursor（执行者）
- 分支：`task/T-INTERACT-VIEWS`
- 链式基点：`task/T-THEME-TOKENS` 尖 commit
- 状态：blocked（待规划者裁定 drag slot 宽度契约）

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

## 评审结论（Codex 审查者·2026-07-10）
- 结论：`blocked`，不得合并；需规划者先裁定 `dragSelectCards` 获取末张全宽的契约面。
- diff 逐行审读：`0b6121f..fa3c4f0`；文件域合规，既有导出仅追加，无既有测试改动，零 `cc` import，`git diff --check` 净。
- 全量闸门：链尖 152 files / 807 tests 绿，typecheck exit 0；但现有测试未覆盖下列契约缺口，不能据此 approved。

### 阻断项 1：重叠手牌的末张命中宽度错误
- spec 要求「非末张=与下张间距，末张=整张牌全宽」；实现却将末张宽度固定为前一步距。
- 定向复现：`containerWidth=390, cardWidth=60, count=20` 时 step=`17.3684`，末张 x=`330`，真实右边界=`390`，实现推导右边界=`347.3684`；扫 x=`380` 返回 0 张，应命中末张。
- 单张也错：`slotHitWidth=Infinity`，x=`1,000,000` 仍命中该牌，违反越界/全宽语义。
- 根因：`InteractiveSlot` 只有 `x/y/card/selected`，函数签名又只接收 `slots/fromX/toX`，仅从 x 无法在重叠布局中反推 `cardWidth`。要求同时「末张全宽」与「`layoutHandInteractive` 导出形状/行为零改动」在现 API 下不可同时满足。

### 域内项 2：同点数稳定序被反转
- spec 要求同点内序与 `sortByRank` 一致；`[3♠, 3♥, 5♣]` 的实际输出为 `[5♣, 3♥, 3♠]`，同点输入序被 `.reverse()` 颠倒。
- 修复应按 rank 降序、原 index 升序稳定排序，并将自写测试的同点期望改为稳定序（强化/纠正契约，不得删除其他覆盖）。

## 阻塞升级（待规划者裁定）
- 阻塞类型：API/spec 契约不足。
- 已尝试路径：对照 `layoutHand` 重叠公式、`InteractiveSlot` 形状与 20 张/单张定向探针；证明仅 slots.x 无法恢复 cardWidth。
- 建议选项 A（推荐）：修订 spec，授权 `InteractiveSlot` 追加明确命中右边界/宽度字段，由 `layoutHandInteractive` 产出；既有消费方可忽略该加法字段。
- 建议选项 B：修订 `dragSelectCards` 签名，显式传入 `cardWidth`。
- 无论选哪个，都必须新增 17/20 张重叠态末张右半区与单张左右越界测试，并修正同点稳定序测试。

## 自检
- [x] 既有导出零 diff（仅追加）
- [x] 全量 test + typecheck 绿
- [x] 未改既有测试
