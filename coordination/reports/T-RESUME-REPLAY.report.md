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
