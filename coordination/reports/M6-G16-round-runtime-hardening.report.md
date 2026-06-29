# M6-G16-round-runtime-hardening 实现报告

- 实现方标识：Codex
- 分支：`task/M6-G16-round-runtime-hardening`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/flow/round-runtime.ts`
  - 新增 `RuntimeConfig.maxTurns` / `maxRedeals`、`RoundRuntime.terminationReason()` 与 `RuntimeTerminationReason`。
  - `advanceUntilPause` 增加顶层错误边界、步数上限与 schedule `.catch`，AI 推进异常转 `disposed + terminationReason()='error'`。
  - `submitPlayerAction` 仅把 `IllegalActionError` 当作用户非法动作；非预期错误统一返回 `INTERNAL_ERROR`。
  - redeal 耗尽改为 `terminationReason()='redealExhausted'`，并消费可配置 `maxRedeals`。
  - 删除旧 `advancing`/`flowEvents` 累加器；`startDeal` 重置 `gameEvents`。
  - `emit` 增加订阅者隔离；`currentBidding()` 返回冻结副本；`persist` / `onSettled` 调用点增加 dispose 守卫。
  - 首个 `deal` 事件进入待重放队列，首订阅者可收到开局发牌 cue。
- `test/flow/round-runtime-hardening.test.ts`
  - 新增 9 个发布硬化测试，覆盖推进异常、步数上限、坏 bidding 不变量、redeal 耗尽、订阅隔离、只读 bidding、dispose 后跳过 persist/onSettled、正常 settled 终止原因。

## 测试与类型检查输出
```
npm --prefix test test -- flow/round-runtime-hardening.test.ts flow/round-runtime.test.ts flow/round-runtime-exceptions.test.ts flow/runtime-resume-phases.test.ts --testTimeout=60000
Test Files  4 passed (4)
Tests       20 passed (20)

npm --prefix test test -- --testTimeout=60000
Test Files  128 passed (128)
Tests       632 passed (632)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
no output

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/flow/round-runtime.ts test/flow/round-runtime-hardening.test.ts
no output
```

## 与 spec 的偏差 / 关键决策
- RR-1 部分偏差：已实现首个 `deal` 对首订阅者重放；未实现 resume-settled 的 `settled` 重放。
- 原因：现有不可改既有测试 `test/flow/runtime-resume-phases.test.ts` 明确断言 resume 到已结算局后再订阅 `onEvent` 不应收到事件（`events === []`）。直接实现 resume-settled 重放会使该既有契约失败；按 PROTOCOL 不修改/弱化既有测试，因此保留旧契约并将冲突写入报告，建议架构若确认产品需要 resume-settled cue，后续先更新该契约再派发小任务。
- RR-2/RR-10：AI 推进异常和非 `IllegalActionError` 统一转 `INTERNAL_ERROR`，不再把 `String(error)` 暴露为非法动作 reason。
- RR-3：删除 `advancing` 字段，保留“轮到 hero 即暂停”的既有推进不变量。
- RR-4/RR-7/RR-8/RR-9/RR-5/RR-6：均已在新测试中覆盖。

## 疑问（给架构）
- 是否要正式改变 resume-settled 的事件重放契约？如果要，请先调整 `runtime-resume-phases.test.ts` 中旧断言，再补一个只改 RR-1 settled replay 的后续任务。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
