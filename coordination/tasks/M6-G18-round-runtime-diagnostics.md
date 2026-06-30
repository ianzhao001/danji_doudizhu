# M6-G18 round-runtime 诊断可见性 + replay 盲区（发布硬化·审查转化·续 G16）

- 状态：changes-requested（首轮实现把 settled 纳入 replay 致 full suite 1 failed；契约裁定 settled **不**入 replay·撤销 #2·保留 #1/#3·见下「行为要求」与 BOARD「第十六批审查记录」）
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
2. ~~**replay 只捕获 `'deal'`，resume-settled 的 `'settled'` 丢失（LOW）**~~ —— **【2026-07-01 契约裁定：撤销，不做】**。原设想让 resume-settled 也 replay `'settled'`，但经裁决**不应**：replay 目的是补构造期 `'deal'` 以驱动初始渲染；重开**已结束**对局时再播一次胜负 cue 是错的；结算由 `settlement()`/`onSettled` 提供、不依赖事件流；且现行 save 仅在 enterPlaying 落盘（永不 settled），resume-settled 不可达。既有 `runtime-resume-phases.test.ts:143`（resume-settled → `events=[]`）是**正确契约**，保持不变。
3. **`onEvent` replay 单投递（LOW）**——[L227-235](assets/scripts/flow/round-runtime.ts#L227-L235)：首订阅者 splice 清空队列、置 `replayDelivered=true`，后续订阅者永不补发。`Set<subscriber>` 暗示多订阅者，但 replay 只服务第一个。当前单订阅者无影响，未来加 debug logger/测试探针会静默丢首发事件。

## 行为要求
1. **保留并暴露终止错误**（#1）：`terminateWithError` 不再丢弃 `error`——存入私有字段并新增访问器 `terminationDetail(): unknown`（`RoundRuntime` 接口追加，**additive 非破坏**；`'settled'`/正常终止时返回 `undefined`/`null`）。可另加一条 `console.warn`（非强制；注意 selfplay 海量跑局勿刷屏，倾向只存不打或 gate）。`terminationReason()` 行为不变。
2. **【撤销·见背景 #2 裁定】** `isReplayableStartupEvent` **只认 `'deal'`**，**不**纳入 `'settled'`。若已实现纳入 settled，请改回仅 `'deal'`——resume-settled 首订阅者维持 `events=[]`，不改既有测试。
3. **replay 多订阅者语义明确**（#3·保留）：要么改为「缓冲事件对每个在实时事件开始前注册的新订阅者各补发一次」，**要么**在代码内显式注释「replay 仅服务首订阅者，刻意单投递」——择一·实现方在测试/注释中言明决策。（执行方已实现的 `replayClosed` per-subscriber 机制在「仅 `'deal'`」下与既有测试兼容，可保留。）

## 验收
- `npm --prefix test test` **full suite 全绿**（含本任务新测试覆盖：error 路径下 `terminationDetail()` 返回原始异常；fresh-start 仍恰一次 `'deal'` 且不串入 round 事件）。**resume-settled 维持 `events=[]`**（既有 `runtime-resume-phases.test.ts` 不改且过）。⚠️ 上轮被打回正因 settled 入 replay 致 full suite 1 failed——务必跑全量而非仅定向。
- `npm --prefix test run typecheck` 无错。
- 仅改声明文件域；未 import `cc`；未改 `flow/types.ts`、未改既有 round-runtime 测试。
- G16 既有 RR-1..10 行为不回归（`round-runtime-exceptions.test.ts` 仍绿）。

## 测试命令
`npm --prefix test test`
