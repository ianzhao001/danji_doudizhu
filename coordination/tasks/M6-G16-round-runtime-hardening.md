# M6-G16 round-runtime 生命周期/错误边界硬化（发布硬化·三方审查转化）

- 状态：**ready**（`flow/round-runtime.ts` 已在 main；纯逻辑·可 Vitest）
- 派发模式：纯逻辑 worktree · **禁 import cc** · 改产品码 + 自写测试
- 分支：`task/M6-G16-round-runtime-hardening`
  （`git worktree add ../斗地主.worktrees/M6-G16 -b task/M6-G16-round-runtime-hardening main`，进入后 `npm --prefix test install`）
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/round-runtime.ts`
  - `test/flow/round-runtime-hardening.test.ts`（**新增**·自写）
  - 既有 `test/flow/round-runtime-exceptions.test.ts`（**可加用例，不得改/弱化既有断言**）
  - `coordination/reports/M6-G16-round-runtime-hardening.report.md`
- 依赖：无
- 背景：三方审查对 `round-runtime.ts` 的 10 项发现，架构核实后采纳（详见对话裁决表 RR-1..RR-10）。

## 设计约束（架构已拍板·实现方须遵守）
- **诊断不走新 FlowEvent/cue**。redeal 耗尽 / 推进异常等用「终止相位 + 只读 `terminationReason()` 访问器」暴露，**不新增** `FlowEvent` 成员，也**不改** `event-cues.ts`/`CUE_IDS`/一致性测试——避免触动 `flow/types.ts` 契约与 cue 跨文件不变量（该不变量由 M6-G17 另行加固）。本任务文件域因此严格收敛在 `round-runtime.ts` 内。
- 既有对外行为（`phase()` 取值集、`submitPlayerAction` 对**合法/非法用户动作**的 `{ok}` 语义、resume/settle 路径、headless 无关）**不得回归**；`round-runtime.test.ts`/`runtime-resume-phases.test.ts`/`round-runtime-exceptions.test.ts` 须保持全绿。

## 公共 API 契约（在 round-runtime.ts 内新增/调整）
```ts
export interface RuntimeConfig {
  // ...既有字段不变...
  maxRedeals?: number; // 新增·默认 10（与 headless FlowConfig 对齐）
}

export interface RoundRuntime {
  // ...既有方法不变...
  /** 终止原因；运行中为 null。'settled'=正常结算；'redealExhausted'=叫抢死局重发耗尽；'error'=推进/应用阶段异常已被边界捕获。 */
  terminationReason(): 'settled' | 'redealExhausted' | 'error' | null;
}
```

## 行为要求（按裁决项编号·测试钉死）
1. **RR-2 错误边界 + 语义对称**：`advanceUntilPause` 加顶层 try/catch，捕获后转终止（`phase()==='disposed'`、`terminationReason()==='error'`）而非抛出；`scheduleAdvance` 补 `.catch`（**不得产生 unhandled rejection**）。`submitPlayerAction` 把 L195 的推进阶段纳入统一通道：推进异常使其 `resolve` 为 `{ ok:false, error:{ reason } }`（或显式 re-throw 通道），与玩家动作错误语义一致——**不得**让 submit 因 AI 推进异常而 reject。
2. **RR-10 不吞编程错误**：`submitPlayerAction` 的 catch 仅对 `IllegalActionError` 返回 `{ok:false, error:{reason: error.reason}}`；其余意外异常**不得**降级为 `String(error)` 当作"非法动作原因"——转 `terminationReason()==='error'` + 结构化诊断（reason 可用稳定标记如 `'INTERNAL_ERROR'`），便于区分规则非法与 bug。
3. **RR-4 推进步数上限**：`advanceUntilPause` 的 `while` 加步数上限（与 headless `maxTurns` 对齐，默认 300），超限转 `disposed` + `terminationReason()==='error'`，**不得**自旋。`enterPlaying` 的不变量 guard（`landlord===null` 等）命中时**不得静默 `return`**，须转错误终止（保证 `bidding.phase==='done' && landlord===null` 这类违例可观测、不死循环）。
4. **RR-7 redeal 耗尽可观测 + 可配**：消费新增 `maxRedeals`（默认 10）；超限时转 `disposed` + `terminationReason()==='redealExhausted'`（区别于正常 `'settled'`）。
5. **RR-8 订阅者隔离**：`emit` 扇出对**每个** subscriber 独立 try/catch，单个订阅者抛错**不得**阻断后续订阅者，异常吞掉或走诊断、**不得**沿 `emit→advanceUntilPause` 升级为 unhandled rejection。
6. **RR-9 只读 bidding**：`currentBidding()` 返回**只读副本**（结构化 clone 或 `Object.freeze` 视图），调用方改写不得污染内部 `this.bidding`。
7. **RR-3 死字段清理**：删除从不被读取的 `advancing` 字段（或将其落实为真正的串行互斥）。默认取**删除** + 用断言/注释固化「轮到 hero 即推进已暂停」不变量；若选保留则 `submitPlayerAction` 须 `await` 在飞推进后再执行。
8. **RR-6 死状态/潜在污染**：删除从不被读取、永不清空的 `flowEvents` 累加器；`redeal`/`startDeal` 路径**显式重置** `gameEvents`（与 `state`/`bidMultiplier` 重置对齐），消除"叫抢阶段未来产出 GameEvent 即污染 settle"的 latent 隐患。
9. **RR-5 dispose 守卫**：`enterPlaying` 的 `persist?.()` 与 `finishIfSettled` 的 `onSettled?.()` 调用点补 `isDisposed()` 守卫——dispose 之后不得再触发持久化/结算回调。
10. **RR-1（低）首事件可达**：构造期发出的首 `deal`（及 resume-settled 的 `settled`）入「待重放」队列，在**首个** `onEvent` 订阅时补发，使首订阅者能收到开局发牌事件（用于首发牌 cue）。**不得**改动 UI 既有轮询渲染路径。

## 验收
- `npm --prefix test test`（含本任务自写测试）**全绿**；既有 `round-runtime*.test.ts`/`runtime-resume-phases.test.ts` 零回归。
- `npm --prefix test run typecheck` 无错；`grep "from 'cc'"` 在 `round-runtime.ts` **零命中**。
- 自写测试须覆盖（确定性·可注入 `bidPolicy`/`playPolicy`/`clock` 制造场景）：
  - 注入抛错 `playPolicy`，hero submit 后的 AI 推进异常 → submit `resolve` 为 `{ok:false}` 且**无** unhandled rejection（RR-2）；非 `IllegalActionError` 不被当 reason 透出、`terminationReason()==='error'`（RR-10/RR-2）。
  - 构造 `bidding.phase==='done' && landlord===null` 或等价违例 → 不死循环、转 error 终止（RR-4）。
  - `maxRedeals` 生效、耗尽 → `terminationReason()==='redealExhausted'`（RR-7）。
  - 两订阅者、首个抛错 → 第二个仍收到事件（RR-8）。
  - `currentBidding()` 返回值被改写后内部状态不变 / 冻结（RR-9）。
  - dispose 后不再调用 `persist`/`onSettled`（RR-5·用注入回调计数断言）。
  - 首订阅者能收到首 `deal` 事件（RR-1）。
- report：注明未 import cc、未碰其它模块、`git diff --check` 无输出、列出每条 RR 的实现与对应测试。

## 测试命令
`npm --prefix test test -- --testTimeout=60000` 与 `npm --prefix test run typecheck`
