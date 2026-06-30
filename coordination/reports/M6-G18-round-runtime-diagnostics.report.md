# M6-G18-round-runtime-diagnostics 实现报告

- 实现方标识：Codex
- 分支：`task/M6-G18-round-runtime-diagnostics`
- 状态：blocked（任务书要求与既有测试契约冲突；当前分支不可合并）

## 改了哪些文件
- `assets/scripts/flow/round-runtime.ts`
  - `RoundRuntime` 追加 `terminationDetail(): unknown`。
  - `terminateWithError(error)` 保留原始异常到私有字段，`terminationReason()` 行为不变。
  - replay 缓冲从仅 `deal` 扩展为 startup `deal` / `settled`。
  - replay 语义改为实时事件开始前注册的每个订阅者各收到一次缓冲事件；实时事件开始后关闭 replay。
- `test/flow/round-runtime-diagnostics.test.ts`（新）
  - 覆盖 `terminationDetail()` 返回原始异常。
  - 覆盖 resume-settled 首订阅者收到 `settled`。
  - 覆盖 fresh-start 每个订阅者恰收一次 `deal`，且不串入 `round`。

## 测试与类型检查输出
```
npm --prefix test test -- flow/round-runtime-diagnostics.test.ts flow/round-runtime-hardening.test.ts flow/round-runtime-exceptions.test.ts
Test Files  3 passed (3)
Tests       15 passed (15)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
<no output>

rg -n "from ['\"]cc['\"]" assets/scripts/flow/round-runtime.ts test/flow/round-runtime-diagnostics.test.ts
<no matches>
```

Full suite 当前阻塞：
```
npm --prefix test test
Test Files  1 failed | 128 passed (129)
Tests       1 failed | 634 passed (635)

FAIL  flow/runtime-resume-phases.test.ts > round-runtime resume phases > resumes an already settled round and emits onSettled exactly once
AssertionError: expected [ 'settled' ] to deeply equal []

test/flow/runtime-resume-phases.test.ts:143
expect(events).toEqual([]);
```

## 与 spec 的偏差 / 关键决策
- 无实现偏差；当前代码按任务书行为要求实现。
- 多订阅者 replay 选择任务书允许的「缓冲事件对每个在实时事件开始前注册的新订阅者各补发一次」。
- 未修改既有 `round-runtime*.test.ts`，遵守任务书「不可改既有 round-runtime 测试」和 PROTOCOL「测试是契约，不可改」。
- 阻塞点是契约冲突：
  - 任务书验收要求：resume-settled 首订阅者收到 `settled`。
  - 既有测试 `runtime-resume-phases.test.ts:143` 要求同一 resume-settled 场景订阅后 `events` 仍为 `[]`。
  - 在不修改既有测试、不弱化任务验收的前提下，两者无法同时满足。

## 疑问（给架构）
- 请裁决 resume-settled 的 `settled` 是否应进入 `onEvent` replay。
  - 若应进入 replay：需要架构更新既有 `runtime-resume-phases.test.ts` 的旧契约，再恢复本任务为可合并。
  - 若不应进入 replay：需要改写 M6-G18 任务书，去掉 resume-settled 首订阅者收到 `settled` 的验收项。

## 自检（对照验收项）
- [x] `terminationDetail()` 返回原始异常。
- [x] resume-settled 首订阅者收到 `settled`（新测试覆盖）。
- [x] fresh-start 每个订阅者恰一次 `deal`，且不串入 `round`。
- [x] `round-runtime-hardening` / `round-runtime-exceptions` 定向回归绿。
- [x] typecheck 无错。
- [x] 仅改声明文件域。
- [x] 未 import cc。
- [x] 未改 `flow/types.ts`。
- [x] 未改既有 round-runtime 测试。
- [ ] `npm --prefix test test` 全绿（被既有测试契约冲突阻塞）。
