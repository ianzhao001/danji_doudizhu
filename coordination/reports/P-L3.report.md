# P-L3 实现报告

- 实现方标识：Codex
- 分支：`task/P-L3`
- 状态：阶段①已实现；阶段②已实现待审

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

## 阶段②开工同步

- 已在 worktree 内执行 `git merge main`，合入 main `95da87d`，生成 merge commit `7d09e63`。
- ART-IMPORT-UIKIT 已在 main 提供 v12 uikit 资源与 `RESOURCE_PATHS` 键；本阶段只做 lobby 接线与可读性收口。

## 阶段②改动文件

- `assets/scripts/ui/components/lobby-scene.ts`

## 阶段②实现摘要

- 大厅背景继续使用 `lobbyBg`，home summary / 难度 / 设置 / 教程 / 帮助 / 战绩 / 历史面板统一接 `panel-popup` 九宫格皮。
- 按钮绘制接 `btn-primary` / `btn-secondary` / `btn-disabled` 三态皮；开关态以 primary/secondary 区分，返回类按钮补 `icon-back`，设置标题补 `icon-settings`。
- 战绩与历史空态接 `empty-records` 插画。
- 用户反馈后做可读性返修：亮色按钮、难度行、面板正文与空态文案统一使用深粉/深蓝/深棕文字，不再在亮色图上压白字。

## 阶段②测试与类型检查

```
npm --prefix test test
=> Test Files 140 passed (140)
=> Tests 711 passed (711)

npm --prefix test run typecheck
=> tsc --noEmit passed

git diff --check
=> passed
```

## 阶段② Creator / CDP 证据

- Creator build：

```
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /Users/admin/Documents/Cocos/斗地主.worktrees/P-L3 \
  --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

- Creator 返回既有 metrics exit code `36`；`temp/logs/project.log` 记录 `build Task (web-mobile) Finished in (4 s)`，并生成 `build/web-mobile/`。
- 本机 Creator 用户配置存在 `~/.CocosCreator/editor/window.json` 恢复警告；该警告发生在 build finished 后，未影响包生成与 CDP 运行。
- 标准 P-L smoke：`node /tmp/doudizhu-v11-visual-smoke.mjs P-L /Users/admin/Documents/Cocos/斗地主.worktrees/P-L3/build/web-mobile /tmp/doudizhu-wave2-p-l3-phase2-readable`
  - 输出：`/tmp/doudizhu-wave2-p-l3-phase2-readable/summary.json`
  - 结论：25 张截图，`productErrors=[]`。
  - 四横屏 × 6 个 lobby 画面截图在目录 `/tmp/doudizhu-wave2-p-l3-phase2-readable/`：
    - `P-L-*-home.png`
    - `P-L-*-tutorial.png`
    - `P-L-*-help.png`
    - `P-L-*-stats.png`
    - `P-L-*-records.png`
    - `P-L-*-difficulty-settings.png`
  - 交互截图：`/tmp/doudizhu-wave2-p-l3-phase2-readable/P-L-844x390-home-start-button-pressed.png`，点击后进入 `game`。
- 人工抽样已打开：
  - `/tmp/doudizhu-wave2-p-l3-phase2-readable/P-L-844x390-home.png`
  - `/tmp/doudizhu-wave2-p-l3-phase2-readable/P-L-844x390-records.png`
  - `/tmp/doudizhu-wave2-p-l3-phase2-readable/P-L-844x390-help.png`
  - 结论：按钮、难度说明、筛选按钮、空态和帮助正文均为深色文字，亮色皮肤上无白字糊成一片的问题。

## 自检

- [x] 仅改声明文件域。
- [x] 未改 `test/**`。
- [x] 未碰 `game-scene` / 纯层。
- [x] 未手写 `.meta`。
- [x] 全量 vitest / typecheck / diff check 通过。
- [x] CDP 横屏、无档、有档、续局恢复证据齐全。
- [x] 阶段② uikit 接线、按钮三态、面板九宫格、空态图与可读性返修完成。
- [x] 阶段② Creator build + 25 张 CDP 截图 + 人工抽样通过。

## 审查者评审（GLM-5.2 · 2026-07-04 · 阶段② + 整分支合并闸）

### 评审范围
覆盖 P-L3 阶段②增量（commit ffe0e25）及整分支（main..task/P-L3）全量回扫。①已 approved 不复审实现，但纳入全量回扫。

### 检查单核销（R-WAVE2）
**阶段②（美术接线）**
- [x] 同 P-G3③ 口径：panel-popup 九宫格皮（drawPanelSkin 替代 drawPanel）；btn-primary/secondary/disabled 三态皮（Button.Transition.COLOR）。
- [x] icon-back：返回按钮 name 以 -back-button 结尾（help-back-button/stats-back-button/records-back-button）→ iconBack。
- [x] icon-settings：设置面板补 iconSettings。
- [x] empty-records 空态：stats/records 空态贴图。
- [x] toggle 开关态样式统一：toggle.on 作 selected → primary/secondary 区分（原恒 disabled 样式已替换）。
- [x] home+6 子屏截图：4 横屏 × 6 屏 + 交互截图，productErrors=[]。

### 红线
- 未碰 test/**（git diff main..task/P-L3 -- test/ 为空）。
- 未碰 game-scene/纯层（git diff --stat game-scene* 及纯层目录为空）。
- .meta/.scene 未碰。

### 测试与类型检查（审查者独立复跑）
- main 基线：140 文件 / 711 用例全绿 + typecheck 净。
- P-L3 worktree typecheck 净。
- diff --check 净。

### 可读性返修核查
- 颜色常量均为深色系：PANEL_TEXT(108,46,76)/PANEL_MUTED(142,88,108)/PANEL_ACCENT(198,68,124)/PANEL_GOOD(77,126,88)/PANEL_BAD(176,72,88)/BUTTON_PRIMARY_TEXT(116,36,82)/BUTTON_SECONDARY_TEXT(34,78,132)/BUTTON_DISABLED_TEXT(118,108,114)。
- addUiLabel 正确消费 color 参数；addLabel 默认色从 white 改为 PANEL_TEXT。
- image skill 截图分析：home/records/help 文字在亮色背景上清晰可辨。
- 执行者人工抽样确认深色文字可读。

### 全量回扫
- addUiButton/drawPanel 在 main 上只被本两巨组件引用——合并后改用本地实现。
- RESOURCE_PATHS 引用键全部存在（buttonPrimary/Secondary/Disabled、iconBack/Settings、panelPopup、emptyRecords）。
- 按钮名匹配 buttonSkinPath/buttonIconPath 判断（home-start-button/home-continue-button → primary；-back-button → iconBack；toggle-on → primary）。
- 跨任务：P-L3 与 P-G3 文件域不相交，无交互点。
- 纯逻辑层未受影响。

### 拿不准（非阻断建议单 → 转规划者）
1. addButton/addSprite/drawPanelSkin 与 P-G3 重复实现（文件域限制）。建议后续抽取共享。不阻断合并。

### 结论
域内致命清零。全量回扫无阻断项。阶段② approved。整分支（①②）可合并。
