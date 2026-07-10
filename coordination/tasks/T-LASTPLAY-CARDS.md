# T-LASTPLAY-CARDS — 三席最近出牌的牌面级派生（替代纯文字药丸的数据源）

- **批次**：v1.4 第一波 W-UNIFY·纯逻辑批第 3 棒（自 T-INTERACT-VIEWS 尖建 `task/T-LASTPLAY-CARDS` 链式续做）
- **类型**：纯逻辑（ui 纯岛·禁 `cc`）·**纯 spec 派发**（测试执行者自写）
- **执行者**：Cursor　**审查者**：Codex（按 `tasks/R-WAVE10.md`）

## 背景与动机
真实斗地主把各家最近一手**以真实牌面**摆在桌面对应席位旁，玩家一眼读牌型；当前实现是文字药丸（「出 一对K」，`ui/last-action-view.ts`）。牌面数据其实已在事件流里：`GameEvent play` 携带 `pattern: HandPattern`，而 `HandPattern.cards: Card[]` 即整手牌面（`rules/pattern.ts:26-33`）；炸弹/火箭出牌时 `game/core.ts:132-136` **先发 `play`（带 pattern）再补 `bomb`/`rocket` 强调事件**——牌面恒可从 play 事件还原。本任务做纯派生，P-TABLE-INFO 再接渲染。

## 目标与文件域
- 新 `assets/scripts/ui/last-play-view.ts`
- `assets/scripts/ui/index.ts` 桶：仅允许追加一行导出（铁律 4 授权）
- 新 `test/ui/last-play-view.test.ts`（执行者自写）
- `coordination/reports/T-LASTPLAY-CARDS.report.md`

## 契约
```ts
import type { Card } from '../rules';
import type { GameEvent, SeatIndex } from '../game';

export interface SeatLastPlay {
  seat: SeatIndex;
  kind: 'play' | 'pass' | null;   // null = 本轮尚无动作（或被 reset 清空）
  cards: Card[];                   // kind==='play' 时为该手全部牌面；否则空数组
  emphasis: 'bomb' | 'rocket' | null; // 炸弹/火箭强调（供渲染层配特效底）
  text: string;                    // 可达性/降级文案，与 deriveLastActions 同语义
}
export function deriveLastPlays(recentEvents: GameEvent[]): SeatLastPlay[]; // 恒返回 3 席（0,1,2 序稳定）
```
- 遍历语义**与 `deriveLastActions` 对齐**（`ui/last-action-view.ts:57` 起）：每席取**最后一次** play/pass；`reset` 事件清空**全部三席**（牌权重回领出，桌面清空——对齐真实游戏一轮结束收牌）；`win` 忽略。
- `play` 事件 → `kind:'play'`、`cards = event.pattern.cards`（**引用透传即可，不深拷**，但不得修改）；紧随同席 `bomb`/`rocket` 事件 → 置 `emphasis`（cards 仍取自 play 事件）。
- `pass` → `kind:'pass'`、cards 空、text『不要』。
- `text` 生成**直接复用** `deriveLastActions` 的产出（内部调用它并按席位合流），不重写文案 switch——单一真相源。

## 必须覆盖用例清单（缺一不收）
1. 单/对/顺子/三带一各一例：cards 与 pattern.cards 全等（长度+逐张），text 与 `deriveLastActions` 相同输入输出一致。
2. 炸弹：`play`+`bomb` 相邻事件 → `kind:'play'`、cards=4 张、`emphasis:'bomb'`、text=『炸弹』；火箭同理 2 张。
3. pass 覆盖旧 play：同席先出后过 → 终态 `kind:'pass'`、cards 空。
4. `reset` 清空三席（reset 前有出牌，reset 后未动的席位 kind=null、text 空串或『—』与 deriveLastActions 现语义一致——以现实现为准并在测试注明）。
5. 空事件流 → 三席 kind=null；恒返回长度 3、席序 0→2。
6. 入参数组与事件对象未被修改（不可变断言）；源码零 `from 'cc'`。

## 红线
- **不改不删** `last-action-view.ts` 的既有导出（`deriveLastActions` 仍被 `seats-renderer.ts:261` 与 `resume-rebuild` 链路消费）；只新增文件复用之。
- 不动 game/rules 层与事件形状；不改既有测试。

## 验收
- 全量 test + typecheck 绿；报告含链式基点 commit 与用例映射。批末做**一次**批交接（三任务），通知审查者按 R-WAVE10 批量审。
