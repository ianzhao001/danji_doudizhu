# M-FLOW-03 难度策略工厂（按座位注入 flow）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/policies.ts`（新）
  - 可读不可改：`assets/scripts/flow/index.ts`（桶由架构维护，已加导出）、`assets/scripts/flow/{types,driver}.ts`、`assets/scripts/ai/**`、`assets/scripts/game/**`、`test/flow/**`
- 依赖：M-FLOW（playPolicy 注入点已并 main）、M4 三档（strategyFor 已并 main）
- 分支：`task/M-FLOW-03-level-policies`

## 背景
flow 已开放 `playPolicy`/`bidPolicy` 注入点（M-FLOW）。本任务把「三座位难度配置」转成可直接注入的
`{ bidPolicy, playPolicy }`，让 UI 选难度后一行接入 flow。出牌按座位难度路由；
叫抢先用基线 `chooseBid`（M4-07 落地后再切 `chooseBidByLevel`，见备注）。

## 行为要求
1. `levelPolicies(levels: [AiLevel, AiLevel, AiLevel]): { bidPolicy: BidPolicy; playPolicy: PlayPolicy }`。
2. `playPolicy = ({ seat, snapshot, rng }) => strategyFor(levels[snapshot.turn])(snapshot, rng)`（按座位路由难度）。
3. `bidPolicy = ({ seat, state, hand }) => chooseBid(hand, state)`（基线判强；各座位现阶段同策略）。
   - 备注：M4-07 合并后，由后续小改将 `bidPolicy` 切换为 `chooseBidByLevel(hand, state, levels[seat])`（本任务不依赖 M4-07）。
4. 复用 `BidPolicy`/`PlayPolicy` 契约类型；纯逻辑、禁止 import `cc`、禁止改签名。

## 验收（test/flow/policies.test.ts，架构种入·不可改）
- `playPolicy` 路由：给定 `levels=[Hard,Normal,Simple]` 与判别快照，
  `playPolicy({ seat, snapshot(turn=seat), rng:createRng(1) })` 深相等 `strategyFor(levels[seat])(同快照, createRng(1))`（seat 0/1/2）。
- `bidPolicy`：calling 强手 `x X 3 4 5` → `{type:'call',seat:state.turn}`，且深相等 `chooseBid(hand, state)`；弱手 `3 4 5 6 7` → pass。
- 可注入性：`runHeadlessRound({ seed, ...levelPolicies([Hard,Normal,Simple]) })` 解析为 settled（`winner∈{landlord,farmer}`、scores 守恒、`0<turns<300`）。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
