# M6-L7 战绩摘要派生（streak/最佳/分角色 · 第十一批·打磨）

- 状态：**ready**（依赖 `data/records.ts` 已在 main）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 纯 spec（实现方自写测试 + 实现）
- 分支：`task/M6-L7-stats-digest`（`git worktree add ../斗地主.worktrees/M6-L7 -b task/M6-L7-stats-digest main`，进入后 `npm --prefix test install`）
- 文件域（**只允许改这些**）：`assets/scripts/data/statsDigest.ts`（新）、`test/data/stats-digest.test.ts`（新）、report
- 不改 `records.ts`/`stats.ts`/`index.ts` 桶（import 直引）

## 目标
从 `RecordsState`（最多 50 条 `RecordEntry`）派生比 `MatchStats` 更丰富的摘要，喂给扩展战绩界面（M3-40）。纯函数，零 IO。

## 接口
```ts
export interface StatsDigest {
  total: number; wins: number; losses: number; winRatePct: number; // 0..100 整数
  currentStreak: number;   // 末尾连胜(+)/连败(-) 计数
  bestWinStreak: number;
  bestScore: number; worstScore: number; // heroScore 极值（total=0 时 0）
  totalBombs: number; springCount: number; // spring!=='none' 计数
  landlordRounds: number; landlordWins: number;
  farmerRounds: number; farmerWins: number;
}
export function digestRecords(records: RecordsState): StatsDigest;
```
- 胜负判定：`heroIsLandlord = entry.heroSeat===entry.landlord`；`heroWon = (heroIsLandlord && winner===Landlord) || (!heroIsLandlord && winner===Farmer)`（与 `stats.ts:recordRound` 同口径，单一真相源口径对齐）。
- `entries` 顺序：按 `records.ts` 既有约定（确认 append/recent 的时序——currentStreak 取“最近”一端）。

## 行为要求
- `total=0` → 全 0、`winRatePct=0`、极值 0。
- `winRatePct = round(wins/total*100)`。
- `currentStreak`：从最近一条往前数同号连续（胜为正、负为负）。
- 纯不可变、不修改入参；零 `cc`。

## 验收
- 新测试覆盖：空记录、全胜、全负、混合 streak、landlord/farmer 分组、bombs/spring 累计、极值。
- `npm --prefix test test` 全绿、`typecheck` 净、零 cc。report 落盘。
