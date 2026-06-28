# M6-L3 table-layout 参数化 + 多分辨率不变量 sweep

- 状态：**ready**（架构已 seed 失败测试 `test/ui/table-layout-resolutions.test.ts`）
- 派发模式：实现型 AI（worktree·`task/M6-L3`·纯逻辑·零 cc·可测）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/table-layout.ts`（`tableLayout()` 参数化）
  - `assets/scripts/ui/screen-view.ts`（透传 containerWidth 给 tableLayout）
  - `test/ui/table-layout-resolutions.test.ts`（架构已提供）
- 依赖：无（复用现有 `tableLayout`/`LAYOUT_METRICS`/`PORTRAIT`）
- 分支：`task/M6-L3`

## 目标
`tableLayout()` 改为接受 `containerWidth/containerHeight` 按比例重算（对手座对称、出牌区居中、playerHand 贴底），加 320–414 多分辨率不变量 sweep。M6-C3 移动端编辑器轨消费此参数化结果。

## 公共 API 契约（架构固定·向后兼容）
```ts
// 无参仍返回 390×844 固定值（不破坏 table-layout.test.ts + table-layout-metrics.test.ts）
export function tableLayout(): TableRegions;
// 显式传宽高才走重算分支
export function tableLayout(containerWidth: number, containerHeight: number): TableRegions;
```

## 行为要求（测试已钉死·见 `table-layout-resolutions.test.ts`）
- **兼容性铁律**：`tableLayout()` 无参调用必须仍返回精确 390×844 固定值（`table-layout-metrics.test.ts` 用 `toEqual` 钉死）。实现方式：无参走固定 `LAYOUT_METRICS`；显式传参走按比例重算分支（且默认 390×844 传参时严格还原固定值）。
- 320/360/390/412/414 五档下：
  - 对手座左右关于 `w/2` 对称（`leftRightEdge` 与 `w-rightLeftEdge` 差 ≤2）。
  - playArea 横向居中（`playArea.x + width/2` 与 `w/2` 差 ≤2）。
  - playerHand 横向占满不溢出、贴底。
  - topBar 贴顶；actionButtons 在 playerHand 上方。
  - 各区在屏内、互不重叠。
- 确定性：同宽高两次深相等。
- 零 `cc` import；纯函数。

## 验收
- `npm --prefix test test` 全绿（`table-layout-resolutions.test.ts` 转绿，现有 table-layout/table-layout-metrics 不退化）
- `npm --prefix test run typecheck` 无错
- 仅改声明的文件域；未 import `cc`

## 测试命令
`npm --prefix test test`

## 后续
M6-C3 编辑器轨让渲染层消费 `tableLayout(containerWidth, containerHeight)`，去硬编码 390 坐标。
