# T-HUD-LIVE 实现报告

## 基本信息

- 任务：`T-HUD-LIVE`
- 分支：`task/T-HUD-LIVE`
- 种子：`4840bc7 test(T-HUD-LIVE): seed topbar live multiplier/bombs phase sourcing (2 red / 1 green)`
- 文件域：`assets/scripts/ui/screen-view.ts`、`assets/scripts/ui/components/game-scene-skeleton.ts`、本报告

## 实现摘要

- `screen-view.ts`
  - 新增 `deriveTopBar`，按 `settlement > snapshot > bidding > default` 派生顶栏。
  - `settlement`：读取 `settlement.multiplier` / `settlement.bombs`。
  - `snapshot`：读取 `snapshot.bidMultiplier ?? 1` / `snapshot.bombsPlayed ?? 0`。
  - `bidding`：`bidding.multiplier > 0 ? bidding.multiplier : 1`，未叫 `0` 显示 `1`，炸弹为 `0`。
  - `default`：`multiplier=1`、`bombs=0`。
- `game-scene-skeleton.ts`
  - 顶栏新增 `top-bombs-badge` + `top-bombs` label，文案 `炸弹×N`。
  - 右侧三项重新排布为 `倍数 / 炸弹 / 手牌`，继续消费 `vm.topBar`，未改 T-LAYOUT4 结构域。

## 关键 diff

```diff
+function deriveTopBar(args: {
+  snapshot?: GameSnapshot;
+  bidding?: BiddingState;
+  settlement?: Settlement;
+}): ScreenVM['topBar'] {
+  const { snapshot, bidding, settlement } = args;
+  if (settlement) return { multiplier: settlement.multiplier, bombs: settlement.bombs, landlordSeat: snapshot?.landlord ?? null };
+  if (snapshot) return { multiplier: snapshot.bidMultiplier ?? 1, bombs: snapshot.bombsPlayed ?? 0, landlordSeat: snapshot.landlord };
+  if (bidding) return { multiplier: bidding.multiplier > 0 ? bidding.multiplier : 1, bombs: 0, landlordSeat: null };
+  return { multiplier: 1, bombs: 0, landlordSeat: null };
+}
```

```diff
-    const multiplierPos = this.screenPoint(canvas, canvas.width - 182, topY);
-    const handPos = this.screenPoint(canvas, canvas.width - 82, topY);
+    const multiplierPos = this.screenPoint(canvas, canvas.width - 265, topY);
+    const bombsPos = this.screenPoint(canvas, canvas.width - 165, topY);
+    const handPos = this.screenPoint(canvas, canvas.width - 68, topY);
...
+    this.addSprite(RESOURCE_PATHS.badgeMultiplierV13, bombsPos.x - 40, bombsPos.y, 20, 20, this.uiRoot!, 'top-bombs-badge');
...
+    this.addLabel(`炸弹×${topBar.bombs}`, bombsPos.x + 4, bombsPos.y, 11, this.uiRoot!, 74, 20, 'top-bombs', BRIGHT_PANEL_TEXT);
```

## 验证

- `npm --prefix test test -- topbar-live-multiplier`：3/3 绿。
- `npm --prefix test test`：148 files / 762 tests 全绿。
- `npm --prefix test run typecheck`：通过。
- `git diff --check`：通过。
- Creator Web Mobile 构建：
  - 命令：`env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator --project /Users/admin/Documents/Cocos/斗地主.worktrees/T-HUD-LIVE --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"`
  - 日志：`/tmp/doudizhu-t-hud-live-build.log`
  - Creator 退出码 `36`，但日志含 `build Task (web-mobile) Finished`，且 `build/web-mobile` 存在。

## 视觉预审第一层

- 自动化：`NODE_PATH=/tmp/doudizhu-playwright-smoke/node_modules node /tmp/doudizhu-pg4-v13-e2e.cjs /Users/admin/Documents/Cocos/斗地主.worktrees/T-HUD-LIVE /tmp/doudizhu-t-hud-live-evidence`
- 汇总：`/tmp/doudizhu-t-hud-live-evidence/summary.json`
- 四横屏均 `productErrors=[]`，每档 11 张截图；本任务重点抽取 bidding / playing / settled 三相顶栏。

| 视口 | 相位 | 顶栏核对 | 截图 |
| --- | --- | --- | --- |
| 844×390 | bidding | `叫地主 / 地主待定 / 倍数×1 / 炸弹×0 / 手牌17` | `/tmp/doudizhu-t-hud-live-evidence/844x390/P-G4-844x390-round1-bidding.png` |
| 844×390 | playing | `对局中 / 地主你 / 倍数×4 / 炸弹×0 / 手牌20` | `/tmp/doudizhu-t-hud-live-evidence/844x390/P-G4-844x390-round1-playing.png` |
| 844×390 | settled | `本局结算 / 地主你 / 倍数×4 / 炸弹×0 / 手牌5` | `/tmp/doudizhu-t-hud-live-evidence/844x390/P-G4-844x390-round1-settlement.png` |
| 812×375 | bidding | `叫地主 / 地主待定 / 倍数×1 / 炸弹×0 / 手牌17` | `/tmp/doudizhu-t-hud-live-evidence/812x375/P-G4-812x375-round1-bidding.png` |
| 812×375 | playing | `对局中 / 地主你 / 倍数×4 / 炸弹×0 / 手牌20` | `/tmp/doudizhu-t-hud-live-evidence/812x375/P-G4-812x375-round1-playing.png` |
| 812×375 | settled | `本局结算 / 地主你 / 倍数×4 / 炸弹×0 / 手牌5` | `/tmp/doudizhu-t-hud-live-evidence/812x375/P-G4-812x375-round1-settlement.png` |
| 915×412 | bidding | `叫地主 / 地主待定 / 倍数×1 / 炸弹×0 / 手牌17` | `/tmp/doudizhu-t-hud-live-evidence/915x412/P-G4-915x412-round1-bidding.png` |
| 915×412 | playing | `对局中 / 地主你 / 倍数×4 / 炸弹×0 / 手牌20` | `/tmp/doudizhu-t-hud-live-evidence/915x412/P-G4-915x412-round1-playing.png` |
| 915×412 | settled | `本局结算 / 地主你 / 倍数×4 / 炸弹×0 / 手牌5` | `/tmp/doudizhu-t-hud-live-evidence/915x412/P-G4-915x412-round1-settlement.png` |
| 780×360 | bidding | `叫地主 / 地主待定 / 倍数×1 / 炸弹×0 / 手牌17` | `/tmp/doudizhu-t-hud-live-evidence/780x360/P-G4-780x360-round1-bidding.png` |
| 780×360 | playing | `对局中 / 地主你 / 倍数×4 / 炸弹×0 / 手牌20` | `/tmp/doudizhu-t-hud-live-evidence/780x360/P-G4-780x360-round1-playing.png` |
| 780×360 | settled | `本局结算 / 地主你 / 倍数×4 / 炸弹×0 / 手牌5` | `/tmp/doudizhu-t-hud-live-evidence/780x360/P-G4-780x360-round1-settlement.png` |

### 四类硬伤自审表

| 视口 | 相位覆盖 | 元素重叠 | 文字对比 | 文案截断/换行 | 闪烁/空白 |
| --- | --- | --- | --- | --- | --- |
| 844×390 | bidding / playing / settled | 无 | 无 | 无 | 无 |
| 812×375 | bidding / playing / settled | 无 | 无 | 无 | 无 |
| 915×412 | bidding / playing / settled | 无 | 无 | 无 | 无 |
| 780×360 | bidding / playing / settled | 无 | 无 | 无 | 无 |

## 红线自证

- 未修改 `seats-renderer.ts` / `result-overlay-renderer.ts` / `table-zones.ts`。
- 未修改 `game/`、`rules/`、`flow/`、`data/`、`ai/`。
- 未修改测试。
- `screen-view.ts` 仅使用已有 `GameSnapshot` 可选字段，不让 `game` 反向依赖 `flow`。
- `game-scene-skeleton.ts` 仅渲染 `vm.topBar`，未新增规则计算。
