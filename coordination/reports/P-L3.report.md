# P-L3 实现报告

- 实现方标识：Codex
- 分支：`task/P-L3`
- 状态：阶段① in-review（阶段②待 ART-IMPORT-UIKIT 落 main 后继续）

## 阶段①改动文件

- `assets/scripts/ui/components/lobby-scene.ts`

## 实现摘要

- `deriveLobbyView` 入参从硬编码 `savedSlot: null` 改为读取 `STORAGE_KEYS.save` 的真实存档槽。
- 「开始新局」与「继续游戏」行为拆开：
  - 开始新局：先清 `doudizhu.save`，再进入 `game`。
  - 继续游戏：仅在真实存档存在时可点；点击前再二次确认存档仍存在，无档则留在 lobby 并刷新按钮状态。
- 无档态按钮显示「暂无存档」且 disabled；有档态显示「继续游戏」且 interactable。
- home summary 栏做轻量密度微调：面板宽高略放宽，主按钮宽度略增，摘要行整体下移，三栏结构不变。

## 测试与类型检查

```
npm --prefix test test
=> Test Files 139 passed (139)
=> Tests 703 passed (703)

npm --prefix test run typecheck
=> tsc --noEmit passed

git diff --check
=> passed
```

## Creator / 构建烟测

- 命令：

```
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /Users/admin/Documents/Cocos/斗地主.worktrees/P-L3 \
  --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

- Creator 返回既有 metrics exit code `36`；`temp/logs/project.log` 记录 `build Task (web-mobile) Finished in (4 s)`，并生成 `build/web-mobile/`。

## CDP visual gate 证据

基础横屏回归：

- 执行脚本：`node /tmp/doudizhu-v11-visual-smoke.mjs P-L /Users/admin/Documents/Cocos/斗地主.worktrees/P-L3/build/web-mobile /tmp/doudizhu-wave2-p-l3-phase1`
- 输出：`/tmp/doudizhu-wave2-p-l3-phase1/summary.json`
- 结论：25 张截图，`productErrors=[]`。

P-L3 存档/续局专项：

- 输出：`/tmp/doudizhu-wave2-p-l3-save-resume/summary.json`
- 无档四横屏截图：
  - `/tmp/doudizhu-wave2-p-l3-save-resume/P-L3-844x390-home-nosave.png`
  - `/tmp/doudizhu-wave2-p-l3-save-resume/P-L3-812x375-home-nosave.png`
  - `/tmp/doudizhu-wave2-p-l3-save-resume/P-L3-915x412-home-nosave.png`
  - `/tmp/doudizhu-wave2-p-l3-save-resume/P-L3-780x360-home-nosave.png`
- 无档按钮 CDP 读数：四档均 `label="暂无存档"`，`buttonInteractable=false`。
- 有档截图：`/tmp/doudizhu-wave2-p-l3-save-resume/P-L3-844x390-home-with-save.png`
- 续局前局面：`phase="playing"`，`handCount=20`，`handCounts=[20,17,17]`，`turn=0`，`saveHash=d9674564`。
- 点击「继续游戏」后局面：`phase="playing"`，`handCount=20`，`handCounts=[20,17,17]`，`turn=0`，`saveHash=d9674564`。
- 恢复截图：
  - 写档后 game：`/tmp/doudizhu-wave2-p-l3-save-resume/P-L3-844x390-game-saved.png`
  - 续局后 game：`/tmp/doudizhu-wave2-p-l3-save-resume/P-L3-844x390-game-resumed.png`
- 真实存档 sha256：`ef646bdb7dc2018118ef97beb6a0b8e004803feb6abbee276084ecc1b15812d2`
- `productErrors=[]`。

## 阶段②状态

- 阶段②美术接线依赖 ART-IMPORT-UIKIT 落 main。当前阶段①不接线新 uikit 资源，避免跨任务提前消费未合并资产键。

## 自检

- [x] 仅改声明文件域。
- [x] 未改 `test/**`。
- [x] 未碰 `game-scene` / 纯层。
- [x] 未手写 `.meta`。
- [x] 全量 vitest / typecheck / diff check 通过。
- [x] CDP 横屏、无档、有档、续局恢复证据齐全。
