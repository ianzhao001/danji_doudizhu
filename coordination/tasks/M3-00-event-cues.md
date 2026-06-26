# M3-00 事件提示映射（GameEvent/FlowEvent → 动画/音效 cue）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/event-cues.ts`（新；`ui/` 纯逻辑岛，本文件**禁止 import `cc`**）
  - 可读不可改：`assets/scripts/game/**`（`GameEvent`）、`assets/scripts/flow/**`（`FlowEvent`）、`test/ui/**`
- 依赖：M2-01（`GameEvent`）/ M-FLOW（`FlowEvent`）已并 main
- 分支：`task/M3-00-event-cues`

## 背景
UI 消费事件播动画/音效，需要一个纯映射把 `GameEvent`/`FlowEvent` 转成 cue id（字符串），
后续 Cocos 组件按 cue 查表播。先做无 cc 纯映射，不接 Cocos。

## 行为要求（纯函数、确定性、禁 cc）
1. `CueId = string`（如 `'play'`/`'pass'`/`'bomb'`/`'rocket'`/`'reset'`/`'win'`/`'deal'`/`'bid'`/`'redeal'`/`'landlordDecided'`/`'settled'`）。
2. `cueForGameEvent(event: GameEvent): CueId`：按 `event.type` 返回同名 cue（`bomb`/`rocket` 区分）。
3. `cueForFlowEvent(event: FlowEvent): CueId | null`：`deal`/`bid`/`redeal`/`landlordDecided`/`settled` 返回同名；`round` 子事件透传 `cueForGameEvent(event.event)`。
4. 纯函数、禁 cc、不改入参。从 `../game` 取 `GameEvent`，从 `../flow` 取 `FlowEvent`（type-only 引用，避免循环依赖问题）。

## 验收（test/ui/event-cues.test.ts，架构种入·不可改）
- 各 `GameEvent.type` 映射到对应 cue（`bomb`→`'bomb'`、`rocket`→`'rocket'`、`play`→`'play'` 等）。
- `FlowEvent` 各 type 映射正确；`{type:'round', event}` 透传内部 `GameEvent` 的 cue。
- 同事件两次映射结果相同（确定性）。
- 入参不变。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
