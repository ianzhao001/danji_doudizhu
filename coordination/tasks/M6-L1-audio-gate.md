# M6-L1 audio-gate 决策纯函数（sound/animation/vibration 门控可测锚）

- 状态：**ready**（架构已 seed 失败测试 `test/ui/audio-gate.test.ts`）
- 派发模式：实现型 AI（worktree·`task/M6-L1`·纯逻辑·零 cc·可测）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/audio-gate.ts`（新建）
  - `assets/scripts/ui/index.ts`（桶导出 audio-gate）
- 依赖：无（复用 `data/settings.ts` 的 `Settings` + `ui/event-cues.ts` 的 `CueId`）
- 分支：`task/M6-L1`
- 测试：`test/ui/audio-gate.test.ts`（架构已提供，实现方只读·可新增不可改）

## 目标
抽出可测 audio-gate 决策表，代替 `game-scene-skeleton.playCue`（`:415-427`）的内联门控，作为 M6-C1 音效开关接线的纯逻辑锚点。

## 公共 API 契约（架构固定）
```ts
import type { Settings } from '../data/settings';
import type { CueId } from './event-cues';

export interface CuePlaybackDecision {
  sound: boolean;
  effect: boolean;
  vibrate: boolean;
}

export function decideCuePlayback(settings: Settings, cue: CueId): CuePlaybackDecision;
```

## 行为要求（测试已钉死·见 `audio-gate.test.ts`）
- `sound=false` → 任意 cue 的 `sound` 为 false。
- `animation=false` → 任意 cue 的 `effect` 为 false。
- `vibration=false` → 任意 cue 的 `vibrate` 为 false。
- 全开 + `bomb` → `{ sound:true, effect:true, vibrate:true }`。
- 动效 cue 集合 = `deal/play/bomb/rocket`（全开下 `effect=true`）；其余 cue（pass/win/settled/landlordDecided/redeal/bid/reset）`effect=false`（仅音效无整屏动效，与 `playEffect` 现状对齐）。
- 确定性：同 settings+cue 两次结果深相等。
- 零 `cc` import；纯函数。

## 验收
- `npm --prefix test test` 全绿（`audio-gate.test.ts` 转绿，现有 437 不退化）
- `npm --prefix test run typecheck` 无错
- 仅改声明的文件域；未 import `cc`

## 测试命令
`npm --prefix test test`

## 后续
M6-C1 编辑器轨消费本函数（playCue 改调 `decideCuePlayback`）。
