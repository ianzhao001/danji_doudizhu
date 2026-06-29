# M6-G17 cue 映射编译期穷尽断言 + 签名诚实化（发布硬化·三方审查转化）

- 状态：**ready**（`event-cues.ts` 已在 main·M6-L6 已将 CueId 收紧为字面量联合）
- 派发模式：纯逻辑 worktree · **禁 import cc** · 改产品码 + 改护栏测试
- 分支：`task/M6-G17-cue-exhaustiveness`
  （`git worktree add ../斗地主.worktrees/M6-G17 -b task/M6-G17-cue-exhaustiveness main`，进入后 `npm --prefix test install`）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/event-cues.ts`
  - `test/ui/cue-id-consistency.test.ts`（扩展·**不得弱化既有断言**）
  - `coordination/reports/M6-G17-cue-exhaustiveness.report.md`
- 依赖：无（与 M6-G16 文件域不相交；G16 已明确**不**新增 FlowEvent/cue，故二者可并行）
- 背景：三方审查 EC-1（缺**显式**编译期穷尽断言，仅靠一致性测试兜底）+ EC-3（`cueForFlowEvent` 的 `| null` 是死分支、签名误导）。架构核实后采纳 EC-1/EC-3；**驳回 EC-2**（字面量联合 CueId 下 `return event.type` 对新增事件类型已在 tsc 报 TS2322，非"静默"——已编译验证）。

## 设计约束（架构已拍板）
- **遵循 ADR-002**：保留 `CueId = (typeof CUE_IDS)[number]` 字面量联合 + 一致性测试，**不**改写成从事件类型派生的 `type CueId = GameEvent['type'] | ...`（保留 cue 词汇与事件类型解耦的设计意图）。本任务只**新增编译期断言**把"运行时一致性测试才暴露"提前到"tsc 阶段强制"。

## 行为要求
1. **EC-1 编译期穷尽断言**：在 `event-cues.ts` 加类型层断言，使
   `GameEvent['type'] ⊆ CueId` 且 `Exclude<FlowEvent['type'], 'round'> ⊆ CueId`
   在 `tsc --noEmit` 阶段被强制——任一事件联合新增了未同步到 `CUE_IDS` 的成员时**编译失败**（而非仅一致性测试红）。参考实现（实现方可等价替换）：
   ```ts
   type AssertExtends<A extends B, B> = A;
   // 任一不成立则下面两行 tsc 报错：
   type _GameCues = AssertExtends<GameEvent['type'], CueId>;
   type _FlowCues = AssertExtends<Exclude<FlowEvent['type'], 'round'>, CueId>;
   ```
2. **EC-3 签名诚实化**：`cueForFlowEvent` 现实现所有分支均非 null（`'round'` 委派 `cueForGameEvent` 永不为 null，其余 `return event.type`）。将返回类型由 `CueId | null` 收紧为 `CueId`，使签名与实现一致、消除死分支。
   - 注：消费方 `ui/components/game-scene-skeleton.ts` 的 `if (!cue) return;` 守卫会因此变为恒假的死代码，但**不报错、不在本任务文件域**——留待后续 UI 精修清理，本任务**不得**改该文件。
3. `cueForGameEvent` 行为不变（恒等映射保持）。

## 验收
- `npm --prefix test test`（含扩展后的 `cue-id-consistency.test.ts`）**全绿**；既有断言零弱化。
- `npm --prefix test run typecheck` 无错；`event-cues.ts` 零 `from 'cc'`。
- report 中**演示**（勿提交该改动）：临时给 `GameEvent` 或 `FlowEvent` 加一个未同步 `CUE_IDS` 的成员 → `tsc` 在 `event-cues.ts` 的断言处报错，证明编译期护栏生效。
- report：注明未 import cc、未碰其它模块、`git diff --check` 无输出。

## 测试命令
`npm --prefix test test` 与 `npm --prefix test run typecheck`
