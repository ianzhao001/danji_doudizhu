
## 审查者裁定（GLM-5.2 · 2026-07-06）

**结论：approved**，打回 0 轮。

R-WAVE7 R:T-FIX-DROP-HUD 检查单逐项：

1. **文件域** ✅：产品码仅 `game-scene-skeleton.ts`（+55−4）；BOARD.md −1 行=分支建自 `a85fd48`（早于 main `4d33eb3` 规划者 PASS note），3-way 保留（merge-tree 验证无冲突）；报告+证据 PNG 新增。13 个排除域逐域 exit=0：game/rules/data/ai/flow、asset-keys、table-zones、game-scene/ 子目录、test、lobby、scenes、resources、*.meta。
2. **diff 核：side-seat 多牌安全区扩展避让 HUD** ✅：`playAreaLayout` 签名增 `layout: TableZones`；`sideSeatPlaySafeBand` 左家避让 `strengthMeter`/`memoryDock` 顶边、右家避让 `turnTimer`/`advisorDock` 顶边；`verticalScaleCap` 按安全 band 高度限缩 cardScale；`screenY` 钳入 `[hudBand.top − bounds.top, hudBand.bottom − bounds.bottom]`。hero 座 `hudBand=null` 不受影响。#2 既有不回归（牌间 spacing/rowSpacing 逻辑不变）。
3. **game 层/#3 座位映射零改动** ✅：`game/seat.ts nextSeat` 不动；`seat-display.ts visualSideForSeat` 不动（分支 diff=0）；分支 `game-scene-skeleton.ts:69` import 不变。
4. **settled/相位/T-LAYOUT4/卡面/暂停面板/逆时针映射不回归** ✅：settled 门控 10 命中；暂停面板 diff 0 行（`pauseBtn/renderPauseMenu/renderPauseConfirm/isPauseToggle/isPauseAction/pause-` 全 0）；table-zones.ts exit=0。
5. **报告含自审勾销表 + 规划者视觉审结论** ✅：报告含 6 项自审表（左家 8 张顺子×HUD 净空 / 左家四形态 / 右家四形态 / #2 既有 / settled/相位/暂停 / productErrors）；BOARD 第 879 行规划者 PASS note（「左家 8 张顺子四档全在 HUD 之上净空分离·780 八形态 sweep 全无覆盖」）。
6. **四档 productErrors=[]** ✅：844×390/812×375/915×412/780×360 各 8 captures（左/右 × 单/对/顺子8/飞机8），全 `productErrors=[]`/`failedResponses=[]`。
7. **vitest/typecheck/diff --check 不回归** ✅：分支 worktree 实跑 141/739 绿（26.64s）+ typecheck 净 + diff --check exit=0。

全量回扫：0 域内致命 / 0 域外致命 / 0 拿不准。
