# T-A1 tableLayout 横屏几何

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/table-layout.ts`（`ui/` 纯逻辑岛，**禁止 import `cc`**）
  - 可读不可改：`test/ui/**`（架构已在 `task/T-A1` 分支种入失败测试 `test/ui/table-layout-landscape.test.ts`）
- 依赖：T-DOC ✅（已并 main，按新协议 `claim/merge/release` 自合）
- 分支：`task/T-A1`

## 背景（关联规划书 §1、§6 T-A1）

横屏化的几何底座。当前 `tableLayout(w,h)` 的响应式分支高度 clamp 是为竖屏 H≈844 调的；横屏 H≈390 时手算三区互压：`playArea 176..316` / `actionButtons 170..234` / `playerHand 250..390`（844×390，780×360 同样互压）。本任务让 `tableLayout` 在**横屏（`width>=height`）**下产出纵向有序、互不重叠、对手贴左右上角、出牌区居中、手牌铺底的布局。

## 公共 API 契约（不变）
- 保持现有签名 `tableLayout(): TableRegions` 与 `tableLayout(w,h): TableRegions`、`TableRegions`/`Rect` 类型不变。
- 可新增导出 `LANDSCAPE = { width: 844, height: 390 }` 常量（供消费方/测试引用）。

## 行为要求（纯函数、确定性、禁 cc）
1. **入口按 `width >= height` 分流**到横屏算法；`width < height` 走现有竖屏响应式分支，**一字不改**。
2. **无参 `tableLayout()` 与 `tableLayout(390,844)` 固定契约不变**（`test/ui/table-layout.test.ts` + `table-layout-metrics.test.ts` 用 `toEqual` 钉死，必须继续绿）。
3. **旧 portrait sweep 不变**（`table-layout-resolutions.test.ts` 的 5 档竖屏必须继续绿）。
4. 横屏布局满足（新失败测试锁定）：
   - **纵向顺序**（y 向下）：`topBar` → `opponentLeft/Right` → `playArea` → `actionButtons` → `playerHand`，两两**不重叠**。
   - `opponentLeft`/`opponentRight` 关于中线 `width/2` 镜像对称，且落在**上部**（`opponent.y` 较小，贴近 topBar 下方左右角）。
   - `playArea` 横向居中（中心 ≈ `width/2`）。
   - `playerHand` 横向铺满不溢出（`x>=0`、`x+width<=width`），且**贴底**（`y+height` 接近 `height`）。
   - 全部区在 `[0,width]×[0,height]` 内。
5. 坐标取整，避免浮点抖动。

## 验收（`test/ui/table-layout-landscape.test.ts` 架构种入·不可改）
- 覆盖横屏档：`844×390`、`812×375`、`915×412`、`780×360`，逐档断言纵向顺序 + 不重叠 + 对手镜像上角 + playArea 居中 + playerHand 贴底铺满。
- 确定性：同宽高两次调用深相等。
- `npm --prefix test test` 全绿（含本任务测试 + 所有既有竖屏测试）；`npm --prefix test run typecheck` 无错；未 import `cc`。

## 交付物
- 分支 `task/T-A1` 提交；`coordination/reports/T-A1.report.md`。
- 获架构 `approved` 后按新协议 `claim → merge → release` 自合。

## 测试命令
`npm --prefix test test`
