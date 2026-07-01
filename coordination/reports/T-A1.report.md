# T-A1 实现报告

- 实现方标识：Codex
- 分支：`task/T-A1`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/table-layout.ts`

## 测试与类型检查输出
```
npm --prefix test test -- ui/table-layout-landscape.test.ts ui/table-layout.test.ts ui/table-layout-metrics.test.ts ui/table-layout-resolutions.test.ts
# Test Files  4 passed (4)
# Tests       20 passed (20)

npm --prefix test test
# Test Files  134 passed (134)
# Tests       659 passed (659)

npm --prefix test run typecheck
# tsc --noEmit
# 通过
```

## 合并证据（approved 后由执行者回填）
- 合并前回归：
  - `npm --prefix test test`：
  - `npm --prefix test run typecheck`：
- merge commit：
- BOARD 状态：

## 与 spec 的偏差 / 关键决策
- 新增 `LANDSCAPE = { width: 844, height: 390 }`。
- 保持无参 `tableLayout()` 与 `tableLayout(390,844)` 固定契约不变。
- 在 `width >= height` 时进入横屏分支；竖屏响应式分支未改。
- 横屏分支按短高重新压缩 `topBar/opponent/playArea/actionButtons/playerHand`，保证 844×390、812×375、915×412、780×360 下纵向有序且互不重叠。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 横屏红测转绿
- [x] 旧竖屏固定契约与 portrait sweep 继续绿
- [x] 全量测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域 + 本任务报告
- [x] 未改测试、未碰他人模块
- [x] 未 import cc
