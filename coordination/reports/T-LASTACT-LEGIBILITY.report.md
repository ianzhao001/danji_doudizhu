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
