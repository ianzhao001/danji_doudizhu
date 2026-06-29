# M6-L6 收紧 CueId 为字面量联合 + cue 一致性绿护栏（第十批 · 优化任务书）

- 状态：**ready**（依赖均已在 main：M6-L1 audio-gate `97b0895`、M6-L2 animation-params `7d93e65`、event-cues 早已在 main）
- 派发模式：**纯逻辑 worktree**（禁 `cc`·Vitest·纯 spec：实现方自写测试 + 实现）
- 分支：`task/M6-L6-cue-id-union`（`git worktree add ../斗地主.worktrees/M6-L6 -b task/M6-L6-cue-id-union main`）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/event-cues.ts`（把 `CueId` 由 `string` 收紧为字面量联合）
  - `test/ui/cue-id-consistency.test.ts`（**新**·绿护栏）
  - `coordination/reports/M6-L6-cue-id-union.report.md`（报告）
- **不得改**：`ui/audio-gate.ts`、`ui/animation-params.ts`、`ui/screen-view.ts`（第九批刚并入，本任务靠「在源头收紧类型」让它们在 typecheck 期自动获益，无需触碰）

## 背景（验证侦察结论·必读）
第九批 L1/L2 合并后，架构验证发现一处**潜在脆性（latent·非 bug）**：

- `event-cues.ts:10` `export type CueId = string;` —— `CueId` 只是 `string` 别名，**零编译期保护**。
- `audio-gate.ts:10-11` 的 `EFFECT_CUES = new Set<CueId>(['deal','play','bomb','rocket'])`、`VIBRATION_CUES = new Set<CueId>(['bomb'])`，以及 `animation-params.ts:14` 的 `PULSE_SCALE` 键 `bomb/rocket/deal/play`，**全部是手写字符串字面量**。
- 因 `CueId=string`，**任何拼写错误（如 `'plya'`、`'boms'`）都能通过编译，且运行时 `Set.has(cue)` 永远 `false` → 对应音效/动效/震动被静默禁用**，无任何报错。当前这些字面量经人工核对**恰好全部正确**（见下「producible cue 全集」），但缺机制护住，后续改 cue 名极易漏改。

本任务在**源头**（`event-cues.ts`）把 `CueId` 收紧为字面量联合，让所有消费方（audio-gate / animation-params / screen-view）在 typecheck 期获得拼写保护，并加运行时绿护栏锁住「audio-gate / animation-params 引用的 cue 都是真能产出的 cue」。

## producible cue 全集（来自 cueForGameEvent / cueForFlowEvent · 已逐一核对）
- `cueForGameEvent(e)` 返回 `GameEvent.type` ∈ **{play, pass, bomb, rocket, reset, win}**（`game/types.ts:55-61`）。
- `cueForFlowEvent(e)`：`type==='round'` → 解包返回内层 `cueForGameEvent`；否则返回 `FlowEvent.type` ∈ **{deal, bid, redeal, landlordDecided, settled}**（`flow/types.ts:43-48`；`'round'` 永不作为 cue 输出）。
- ∴ **CueId 合法全集（11 个）** = `'play' | 'pass' | 'bomb' | 'rocket' | 'reset' | 'win' | 'deal' | 'bid' | 'redeal' | 'landlordDecided' | 'settled'`。

## 行为要求
1. **收紧类型**：`event-cues.ts` 把 `export type CueId = string;` 改为上述 11 个字面量的联合。
2. **保持函数返回类型一致**：`cueForGameEvent` 返回 `CueId`、`cueForFlowEvent` 返回 `CueId | null`。收紧后 `cueForGameEvent` 的 `return event.type`、`cueForFlowEvent` 非 `'round'` 分支的 `return event.type` 须**仍直接 typecheck 通过**（联合已覆盖全部 producible type；`'round'` 已被 if 守卫窄化排除）。若编译器报某 type 不在联合 → 说明全集遗漏，**补进联合**（而非把函数返回退回 `string`）。
3. **不放宽**：禁止用 `as CueId` / `as string` 兜底；禁止把 `CueId` 改回 `string`。若 audio-gate / animation-params 的某字面量因收紧而 typecheck 报错（即真存在拼写错误）→ **修那个字面量的拼写根因**（但因其在本任务文件域外，正常情况下不应触发；若触发请在 report 记录并联系架构，不要越域改）。
4. **新增绿护栏** `test/ui/cue-id-consistency.test.ts`：
   - 遍历每个 `GameEvent.type` 构造最小事件，`cueForGameEvent` 输出落在 11 个合法 CueId 集合内；同理覆盖 `FlowEvent` 各 type（含 `'round'` 解包、`'settled'`/`'deal'` 等）。
   - 锁 **audio-gate 引用真实**：`decideCuePlayback(settingsAllOn, cue)` 对 `'deal'/'play'/'bomb'/'rocket'` 返回 `effect:true`、对 `'bomb'` 返回 `vibrate:true`；对不在集合内的 cue（如 `'pass'`）返回 `effect:false`。借此锁定 EFFECT_CUES/VIBRATION_CUES 引用的是**真能产出**的 cue。
   - 锁 **animation 引用真实**：`pulseParams('deal'/'play'/'bomb'/'rocket')` 非 `null`、`pulseParams('pass')` 为 `null`。借此锁定 PULSE_SCALE 键是真 cue。
5. 零 `cc` import（ui 纯逻辑岛）。

## 验收
- `npm --prefix test test` 全绿（现有 462 + 新护栏；新增 ≥1 测试文件）。
- `npm --prefix test run typecheck` 无错——**关键**：收紧 `CueId` 后 audio-gate（`import type { CueId }`）在 typecheck 期受保护；若 audio-gate 内有拼写错误，typecheck 会**直接红**（这正是本任务要建立的保护）。
- `CueId` 在 main 上为 11 字面量联合，非 `string`。
- 纯逻辑层零 `cc` 不退化（grep `rules/game/ai/flow/data` + `ui/{event-cues,audio-gate,animation-params}` 仍零 cc）。
- `M6-L6-cue-id-union.report.md` 落盘（记收紧前后 CueId、新护栏断言、typecheck 净证据）。

## 测试命令
`npm --prefix test test` + `npm --prefix test run typecheck`
