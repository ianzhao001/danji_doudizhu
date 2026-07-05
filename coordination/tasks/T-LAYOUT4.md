# T-LAYOUT4 — v13 无重叠布局整改（名字牌分离 + HUD 让位 + 角色外移上移）

- 状态：ready（种子已收紧·验红）
- 任务模式：seeded-red（纯逻辑·无 cc）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/table-zones.ts`
  - `coordination/reports/T-LAYOUT4.report.md`
  - **测试由规划者种入（不可改）**：`test/ui/table-zones-v13.test.ts`（新增 T-LAYOUT4 无重叠断言）
- 依赖：—
- 分支：`task/T-LAYOUT4`
- worktree 缺 `temp/cli/tsconfig.cocos.json` 时照例拷贝。

## 背景

用户视觉终审否 v13：名字牌贴在人物身上、强度/剩牌/建议 HUD 撞在对家立绘上、左右上角色偏中偏低。规划者早先「名字牌贴附 body 允许重叠」裁定**已被推翻**（用户 2026-07-05：元素不可重叠）。

## 行为要求（实现到种子测试绿）

1. **名字牌分离**（种子断言 `rectGap ≥ 8`）：`heroNameplate`/`opponentLeftNameplate`/`opponentRightNameplate` 移到各自宿主立绘外的独立落点（建议：立绘正下方或外侧），与宿主 body **不重叠**；且不压 `heroHandLarge`/`tableActionBar`（种子已断言 `rectGap ≥ 0`）。
2. **HUD 让位**（种子断言 `rectGap ≥ 8`）：`strengthMeter`/`memoryDock` 不撞 `opponentLeftBody`、`advisorDock` 不撞 `opponentRightBody`。**同时守 T-LAYOUT2 语义不变**（`table-zones.test.ts:155-161`：`right(strengthMeter) ≤ actionBar.x`、`turnTimer.x ≥ right(actionBar)`、memory 左半、advisor 右半）。
3. **角色外移 + 上移**（设计目标·无硬性数值断言·交 P-G5 时规划者视觉审把关）：`opponentLeftBody` 更贴左上角、`opponentRightBody` 更贴右上角、整体上移，给中部牌桌与 HUD 腾出空间（外移正好化解 #2 的撞立绘）。建议手法：opponent body 移到近屏边（x 近 gap / 右对称）并与 `heroBody` 竖向错开（`rectGap ≥ 8`），避免回到 T-LAYOUT3 的偏中位置。
4. **红线**：legacy 6 字段（`tableLayout` 的 topBar/opponentLeft/opponentRight/playArea/actionButtons/playerHand）深相等不变；既有 T-LAYOUT3 的 16 断言 + T-LAYOUT2 全部断言**零改动全绿**；纯层不 import `cc`。

## 验收

- 种子全绿：`table-zones-v13.test.ts` 新增 T-LAYOUT4 三 it（名字牌分离/不压手牌/HUD 不撞立绘）+ 既有 16 断言 + `table-zones.test.ts` 全绿；typecheck + `git diff --check` 净。
- 报告附四横屏新 zone 数值表 + 名字牌/HUD/body 两两 `rectGap` 表（证明非重叠）。

## 交付物

分支提交 + 报告 → 提审 → 审查者按 `tasks/R-WAVE5.md` R:T-LAYOUT4 → approved 后合并（纯逻辑 lane 随到随合）。
