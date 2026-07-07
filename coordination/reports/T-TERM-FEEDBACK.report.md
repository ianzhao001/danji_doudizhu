# T-TERM-FEEDBACK 实现报告

- 实现方标识：Codex / GPT-5
- 分支：`task/T-TERM-FEEDBACK`
- 状态：in-review

## 改了哪些文件

- **新** `assets/scripts/ui/termination-feedback-view.ts`（纯岛·禁 `cc`）
  - `deriveTerminationFeedback({ phase, reason, alreadyNotified })` 仅在 `phase === 'disposed'` 且 `reason` 为 `redealExhausted` / `error` 且未通知时返回固定文案。
  - `settled` / `null`（玩家主动退出 dispose）/ 非 disposed / 已通知均返回 `null`，为正向清单判定。
- **新** `assets/scripts/ui/termination-feedback-view.ts.meta`
  - Cocos Creator 3.8.8 构建时自动生成，未手写。
- `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `update()` 轮询 `runtime.phase()` + `runtime.terminationReason()`，经纯岛决策后 `pushToast`，并用 flag 去重。
  - 异常终止态显示低打扰操作面板，含异常文案、`返回大厅`、`重开`；按钮复用现有导航/重开路径。
  - `openPauseMenu()` 追加 `runtime.pause()`；`closePauseMenu()` 追加 `runtime.resume()`。
  - `restartFromPause()` 和确认返回大厅路径不调用 `resume()`；既有暂停视觉冻结逻辑不动。
  - `disposed` 顶栏文案显示为 `已终止`，终止态隐藏暂停按钮。

## 测试与类型检查输出

```text
$ npm --prefix test test -- termination-feedback
Test Files  1 passed (1)
Tests       6 passed (6)

$ npm --prefix test test
Test Files  149 passed (149)
Tests       768 passed (768)

$ npm --prefix test run typecheck
tsc --noEmit passed

$ git diff --check
passed

$ rg -n "from 'cc'|from \"cc\"" assets/scripts/ui/termination-feedback-view.ts
no matches
```

## 工作树状态

```text
 M assets/scripts/ui/components/game-scene-skeleton.ts
?? assets/scripts/ui/termination-feedback-view.ts
?? assets/scripts/ui/termination-feedback-view.ts.meta
?? coordination/reports/T-TERM-FEEDBACK.report.md
```

## 非文字模态 / IDE 实操验收证据

- 验收面：Cocos Creator 3.8.8 构建 + Chrome CDP 截图/行为断言。
- 环境与版本：macOS；Cocos Creator 3.8.8；Chrome headless；seed=`20260707`。
- Creator 构建命令：
  - `env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator --project /Users/admin/Documents/Cocos/斗地主.worktrees/T-TERM-FEEDBACK --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"`
  - 日志：`/tmp/doudizhu-t-term-feedback-build.log`
  - 结果：Creator 退出码 `36`（本机历史 metrics/shutdown quirk），日志含 `build Task (web-mobile) Finished in (3 s)ms`，且 `build/web-mobile` 存在。
- CDP 自动化：
  - 命令：`node /tmp/doudizhu-t-term-feedback-smoke.mjs /Users/admin/Documents/Cocos/斗地主.worktrees/T-TERM-FEEDBACK/build/web-mobile /tmp/doudizhu-t-term-feedback-evidence`
  - 汇总：`/tmp/doudizhu-t-term-feedback-evidence/summary.json`
  - 异常终止视觉复现：CDP 临时设置 runtime `currentTerminationReason` + `currentPhase='disposed'`，仅用于复现罕见 UI 状态和截图；未写入产品代码。
- 原始证据路径：
  - 四横屏 `redealExhausted`：
    - `/tmp/doudizhu-t-term-feedback-evidence/T-TERM-FEEDBACK-844x390-redealExhausted.png`
    - `/tmp/doudizhu-t-term-feedback-evidence/T-TERM-FEEDBACK-812x375-redealExhausted.png`
    - `/tmp/doudizhu-t-term-feedback-evidence/T-TERM-FEEDBACK-915x412-redealExhausted.png`
    - `/tmp/doudizhu-t-term-feedback-evidence/T-TERM-FEEDBACK-780x360-redealExhausted.png`
  - `error` 文案补充截图：`/tmp/doudizhu-t-term-feedback-evidence/T-TERM-FEEDBACK-844x390-error.png`
  - 暂停冻结截图：`/tmp/doudizhu-t-term-feedback-evidence/T-TERM-FEEDBACK-844x390-pause-frozen.png`
- 结果摘要：
  - 四横屏异常反馈均有 `已终止` 顶栏、异常文案、`返回大厅`、`重开`，`productErrors=[]`、`failedResponses=[]`。
  - 844×390 `error` 文案补充：`对局发生内部错误，已终止`，同样 `productErrors=[]`、`failedResponses=[]`。
  - pause-wiring CDP 四断言均为 true：`freezeOk=true`、`resumeOk=true`、`returnOk=true`、`idempotentOk=true`。
  - 暂停验证步骤：no-wait 提交玩家动作卡入 AI thinkDelay 窗口 → `openPauseMenu()` → 等待 1400ms 状态不推进 → `closePauseMenu()` 后状态继续推进 → 确认返回大厅后保留的 runtime phase 为 `disposed` 且 1s 后不复活 → 重复 open/close 只有一个 overlay 且最终 `isPaused=false`。
- 用户主观终审状态：等待。执行者已完成第一层视觉自审和证据准备；规划者视觉审第二层与用户主观终审不可由执行者代判。
- 审查边界：审查者仅核验证据链、步骤、环境、日志、用户终审记录与可复现说明；不亲验图像/音频/视频，不操作 Cocos Creator/IDE/浏览器，不替代用户下主观结论。

## 执行者视觉自审勾销表

> 覆盖四横屏异常终止反馈截图 + 844×390 pause freeze 截图。

| 视口 | 相位 / 状态 | 元素重叠 | 文字对比 | 文案包裹 | 闪烁/重渲 |
| --- | --- | --- | --- | --- | --- |
| 844×390 | abnormal disposed | 无 | 无 | 无 | 无 |
| 812×375 | abnormal disposed | 无 | 无 | 无 | 无 |
| 915×412 | abnormal disposed | 无 | 无 | 无 | 无 |
| 780×360 | abnormal disposed | 无 | 无 | 无 | 无 |
| 844×390 | pause frozen | 无 | 无 | 无 | 无 |

- 首轮截图曾发现异常面板压底牌、文案层次不清，已修为牌桌中部面板 + 实底衬 + 面板内直接显示异常文案。
- 当前截图确认：异常面板不压底牌 dock；按钮背景包住 `返回大厅` / `重开`；最窄 780×360 文案仍完整；pause 菜单按钮与暗幕清楚。
- 存疑截图路径：无。

## 合并证据（approved 后由审查者回填）

- 合并前回归：
  - `npm --prefix test test`：
  - `npm --prefix test run typecheck`：
- merge commit：
- BOARD 状态：
- 规划者批量结构性把关：不适用（常规任务）。

## 全量回扫（审查者·写 approved 前一次）

- 待审查者回填。

## 与 spec 的偏差 / 关键决策

- pause-wiring 无 vitest 缝，按 spec 用 CDP 行为证据验收。
- 异常终止视觉截图用 CDP 临时注入 termination reason 复现罕见错误态；纯岛正向清单和 update 轮询由种子测试 + 代码 diff 锁定。
- 为避免 `disposed` 顶栏显示英文，补 `phaseText('disposed') => '已终止'`。
- 为避免终止态仍显示可点击暂停按钮，`phase === 'disposed'` 时不渲染暂停入口。

## 疑问 / 需规划者裁定

- 无。

## 阻塞升级

- 不适用。

## 回扫升级

- 不适用。

## 批次交接记录 / 下一步

- 所属批次 / 任务号：C 波 UI 收尾 / `T-TERM-FEEDBACK`
- 本回合结论 / 状态：实现完成，待审查者评审。
- 下一步找谁：审查者。
- 用户终审配合：等待规划者视觉审第二层和后续用户主观终审；执行者不代判。
- 给下一窗口的可粘贴提示词：
  > 你是本仓库斗地主的**审查型 AI**。先读 `coordination/PROTOCOL.md`、`coordination/tasks/T-TERM-FEEDBACK.md`、`coordination/tasks/R-WAVE9.md`（R:T-TERM-FEEDBACK）与 `coordination/reports/T-TERM-FEEDBACK.report.md`。评审 `git diff main..task/T-TERM-FEEDBACK`：文件域/红线/种子测试未改/全量 test+typecheck 双绿/纯岛无 cc/CDP pause-wiring 与异常终止截图证据。通过后按协议在 BOARD 置 `approved` 并由审查者 claim/merge/release；不要替代规划者视觉审或用户主观终审。

## 自检（对照验收项）

- [x] 种子 `termination-feedback` 6/6 绿（4 红转绿 + 2 绿锚）。
- [x] 全量 `npm --prefix test test`：149/768 绿。
- [x] `npm --prefix test run typecheck`：通过。
- [x] `git diff --check`：通过。
- [x] `git status --short --untracked-files=all` 已记录。
- [x] 仅改声明文件域（新纯岛 + Creator 自动 `.meta` + `game-scene-skeleton.ts` + 本报告）。
- [x] 未改测试、未碰 `flow/` / `game/` / `rules/` / `result-overlay-renderer.ts` / `pause-menu.ts` / `toast-queue.ts`。
- [x] 纯岛未 import `cc`。
- [x] pause-wiring CDP 四断言通过：暂停 AI 冻结 / 继续恢复 / 返回大厅 disposed 不复活 / 重复开关幂等。
- [x] 双层视觉预审第一层已自审；第二层规划者视觉审待补。
- [x] 未合并 main。
