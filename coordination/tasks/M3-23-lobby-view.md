# M3-23 大厅 VM（存档 + 战绩 → LobbyView）

- 状态：ready
- **派发模式：纯 spec（无架构种入测试）**——实现方按本 spec 自写 vitest 测试 + 实现。新文件 **import 直引、不改 `ui/index.ts` 桶**。`ui/` 纯逻辑岛，**禁止 import `cc`**。
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/lobby-view.ts`（新）
  - 新增 `test/ui/lobby-view.test.ts`（实现方自写）
  - 可读不可改：`assets/scripts/data/save.ts`（`SaveSlot`）、`assets/scripts/data/stats.ts`（`MatchStats`）
- 依赖：`data/save`（`SaveSlot` 类型）、`data/stats`（`MatchStats`，均已并 main）
- 分支：`task/M3-23-lobby-view`

## 背景
大厅界面要显示「是否有可续对局」「战绩摘要」。本 VM **纯函数、无 IO**——接收已加载的 `SaveSlot | null`（IO 由 saveStorage 层在外面做）与 `MatchStats`，产出大厅绑定字段。

## 公共 API 契约
```ts
export interface LobbyView {
  hasSavedGame: boolean;          // savedSlot !== null
  continueLabel: string;          // hasSavedGame →'继续对局' 否则 '新对局'
  summary: { rounds: number; winRatePct: number; netScore: number };  // 战绩摘要
}
export function deriveLobbyView(args: { savedSlot: SaveSlot | null; stats: MatchStats }): LobbyView;
```

## 行为要求
1. `hasSavedGame = savedSlot !== null`；`continueLabel` 据此二选一。
2. `summary.winRatePct = rounds===0 ? 0 : Math.round(wins/rounds*100)`，`wins = landlordWins+farmerWins`；`rounds`/`netScore` 透传。
3. **不做 IO**（不接 storage），纯函数、不改入参、禁 import `cc`。

## 验收（实现方自写 test/ui/lobby-view.test.ts）
- `savedSlot:null` → `hasSavedGame:false`、`continueLabel:'新对局'`。
- 给一个 `SaveSlot` → `hasSavedGame:true`、`continueLabel:'继续对局'`。
- `stats` 摘要：rounds:0 → winRatePct:0；rounds:4/wins:3 → 75；netScore 透传（含负）。
- 入参不被改动。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
