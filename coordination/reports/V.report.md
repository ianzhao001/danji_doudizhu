# V Report — Wave 3 Release-State Landscape E2E + PLAYTEST Evidence

- 实现方标识：Codex
- 分支：`task/V`
- 状态：in-review

## 改了哪些文件

- `coordination/reports/V.report.md`

V 是 verify-only 任务，未改产品代码、未改测试、未改 `.scene` / `.meta`。

## 构建与环境

- Cocos Creator：3.8.8
- 构建目标：`web-mobile`
- 构建命令：

```sh
env -u ELECTRON_RUN_AS_NODE "/Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator" \
  --project "/Users/admin/Documents/Cocos/斗地主.worktrees/V" \
  --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

注：本机 Cocos CLI 在 metrics shutdown 后退出码为 `36`，但日志明确结束于：

```text
build Task (web-mobile) Finished in (4 s)
```

`build/web-mobile/src/settings.json` 实测：

```json
{
  "orientation": "auto",
  "exactFitScreen": true,
  "designResolution": { "width": 844, "height": 390, "policy": 3 },
  "launchScene": "db://assets/scene/lobby.scene"
}
```

## 四横屏 E2E 结果

证据目录：`/tmp/doudizhu-v11-visual-gate/V/`

汇总文件：`/tmp/doudizhu-v11-visual-gate/V/summary.json`

| 分辨率 | productErrors | 终态 | 提示/出牌/不要 | 截图数 | 大厅 | 叫抢 | 结算 | 返回大厅 |
|---|---:|---|---|---:|---|---|---|---|
| 844x390 | 0 | settled | true/true/true | 23 | `/tmp/doudizhu-v11-visual-gate/V/V-844x390-01-lobby.png` | `/tmp/doudizhu-v11-visual-gate/V/V-844x390-02-bidding.png` | `/tmp/doudizhu-v11-visual-gate/V/V-844x390-10-settlement.png` | `/tmp/doudizhu-v11-visual-gate/V/V-844x390-11-return-lobby.png` |
| 812x375 | 0 | settled | true/true/true | 24 | `/tmp/doudizhu-v11-visual-gate/V/V-812x375-01-lobby.png` | `/tmp/doudizhu-v11-visual-gate/V/V-812x375-02-bidding.png` | `/tmp/doudizhu-v11-visual-gate/V/V-812x375-10-settlement.png` | `/tmp/doudizhu-v11-visual-gate/V/V-812x375-11-return-lobby.png` |
| 915x412 | 0 | settled | true/true/true | 30 | `/tmp/doudizhu-v11-visual-gate/V/V-915x412-01-lobby.png` | `/tmp/doudizhu-v11-visual-gate/V/V-915x412-02-bidding.png` | `/tmp/doudizhu-v11-visual-gate/V/V-915x412-10-settlement.png` | `/tmp/doudizhu-v11-visual-gate/V/V-915x412-11-return-lobby.png` |
| 780x360 | 0 | settled | true/true/true | 24 | `/tmp/doudizhu-v11-visual-gate/V/V-780x360-01-lobby.png` | `/tmp/doudizhu-v11-visual-gate/V/V-780x360-02-bidding.png` | `/tmp/doudizhu-v11-visual-gate/V/V-780x360-10-settlement.png` | `/tmp/doudizhu-v11-visual-gate/V/V-780x360-11-return-lobby.png` |

链路覆盖：

- 大厅 home → 开始新局 → game。
- 叫抢阶段截图。
- 真实 playing 阶段循环推进，覆盖「提示」「出牌」「不要」。
- 暂停 → 暂停菜单 → 继续。
- 真实结算弹层。
- 结算「返回大厅」→ lobby home。

结算黑边扫描：

```text
V-780x360-10-settlement.png pure_black 0 near_black 0
V-812x375-10-settlement.png pure_black 0 near_black 0
V-844x390-10-settlement.png pure_black 0 near_black 0
V-915x412-10-settlement.png pure_black 0 near_black 0
```

## 交互复核

- 大厅入口按钮可点击，成功进入 game。
- 游戏按钮「提示 / 出牌 / 不要 / 暂停 / 继续」均可点击并推进真实状态。
- 结算按钮「返回大厅」可点击并回到 lobby。
- 四档均 `productErrors=[]`。
- 手牌点击后有选牌反馈：自动化记录首张手牌 `world.y` 从 `62` 抬到 `80`。瞬时按压态 `scale/opacity` 在 headless CDP 采样中未能稳定捕获，故这里只记录选牌反馈为可见证据；主观手感仍建议用户终审时再手测一次。

## 发现清单

### Blocker / Release Gate Candidate

1. **构建产物 orientation 仍为 `auto`，与 V spec 的 `landscape` 不一致。**
   - 现象：`build/web-mobile/src/settings.json` 中 `screen.orientation === "auto"`，虽然 `designResolution` 已是 `844x390` 且 `exactFitScreen:true`。
   - 截图/证据：`/tmp/doudizhu-v11-visual-gate/V/summary.json` 的 `settings.orientation`。
   - 归属文件域：构建/项目配置 scoped-fix，优先查 `settings/v2/packages/project.json` 与 Creator build profile。
   - 影响：可能允许移动端竖屏旋转，不符合 v1.1「横屏发布态」目标。

### Nit / Scoped Fix Candidates

2. **叫抢提示仍暴露原始座位号。**
   - 现象：四档叫抢截图均出现 `请座位 1 行动`。
   - 截图：`/tmp/doudizhu-v11-visual-gate/V/V-780x360-02-bidding.png`（四档同类）。
   - 归属文件域：`assets/scripts/ui/bidding-view.ts` + `test/ui/bidding-view.test.ts`。
   - 备注：这就是已预登记的 `T-COPY-BID`。

3. **叫抢阶段顶部提前显示 `地主：你`。**
   - 现象：地主尚未决出时，顶部已经显示 `地主：你`。
   - 截图：`/tmp/doudizhu-v11-visual-gate/V/V-780x360-02-bidding.png`。
   - 归属文件域：`assets/scripts/ui/screen-view.ts`（`topBar.landlordSeat: snapshot?.landlord ?? 0`）及消费侧 `assets/scripts/ui/components/game-scene-skeleton.ts`。
   - 建议：bidding 阶段显示 `地主：待定` 或隐藏地主字段，settled/playing 后再显示真实地主。

4. **780x360 结算弹层底部略挤。**
   - 现象：最紧档结算弹层按钮接近底部装饰和手牌区，仍可读可点，但视觉余量偏小。
   - 截图：`/tmp/doudizhu-v11-visual-gate/V/V-780x360-10-settlement.png`。
   - 归属文件域：`assets/scripts/ui/components/game-scene-skeleton.ts` 结算面板布局。
   - 建议：后续 polish 可略上移按钮或缩小结算面板底部装饰占位。

## 测试与类型检查输出

```text
npm --prefix test run typecheck
> tsc --noEmit
pass

npm --prefix test test
Test Files  134 passed (134)
Tests       659 passed (659)
```

## 与 spec 的偏差 / 关键决策

- V-0 baseline 未落盘，本次按 spec 作为发布态全新验证，不做回归 diff。
- 自动化脚本保存在仓库外 `/tmp/doudizhu-v-e2e.cjs`，不进入分支。
- 发现项全部只记录，不在 V 内修复。
- 因自动化运行在 headless Chromium，手牌瞬时按压态只做有限取证；选牌抬起反馈已可见，最终手感归用户主观 PLAYTEST 终审。

## 疑问（给架构）

- `orientation:auto` 是否作为 V 后必须修复的 release blocker？我建议按横屏目标列为 scoped-fix，并在修复后补一次 settings + 四档轻量 smoke。
- `地主：你` 的未决阶段展示是否与 T-COPY-BID 合并成一批文案修复，还是单独按 `screen-view.ts` 发一个 topBar scoped-fix？

## 自检（对照验收项）

- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获 `approved` 前未合并 main
- [x] verify-only，未改产品代码
