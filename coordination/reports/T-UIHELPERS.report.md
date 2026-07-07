# T-UIHELPERS 实现报告

- 实现方标识：Codex
- 分支：`task/T-UIHELPERS`
- 基线：`main@c5d3029`
- 状态：in-review（执行者视觉自审通过，待规划者视觉审；通过后交 R-WAVE8 的 `R:T-UIHELPERS`）

## 改了哪些文件

- `assets/scripts/ui/components/ui-helpers.ts`
- `assets/scripts/ui/components/game-scene-skeleton.ts`
- `assets/scripts/ui/components/lobby-scene.ts`
- `assets/scripts/ui/strings.ts`
- `coordination/reports/T-UIHELPERS.report.md`

未改测试、规则、AI、流程、存档、资源、`.meta`、场景、prefab、根 `package.json`、`tsconfig.json` 或 `cocos.config.json`。

## 实现摘要

- 在 `ui-helpers.ts` 新增共享机械装配 helper：
  - `addSkinnedButton`
  - `addSkinnedSprite`
  - `drawPanelSkin`
- 保留既有导出：
  - `drawPanel`
  - `addUiTransform`
  - `addLabel`
  - `addButton`
  - `loadSprite`
- `lobby-scene.ts` 和 `game-scene-skeleton.ts` 不再直接装配 `Button`，改为保留各自的 skin/icon/text/layout 策略，再委托共享 helper 生成背景、图标、label 与 click 绑定。
- `drawPanel` 仍然保留且 active；现仍被 HUD、叫抢/动作、结算、座位渲染器调用。
- `addUiButton` 在本分支未发现导出或调用；`rg -n "addUiButton" assets test` 无命中，本任务无需删除遗留代码。

## 文案常量化

组件内硬编码中文已迁移到 `assets/scripts/ui/strings.ts`，组件通过 `t(...)` 或局部 `*_TEXT` 常量引用。迁移覆盖：

- Lobby：首页标题、开始/继续/暂无存档、设置、教程、帮助、战绩、历史。
- Lobby 设置与教程：音效、震动、动效、开/关、当前、新手教程、重点、玩家手牌、叫抢区域、出牌区、操作按钮、结算面板、当前步骤、上一步/下一步/完成/跳过/上滚/下滚/返回。
- Lobby 统计与历史：局数、胜率、净分、难度、普通、暂无完成对局、暂无战绩、全部、胜、负、地主、农民、最新、最早、暂无匹配历史。
- Game 顶栏/状态：叫地主、对局中、本局结算、已终止、地主待定、地主、倍数、炸弹、手牌、玩家手牌。
- Game 暂停/退出：暂停、本局进度已保留、继续、重开、退出、退出对局、确认后返回大厅、确认、取消、返回大厅。
- Game 错误与 toast：叫抢失败、出牌失败、不能过牌、炸弹、火箭、不要、春天、反春天。

机械 grep 证据：

```
rg -n "[\p{Han}]" assets/scripts/ui/components/lobby-scene.ts assets/scripts/ui/components/game-scene-skeleton.ts
# 无输出
```

`strings.ts` 保留原有 key，并新增本次需要的局部 UI 文案 key。可见文案像素 diff 为 0，未改变最终画面。

## 构建证据

当前分支命令：

```
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator --project /Users/admin/Documents/Cocos/斗地主.worktrees/T-UIHELPERS --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

结果：

```
日志含：build Task (web-mobile) Finished in (4 s)ms
退出码：36
产物路径：build/web-mobile
```

说明：本机 Creator CLI 在该项目上沿用既有行为，构建完成后仍可能以 36 退出；按现有验收口径，以日志 `build Task (web-mobile) Finished` 作为产物生成证据。

基线 `c5d3029` 也用同一构建参数生成 before evidence，结果同样包含 `build Task (web-mobile) Finished` 与退出码 36。baseline 构建日志里存在既有 Creator/editor 噪声，但浏览器验收 `productErrors=[]`。

## GUI / Editor Evidence

使用 Cocos Creator 3.8.8 构建 `web-mobile`，再用 Playwright 驱动 Chrome 打开构建产物截图。P-G4 脚本覆盖 lobby/playing/settlement；pause 由本任务补充脚本覆盖。所有证据文件均在 `/tmp`，不进入提交。

Evidence 路径：

```
/tmp/doudizhu-t-uihelpers-before-evidence/summary.json
/tmp/doudizhu-t-uihelpers-after/summary.json
/tmp/doudizhu-t-uihelpers-before-pause/summary.json
/tmp/doudizhu-t-uihelpers-after-pause/summary.json
/tmp/doudizhu-t-uihelpers-after-contact.png
```

截图覆盖：

| viewport | before captures | after captures | phases | before productErrors | after productErrors |
|---|---:|---:|---|---|---|
| 844x390 | 11 + pause | 11 + pause | lobby / bidding / playing / settled / pause | `[]` | `[]` |
| 812x375 | 11 + pause | 11 + pause | lobby / bidding / playing / settled / pause | `[]` | `[]` |
| 915x412 | 11 + pause | 11 + pause | lobby / bidding / playing / settled / pause | `[]` | `[]` |
| 780x360 | 11 + pause | 11 + pause | lobby / bidding / playing / settled / pause | `[]` | `[]` |

像素级 before/after diff：

```
regular captures: 44 pairs
pause captures: 4 pairs
missing: 0
diffCount: 0
```

执行者视觉自审四类硬伤：

| viewport | 文字重叠/溢出 | 裸文字按钮 | 视觉错位/裁切 | 低对比/不可读 | 结论 |
|---|---|---|---|---|---|
| 844x390 | pass | pass | pass | pass | pass |
| 812x375 | pass | pass | pass | pass | pass |
| 915x412 | pass | pass | pass | pass | pass |
| 780x360 | pass | pass | pass | pass | pass |

执行者自审仅覆盖机械视觉硬伤，不替代规划者视觉审，也不替代用户主观终审。

## 规划者视觉审第二层（Opus · 2026-07-07 · **PASS**）

> 机械重构等价性 = 本任务视觉审的唯一命题：before 基线为 main `c5d3029`（C 波验收过的画面），若 after 与 before 逐像素一致则不可能引入新硬伤；剩余风险仅「一致地坏」，以目检兜底排除。

- **像素 diff 独立重算（不采信报告数字）**：规划者用 PIL `ImageChops.difference` 亲算全部 **48 对**（4 视口 × 11 常规 + 4 视口 × 1 pause）——`missing=0`、`diffPairs=0`，每像素 RGBA 完全一致。文件名清单 before/after 逐一对齐。
- **summary 独立核验**：4 份 summary × 4 视口（844×390/812×375/915×412/780×360）全部 `productErrors=[]` + `failedResponses=[]`；before/after 同 seed=`20260705`（同局面可比）；覆盖 lobby/bidding/playing/settled/pause 相位。
- **目检兜底（防「一致地坏」）**：contact sheet 16 格全景 + 844×390 lobby/playing/settlement/pause 全尺寸 + 780×360 playing 最窄档全尺寸，四类硬伤逐类核销——① 文字重叠/溢出：零（面板/名牌/顶栏/手牌行各归其位）② 裸文字按钮：零（lobby 三面板、出牌/不要/提示、结算双按钮、暂停六按钮皮肤全在位，disabled 灰皮肤正确）③ 视觉错位/裁切：零（对照历史基线画面结构一致）④ 低对比/不可读：零（难度描述小字、结算明细、最窄档均可读）。
- **文件域 sanity**：diff 恰 5 文件全在声明域（ui-helpers +161 / strings +63 / skeleton / lobby / report），规模与机械重构 + 文案迁移相称；代码逐行正确性归审查者。
- **结论：规划者视觉审 PASS。** 双层视觉预审闭合（执行者自审 + 规划者第二层），转审查者按 R-WAVE8 `R:T-UIHELPERS` 审代码与证据（grep 文案零漂移 / addUiButton 0 命中如实记录 / 机械替换逐行核 / 全量双绿）。

## 测试与类型检查

```
npm --prefix test install
# completed；仅报告既有 test 依赖漏洞提示，未改依赖

npm --prefix test run typecheck
# tsc --noEmit passed

npm --prefix test test
# Test Files 149 passed (149)
# Tests      768 passed (768)

git diff --check
# passed
```

## 机械核查

```
rg -n "addUiButton" assets test
# 无输出

rg -n "\bButton\b" assets/scripts/ui/components/lobby-scene.ts assets/scripts/ui/components/game-scene-skeleton.ts
# 无输出

rg -n "drawPanel\(" assets/scripts/ui test
# ui-helpers.ts 仍导出；bid-actions-renderer / hud-renderer / result-overlay-renderer / seats-renderer 仍调用
```

## 偏差 / 说明

- P-G4 e2e 脚本的 `task` 字段仍显示 `P-G4-UI-REMAKE`，但输出目录为 `/tmp/doudizhu-t-uihelpers-*`；这是复用既有视觉脚本导致的标签差异，不影响证据归属。
- P-G4 e2e 脚本不覆盖 pause phase；本任务另补 pause 截图脚本，并做 before/after 像素 diff。
- Playwright 使用本机已有安装路径 `NODE_PATH=/Users/admin/open-design/node_modules/.pnpm/playwright@1.60.0/node_modules`，未新增项目依赖。
- `/tmp` 下 before/after 截图与 summary 作为审查证据保留；不把二进制截图纳入任务允许文件域。

## 工作树状态

预期改动：

```
M  assets/scripts/ui/components/ui-helpers.ts
M  assets/scripts/ui/components/game-scene-skeleton.ts
M  assets/scripts/ui/components/lobby-scene.ts
M  assets/scripts/ui/strings.ts
A  coordination/reports/T-UIHELPERS.report.md
```

## 批次交接记录 / 下一步

- 所属批次 / 任务号：WAVE8 / `T-UIHELPERS`
- 本回合结论 / 状态：共享 UI helper 机械重构完成；全量测试、typecheck、diff-check、Cocos build、四横屏 before/after GUI 与 pause 证据通过；执行者视觉自审通过。
- 下一步找谁：规划者视觉审。
- 原因：任务书要求“双层视觉预审（执行者自审四类硬伤 -> 规划者视觉审）”，规划者视觉审通过后才转审查者按 R-WAVE8 的 `R:T-UIHELPERS`。
- 待用户终审事项：本任务不替代用户主观视觉终审；用户主观项由用户保留最终判断。

给下一窗口的可粘贴提示词：

```
你是本仓库 斗地主 的规划者/视觉预审 AI。请对 T-UIHELPERS 做第二层视觉审。
先读：coordination/PROTOCOL.md、coordination/tasks/T-UIHELPERS.md、coordination/reports/T-UIHELPERS.report.md、coordination/BOARD.md 的 T-UIHELPERS 行。
当前分支：task/T-UIHELPERS，worktree：/Users/admin/Documents/Cocos/斗地主.worktrees/T-UIHELPERS。
请核验共享 helper 机械重构没有改变画面：重点看 /tmp/doudizhu-t-uihelpers-after-contact.png，以及 /tmp/doudizhu-t-uihelpers-before-evidence、/tmp/doudizhu-t-uihelpers-after、/tmp/doudizhu-t-uihelpers-before-pause、/tmp/doudizhu-t-uihelpers-after-pause 的 4 横屏截图和 summary。四类硬伤：文字重叠/溢出、裸文字按钮、视觉错位/裁切、低对比/不可读。若通过，请在报告或审查交接中标记规划者视觉审 PASS，并转审查者按 R-WAVE8 的 R:T-UIHELPERS 审代码与证据。
```

## 自检（对照验收项）

- [x] 仅改任务允许文件域
- [x] 新增共享 `addSkinnedButton` / `addSkinnedSprite` / `drawPanelSkin`
- [x] 保留旧 `drawPanel` / `addUiTransform` / `addLabel` / `addButton` / `loadSprite`
- [x] lobby 与 game skeleton 消费共享 helper，局部策略仍留在各自组件
- [x] `addUiButton` 无遗留调用
- [x] `drawPanel` 仍 active
- [x] 组件硬编码中文迁移到 `strings.ts`
- [x] 4 横屏 lobby/playing/settlement/pause before/after 证据齐
- [x] `productErrors=[]`
- [x] before/after 像素 diff 0
- [x] Cocos web-mobile 构建日志含 `build Task (web-mobile) Finished`
- [x] 全量测试通过
- [x] typecheck 通过
- [x] `git diff --check` 通过

## 审查者评审（GLM-5.2 · 2026-07-07）

### 评审结论：approved（0 打回轮次）

- 分支：`task/T-UIHELPERS`（基线 main `bb59483`·实现 `480b2e4`·规划者视觉审②PASS `c5f5756`）
- 审查基线：main `ddee2e9` → 分支 `c5f5756`

### 逐项核销

1. **文件域**：恰 5 产品文件（ui-helpers.ts +161 / game-scene-skeleton.ts / lobby-scene.ts / strings.ts +63 / report）+ BOARD.md（规划者状态行更新·预期）。test/ 零 diff。✅
2. **机械替换逐行核**：
   - `addSkinnedButton`：Button transition/target/interactable/colors、bg sprite SLICED、icon 阈值（skeleton ≥136 / lobby ≥72）、label fontSize/lineHeight/position/width/height 逐参数等价。skeleton 旧版 `selected` 不传 skinPath（2 参回调），lobby 旧版传 `selected`（3 参回调）——共享件通过 `options.selected ?? false` + 回调签名统一处理，两组件行为不变。✅
   - `addSkinnedSprite`：ensureNode/setPosition/addUiTransform/Sprite Type/sizeMode/load 调用链与旧 `this.addSprite` 逐行等价。skeleton 旧 `loadSprite` 带内部 cache，lobby 新增私有 `loadSprite` 包装 `loadSprite(path, sprite, this.spriteFrames)`。✅
   - `drawPanelSkin`：`parent.getComponent(Graphics)?.clear()` + `addSkinnedSprite(sliced=true)` + `setSiblingIndex(0)` 与旧实现逐行等价。✅
3. **文案迁移零漂移**：`rg "[\p{Han}]"` 两组件 0 命中；73 个 `t()` key 全部在 strings.ts 定义（87 key 中 73 被消费·14 为既有 key 供其它组件用）；strings.ts 纯增 63 行无删除；逐字面量比对全部一致（含 `倍数×`/`炸弹×` 前缀、`重点：` 含冒号、`退出对局？` 含问号）。`outcomeLabel === LOBBY_TEXT.win` 等价 `=== '胜'`（值不变·机械迁移非 i18n）。✅
4. **drawPanel 5 处消费未动**：`drawPanel` 函数体未改；bid-actions-renderer / hud-renderer / result-overlay-renderer / seats-renderer diff 零行；均只导入 `addUiTransform` + `drawPanel`（均未改）。✅
5. **addUiButton**：全仓 `rg "addUiButton"` 0 命中；报告如实记录"已不存在、无需删"。✅
6. **Button 导入**：两组件 `\bButton\b` 0 命中；`Graphics` 保留（其它绘制仍用）。✅
7. **测试/类型检查**：149/768 绿、typecheck 净、`git diff --check` 净。✅
8. **视觉证据链**（只核链完整性·不亲验图像）：48 对（44 常规 + 4 pause）`diffCount=0`/`missing=0`、4 横屏×5 相位 `productErrors=[]`、规划者 PIL `ImageChops.difference` 独立重算 PASS（c5f5756）、双层视觉预审闭合。✅

### 全量回扫

- **范围**：全仓 `rg` 扫描 ui-helpers 所有导入方（6 文件：2 改 + 4 未改 renderer）、strings.ts 全 key 交叉验证、drawPanel/drawPanelSkin/addButton 调用链追踪、`Button`/`Graphics` 导入审计。
- **域内致命**：0
- **域外致命**：0
- **拿不准**：0
- 无其它模块回归或交互隐患。

### 合并计划

- 常规任务（editor-evidence 机械重构·非高风险）→ 审查者连续合并
- BOARD 3-way 冲突预期：分支 BOARD 行为旧版（ready·重建信息），main 为新版（in-progress·视觉审②PASS）→ 合并时取 main 版再改 approved
