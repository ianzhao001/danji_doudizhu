# T-LASTACT-LEGIBILITY 实现报告

## 基本信息

- 任务：`T-LASTACT-LEGIBILITY`
- 分支：`task/T-LASTACT-LEGIBILITY`
- 模式：editor-evidence（无种子）
- 文件域：`assets/scripts/ui/components/game-scene/seats-renderer.ts`、本报告

## 实现摘要

- `renderLastActions`：三席 last-action 从裸 label 改为 `last-action-pill-${seat}` root + 深色半透 `drawPanel` 药丸底 + 子 label。
- 保留子 label 名称 `last-action-${seat}`，不破坏既有 CDP/视觉脚本按节点名读取文案的方式。
- active 文案色提升到 `Color(255,244,209,255)`；`'—'` 仍为占位文案，只调高在深色底上的可读透明度。
- hero 布点从会被 `heroHandLarge.y - 42` 推入按钮行的旧公式，改为 `tableActionBar.y - 24` 并夹在出牌区下缘与手牌上缘之间，避开真实 60px 操作按钮高度。

## 关键 diff

```diff
-    const label = ctx.addLabel(row.text, pos.x, pos.y, 12, ctx.uiRoot, pos.width, 24, `last-action-${row.seat}`);
-    label.color = row.text === '—' ? new Color(255, 255, 255, 120) : new Color(255, 244, 209, 230);
+    const root = ctx.ensureNode(`last-action-pill-${row.seat}`, ctx.uiRoot);
+    root.setPosition(pos.x, pos.y, 0);
+    addUiTransform(root, pos.width, 28);
+    drawPanel(root, pos.width, 28, new Color(37, 42, 58, 184));
+
+    const labelColor = row.text === '—' ? new Color(255, 255, 255, 145) : new Color(255, 244, 209, 255);
+    ctx.addLabel(row.text, 0, 1, 12, root, pos.width - 16, 22, `last-action-${row.seat}`, labelColor);
```

```diff
-    const pos = ctx.screenPoint(canvas, canvas.width / 2, Math.max(layout.tableActionBar.y - 18, layout.heroHandLarge.y - 42));
+    const minY = layout.playArea.y + layout.playArea.height + 12;
+    const maxY = layout.heroHandLarge.y - 30;
+    const screenY = clamp(layout.tableActionBar.y - 24, minY, maxY);
+    const pos = ctx.screenPoint(canvas, canvas.width / 2, screenY);
```

## 代码自证

- `deriveLastActions` 调用和 recent round 解包链保持原样：`seats-renderer.ts:261-262`。
- 文案来源、`'—'` 占位语义零改动：未修改 `assets/scripts/ui/last-action-view.ts`。
- 药丸底实现位置：`seats-renderer.ts:265-271`。
- hero 避让位置：`seats-renderer.ts:311-316`。
- 未修改 `game-scene-skeleton.ts` / `table-zones.ts` / `last-action-view.ts`。

## 验证

- `npm --prefix test install`：该 worktree 初始缺 `test/node_modules`，仅补装测试依赖；生成目录为 ignored，未提交依赖产物。
- `npm --prefix test test`：147 files / 759 tests 全绿。
- `npm --prefix test run typecheck`：通过。
- `git diff --check`：通过。
- Creator Web Mobile 构建：
  - 命令：`env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator --project /Users/admin/Documents/Cocos/斗地主.worktrees/T-LASTACT-LEGIBILITY --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"`
  - 日志：`/tmp/doudizhu-t-lastact-legibility-build.log`
  - Creator 退出码 `36`，但日志含 `build Task (web-mobile) Finished`，且 `build/web-mobile` 存在。

## 视觉预审第一层

- 自动化：`node /tmp/doudizhu-t-resume-replay-smoke.mjs /Users/admin/Documents/Cocos/斗地主.worktrees/T-LASTACT-LEGIBILITY/build/web-mobile /tmp/doudizhu-t-lastact-legibility-evidence`
- 汇总：`/tmp/doudizhu-t-lastact-legibility-evidence/summary.json`
- 四横屏均 `productErrors=[]`，live-playing 与 resumed 两态均有三席 last-action 文案。

| 视口 | 状态 | 三席 last-action 文案 | 截图 |
| --- | --- | --- | --- |
| 844×390 | live-playing | hero `出 一对J` / right `出 一对K` / left `不要` | `/tmp/doudizhu-t-lastact-legibility-evidence/T-RESUME-REPLAY-844x390-playing-before-reload.png` |
| 844×390 | resumed | hero `出 一对J` / right `出 一对K` / left `不要` | `/tmp/doudizhu-t-lastact-legibility-evidence/T-RESUME-REPLAY-844x390-playing-resumed.png` |
| 812×375 | live-playing | hero `出 一对J` / right `出 一对K` / left `不要` | `/tmp/doudizhu-t-lastact-legibility-evidence/T-RESUME-REPLAY-812x375-playing-before-reload.png` |
| 812×375 | resumed | hero `出 一对J` / right `出 一对K` / left `不要` | `/tmp/doudizhu-t-lastact-legibility-evidence/T-RESUME-REPLAY-812x375-playing-resumed.png` |
| 915×412 | live-playing | hero `出 一对J` / right `出 一对K` / left `不要` | `/tmp/doudizhu-t-lastact-legibility-evidence/T-RESUME-REPLAY-915x412-playing-before-reload.png` |
| 915×412 | resumed | hero `出 一对J` / right `出 一对K` / left `不要` | `/tmp/doudizhu-t-lastact-legibility-evidence/T-RESUME-REPLAY-915x412-playing-resumed.png` |
| 780×360 | live-playing | hero `出 一对J` / right `出 一对K` / left `不要` | `/tmp/doudizhu-t-lastact-legibility-evidence/T-RESUME-REPLAY-780x360-playing-before-reload.png` |
| 780×360 | resumed | hero `出 一对J` / right `出 一对K` / left `不要` | `/tmp/doudizhu-t-lastact-legibility-evidence/T-RESUME-REPLAY-780x360-playing-resumed.png` |

### 四类硬伤自审表

| 视口 | 状态覆盖 | 元素重叠 | 文字对比 | 文案截断/换行 | 闪烁/空白 |
| --- | --- | --- | --- | --- | --- |
| 844×390 | live-playing / resumed | 无；hero pill 在按钮行上方 | 无；三席均有深色药丸底 | 无 | 无 |
| 812×375 | live-playing / resumed | 无；hero pill 在按钮行上方 | 无；三席均有深色药丸底 | 无 | 无 |
| 915×412 | live-playing / resumed | 无；hero pill 在按钮行上方 | 无；三席均有深色药丸底 | 无 | 无 |
| 780×360 | live-playing / resumed | 无；hero pill 在按钮行上方 | 无；右家亮背景 `出 一对K` 可读 | 无 | 无 |

## 红线自证

- 未修改 `deriveLastActions` 文案纯函数、`'—'` 语义或事件过滤规则。
- 未修改 `last-action-view.ts` / `game-scene-skeleton.ts` / `table-zones.ts`。
- 未修改测试。
- 未新增资源、场景或组件。

### 审查段（审查者 GLM-5.2·2026-07-07）

**结论：approved**（0 打回·常规任务·双闸全绿）

#### 检查单逐项核销（R-WAVE9 R:T-LASTACT-LEGIBILITY）

1. **无种子** ✅ — editor-evidence 模式·无纯逻辑缝·`git diff 93cedd1..9a51d7d -- test/` 为空。
2. **文件域** ✅ — `git diff 93cedd1..9a51d7d --name-only`（去 coordination）= `seats-renderer.ts`，与 spec 声明一致。`last-action-view.ts`/`game-scene-skeleton.ts`/`table-zones.ts`/`screen-view.ts` 零 diff。
3. **只动呈现** ✅ — `deriveLastActions` 调用与 recent round 解包链（:261-262）零改动；文案来源、`'—'` 占位语义零改动（`last-action-view.ts` 未触）。
4. **药丸底实现** ✅ — `renderLastActions`（:265-271）：`ensureNode('last-action-pill-${seat}', uiRoot)` root + `addUiTransform(root, width, 28)` + `drawPanel(root, width, 28, Color(37,42,58,184))` 深色半透药丸底 + 子 label `last-action-${seat}` 名保留（CDP/视觉脚本兼容）；active 文案色 alpha 230→255·`'—'` 占位 120→145。
5. **hero 布点避让** ✅ — `lastActionPosition`（:311-316）：旧公式 `Math.max(tableActionBar.y - 18, heroHandLarge.y - 42)` 改为 `clamp(tableActionBar.y - 24, playArea.y + playArea.height + 12, heroHandLarge.y - 30)`·夹在出牌区下缘与手牌上缘之间·避开 60px 操作按钮高度。
6. **helper 可用性** ✅ — `clamp` 是文件内 :197 局部函数；`ensureNode` 是 `ctx` 既有方法；`addUiTransform`/`drawPanel` 从 `../ui-helpers` 既有 import；`addLabel` 签名支持任意 parent + local 坐标（:243 先例 `ctx.addLabel(roleText, 0, ..., root, ...)`）。
7. **双层视觉预审** — 第一层（执行者自审）✅：四横屏×live-playing + resumed 两态截图·三席 last-action 全部可辨读（含右家压亮背景 `出 一对K`）·hero pill 在按钮行上方零重叠；四类硬伤逐项勾销"无"；CDP 证据 `productErrors=[]` ×4。第二层（规划者视觉审）**待补**——本审查按"通过后 BOARD 置 approved 并 claim/merge/release"推进合并，规划者视觉审作为用户审美签收前置在合并后进行。
8. **全量零回归** ✅ — 147 文件/759 用例全绿；typecheck 净；diff check 净。

#### 全量回扫
- `renderLastActions` 新增 `last-action-pill-${seat}` root 节点（uiRoot 直属子）+ 子 label `last-action-${seat}`（pill 子）。`pruneInactiveChildren` 是**递归**实现（:1594）→ pill 在 `liveRenderNodes` 则递归检查其子·label 也在 `liveRenderNodes`（`addLabel` 内部 `ensureNode` 注册）→ 无孤儿节点风险。
- `last-action-${seat}` label 名保留 → skeleton.ts:134-136 `SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` 清理列表 + CDP/视觉脚本按名读取兼容。
- **非阻断观察（拿不准→转规划者）**：`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` 含 `last-action-0/1/2`·`hideLiveSubtree` 通过 `uiRoot.getChildByName` 查找直属子·改动后 label 移至 pill 子节点·`hideLiveSubtree` 不再能找到。但经分析：settled 阶段 `renderSeats`→`renderLastActions` 仍被调用（skeleton:434 无条件）·`ensureNode` 重激活 label → `hideSettledTransientHud` 对 `last-action-*` **在改动前已是无效操作**（先 `active=false` 后立即 `active=true`）。净行为不变·非回归。建议规划者评估是否需将 `last-action-pill-*` 加入清理列表或调整 `hideLiveSubtree` 搜索策略。
- 跨模块/跨任务无交互隐患。

#### 3-way 合并预判
- merge base `93cedd1`；main `415cbc2` 更新了 BOARD.md（`415cbc2` 规划者批量派发记录）；分支未触 BOARD.md。3-way merge 自动取 main 版·**无冲突预期**。

### 验收披露段（审查者 GLM-5.2·2026-07-07）

- **评审结论**：approved（0 打回·0 域内致命·0 域外致命·1 拿不准→转规划者非阻断）
- **打回轮次**：0
- **全量回扫范围与分流结果**：① `renderLastActions` 新增 `last-action-pill-${seat}` root + 子 label·`pruneInactiveChildren` 递归实现保证无孤儿节点 ② `last-action-${seat}` label 名保留→CDP/视觉脚本兼容 ③ **拿不准（非阻断→转规划者）**：`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` 含 `last-action-0/1/2`·改动后 `hideLiveSubtree` 的 `getChildByName` 不再能找到（label 移至 pill 子节点）·但 `renderLastActions` 在 settled 阶段仍被调用并重激活→改动前已是无效操作→净行为不变·建议规划者评估是否需将 `last-action-pill-*` 加入清理列表 ④ 跨模块/跨任务无交互隐患。回扫 0/0/1（拿不准）。
- **合并 commit**：`595a626`（merge commit·`--no-ff`）
- **最终测试基线**：main `e3a2adb` — 148 文件/762 用例全绿 + typecheck 净 + diff check 净（T-LASTACT-LEGIBILITY 无种子·测试数不变）
- **3-way 合并**：merge base `93cedd1`·main `4d3f162` 更新 BOARD.md·分支未触 BOARD.md·3-way 自动取 main 版·**零冲突**（与预判一致）
- **规划者视觉审（双层视觉预审第二层）**：待补录·作为用户审美签收前置
- **拿不准转规划者建议单**：`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` 的 `last-action-0/1/2` 条目在 T-LASTACT-LEGIBILITY 后变为 stale（`hideLiveSubtree` 无法找到 pill 子节点下的 label）·净行为无变化（settled 阶段 `renderLastActions` 重激活）·建议清理列表加入 `last-action-pill-0/1/2` 或调整 `hideLiveSubtree` 搜索策略（非阻断·不阻塞合并）
