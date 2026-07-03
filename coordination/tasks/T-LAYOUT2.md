# T-LAYOUT2 — 横屏布局区契约重造（相位可见集 · 消灭 17 对重叠的纯层根基）

- 状态：ready
- 类型：纯逻辑（禁 import `cc`）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/table-zones.ts`（架构已落桩，实现函数体）
  - `assets/scripts/ui/table-layout.ts`（**仅允许**微调 `landscapeLayout` 内部数值为新 zone 腾空间；6 个旧字段与竖屏/无参契约**不得破坏**）
  - `coordination/reports/T-LAYOUT2.report.md`
  - **测试 `test/ui/table-zones.test.ts` 由架构种入（契约·不可改）**
- 依赖：—（Wave 1 并行）
- 分支：`task/T-LAYOUT2`
- worktree 缺 `temp/cli/tsconfig.cocos.json` 时：`mkdir -p temp/cli && cp /Users/admin/Documents/Cocos/斗地主/temp/cli/tsconfig.cocos.json temp/cli/`

## 背景（v1.2 规划书 §1-2）

游戏场景 y∈209–298 窄带塞 8 类元素、实测 17 对数值重叠（叫抢/出牌按钮同帧同 rect 最重）。根因：消费侧全靠 canvas-center 硬编码取点，layout 只有 6 个粗 region。本任务建立**全元素命名 zone + 按相位可见集互斥**的纯函数契约，P-G3② 消费。

## 行为要求（架构已落桩 `table-zones.ts`，实现到测试绿）

`tableZones(width, height): TableZones`，`TableZones extends TableRegions` 增 11 个 `Rect`：

| zone | 语义 | 关键约束（测试断言） |
|---|---|---|
| `infoStrip` | 地主/倍数/手牌数徽标带 | 在 topBar 之下、两座位之上（修 地主∩左家 / 手牌数∩右家） |
| `bottomCardsDock` | 3 张底牌展示位 | 横向居中（±40）、topBar 之下、dropZoneHero 之上 |
| `dropZoneLeft/Right` | 左/右家出牌落点 | 分别贴邻己方座位内侧（x 与座位隔 ≥8、y 中心差 ≤ 座位高） |
| `dropZoneHero` | 玩家出牌落点（中央） | 横向居中（±40） |
| `statusLine` | 状态/叫抢提示行 | dropZoneHero 之下、actionBar 之上 |
| `actionBar` | **叫抢按钮组与出牌按钮组共享**（相位互斥，同一时刻只渲染一组） | statusLine 之下、playerHand 之上 |
| `strengthMeter` | 手牌强度条 | actionBar 左侧翼（x 不相交） |
| `turnTimer` | 计时 | actionBar 右侧翼（x 不相交） |
| `memoryDock` | 记牌器收起态停靠 | 左半屏（centerX < w/2） |
| `advisorDock` | 建议开关/面板停靠 | 右半屏（centerX > w/2） |

- **相位可见集互斥**（测试核心）：`bidding 集`＝{topBar, infoStrip, opponentLeft/Right, bottomCardsDock, statusLine, actionBar, playerHand}；`playing 集`＝bidding 集 ∪ {dropZone×3, strengthMeter, turnTimer, memoryDock, advisorDock}。**各集合内两两间距 ≥8px**（rect gap，x 或 y 方向分离皆可）+ 全 zone 落屏内。四分辨率全过：844×390 / 812×375 / 915×412 / 780×360。
- **legacy 一致性**：`TableZones` 的 6 个旧字段必须与 `tableLayout(w,h)` 深相等（单一事实源；如需为 zone 腾空间，微调 `landscapeLayout` 数值——旧横屏测试只锁「纵向有序+不重叠」，允许调值）。
- 竖屏（h>w）与无参调用：`tableZones` 也须返回（zone 可按竖屏合理排布或退化堆叠），但**四横屏是验收主战场**；`tableLayout` 无参/390×844 固定契约一字不破。

## 验收
- 架构种入的 `test/ui/table-zones.test.ts` 转绿；既有 `table-layout*.test.ts` 全部零改动继续绿。
- `npm --prefix test test` 全绿 + `npm --prefix test run typecheck` 净。
- 报告附四分辨率 zone 坐标表（便于 P-G3② 消费与人审）。

## 不可做
不改测试；不碰 screen-view/组件；不 import `cc`；不动 `TableRegions` 旧字段定义。

## 交付物
分支提交 + `reports/T-LAYOUT2.report.md`；获 `approved` 后 `claim→merge→release`。
