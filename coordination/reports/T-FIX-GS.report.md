# T-FIX-GS 实现报告

- 实现方标识：Codex
- 分支：`task/T-FIX-GS`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/screen-view.ts`
  - `ScreenVM.topBar.landlordSeat` 改为 `SeatIndex | null`。
  - 未决 landlord 时输出 `null`，不再兜底为 seat 0。
- `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `renderTopBar` 接受 `landlordSeat: number | null`。
  - `landlordSeat === null` 时不创建 `top-landlord` 标签，避免叫抢未决阶段显示 `地主：你`。
  - 横屏结算面板收紧 score 区高度并上移按钮，给 780x360 底部保留余量。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  134 passed (134)
Tests       659 passed (659)

npm --prefix test run typecheck
tsc --noEmit passed
```

## 视觉 / CDP 证据
```
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator --project /Users/admin/Documents/Cocos/斗地主.worktrees/T-FIX-GS --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"

node /tmp/doudizhu-t-fix-gs-smoke.mjs build/web-mobile /tmp/doudizhu-v11-visual-gate/T-FIX-GS
```

- 构建日志结尾：`build Task (web-mobile) Finished in (3 s)`；Creator CLI 进程退出码为 36（metrics/shutdown 阶段），产物已生成。
- CDP 四横屏：844x390 / 812x375 / 915x412 / 780x360。
- `productErrors=[]`。
- 叫抢未决态：四档 `top-landlord` 均不存在，`地主：` 标签列表为空。
- 结算按钮底部余量：四档 `minButtonMargin=39.42px`，780x360 不贴底。
- 截图与 summary：
  - `/tmp/doudizhu-v11-visual-gate/T-FIX-GS/summary.json`
  - `/tmp/doudizhu-v11-visual-gate/T-FIX-GS/T-FIX-GS-*-bidding.png`
  - `/tmp/doudizhu-v11-visual-gate/T-FIX-GS/T-FIX-GS-*-settlement.png`

## 合并证据（approved 后由执行者回填）
- 合并前回归：
  - `npm --prefix test test`：
  - `npm --prefix test run typecheck`：
- merge commit：
- BOARD 状态：

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `deriveResultView({ landlord: snapshot?.landlord ?? 0 })` 保持不变；该路径只用于已有结算信息的结果视图，不影响未决叫抢顶部字段。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 四横屏 CDP 证据已补
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获 `approved` 前未合并 main；获批后仅通过 `agentctl.sh claim/merge/release` 合并
- [x] 未 import cc
