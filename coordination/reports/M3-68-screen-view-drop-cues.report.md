# M3-68-screen-view-drop-cues 实现报告

- 实现方标识：Codex
- 分支：`task/M3-68-screen-view-drop-cues`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/screen-view.ts`
  - 移除 `ScreenVM.cues`。
  - 移除 `deriveScreenVM` 入参 `recentEvents`。
  - 移除对 `FlowEvent`、`event-cues`、`cueForFlowEvent` 的依赖。
- `test/ui/screen-view.test.ts`
  - 按新契约移除 `recentEvents` 入参和 `vm.cues` 断言。
  - 保留布局、按钮、叫分、结算、空态、不可变性等既有断言。

## 测试与类型检查输出
```
npm --prefix test test -- ui/screen-view.test.ts
Test Files  1 passed (1)
Tests       6 passed (6)

npm --prefix test run typecheck
tsc --noEmit

npm --prefix test test
Test Files  128 passed (128)
Tests       632 passed (632)

git diff --check
<no output>

rg -n "from ['\"]cc['\"]" assets/scripts/rules assets/scripts/game assets/scripts/ai assets/scripts/flow assets/scripts/data assets/scripts/ui/screen-view.ts
<no matches>
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `recentEvents` 在 `screen-view.ts` 内已无消费方，因此按任务书要求从 `deriveScreenVM` 签名中移除。
- 未改 `event-cues.ts`，该模块仍保留给其他直接消费者。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] `ScreenVM` 不再暴露 `cues`。
- [x] `deriveScreenVM` 不再依赖 `FlowEvent` / `cueForFlowEvent`。
- [x] `screen-view.test.ts` 不再断言 cue 映射。
- [x] 全量测试绿。
- [x] typecheck 无错。
- [x] 仅改声明文件域。
- [x] 未 import cc。
