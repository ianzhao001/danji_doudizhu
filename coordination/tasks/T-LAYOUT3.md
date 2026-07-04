# T-LAYOUT3 — 游戏内 UI 重造纯布局契约

- 状态：ready
- 类型：纯 UI 布局算法（无 `cc`）
- 文件域（只允许改这些）：
  - `assets/scripts/ui/table-zones.ts`
  - `test/ui/table-zones-v13.test.ts`
  - `coordination/reports/T-LAYOUT3.report.md`
- 依赖：ART-GAME-REMAKE 用户方向确认可并行；P-G4 接线依赖本任务
- 分支建议：`task/T-LAYOUT3`

## 目标

扩展 `TableZones`，把游戏内布局从“小控件压缩横屏”改成“大牌桌主舞台”：

- 三名角色立绘区：`heroBody`、`opponentLeftBody`、`opponentRightBody`
- 三名名字牌区：`heroNameplate`、`opponentLeftNameplate`、`opponentRightNameplate`
- 底部大手牌区：`heroHandLarge`
- 桌面行动区：`tableActionBar`
- v13 底牌托架：复用/调整 `bottomCardsDock`
- 结算展示区：`settlementShowcase`

## 布局契约

- 四横屏：844×390、812×375、915×412、780×360。
- 所有新增 zone 落屏且有正面积。
- 关键可见集不重叠，最小间距 8px；按钮触控区高度不小于 44px。
- 核心层级顺序：顶部信息/底牌托架在上，牌桌与角色在中，行动按钮悬在牌桌中下部，玩家手牌在底部，结算覆盖区居中。
- 保持 `tableLayout` legacy 6 字段兼容；新增 zone 只扩展 `TableZones`。

## 验收

- 新增失败测试先红后绿。
- `npm --prefix test test`、`npm --prefix test run typecheck`、`git diff --check` 全绿。
- 纯层不得 import `cc`。
