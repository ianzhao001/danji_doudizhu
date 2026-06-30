# M3-68-screen-view-drop-cues 返工报告

- 实现方标识：Codex
- 分支：`task/M3-68-screen-view-drop-cues`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/screen-view.ts`
  - 移除 `ScreenVM.cues`。
  - 移除 `cueForFlowEvent` / `CueId` import 与 `recentEvents.map(...).filter(...)` 计算。
  - 按订正 spec 的 A 方案保留 `deriveScreenVM` args 里的 `recentEvents: FlowEvent[]` 类型入口，函数体不解构、不使用。
- `test/ui/screen-view.test.ts`
  - 移除 cues 相关断言。
  - 所有 `deriveScreenVM` 调用补 `recentEvents: []`，锁住 caller/callee 参数形状。

## 测试与类型检查输出
```
git merge main
Merge made by the 'ort' strategy.

npm --prefix test test
Test Files  131 passed (131)
Tests       645 passed (645)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
通过，无输出

cc import 护栏
rg -n "^\\s*import .*['\\\"]cc['\\\"]|from ['\\\"]cc['\\\"]" assets/scripts/ui/screen-view.ts test/ui/screen-view.test.ts
无命中
```

## 与 spec 的偏差 / 关键决策
- 采用订正任务书推荐 A：保留 `recentEvents` 入参类型，caller `game-scene-skeleton.ts` 零改，因此无需 Creator 编译证据。
- `recentEvents` 只作为兼容参数保留，不再参与 `ScreenVM` 派生；cue 播放仍由组件内独立 `playCue(event)` 路径处理。
- 未触碰 `game-scene-skeleton.ts`，也未触碰 `event-cues.ts`。
- 除 cues 相关断言外，screen-view 既有布局、按钮、叫分、结算、空态、不可变性覆盖保持。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] `ScreenVM` 不再暴露 `cues`
- [x] 去掉 `cueForFlowEvent` / `CueId` 依赖和 cues 映射
- [x] 保留 `recentEvents: FlowEvent[]` 参数，caller/callee 一致
- [x] caller `game-scene-skeleton.ts` 未改
- [x] full suite 全绿
- [x] typecheck 无错
- [x] 未 import cc
