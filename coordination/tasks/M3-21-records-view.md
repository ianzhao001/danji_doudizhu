# M3-21 对局历史展示 VM（RecordsState → 行 VM 列表）

- 状态：ready
- **派发模式：纯 spec（无架构种入测试）**——实现方按本 spec 自写 vitest 测试 + 实现。新文件 **import 直引、不改 `ui/index.ts` 桶**。`ui/` 纯逻辑岛，**禁止 import `cc`**。
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/records-view.ts`（新）
  - 新增 `test/ui/records-view.test.ts`（实现方自写）
  - 可读不可改：`assets/scripts/data/records.ts`（`RecordsState`/`RecordEntry`）、`assets/scripts/game/types.ts`（`Side`）
- 依赖：`data/records`（`RecordsState`/`RecordEntry`/`Spring`，已并 main）
- 分支：`task/M3-21-records-view`

## 背景
历史界面需把 `RecordEntry`（heroSeat/landlord/winner/multiplier/bombs/spring/heroScore/playedAt）折算成可绑定的行 VM（胜负、角色、倍数、春天标签、得分符号），并按时间倒序。

## 公共 API 契约
```ts
export interface RecordRowView {
  outcomeText: string;     // heroScore>0 →'胜'，<0 →'败'，===0 →'平'
  heroScore: number;
  scoreLabel: string;      // 带符号 "+24"/"-16"/"0"
  roleText: string;        // heroSeat===landlord →'地主' 否则 '农民'
  multiplierText: string;  // `×${multiplier}`
  bombs: number;
  springText: string;      // 'none'→''、'spring'→'春天'、'anti-spring'→'反春天'
  playedAt: number;
}
export function deriveRecordsView(records: RecordsState, limit?: number): RecordRowView[];
```

## 行为要求
1. 输出按 `playedAt` 视为追加序，**倒序**（最近在前）——等价 `records.entries` 反转；给 `limit` 时取前 `limit` 条（`limit<=0` → 空数组）。
2. `outcomeText` 依 `heroScore` 符号；`roleText` 依 `heroSeat===landlord`；`springText` 映射三态；`scoreLabel` 带符号（同 M3-20 规则）。
3. 纯函数、确定性、不改入参、禁 import `cc`。

## 验收（实现方自写 test/ui/records-view.test.ts）
- 3 条 entry（追加序 a,b,c）→ 输出顺序 c,b,a；`limit:2` → [c,b]；`limit:0` → []。
- 地主+赢（heroSeat===landlord、heroScore>0）→ `outcomeText:'胜'`、`roleText:'地主'`、`scoreLabel` 带 '+'。
- 农民+负分 → `outcomeText:'败'`、`roleText:'农民'`、`scoreLabel` 带 '-'。
- `spring:'anti-spring'`→`'反春天'`、`'none'`→`''`；`multiplierText==='×'+multiplier`。
- 入参不被改动。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
