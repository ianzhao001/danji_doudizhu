# T-DEDUP — 跨模块重复定义归一（key 漂移=静默降难度的隐雷）

- 状态：ready
- 类型：纯逻辑 + 两组件机械 import 替换
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/storage-keys.ts`（架构已落桩，实现）
  - `assets/scripts/data/settings.ts`、`assets/scripts/data/difficultyConfig.ts`（共用同一 `isAiLevel`——放 `settings.ts` 导出或新小模块均可，二选一消灭重复）
  - `assets/scripts/ai/handStrength.ts`、`assets/scripts/ai/cardMemory.ts`（rank 数组归一为单一导出源，**顺序语义各自保持**）
  - `assets/scripts/ui/components/game-scene-skeleton.ts`、`lobby-scene.ts`（**仅** `doudizhu.*` 字面量 → import `STORAGE_KEYS`，约 7 行）
  - `coordination/reports/T-DEDUP.report.md`
  - **测试 `test/data/storage-keys.test.ts` 由架构种入（不可改）**；`test/selfplay/difficulty.ts` 的 `buildRoutingPolicy` 改造**由架构完成**（已在分支种好），执行者不碰
- 依赖：—（Wave 1 并行；**merge lane 排第一**——先合可消除 key 漂移风险且为两巨组件替换赶在 P-G3/P-L3 建分支前）
- 分支：`task/T-DEDUP`
- worktree 缺 tsconfig 同 T-LAYOUT2 处理。

## 背景（v1.2 规划书 §1-5）

`'doudizhu.settings'` 等 4 个存储键在两巨组件重复 7 处字面量——任何一处漂移，游戏静默读默认值降级普通难度；`isAiLevel` 两份、rank 数组两份；hard.ts 的 cardKey 重复归 T-AI-1 顺手改（**本任务不碰 ai/levels/**）。

## 行为要求
1. `storage-keys.ts` 导出 `STORAGE_KEYS = { settings: 'doudizhu.settings', save: 'doudizhu.save', stats: 'doudizhu.stats', records: 'doudizhu.records' } as const`；两组件字面量全部替换为 import（值不变=行为零变化）。
2. `isAiLevel` 归一为一处导出，`difficultyConfig.ts` 复用（回退 Normal 行为不变）。
3. rank 数组：`handStrength.ts` 的 `ALL_RANKS` 与 `cardMemory.ts` 的 `RANKS` 归一为单一导出（注意二者当前顺序/内容是否完全一致——如不一致，**保持各自语义**并在 report 说明，不强行合并）。
4. **禁止**合并 `game-scene-skeleton.ts:101` 的 `cardsSignature`（顺序敏感·动画 diff 用）与 hint 侧排序签名——语义不同。

## 验收
- 架构种入测试转绿；`grep -rn "doudizhu\." assets/scripts --include=*.ts` 仅命中 `storage-keys.ts`；全量 vitest + typecheck 净；四横屏一屏冒烟（设置读写/难度选择不回归——执行者自测 CDP 一张 lobby 截图即可）。

## 不可做
不碰 `ai/levels/**`；不改键值本身；不改测试。

## 交付物
分支提交 + report；获 `approved` 后 `claim→merge→release`（**lane 第一位**）。
