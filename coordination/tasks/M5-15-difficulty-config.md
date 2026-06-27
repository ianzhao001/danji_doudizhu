# M5-15 难度配置纯数据（AiLevel → 展示/调参）

- 状态：ready
- **派发模式：纯 spec（无架构种入测试）**——实现方按本 spec 自写 vitest 测试 + 实现，覆盖下列验收。新文件 **import 直引、不改 `data/index.ts` 桶**（架构合并时统一补桶导出）。
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/difficultyConfig.ts`（新）
  - 新增 `test/data/difficulty-config.test.ts`（实现方自写）
  - 可读不可改：`assets/scripts/ai/strategy.ts`（`AiLevel`）、`assets/scripts/data/settings.ts`
- 依赖：`ai/strategy`（`AiLevel`）、`data/settings`（均已并 main）
- 分支：`task/M5-15-difficulty-config`

## 背景
设置界面要展示三档难度的名称/说明，flow 在 AI 座位要按难度插入「思考时延」（见 `flow/clock`）。当前这些常量散落/缺失。集中为一份纯数据配置，单一真相源，供 settings-view（M3-22）与 flow 复用。

## 公共 API 契约
```ts
export interface DifficultyConfig {
  level: AiLevel;
  label: string;          // 中文名：简单/普通/困难
  description: string;    // 一句话说明
  thinkDelayMs: { min: number; max: number };  // AI 思考时延区间（min<=max，均为非负整数）
}
export const DIFFICULTY_CONFIGS: Record<AiLevel, DifficultyConfig>;
export function difficultyConfig(level: AiLevel): DifficultyConfig;   // 非法 level 抛错或回 Normal——见验收
export function difficultyOptions(): DifficultyConfig[];              // 固定序 simple→normal→hard
```

## 行为要求
1. 三档都有 config；`label`/`description` 非空；`thinkDelayMs.min<=max` 且均为非负整数；困难档时延区间应 ≤ 普通档（更快决策，可配置，记注释）。
2. `difficultyConfig(level)`：合法 `AiLevel` 返回对应 config；非法值**回退 `Normal` 的 config**（与 settings migrate 容错一致）。
3. `difficultyOptions()` 顺序固定 `[simple, normal, hard]`，长度 3，与 `DIFFICULTY_CONFIGS` 一致。
4. 纯数据、确定性、禁 import `cc`。

## 验收（实现方自写 test/data/difficulty-config.test.ts）
- `DIFFICULTY_CONFIGS` 含全部 3 档；每档 `label`/`description` 非空、`0<=min<=max` 且均整数。
- `difficultyConfig('hard')` 返回 hard；`difficultyConfig('x' as AiLevel)` → Normal config（容错）。
- `difficultyOptions()` 深相等 `[simple,normal,hard]` 顺序、length===3。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
