# M6-L3-table-layout-resolutions 实现报告

- 实现方标识：Codex
- 分支：`task/M6-L3`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/table-layout.ts`：为 `tableLayout()` 增加显式宽高重算分支；无参和显式 390x844 保持原固定契约。
- `assets/scripts/ui/screen-view.ts`：`layoutOpts.containerHeight` 可选透传；未传时仍使用旧固定布局。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  86 passed (86)
Tests       444 passed (444)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed

rg "^import .*['\"]cc['\"]" ...
no matches
```

## 与 spec 的偏差 / 关键决策
- 为兼容既有 `screen-view` 调用，`containerHeight` 设计为可选；未来 C3 传入画布高后才启用参数化 tableLayout。
- 显式 390x844 直接回固定布局，避免破坏既有精确像素断言。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
