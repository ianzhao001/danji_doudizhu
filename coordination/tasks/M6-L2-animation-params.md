# M6-L2 animation-params 纯映射表（cue→tween 参数可测锚）

- 状态：**ready**（架构已 seed 失败测试 `test/ui/animation-params.test.ts`）
- 派发模式：实现型 AI（worktree·`task/M6-L2`·纯逻辑·零 cc·可测）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/animation-params.ts`（新建）
  - `assets/scripts/ui/index.ts`（桶导出 animation-params）
- 依赖：无（纯参数表；可参考 `ui/hand-interaction.ts` slot 坐标作飞入目标）
- 分支：`task/M6-L2`
- 测试：`test/ui/animation-params.test.ts`（架构已提供）

## 目标
把 `game-scene-skeleton.playEffect`（`:429-436`）内联的 scaleUp/durationMs 抽成纯参数表，并补 deal 飞入延迟/出牌飞入 from-to，作为 M6-C2 基础动画接线的纯逻辑锚点。

## 公共 API 契约（架构固定）
```ts
export interface PulseParams { scaleUp: number; upMs: number; downMs: number; }
export function pulseParams(cue: string): PulseParams | null;

export function dealCardDelay(index: number, total: number): number; // ms
export interface FlyFromTo { fromY: number; toY: number; durationMs: number; }
export function playFlyFromTo(): FlyFromTo;
```

## 行为要求（测试已钉死·见 `animation-params.test.ts`）
- `pulseParams('bomb')`/`('rocket')` → `scaleUp: 1.12`。
- `pulseParams('deal')`/`('play')` → `scaleUp: 1.04`。
- 所有动效 cue 的 `upMs+downMs ≤ 300`（与现有 0.1+0.16=260ms 对齐，留余量）；`upMs>0`、`downMs>0`。
- 非动效 cue（pass/win/settled/landlordDecided/redeal/bid/reset）→ `null`。
- `dealCardDelay(index,total)`：单调非负、`index=0` 返回 0、index 递增延迟递增。
- `playFlyFromTo()`：`fromY < toY`（从下方飞入到槽位）、`durationMs > 0`。
- 确定性：同 cue 两次 `pulseParams` 深相等。
- 零 `cc` import；纯函数。

## 验收
- `npm --prefix test test` 全绿（`animation-params.test.ts` 转绿）
- `npm --prefix test run typecheck` 无错
- 仅改声明的文件域；未 import `cc`

## 测试命令
`npm --prefix test test`

## 后续
M6-C2 编辑器轨消费本表（playEffect 参数改喂 `pulseParams` + deal 飞入用 `dealCardDelay` + 出牌飞入用 `playFlyFromTo`）。

## 桶导出冲突注意
本任务与 M6-L1 都改 `assets/scripts/ui/index.ts` 桶（各加一行 `export *`）。两者可并行写，但**必须串行 merge**（第二个 rebase 到第一个之上）——架构在 merge 阶段协调，实现方各自只加自己的导出行即可。
