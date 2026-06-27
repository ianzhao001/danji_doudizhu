# M3-20 战绩展示 VM（MatchStats → StatsView）

- 状态：ready
- **派发模式：纯 spec（无架构种入测试）**——实现方按本 spec 自写 vitest 测试 + 实现。新文件 **import 直引、不改 `ui/index.ts` 桶**（架构在 M3-01 桶落定后统一补导出）。本文件 `ui/` 纯逻辑岛，**禁止 import `cc`**。
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/stats-view.ts`（新）
  - 新增 `test/ui/stats-view.test.ts`（实现方自写）
  - 可读不可改：`assets/scripts/data/stats.ts`（`MatchStats`）
- 依赖：`data/stats`（`MatchStats`/`emptyStats`，已并 main）
- 分支：`task/M3-20-stats-view`

## 背景
战绩界面需要把 `MatchStats`（rounds/asLandlord/landlordWins/asFarmer/farmerWins/netScore）折算成可直接绑定的展示字段（胜率、胜负数、净分符号）。组件不该自己算。

## 公共 API 契约
```ts
export interface StatsView {
  rounds: number;
  wins: number;            // landlordWins + farmerWins
  losses: number;          // rounds - wins
  winRatePct: number;      // 0..100 整数；rounds===0 → 0
  asLandlord: number; landlordWins: number;
  asFarmer: number; farmerWins: number;
  netScore: number;
  netScoreLabel: string;   // 带符号："+12" / "-8" / "0"
}
export function deriveStatsView(stats: MatchStats): StatsView;
```

## 行为要求
1. `wins = landlordWins + farmerWins`；`losses = rounds - wins`（保证 `>=0`，stats 自洽前提下）。
2. `winRatePct = rounds === 0 ? 0 : Math.round((wins / rounds) * 100)`（0..100 整数）。
3. `netScoreLabel`：`netScore>0`→`"+"+netScore`、`<0`→`String(netScore)`（已带负号）、`===0`→`"0"`。
4. 纯函数、确定性、不改入参、禁 import `cc`。

## 验收（实现方自写 test/ui/stats-view.test.ts）
- `emptyStats()` → `rounds:0, wins:0, losses:0, winRatePct:0, netScore:0, netScoreLabel:'0'`。
- 构造 `{rounds:4, asLandlord:2, landlordWins:1, asFarmer:2, farmerWins:2, netScore:12}` → `wins:3, losses:1, winRatePct:75, netScoreLabel:'+12'`。
- 负净分 → `netScoreLabel:'-8'`；`winRatePct` 边界（rounds:3,wins:1 → 33）。
- 入参不被改动。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
