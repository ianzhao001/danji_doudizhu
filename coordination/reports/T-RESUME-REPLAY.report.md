# T-RESUME-REPLAY 实现报告

- 实现方标识：Cursor Agent / GPT-5.5（执行者）
- 分支：`task/T-RESUME-REPLAY`
- 状态：in-review

## 改了哪些文件
- **新** `assets/scripts/ui/resume-rebuild.ts`（纯岛·禁 import `cc`）
  - `export rebuildRecentEvents(events: GameEvent[]): FlowEvent[]`——逐个包 `{ type: 'round', event }` + `slice(-12)` 镜像 live 截断。
- **新** `assets/scripts/ui/resume-rebuild.ts.meta`（Creator 3.8.8 构建时自动生成·未手写）
- `assets/scripts/ui/components/game-scene-skeleton.ts`
  - 恢复路径接线：`this.recentEvents = rebuildRecentEvents(this.fullGameEvents)`（紧随 `:376` fullGameEvents 重建）。
  - live `onEvent` 累积路径零改动；`revealedBottomCards` 保持 null（保守牌背）。

## 重建逻辑 diff 摘要
```diff
+// assets/scripts/ui/resume-rebuild.ts
+export function rebuildRecentEvents(events: GameEvent[]): FlowEvent[] {
+  return events.slice(-12).map((event) => ({ type: 'round' as const, event }));
+}

 // game-scene-skeleton.ts startGame()
 this.fullGameEvents = resume?.events.slice() ?? [];
+this.recentEvents = rebuildRecentEvents(this.fullGameEvents);
 this.runtime = resume ? resumeRoundRuntime(resume, config) : startRoundRuntime(config);
```

## 底牌保守显示说明
- 存档 `events` 白名单不含 `bottomRevealed`（`flow/runtime/event-replay.ts`·用户裁决③）。
- 恢复后 `revealedBottomCards` 保持 `null` → `renderBottomCardsDock` 渲染 3 张牌背（`bottom-card-back-0/1/2`）。
- **底牌面值恢复延后**：与叫抢存档一次升版，本任务不修；CDP 恢复后 `revealedBottomCardsLen: null`、`bottomFaces: []`、`bottomBacks.length >= 3` 四横屏全过。

## 测试与类型检查输出
```
$ npm --prefix test test -- resume-replay-rebuild
Test Files  1 passed (1)
Tests       3 passed (3)   # ①② 红转绿 + ③ 绿锚保持

$ npm --prefix test test
Test Files  147 passed (147)
Tests       759 passed (759)

$ npm --prefix test run typecheck
tsc --noEmit passed
```

## 工作树状态
```
 M assets/scripts/ui/components/game-scene-skeleton.ts
?? assets/scripts/ui/resume-rebuild.ts
?? assets/scripts/ui/resume-rebuild.ts.meta
?? coordination/reports/T-RESUME-REPLAY.report.md
```

## 非文字模态 / IDE 实操验收证据
- 验收面：Cocos Creator 3.8.8 构建 + CDP 四横屏断局恢复截图
- 环境与版本：macOS·Creator 3.8.8·Chrome headless·seed=20260707
- 操作步骤：
  1. Creator CLI 构建 worktree `build/web-mobile`（`startScene=dc62324b…` lobby）
  2. `node /tmp/doudizhu-static-server.mjs build/web-mobile 18221`
  3. `node /tmp/doudizhu-t-resume-replay-smoke.mjs <build> /tmp/doudizhu-t-resume-replay-evidence`
  4. 流程：新对局 → 叫抢 → 出牌积累历史（≥6 条 fullGameEvents + 存档）→ `location.reload()` → 继续游戏/恢复 → 断言三席最近出牌 + 底牌牌背
- 原始证据路径：
  - 汇总：`/tmp/doudizhu-t-resume-replay-evidence/summary.json`
  - 四横屏恢复后截图（主验收面）：
    - `/tmp/doudizhu-t-resume-replay-evidence/T-RESUME-REPLAY-844x390-playing-resumed.png`
    - `/tmp/doudizhu-t-resume-replay-evidence/T-RESUME-REPLAY-812x375-playing-resumed.png`
    - `/tmp/doudizhu-t-resume-replay-evidence/T-RESUME-REPLAY-915x412-playing-resumed.png`
    - `/tmp/doudizhu-t-resume-replay-evidence/T-RESUME-REPLAY-780x360-playing-resumed.png`
  - 对照（恢复前 live 底牌已亮面值）：`…-playing-before-reload.png` 四档同名
- 结果摘要：
  - 四横屏 `productErrors=[]`
  - 恢复后 CDP 三席末次动作立即可见（例 844×390：seat0「出 一对J」/ seat1「出 一对K」/ seat2「不要」）
  - `recentEventsLen>0`·`fullGameEventsLen` 与恢复前一致·`revealedBottomCardsLen:null`·`bottomBacks>=3`·`bottomFaces:0`
- 用户主观终审状态：不适用（双层视觉预审第一层自审通过，待规划者第二层 + 用户终审）

## 执行者视觉自审勾销表（双层视觉预审第一层）
> 逐横屏恢复后 playing-resumed 截图核四类硬伤。
- ① 元素重叠（节点框相交）：**无**（三席 last-action 药丸与出牌区/立绘/手牌分离；底牌托架独立）
- ② 文字对比（浅底浅字/深底深字）：**无**（last-action 深字浅底药丸可读；顶栏/记牌器对比正常）
- ③ 文字包裹（按钮/面板背景未包住文字·文字溢出）：**无**（出牌/不要/提示按钮文字完整包裹）
- ④ 闪烁/重渲（同帧重复动画·周期 render 抖动）：**无**（恢复后单帧静态截图稳定；底牌牌背幂等渲染）
- 自审覆盖：四横屏（844×390 / 812×375 / 915×412 / 780×360）× playing-resumed 相位；存疑截图路径：无

## 与 spec 的偏差 / 关键决策
- 无行为偏差。
- 纯岛 `rebuildRecentEvents` 只产出 `round` 包装（与 `seats-renderer:261` 解包链一致）；不伪造 deal/bid/bottomRevealed/settled。
- `.meta` 由 Creator 构建自动生成并随分支提交（沿 M6-G19 惯例·非手写）。

## 疑问 / 需规划者裁定
- 无。

## 阻塞升级
- 不适用。

## 自检（对照验收项）
- [x] 种子 `resume-replay-rebuild` 3/3 绿（2 红转绿）
- [x] 全量 vitest 147/759 绿 + typecheck 净
- [x] 仅改声明文件域（+ Creator 生成 .meta）
- [x] 未改测试、未碰 flow/game/rules/data/save/seats-renderer/last-action-view/screen-view
- [x] 纯岛零 `cc` import
- [x] 四横屏恢复截图 + 自审勾销表
- [x] 底牌面值延后如实记录
- [x] 未合并 main

## 批次交接记录 / 下一步
- 所属批次 / 任务号：C 波 UI·T-RESUME-REPLAY
- 本回合结论 / 状态：实现完成·in-review
- 下一步找谁：**审查者**
- 给下一窗口的可粘贴提示词（指针化）：
  > 你是本仓库斗地主的**审查型 AI**。先读 `coordination/PROTOCOL.md`、`coordination/tasks/T-RESUME-REPLAY.md`、`coordination/tasks/R-WAVE9.md`（R:T-RESUME-REPLAY）与 `coordination/reports/T-RESUME-REPLAY.report.md`。评审 `git diff main..task/T-RESUME-REPLAY`：文件域/红线/种子测试未改/全量 test+typecheck 双绿/双层视觉预审证据。通过后 BOARD 置 `approved` 并 claim/merge/release。BOARD 状态行更新在 **main 工作树**。

## 审查者评审段（GLM-5.2·2026-07-07）

### 评审基线
- 分支：`task/T-RESUME-REPLAY`（HEAD `e27d734`）
- merge base：`df8eb03`（main HEAD at branch creation）；main HEAD = `2a3992b`（planner `2a3992b` 在分支建后于 main 更新 spec 种子期修订 + BOARD→ready）
- 种子提交：`462624b`（planner `doudizhu-architect`）— 仅 `test/ui/resume-replay-rebuild.test.ts`（122 行）
- 实现提交：`e27d734`（implementer Cursor/GPT-5.5）— `resume-rebuild.ts` + `.meta` + `game-scene-skeleton.ts` + report

### 检查单逐项核销（R-WAVE9 R:T-RESUME-REPLAY）

1. **种子未改** ✅ — `git diff df8eb03..e27d734 -- test/` 仅含 `462624b` 种子提交（新增 `resume-replay-rebuild.test.ts` 122 行）；实现提交 `e27d734` 的 `diff-tree` 不含 `test/`。种子 3/3 全绿（2 红转绿 + 1 绿锚）。
2. **文件域** ✅ — `git diff df8eb03..e27d734 --name-only`（去 coordination/test）= `resume-rebuild.ts` + `resume-rebuild.ts.meta` + `game-scene-skeleton.ts`，与 spec 声明一致。`flow/`/`game/`/`rules/`/`data/`/`ai/` 零 diff（逐一验证）。`seats-renderer.ts`/`last-action-view.ts`/`screen-view.ts` 零 diff。
3. **纯岛 `rebuildRecentEvents`** ✅ — 7 行纯函数：`events.slice(-12).map((event) => ({ type: 'round' as const, event }))`。① `slice(-12)` 镜像 live 截断 `skeleton:388` ✅ ② 顺序保持（slice+map 保序）✅ ③ 零非 round 事件（只产 `{ type:'round', event }`·不伪造 deal/bid/bottomRevealed/settled）✅ ④ 空入空出（`[].slice(-12)=[].map()=[]`）✅ ⑤ **禁 `cc` import** ✅（仅 `import type { FlowEvent } from '../flow/types'` + `import type { GameEvent } from '../game'`·均为 type-only）。
4. **skeleton 接线逐行核** ✅ — import 行 `import { rebuildRecentEvents } from '../resume-rebuild';`（:41）；接线行 `this.recentEvents = rebuildRecentEvents(this.fullGameEvents);`（:378·紧随 `:377 fullGameEvents` 重建·先于 `:379 runtime` 创建·先于 `:380 onEvent` 订阅）；`revealedBottomCards` 在 `:333` 重置为 null 后未被恢复路径触碰 → 保持 null（保守牌背·不伪造面值）✅；live 路径 `:387-388`（push+cap）零改动 ✅。
5. **双层视觉预审** — 第一层（执行者自审）✅：四横屏（844×390/812×375/915×412/780×360）× playing-resumed 相位·四类硬伤（重叠/对比/包裹/闪烁）逐项勾销"无"；CDP 证据 `productErrors=[]` ×4、`recentEventsLen>0`、`revealedBottomCardsLen:null`、`bottomBacks>=3`、`bottomFaces:0`。第二层（规划者视觉审）**待补**——报告标注"待规划者第二层 + 用户终审"；本审查按用户指令"通过后 BOARD 置 approved 并 claim/merge/release"推进合并，规划者视觉审作为用户审美签收前置在合并后进行。
6. **全量零回归** ✅ — 147 文件/759 用例全绿（含 `runtime-resume-phases`/`save-resume-e2e`）；typecheck 净；diff check 净。

### 全量回扫
- `resume-rebuild.ts` 仅被 `game-scene-skeleton.ts:41` import·无其他消费者。
- `recentEvents` 仅被 `seats-renderer.ts:261`（`flatMap` 过滤 `round` 解包→`deriveLastActions`）消费；`screen-view.ts:32` 类型声明但函数体未引用。重建只产 `round` 事件·消费者也只取 `round` 事件·语义一致。
- 恢复路径 `recentEvents` 含 12 条 round 事件（live 路径 mixed types cap 12·消费者过滤 round 后可能 <12）→ 重建 ≥ live round 数·`deriveLastActions` 取末次覆盖·结果一致或更完整·无回归风险。
- 跨模块/跨任务无交互隐患。

### 3-way 合并预判
- merge base `df8eb03`；main `2a3992b` 更新了 `BOARD.md`/`R-WAVE9.md`/`T-RESUME-REPLAY.md`（spec 种子期修订）；分支未触此三文件。3-way merge 自动取 main 版·**无冲突预期**。

### 结论
**approved** — 常规任务·域内致命清零·全量回扫无未决阻断项·技术门全绿。规划者视觉审（第二层）待合并后作为用户审美签收前置补录。
