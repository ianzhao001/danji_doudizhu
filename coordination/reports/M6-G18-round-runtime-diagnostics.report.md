# M6-G18-round-runtime-diagnostics 返工报告

- 实现方标识：Codex
- 分支：`task/M6-G18-round-runtime-diagnostics`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/flow/round-runtime.ts`
  - 保留 `RoundRuntime.terminationDetail(): unknown`。
  - 保留 `terminateWithError(error)` 记录原始异常，`terminationReason()` 行为不变。
  - 按契约裁定回退 replay 范围：`isReplayableStartupEvent(...)` 仅返回 `event.type === 'deal'`，不再 replay `settled`。
  - 保留 `replayClosed` per-subscriber 机制：实时事件开始前，每个订阅者都可收到 startup `deal` replay；实时事件开始后关闭 replay。
- `test/flow/round-runtime-diagnostics.test.ts`
  - 保留 `terminationDetail()` 返回原始异常覆盖。
  - 将 resume-settled 用例改为裁定后的契约：`settlement()` 可读，但 `onEvent` 不 replay `settled`，事件数组保持 `[]`。
  - 保留 fresh-start 每个订阅者恰收一次 `deal` 且不串入 `round`。

## 测试与类型检查输出
```
git merge main
Merge made by the 'ort' strategy.

npm --prefix test test
Test Files  132 passed (132)
Tests       648 passed (648)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
通过，无输出

cc import 护栏
rg -n "^\\s*import .*['\\\"]cc['\\\"]|from ['\\\"]cc['\\\"]" assets/scripts/flow/round-runtime.ts test/flow/round-runtime-diagnostics.test.ts
无命中
```

## 与 spec 的偏差 / 关键决策
- 已按更新后的任务书和 BOARD「第十六批审查记录」裁决执行：resume-settled 的 `settled` 不进入 onEvent replay，既有 `runtime-resume-phases.test.ts:143` 保持不改且 full suite 通过。
- 撤销首轮新增的 settled replay；保留 #1 `terminationDetail()` 和 #3 per-subscriber startup replay。
- 未修改 `flow/types.ts`。
- 未修改既有 `round-runtime*.test.ts` / `runtime-resume-phases.test.ts`；只调整本任务新增 diagnostics 测试。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] full suite 全绿
- [x] typecheck 无错
- [x] resume-settled 维持 `events=[]`
- [x] `terminationDetail()` 返回原始异常
- [x] fresh-start 每个订阅者恰一次 `deal`，且不串入 `round`
- [x] 未改既有 round-runtime 测试
- [x] 未碰 `flow/types.ts`
- [x] 未 import cc
