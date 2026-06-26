# M3-01 整屏 VM 集成层（9 个 UI 岛 → 单一渲染 VM）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/screen-view.ts`（新；`ui/` 纯逻辑岛，本文件**禁止 import `cc`**）
  - `assets/scripts/ui/index.ts`（新桶；由本任务创建，`export *` 全部 9 岛 + screen-view）
  - 可读不可改：`assets/scripts/ui/{hand-layout,selection,card-view,table-layout,action-buttons,hand-interaction,bidding-view,result-view,event-cues}.ts`、`assets/scripts/game/**`、`assets/scripts/flow/types.ts`、`assets/scripts/data/settings.ts`、`test/ui/**`
- 依赖：9 个 UI 纯逻辑岛（均已并 main）+ game/flow/data 类型
- 分支：`task/M3-01-screen-view`

## 背景
Cocos 组件侧若各自重复推导布局/按钮态/叫抢 VM/结算 VM，会又厚又易错。本任务做一个**纯整合层**：把 GameSnapshot/BiddingState/Settlement/selectedCards/recentEvents 组合成一个 `ScreenVM`，后续组件只做 VM→节点的属性绑定（组件变薄）。BOARD 设计待办 ②。

## 公共 API 契约（架构固定，字段集钉死）
```ts
export interface ScreenVM {
  layout: TableRegions;
  hand: InteractiveSlot[];
  actions: ActionButtonsState;
  bidding?: BiddingView;       // phase 为叫抢时存在
  result?: ResultView;         // phase===Settled 时存在
  cues: CueId[];
  topBar: { multiplier: number; bombs: number; landlordSeat: SeatIndex };
}

export function deriveScreenVM(args: {
  snapshot?: GameSnapshot;     // playing/settled 时给
  bidding?: BiddingState;      // 叫抢阶段给（与 snapshot 互斥）
  heroSeat: SeatIndex;
  selectedCards: Card[];
  recentEvents: FlowEvent[];   // 待消费的事件（播 cue）
  layoutOpts: { containerWidth: number; cardWidth: number; liftOffset: number };
  settlement?: Settlement;     // settled 时给（亦可从 snapshot 派生不到，故显式）
}): ScreenVM;
```

## 行为要求
1. `layout` = `tableLayout()`（复用）。
2. `hand` = `layoutHandInteractive({ hand: snapshot.viewerHand ?? [], selected: selectedCards, ...layoutOpts })`（复用）；无 snapshot 时 `hand = []`。
3. `actions` = `deriveActionButtons({ snapshot: snapshot ?? <空快照>, selectedCards: selectedCards, viewerSeat: heroSeat })`（复用）；无 snapshot → `{play:false,pass:false,hint:false}`。
4. `bidding` = `bidding` 入参存在时 `deriveBiddingView(bidding, heroSeat)`，否则 `undefined`。
5. `result` = `settlement` 入参存在时 `deriveResultView({ settlement, landlord: snapshot?.landlord ?? 0, heroSeat })`，否则 `undefined`。
6. `cues` = `recentEvents.map(cueForFlowEvent).filter((c): c is CueId => c !== null)`（复用）。
7. `topBar` = `{ multiplier: settlement?.multiplier ?? 1, bombs: settlement?.bombs ?? 0, landlordSeat: snapshot?.landlord ?? 0 }`。
8. 纯函数、确定性、禁 import `cc`、不改入参。从各 `./<岛>` 复用，从 `../game`/`../flow` 取类型。

## 验收（test/ui/screen-view.test.ts，架构种入·不可改）
- playing 快照（有 viewerHand、selectedCards、recentEvents 含一个 `round` play）：`hand`/`actions`/`cues` 非空、`bidding===undefined`、`result===undefined`、`topBar.landlordSeat===snapshot.landlord`。
- 叫抢阶段（给 `bidding`、无 snapshot）：`bidding` 非空、`hand===[]`、`actions` 全 false。
- settled（给 `settlement`+快照）：`result` 非空、`result.resultText` 正确、`topBar.multiplier===settlement.multiplier`。
- `cues` 过滤掉 `cueForFlowEvent` 返回 null 的事件（如有）。
- 入参不被改动。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
