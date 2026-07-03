# T-FIX-GS — 地主未决不显示（#3）+ 780×360 结算底部布局（#4）

- 状态：ready（V 发现 #3/#4；用户裁决「未决时隐藏地主字段」）
- 类型：**view-model + 编辑器/运行时**
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/screen-view.ts`（topBar.landlordSeat 允许 null）
  - `assets/scripts/ui/components/game-scene-skeleton.ts`（消费侧隐藏 + 结算布局）
  - `coordination/reports/T-FIX-GS.report.md`
  - **失败测试 `test/ui/screen-view.test.ts` 由架构种入（契约·执行者不改）**
- 依赖：—（独立，可与 E-ORIENT / T-COPY-BID 并行；三者文件域不相交）
- 分支：`task/T-FIX-GS`
- **worktree 测试环境**：缺 `./temp/cli/tsconfig.cocos.json` 时 `mkdir -p temp/cli && cp /Users/admin/Documents/Cocos/斗地主/temp/cli/tsconfig.cocos.json temp/cli/`。

## 背景（V 发现 #3/#4）

- **#3**：`screen-view.ts:57` `landlordSeat: snapshot?.landlord ?? 0` 把未决地主默认成座位0 → 叫抢阶段顶部提前显示「地主：你」。用户裁决**未决时隐藏该字段**。
- **#4**：780×360（最紧档）结算弹层底部按钮（再来一局/返回大厅）贴近底部装饰/手牌区，可读可点但余量偏小。

## 行为要求

### #3 地主未决不显示（**架构已种失败测试**）
1. `screen-view.ts`：`topBar.landlordSeat` 类型改 `SeatIndex | null`；派生 `landlordSeat: snapshot?.landlord ?? null`（**不再默认 0**）。`deriveResultView` 的 `landlord: snapshot?.landlord ?? 0` 属结算路径、**保持不变**（结算时地主必已决出）。
2. `game-scene-skeleton.ts` `renderTopBar`：签名 `landlordSeat: number` → `number | null`；**仅当 `landlordSeat !== null` 才 `addLabel('地主：…')`**（未决不建该 label；地主只会 null→决出、不会回退，diff 渲染 `pruneInactiveChildren` 天然处理）。

### #4 结算底部布局
3. 结算面板（`renderResult` / 面板高度与按钮 y 计算）在**短高横屏（H≈360）**下给底部按钮留更多余量：略上移按钮或收紧面板底部装饰占位；844×390 等更高档不劣化。仅布局微调，不改结算文案/分数逻辑。

## 契约 / 验收

- 架构种入的 `test/ui/screen-view.test.ts`（无 snapshot 边界 `landlordSeat` 期望值改 `null`）**转绿**；其余 landlord 断言（playing snapshot landlord=2 等）仍绿。
- `npm --prefix test test`（134/659 不回归）+ `npm --prefix test run typecheck` 净。
- **四横屏截图**（844×390/812×375/915×412/780×360）：
  - 叫抢阶段顶部**无「地主：你」**（未决不显示）；playing/settled 后正常显示真实地主。
  - 780×360 结算弹层底部按钮余量改善、不贴底、可读可点；`productErrors=[]`。
- 证据落 `coordination/reports/T-FIX-GS.report.md`（附截图路径 + CDP summary）。

## 不可做（护栏）

- 不改测试（有疑问在报告提出）；不碰他人文件域；不 import `cc`（screen-view 纯层）；不手写 `.scene`/`.meta`。
- 不改结算分数/文案逻辑（#4 仅布局）。

## 交付物

- 分支 `task/T-FIX-GS` 分阶段提交（#3 → #4）；报告。
- 获架构 `approved` 后 `claim → merge → release` 自合（单 lane，排队）。

## 测试命令

`npm --prefix test test`
