# T-LIVE-MULT 实现报告

- 实现方标识：Codex / GPT-5
- 分支：`task/T-LIVE-MULT`
- 状态：in-review（三闸高风险·待审查者按 R-WAVE9 评审并置 `approved-pending-planner`）

## 改了哪些文件
- `assets/scripts/game/types.ts`
  - `GameSnapshot` 纯加法新增 `bidMultiplier?: number` 与 `bombsPlayed?: number`。
- `assets/scripts/game/core.ts`
  - `snapshot(state, viewer?)` 两参签名不动；返回对象新增 `bombsPlayed: state.bombsPlayed`。
  - 纯 game snapshot 不填 `bidMultiplier`，保持 flow 倍数来源不反向进入 game。
- `assets/scripts/flow/runtime/bidding-driver.ts`
  - `runtimeSnapshot()` 在有 `runtime.state` 时基于 `snapshot(runtime.state, runtime.heroSeat)` 追加 `bidMultiplier: runtime.bidMultiplier`。
  - resume 路径因此读取存档回填的 `runtime.bidMultiplier`，不依赖已不存在的 bidding 态。

## 三处 diff 摘要
```diff
diff --git a/assets/scripts/game/types.ts b/assets/scripts/game/types.ts
@@
   handCounts: [number, number, number];
   winner: Side | null;
+  bidMultiplier?: number;
+  bombsPlayed?: number;
   viewerHand?: Card[];
```

```diff
diff --git a/assets/scripts/game/core.ts b/assets/scripts/game/core.ts
@@
     handCounts,
     winner: state.winner,
+    bombsPlayed: state.bombsPlayed,
   };
```

```diff
diff --git a/assets/scripts/flow/runtime/bidding-driver.ts b/assets/scripts/flow/runtime/bidding-driver.ts
@@
 export function runtimeSnapshot(runtime: RuntimeDriverContext): GameSnapshot | null {
-  return runtime.state ? snapshot(runtime.state, runtime.heroSeat) : null;
+  if (!runtime.state) return null;
+  return { ...snapshot(runtime.state, runtime.heroSeat), bidMultiplier: runtime.bidMultiplier };
 }
```

## 依赖方向自证
- `snapshot()` 仍是两参：`snapshot(state, viewer?)`，未新增第三参或从 game 层读取 flow 数据。
- `RoundState` 未改；`settle()`、`FlowEvent`、`PlayPolicy`、`BidPolicy`、`round-runtime.ts` 接口、`driver.ts`、`policies.ts`、`clock.ts`、`event-replay.ts`、`persistence.ts` 均未改。
- `game` 层不 import `flow`：`rg -n "from ['\"]../flow|from ['\"]../../flow|assets/scripts/flow|flow/" assets/scripts/game` 无命中。
- 纯层不 import `cc`：`rg -n "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/rules assets/scripts/game assets/scripts/ai assets/scripts/flow assets/scripts/data` 无命中。

## 测试与类型检查输出
基线红：
```
$ npm --prefix test test -- snapshot-live-multiplier
game/snapshot-live-multiplier.test.ts: 2 failed, 1 passed
- snapshot(state).bombsPlayed expected 0, received undefined
- runtime.currentSnapshot().bidMultiplier expected 4, received undefined

$ npm --prefix test run typecheck
TS2339: GameSnapshot lacks bombsPlayed / bidMultiplier (seed file only)
```

实现后：
```
$ npm --prefix test test -- snapshot-live-multiplier
Test Files  1 passed (1)
Tests       3 passed (3)

$ npm --prefix test test
Test Files  145 passed (145)
Tests       753 passed (753)

$ npm --prefix test run typecheck
tsc --noEmit passed

$ git diff --check
passed
```

## 工作树状态
```
$ git status --short --untracked-files=all
 M assets/scripts/flow/runtime/bidding-driver.ts
 M assets/scripts/game/core.ts
 M assets/scripts/game/types.ts
?? coordination/reports/T-LIVE-MULT.report.md
```

## 非文字模态 / IDE 实操验收证据
- 不适用。本任务为纯逻辑数据口改动，未涉及 Cocos Creator / IDE / 浏览器实操。

## 执行者视觉自审勾销表
- 不适用。本任务无 UI / 场景 / 视觉产物。

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `bidMultiplier` 仅由 flow 层 `runtimeSnapshot` enrich，自 `runtime.bidMultiplier` 取值，满足恢复局无 bidding 态时仍显示存档倍数。
- `bombsPlayed` 仅由 game 层 `snapshot()` 从 `RoundState.bombsPlayed` 复制，来源仍属 game 自有状态。
- 纯 game `snapshot()` 的 `bidMultiplier` 保持 `undefined`，由种子第三例钉住依赖方向。

## 疑问 / 需规划者裁定
- 无。

## 阻塞升级
- 不适用。

## 合并证据（approved 后由审查者回填）
- 合并前回归：
  - `npm --prefix test test`：145/753 绿。
  - `npm --prefix test run typecheck`：passed。
- merge commit：待审查者回填。
- BOARD 状态：待审查者。
- 规划者批量结构性把关（仅高风险任务）：待审查者置 `approved-pending-planner` 后由规划者回填。

## 全量回扫（审查者·写 approved 前一次）
- 待审查者填写。

## 回扫升级（转规划者，全量回扫的域外致命 / 拿不准，由审查者填写）
- 待审查者填写。

## 批次交接记录 / 下一步
- 所属批次 / 任务号：C 波 / `T-LIVE-MULT`
- 本回合结论 / 状态：实现已按文件域完成；种子 3/3、全量 145/753、typecheck 均绿；状态 `in-review`。
- 下一步找谁：审查者（R-WAVE9 R:T-LIVE-MULT；三闸任务，通过后置 `approved-pending-planner` 排队待规划者结构性把关，不得直接合并）。
- 用户终审配合：不适用。
- 给下一窗口的可粘贴提示词：
  > 你是本仓库 `斗地主` 的审查者。请读取 `coordination/PROTOCOL.md`、`coordination/tasks/T-LIVE-MULT.md`、`coordination/tasks/R-WAVE9.md` 的 R:T-LIVE-MULT、以及 `coordination/reports/T-LIVE-MULT.report.md`，评审 `task/T-LIVE-MULT`。执行者仅改 `assets/scripts/game/types.ts`、`assets/scripts/game/core.ts`、`assets/scripts/flow/runtime/bidding-driver.ts` 与报告；未改测试。验证已通过：`snapshot-live-multiplier` 3/3、全量 `npm --prefix test test` 145/753 绿、`npm --prefix test run typecheck` 净、`git diff --check` 净、纯层无 `cc`、game 无 flow import。此任务为高风险三闸；若审查通过，请置 `approved-pending-planner` 排队待规划者结构性把关，不得直接合并。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] `git status --short --untracked-files=all` 已记录，越域未跟踪文件已说明
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获精确机器态 `approved` 前未合并 main；高风险三闸未直接合并
- [x] 未 import cc
