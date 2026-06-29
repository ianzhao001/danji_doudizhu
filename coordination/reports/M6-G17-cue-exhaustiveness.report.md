# M6-G17-cue-exhaustiveness 实现报告

- 实现方标识：Codex
- 分支：`task/M6-G17-cue-exhaustiveness`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/event-cues.ts`
  - 新增 `AssertExtends` 类型层断言，强制 `GameEvent['type']` 与 `Exclude<FlowEvent['type'], 'round'>` 都必须包含在 `CueId` 内。
  - `cueForFlowEvent` 返回类型由 `CueId | null` 收紧为 `CueId`，与实现的非空行为对齐。
- `test/ui/cue-id-consistency.test.ts`
  - 保留既有一致性断言，补充 `FLOW_EVENTS.map(cueForFlowEvent)` 可直接赋值为 `CueId[]` 的类型/运行时护栏。

## 测试与类型检查输出
```
npm --prefix test test -- ui/cue-id-consistency.test.ts ui/event-cues.test.ts --testTimeout=60000
Test Files  2 passed (2)
Tests       9 passed (9)

npm --prefix test test -- --testTimeout=60000
Test Files  128 passed (128)
Tests       632 passed (632)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
no output

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/ui/event-cues.ts test/ui/cue-id-consistency.test.ts
no output
```

## 编译期护栏演示（未提交）
- 临时给 `GameEvent` 增加 `{ type: 'debug' }` 且不加入 `CUE_IDS` 后运行 `npm --prefix test run typecheck`，确认失败。
- 关键错误包含：
  - `assets/scripts/ui/event-cues.ts(28,17): error TS2344: Type ... "debug" ... does not satisfy the constraint ... CueId ...`
  - `assets/scripts/ui/event-cues.ts(33,3): error TS2322: Type ... "debug" ... is not assignable to type ... CueId ...`
- 已立即还原临时改动，最终 diff 只包含本任务允许文件。

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 保留 ADR-002 的 `CueId = (typeof CUE_IDS)[number]` 字面量联合设计，未改成事件类型派生。
- 未清理消费方恒假 `if (!cue) return;`，因为不在本任务文件域。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未弱化既有断言、未碰 main / 他人模块
- [x] 未 import cc
