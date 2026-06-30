# M6-G18 round-runtime 诊断可见性 + replay 盲区（发布硬化·审查转化·续 G16）

- 状态：ready（纯逻辑·无依赖·可即认领）
- 派发模式：**纯 spec**（架构只出任务定义；实现方自写 vitest 测试 + 实现，同 G16/G17）
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/round-runtime.ts`
  - 新 `test/flow/round-runtime-diagnostics.test.ts`（可加；**不可改**既有 `round-runtime*.test.ts`）
  - 如需扩 `RoundRuntime` 接口：仅 `flow/round-runtime.ts` 内追加方法签名，**不碰 `flow/types.ts`**（与 G16 同纪律）
- 依赖：无（G16/G17 已并 main）
- 分支：`task/M6-G18-round-runtime-diagnostics`
- 来源：M6-editor 第三轮审查 round-runtime 三项（RR-诊断/replay 盲区）
- 禁 `cc` import（flow 纯逻辑层）

## 背景（审查发现·已核实）
G16 用「终止相位 + `terminationReason()`」暴露异常，但仍有三处可见性/完整性缺口：

1. **`terminateWithError` 吞掉错误详情（MEDIUM）**——[round-runtime.ts:414-418](assets/scripts/flow/round-runtime.ts#L414-L418)：参数 `_error: unknown` 整个丢弃，无诊断痕迹、无错误链。`terminationReason()` 只返回 `'error'`，消费方拿不到原始异常，生产环境 AI 决策/`applyStep` 抛错后无法事后排查。
2. **replay 只捕获 `'deal'`，resume-settled 的 `'settled'` 丢失（LOW）**——入队条件 [L330-337](assets/scripts/flow/round-runtime.ts#L330-L337) 限定 `event.type === 'deal'`；resume-settled 路径在构造期 `finishIfSettled()`（[L140](assets/scripts/flow/round-runtime.ts#L140)）同步 emit `'settled'`（[L405](assets/scripts/flow/round-runtime.ts#L405)），此时 `subscribers` 为空且非 `'deal'`→ 不入队 → 首订阅者收不到 → settled cue（音效/动画）在 resume-settled 时丢失。功能不破（`settlement()`/`onSettled` 兜底），replay 机制有盲区。
3. **`onEvent` replay 单投递（LOW）**——[L227-235](assets/scripts/flow/round-runtime.ts#L227-L235)：首订阅者 splice 清空队列、置 `replayDelivered=true`，后续订阅者永不补发。`Set<subscriber>` 暗示多订阅者，但 replay 只服务第一个。当前单订阅者无影响，未来加 debug logger/测试探针会静默丢首发事件。

## 行为要求
1. **保留并暴露终止错误**（#1）：`terminateWithError` 不再丢弃 `error`——存入私有字段并新增访问器 `terminationDetail(): unknown`（`RoundRuntime` 接口追加，**additive 非破坏**；`'settled'`/正常终止时返回 `undefined`/`null`）。可另加一条 `console.warn`（非强制；注意 selfplay 海量跑局勿刷屏，倾向只存不打或 gate）。`terminationReason()` 行为不变。
2. **replay 覆盖构造期同步 emit**（#2）：放宽入队条件，使构造函数内（subscribers 为空时）同步 emit 的事件都被缓冲补发——`'deal'`（fresh）与 `'settled'`（resume-settled）均覆盖。**不得回归**：fresh-start 仍恰好补发一次 `'deal'`；缓冲事件非 `'round'` 类型，**不得**影响任何 `fullGameEvents` 语义（见 M3-56 不变量）。
3. **replay 多订阅者语义明确**（#3）：要么改为「缓冲事件对每个在实时事件开始前注册的新订阅者各补发一次」，**要么**在代码内显式注释「replay 仅服务首订阅者，刻意单投递」——择一·实现方在测试/注释中言明决策。

## 验收
- `npm --prefix test test` 全绿（含本任务新测试覆盖：error 路径下 `terminationDetail()` 返回原始异常；resume-settled 首订阅者收到 `'settled'`；fresh-start 仍恰一次 `'deal'` 且不串入 round 事件）。
- `npm --prefix test run typecheck` 无错。
- 仅改声明文件域；未 import `cc`；未改 `flow/types.ts`、未改既有 round-runtime 测试。
- G16 既有 RR-1..10 行为不回归（`round-runtime-exceptions.test.ts` 仍绿）。

## 测试命令
`npm --prefix test test`
