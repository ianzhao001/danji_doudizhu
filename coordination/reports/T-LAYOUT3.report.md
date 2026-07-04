# T-LAYOUT3 实现报告

- 实现方标识：Codex
- 分支：`task/T-LAYOUT3`
- 状态：in-review（round 1 返工已提交，待复审）

## 改了哪些文件

- `assets/scripts/ui/table-zones.ts`
- `coordination/reports/T-LAYOUT3.report.md`

## 实现摘要

- `TableZones` 纯加法扩展 v13 新区：`heroBody`、`opponentLeftBody`、`opponentRightBody`、`heroNameplate`、`opponentLeftNameplate`、`opponentRightNameplate`、`heroHandLarge`、`tableActionBar`、`settlementShowcase`。
- 保持 legacy 6 字段来自 `tableLayout(width, height)` 并与旧测试深相等；旧 `actionBar` / `playerHand` 不改，v13 接线后消费 `tableActionBar` / `heroHandLarge`。
- v13 新区使用独立 `gameRemakeZones()` 计算：三名角色围桌、底部大手牌、桌面中部行动区、居中结算展示区。
- 纯函数、确定性；未 import `cc`。

## 四横屏 v13 zone 尺寸

导出命令：

```
npm --prefix test exec -- tsx -e "import { tableZones } from './assets/scripts/ui/table-zones.ts'; const names=['heroBody','opponentLeftBody','opponentRightBody','heroNameplate','opponentLeftNameplate','opponentRightNameplate','heroHandLarge','tableActionBar','settlementShowcase','bottomCardsDock']; for (const [w,h] of [[844,390],[812,375],[915,412],[780,360]]) { const z=tableZones(w,h); console.log('## '+w+'x'+h); for (const n of names) { const r=(z as any)[n]; console.log(n+': '+JSON.stringify(r)); } }"
```

```
## 844x390
heroBody: {"x":8,"y":140,"width":152,"height":164}
opponentLeftBody: {"x":8,"y":47,"width":169,"height":249}
opponentRightBody: {"x":667,"y":47,"width":169,"height":249}
heroNameplate: {"x":8,"y":271,"width":152,"height":33}
opponentLeftNameplate: {"x":16,"y":179,"width":152,"height":33}
opponentRightNameplate: {"x":684,"y":179,"width":152,"height":33}
heroHandLarge: {"x":176,"y":304,"width":660,"height":86}
tableActionBar: {"x":287,"y":247,"width":270,"height":49}
settlementShowcase: {"x":186,"y":35,"width":473,"height":195}
bottomCardsDock: {"x":321,"y":58,"width":203,"height":27}

## 812x375
heroBody: {"x":8,"y":135,"width":146,"height":157}
opponentLeftBody: {"x":8,"y":45,"width":162,"height":239}
opponentRightBody: {"x":642,"y":45,"width":162,"height":239}
heroNameplate: {"x":8,"y":260,"width":146,"height":32}
opponentLeftNameplate: {"x":16,"y":172,"width":146,"height":32}
opponentRightNameplate: {"x":658,"y":172,"width":146,"height":32}
heroHandLarge: {"x":171,"y":292,"width":633,"height":83}
tableActionBar: {"x":276,"y":237,"width":260,"height":47}
settlementShowcase: {"x":179,"y":34,"width":455,"height":188}
bottomCardsDock: {"x":309,"y":57,"width":195,"height":26}

## 915x412
heroBody: {"x":8,"y":148,"width":156,"height":173}
opponentLeftBody: {"x":8,"y":49,"width":176,"height":264}
opponentRightBody: {"x":731,"y":49,"width":176,"height":264}
heroNameplate: {"x":8,"y":286,"width":164,"height":35}
opponentLeftNameplate: {"x":16,"y":189,"width":164,"height":35}
opponentRightNameplate: {"x":743,"y":189,"width":164,"height":35}
heroHandLarge: {"x":176,"y":321,"width":731,"height":91}
tableActionBar: {"x":311,"y":261,"width":293,"height":52}
settlementShowcase: {"x":202,"y":37,"width":512,"height":206}
bottomCardsDock: {"x":348,"y":61,"width":220,"height":29}

## 780x360
heroBody: {"x":8,"y":130,"width":140,"height":150}
opponentLeftBody: {"x":8,"y":43,"width":156,"height":229}
opponentRightBody: {"x":616,"y":43,"width":156,"height":229}
heroNameplate: {"x":8,"y":249,"width":140,"height":31}
opponentLeftNameplate: {"x":16,"y":164,"width":140,"height":31}
opponentRightNameplate: {"x":632,"y":164,"width":140,"height":31}
heroHandLarge: {"x":164,"y":280,"width":608,"height":80}
tableActionBar: {"x":264,"y":227,"width":252,"height":45}
settlementShowcase: {"x":172,"y":32,"width":437,"height":180}
bottomCardsDock: {"x":297,"y":55,"width":187,"height":25}
```

## 测试与类型检查输出

```
npm --prefix test exec -- vitest run ui/table-zones-v13.test.ts
Test Files  1 failed (1)
Tests       16 failed (16)
主要失败：heroBody missing；作为实现前红测基线。

npm --prefix test exec -- vitest run ui/table-zones-v13.test.ts ui/table-zones.test.ts
Test Files  2 passed (2)
Tests       44 passed (44)

npm --prefix test test
Test Files  141 passed (141)
Tests       727 passed (727)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed

rg -n "from 'cc'|from \"cc\"|import .*cc" assets/scripts/ui/table-zones.ts
No cc import; only source comment contains the phrase "import `cc`".
```

## 工作树状态

```
git status --short --untracked-files=all
 M assets/scripts/ui/table-zones.ts
```

## 非文字模态 / IDE 实操验收证据

- 验收面：不适用（纯 UI 布局算法，无 Cocos/浏览器实操）
- 用户主观终审状态：不适用

## 与 spec 的偏差 / 关键决策

- 未修改种子测试；`test/ui/table-zones-v13.test.ts` 保持规划者种子。
- 旧 `playerHand` 与 `actionBar` 保持兼容，不承担 v13 大手牌/大按钮职责；新增 `heroHandLarge` 与 `tableActionBar` 给 P-G4 消费。

## 疑问 / 需规划者裁定

- 无。

## 批次交接记录 / 下一步

- 所属批次 / 任务号：UI-REMAKE 第四波 / `T-LAYOUT3`
- 本回合结论 / 状态：布局契约实现完成，已自检全绿，待审查者按 `R-UI-REMAKE` 的 `R:T-LAYOUT3` 审查。
- 下一步找谁：审查者
- 用户终审配合：不适用
- 给下一窗口的可粘贴提示词（指针化）：

```
你是本仓库 斗地主 的审查型 AI。本批/任务号：T-LAYOUT3。
先读：coordination/PROTOCOL.md、coordination/tasks/T-LAYOUT3.md、coordination/tasks/R-UI-REMAKE.md、coordination/reports/T-LAYOUT3.report.md、coordination/BOARD.md 的 UI-REMAKE 段。
本回合最小增量：task/T-LAYOUT3 已实现 v13 TableZones，报告含四横屏 zone 尺寸、红测基线和全量测试/typecheck/diff-check 证据；请按 R:T-LAYOUT3 审查，勿替用户做视觉判断。
```

## 自检（对照验收项）

- [x] 测试全绿
- [x] typecheck 无错
- [x] `git status --short --untracked-files=all` 已记录，越域未跟踪文件已清理或说明
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获精确机器态 `approved` 前未合并 main；高风险 `approved-pending-planner` 未直接合并；获批后仅由审查者通过 `agentctl.sh claim/merge/release` 合并
- [x] 未 import cc

---

## 审查者评审段（GLM-5.2 · 2026-07-05）

### 评审范围

- `git diff main..task/T-LAYOUT3`（提交 `45f2450`，基线 merge-base `ff43262`）
- 逐行细读 `assets/scripts/ui/table-zones.ts` 新增 115 行 + 种子测试 `test/ui/table-zones-v13.test.ts` 93 行
- 全量回扫：`table-zones` 全仓消费方（`game-scene-skeleton.ts`、`game-scene/*` 4 模块、`test/ui/table-zones*.test.ts`）+ `table-layout` legacy 依赖链
- 技术门复跑（worktree `../斗地主.worktrees/T-LAYOUT3`，HEAD `45f2450`）：
  - `npm --prefix test test` → **141 文件 / 727 用例全绿**（main 711 + 16 新增）
  - `npm --prefix test run typecheck` → tsc --noEmit exit 0
  - `git diff --check` → exit 0
  - `grep "from 'cc'" assets/scripts/ui/table-zones.ts` → 无匹配（纯层零 cc）

### 检查单核销（R:T-LAYOUT3 · R-UI-REMAKE.md 修订版）

- [x] 种子 `test/ui/table-zones-v13.test.ts` 未被改动（`git show 45f2450 --stat` 确认提交仅含 `table-zones.ts` + 报告，未碰 `test/`）
- [x] `TableZones` 纯加法：接口新增 9 个 v13 zone 字段，legacy 11 字段（T-LAYOUT2 的 `infoStrip`/`bottomCardsDock`/`dropZone*`/`statusLine`/`actionBar`/`strengthMeter`/`turnTimer`/`memoryDock`/`advisorDock` + `TableRegions`）逐字未改；`tableZones()` return `{ ...legacy, ...legacyZones, ...v13 }`，v13 字段名不与 legacy 冲突
- [x] legacy 6 字段兼容：`const legacy = tableLayout(width, height)` + `...legacy` 展开保证 `topBar`/`opponentLeft`/`opponentRight`/`playArea`/`actionButtons`/`playerHand` 与 `tableLayout()` 深相等
- [x] 既有 `test/ui/table-zones.test.ts`（T-LAYOUT2 28 用例）零改动全绿
- [x] `tableActionBar` 高度 `clamp(round(height*0.125), 44, 56)` ≥44px ✓（四档实测 49/47/52/45）
- [x] 纯层无 `cc` import
- [x] 全量 test/typecheck/diff-check 绿（见上技术门）

### 🔴 域内致命 — changes-requested

**heroBody 与 opponentLeftBody 在所有四横屏重叠，违反布局契约"关键可见集不重叠，最小间距 8px"**

spec `tasks/T-LAYOUT3.md` 布局契约明确："关键可见集不重叠，最小间距 8px"；R 检查单 R:T-LAYOUT3 明确："四横屏新增 zone 落屏不重叠"。三名角色立绘围桌是 v13 核心设计（spec 目标："三名角色立绘区"），同时可见，不应重叠。

实测（`rectGap(a,b) = max(x方向间距, y方向间距)`，负值=重叠）：

| 分辨率 | heroBody vs opponentLeftBody gap | 重叠面积(px) |
|----|----|----|
| 844×390 | -156 | ~152×156 |
| 812×375 | -149 | ~146×149 |
| 915×412 | -165 | ~156×165 |
| 780×360 | -142 | ~140×142 |

根因分析：`gameRemakeZones()` 中 `opponentLeftBody` 占据左侧从 `topBodyY`(~47) 到 `heroHandLarge.y - gap`(~296) 的整个高度（height = `heroHandLarge.y - gap - topBodyY` ≈ 249），而 `heroBody` 也放在左侧（`x: gap`），`heroBodyY = clamp(round(height*0.36), 128, ...)` = 140，远小于 opponentLeftBody 底边 296。两者 x 都从 `gap`(8) 开始，x 方向也重叠。设计意图应是 opponentLeftBody 在左上、heroBody 在左下，但 y 范围计算未做互斥分离。

**修复要求**：调整 `gameRemakeZones()` 使 heroBody 与 opponentLeftBody 在 x 或 y 方向分离（间距 ≥8px），同时保持现有 16 个种子测试全绿。可选方向（执行者自判）：
1. heroBody 移至中间偏下（x 不与 opponentLeftBody 重叠）
2. 缩短 opponentLeftBody 高度，给 heroBody 腾出左下方空间
3. 重新分配左侧空间，opponentLeftBody 上半、heroBody 下半

### 非阻断建议（拿不准 → 转规划者）

以下重叠可能 by-design，但 spec 未明确说明，转规划者判断是否需要修：

1. **body vs nameplate**（heroBody vs heroNameplate gap=-33、opponentLeftBody vs opponentLeftNameplate gap=-117）：nameplate 设计上贴在 body 上/内，可能预期。但 spec 说"最小间距 8px"，若 nameplate 与 body 属同一可见集则需分离。建议规划者明确 nameplate 是否"贴附"于 body（免间距约束）还是独立 zone（需间距）。
2. **body/nameplate vs settlementShowcase**（gap=-90 ~ -194）：settlementShowcase 是结算覆盖区，设计上在结算相位覆盖牌桌。若与 body/nameplate 不同相位（结算时 body 隐藏），重叠 OK。建议规划者明确 settlementShowcase 与底层 zone 的相位互斥关系。
3. **opponentLeftNameplate vs settlementShowcase**（gap=-51）：同上。

### 全量回扫结果

- **消费方回归**：`tableZones()` 的消费方（`game-scene-skeleton.ts:349`、`game-scene/hud-renderer.ts`、`game-scene/bid-actions-renderer.ts`、`game-scene/seats-renderer.ts`）当前只消费 legacy zone（`layout.actionBar`/`layout.playerHand`/`layout.opponentLeft` 等），不消费 v13 新增 zone。P-G4 接线时才消费 `heroBody`/`tableActionBar`/`heroHandLarge` 等。因此当前重叠不会造成运行时回归——但 P-G4 接线后会直接继承此缺陷，必须在本任务修复。
- **跨任务回归**：无。`table-zones.ts` 改动纯加法，不影响 legacy zone 数值；`table-layout.ts` 未改；其它模块零触碰。
- **分层不变量**：`table-zones.ts` 无 `cc` import；仅 import `table-layout`（同层 ui 纯岛），分层正确。

### 结论

**changes-requested** — 域内致命（heroBody vs opponentLeftBody 四档重叠，违反 spec 布局契约"关键可见集不重叠"+ R 检查单"新增 zone 落屏不重叠"）。打回执行者在 `task/T-LAYOUT3` 原分支修复 `gameRemakeZones()` 布局计算，使 heroBody 与 opponentLeftBody 间距 ≥8px，重跑全量 test/typecheck/diff-check 后再次提审。

打回轮次：1
非阻断建议：3 项转规划者（body/nameplate 间距豁免？settlementShowcase 相位互斥？）

---

## 执行者返工段（Codex · 2026-07-05 · round 1）

### 用户/审查者打回项

- 用户图审反馈：`bidding`、`playing`、`settlement` 三张合成预览里三个人有两个人重叠，需参考用户示意图避免人物重叠。
- 审查者打回项：`heroBody` 与 `opponentLeftBody` 在四横屏 zone 本身重叠，违反 v13 关键可见集不重叠契约。

### 修复摘要

- 只改 `assets/scripts/ui/table-zones.ts` 与本报告；未改种子测试。
- 将 `opponentLeftBody.x` 从左屏边缘改为 `heroBody.x + heroBody.width + gap`，形成“左下玩家、左上偏中 AI、右上 AI”的围桌结构。
- `heroHandLarge`、`tableActionBar`、`settlementShowcase` 的位置语义保持不变；legacy 6 字段仍来自 `tableLayout(width, height)`。

### 返工后四横屏 v13 zone 尺寸与人物交叉面积

导出命令：

```
npm --prefix test exec -- tsx -e "import { tableZones } from './assets/scripts/ui/table-zones.ts'; const sizes=[[844,390],[812,375],[915,412],[780,360]] as const; const names=['heroBody','opponentLeftBody','opponentRightBody'] as const; const full=['heroBody','opponentLeftBody','opponentRightBody','heroNameplate','opponentLeftNameplate','opponentRightNameplate','heroHandLarge','tableActionBar','settlementShowcase','bottomCardsDock'] as const; const area=(a:any,b:any)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)); for (const [w,h] of sizes) { const z=tableZones(w,h) as any; console.log('## '+w+'x'+h); for (const n of full) console.log(n+': '+JSON.stringify(z[n])); for (let i=0;i<names.length;i++) for (let j=i+1;j<names.length;j++) console.log(names[i]+' x '+names[j]+' intersection='+area(z[names[i]],z[names[j]])); }"
```

```
## 844x390
heroBody: {"x":8,"y":140,"width":152,"height":164}
opponentLeftBody: {"x":168,"y":47,"width":169,"height":249}
opponentRightBody: {"x":667,"y":47,"width":169,"height":249}
heroNameplate: {"x":8,"y":271,"width":152,"height":33}
opponentLeftNameplate: {"x":176,"y":179,"width":152,"height":33}
opponentRightNameplate: {"x":684,"y":179,"width":152,"height":33}
heroHandLarge: {"x":176,"y":304,"width":660,"height":86}
tableActionBar: {"x":287,"y":247,"width":270,"height":49}
settlementShowcase: {"x":186,"y":35,"width":473,"height":195}
bottomCardsDock: {"x":321,"y":58,"width":203,"height":27}
heroBody x opponentLeftBody intersection=0
heroBody x opponentRightBody intersection=0
opponentLeftBody x opponentRightBody intersection=0
## 812x375
heroBody: {"x":8,"y":135,"width":146,"height":157}
opponentLeftBody: {"x":162,"y":45,"width":162,"height":239}
opponentRightBody: {"x":642,"y":45,"width":162,"height":239}
heroNameplate: {"x":8,"y":260,"width":146,"height":32}
opponentLeftNameplate: {"x":170,"y":172,"width":146,"height":32}
opponentRightNameplate: {"x":658,"y":172,"width":146,"height":32}
heroHandLarge: {"x":171,"y":292,"width":633,"height":83}
tableActionBar: {"x":276,"y":237,"width":260,"height":47}
settlementShowcase: {"x":179,"y":34,"width":455,"height":188}
bottomCardsDock: {"x":309,"y":57,"width":195,"height":26}
heroBody x opponentLeftBody intersection=0
heroBody x opponentRightBody intersection=0
opponentLeftBody x opponentRightBody intersection=0
## 915x412
heroBody: {"x":8,"y":148,"width":156,"height":173}
opponentLeftBody: {"x":172,"y":49,"width":176,"height":264}
opponentRightBody: {"x":731,"y":49,"width":176,"height":264}
heroNameplate: {"x":8,"y":286,"width":164,"height":35}
opponentLeftNameplate: {"x":180,"y":189,"width":164,"height":35}
opponentRightNameplate: {"x":743,"y":189,"width":164,"height":35}
heroHandLarge: {"x":176,"y":321,"width":731,"height":91}
tableActionBar: {"x":311,"y":261,"width":293,"height":52}
settlementShowcase: {"x":202,"y":37,"width":512,"height":206}
bottomCardsDock: {"x":348,"y":61,"width":220,"height":29}
heroBody x opponentLeftBody intersection=0
heroBody x opponentRightBody intersection=0
opponentLeftBody x opponentRightBody intersection=0
## 780x360
heroBody: {"x":8,"y":130,"width":140,"height":150}
opponentLeftBody: {"x":156,"y":43,"width":156,"height":229}
opponentRightBody: {"x":616,"y":43,"width":156,"height":229}
heroNameplate: {"x":8,"y":249,"width":140,"height":31}
opponentLeftNameplate: {"x":164,"y":164,"width":140,"height":31}
opponentRightNameplate: {"x":632,"y":164,"width":140,"height":31}
heroHandLarge: {"x":164,"y":280,"width":608,"height":80}
tableActionBar: {"x":264,"y":227,"width":252,"height":45}
settlementShowcase: {"x":172,"y":32,"width":437,"height":180}
bottomCardsDock: {"x":297,"y":55,"width":187,"height":25}
heroBody x opponentLeftBody intersection=0
heroBody x opponentRightBody intersection=0
opponentLeftBody x opponentRightBody intersection=0
```

### 返工测试输出

```
npm --prefix test exec -- vitest run ui/table-zones-v13.test.ts ui/table-zones.test.ts
Test Files  2 passed (2)
Tests       44 passed (44)

npm --prefix test test
Test Files  141 passed (141)
Tests       727 passed (727)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed
```

---

## 执行者二次返工段（Codex · 2026-07-05 · round 2）

### 用户新增图审意见

- 三个人的大小需要一样。
- 玩家角色是在自己手牌的左边，不能出现在牌桌上。

### 修复摘要

- 三名角色 body 改为共用同一组 `bodyWidth` / `bodyHeight`，四横屏下三人 zone 尺寸完全一致。
- 玩家 body 仍锚定左下，但改为底部贴屏、横向与 `heroHandLarge` 分离：玩家位于手牌左侧保留区，不再进入手牌区或牌桌中央。
- 左 AI 从玩家 body 右侧 `gap=8` 开始，右 AI 贴右侧，三名 body 均不相交。

### 二次返工后四横屏 v13 zone 尺寸与人物交叉面积

```
## 844x390
heroBody: {"x":8,"y":156,"width":152,"height":234}
opponentLeftBody: {"x":168,"y":47,"width":152,"height":234}
opponentRightBody: {"x":684,"y":47,"width":152,"height":234}
heroNameplate: {"x":8,"y":271,"width":152,"height":33}
opponentLeftNameplate: {"x":176,"y":171,"width":152,"height":33}
opponentRightNameplate: {"x":684,"y":171,"width":152,"height":33}
heroHandLarge: {"x":176,"y":304,"width":660,"height":86}
tableActionBar: {"x":287,"y":247,"width":270,"height":49}
settlementShowcase: {"x":186,"y":35,"width":473,"height":195}
bottomCardsDock: {"x":321,"y":58,"width":203,"height":27}
body sizes=152x234,152x234,152x234
hero-hand gap=16
heroBody x opponentLeftBody intersection=0 gap=8
heroBody x opponentRightBody intersection=0 gap=524
opponentLeftBody x opponentRightBody intersection=0 gap=364
## 812x375
heroBody: {"x":8,"y":150,"width":146,"height":225}
opponentLeftBody: {"x":162,"y":45,"width":146,"height":225}
opponentRightBody: {"x":658,"y":45,"width":146,"height":225}
heroNameplate: {"x":8,"y":260,"width":146,"height":32}
opponentLeftNameplate: {"x":170,"y":164,"width":146,"height":32}
opponentRightNameplate: {"x":658,"y":164,"width":146,"height":32}
heroHandLarge: {"x":171,"y":292,"width":633,"height":83}
tableActionBar: {"x":276,"y":237,"width":260,"height":47}
settlementShowcase: {"x":179,"y":34,"width":455,"height":188}
bottomCardsDock: {"x":309,"y":57,"width":195,"height":26}
body sizes=146x225,146x225,146x225
hero-hand gap=17
heroBody x opponentLeftBody intersection=0 gap=8
heroBody x opponentRightBody intersection=0 gap=504
opponentLeftBody x opponentRightBody intersection=0 gap=350
## 915x412
heroBody: {"x":8,"y":165,"width":156,"height":247}
opponentLeftBody: {"x":172,"y":49,"width":156,"height":247}
opponentRightBody: {"x":751,"y":49,"width":156,"height":247}
heroNameplate: {"x":8,"y":286,"width":164,"height":35}
opponentLeftNameplate: {"x":180,"y":180,"width":164,"height":35}
opponentRightNameplate: {"x":743,"y":180,"width":164,"height":35}
heroHandLarge: {"x":176,"y":321,"width":731,"height":91}
tableActionBar: {"x":311,"y":261,"width":293,"height":52}
settlementShowcase: {"x":202,"y":37,"width":512,"height":206}
bottomCardsDock: {"x":348,"y":61,"width":220,"height":29}
body sizes=156x247,156x247,156x247
hero-hand gap=12
heroBody x opponentLeftBody intersection=0 gap=8
heroBody x opponentRightBody intersection=0 gap=587
opponentLeftBody x opponentRightBody intersection=0 gap=423
## 780x360
heroBody: {"x":8,"y":144,"width":140,"height":216}
opponentLeftBody: {"x":156,"y":43,"width":140,"height":216}
opponentRightBody: {"x":632,"y":43,"width":140,"height":216}
heroNameplate: {"x":8,"y":249,"width":140,"height":31}
opponentLeftNameplate: {"x":164,"y":157,"width":140,"height":31}
opponentRightNameplate: {"x":632,"y":157,"width":140,"height":31}
heroHandLarge: {"x":164,"y":280,"width":608,"height":80}
tableActionBar: {"x":264,"y":227,"width":252,"height":45}
settlementShowcase: {"x":172,"y":32,"width":437,"height":180}
bottomCardsDock: {"x":297,"y":55,"width":187,"height":25}
body sizes=140x216,140x216,140x216
hero-hand gap=16
heroBody x opponentLeftBody intersection=0 gap=8
heroBody x opponentRightBody intersection=0 gap=484
opponentLeftBody x opponentRightBody intersection=0 gap=336
```

### 二次返工局部测试输出

```
npm --prefix test exec -- vitest run ui/table-zones-v13.test.ts ui/table-zones.test.ts
Test Files  2 passed (2)
Tests       44 passed (44)

npm --prefix test test
Test Files  141 passed (141)
Tests       727 passed (727)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed
```

---

## 执行者三次返工段（Codex · 2026-07-05 · round 3）

### 用户新增图审意见

- 左上角人物不能出现在牌桌上面。
- 三名人物可以整体缩小。
- 人物位置需严格参考用户上传示意图的人物与牌桌参考关系。
- 可改变背景牌桌大小；左上、右上人物需要继续再往左相对移动一点点。

### 修复摘要

- 三名 body 继续保持同尺寸，但整体缩小到约屏高 49%、屏宽 14.2%，避免人物压到牌桌主舞台。
- 玩家 body 固定在手牌左侧，底部贴屏；`heroHandLarge` 仍从玩家右侧开始。
- 左上 AI 位于玩家右上方，并与玩家保持 8px 横向分离；在二次返工基础上继续左移。
- 右上 AI 从右边缘向内并向左移动，名字牌也跟随人物向左，减少贴边感。
- `heroHandLarge`、`tableActionBar`、`settlementShowcase` 语义未改；legacy 6 字段仍来自 `tableLayout(width,height)`。

### 三次返工后关键 zone 证据

```
## 844x390
heroBody: {"x":17,"y":199,"width":120,"height":191}
opponentLeftBody: {"x":145,"y":47,"width":120,"height":191}
opponentRightBody: {"x":577,"y":47,"width":120,"height":191}
heroNameplate: {"x":8,"y":271,"width":138,"height":33}
opponentLeftNameplate: {"x":153,"y":148,"width":152,"height":33}
opponentRightNameplate: {"x":667,"y":148,"width":152,"height":33}
heroHandLarge: {"x":176,"y":304,"width":660,"height":86}
tableActionBar: {"x":287,"y":247,"width":270,"height":49}
settlementShowcase: {"x":186,"y":35,"width":473,"height":195}
body sizes=120x191,120x191,120x191
hero-hand gap=39
heroBody x opponentLeftBody intersection=0 gap=8
opponentLeftBody x opponentRightBody intersection=0 gap=312

## 812x375
heroBody: {"x":16,"y":191,"width":115,"height":184}
opponentLeftBody: {"x":139,"y":45,"width":115,"height":184}
opponentRightBody: {"x":555,"y":45,"width":115,"height":184}
heroNameplate: {"x":8,"y":260,"width":133,"height":32}
opponentLeftNameplate: {"x":147,"y":143,"width":146,"height":32}
opponentRightNameplate: {"x":641,"y":143,"width":146,"height":32}
heroHandLarge: {"x":171,"y":292,"width":633,"height":83}
tableActionBar: {"x":276,"y":237,"width":260,"height":47}
settlementShowcase: {"x":179,"y":34,"width":455,"height":188}
body sizes=115x184,115x184,115x184
hero-hand gap=40
heroBody x opponentLeftBody intersection=0 gap=8
opponentLeftBody x opponentRightBody intersection=0 gap=301

## 915x412
heroBody: {"x":18,"y":214,"width":124,"height":198}
opponentLeftBody: {"x":150,"y":49,"width":124,"height":198}
opponentRightBody: {"x":631,"y":49,"width":124,"height":198}
heroNameplate: {"x":8,"y":286,"width":142,"height":35}
opponentLeftNameplate: {"x":158,"y":154,"width":164,"height":35}
opponentRightNameplate: {"x":724,"y":154,"width":164,"height":35}
heroHandLarge: {"x":176,"y":321,"width":731,"height":91}
tableActionBar: {"x":311,"y":261,"width":293,"height":52}
settlementShowcase: {"x":202,"y":37,"width":512,"height":206}
body sizes=124x198,124x198,124x198
hero-hand gap=34
heroBody x opponentLeftBody intersection=0 gap=8
opponentLeftBody x opponentRightBody intersection=0 gap=357

## 780x360
heroBody: {"x":16,"y":184,"width":112,"height":176}
opponentLeftBody: {"x":136,"y":43,"width":112,"height":176}
opponentRightBody: {"x":531,"y":43,"width":112,"height":176}
heroNameplate: {"x":8,"y":249,"width":130,"height":31}
opponentLeftNameplate: {"x":144,"y":136,"width":140,"height":31}
opponentRightNameplate: {"x":615,"y":136,"width":140,"height":31}
heroHandLarge: {"x":164,"y":280,"width":608,"height":80}
tableActionBar: {"x":264,"y":227,"width":252,"height":45}
settlementShowcase: {"x":172,"y":32,"width":437,"height":180}
body sizes=112x176,112x176,112x176
hero-hand gap=36
heroBody x opponentLeftBody intersection=0 gap=8
opponentLeftBody x opponentRightBody intersection=0 gap=283
```

### 三次返工局部测试输出

```
npm --prefix test exec -- vitest run ui/table-zones-v13.test.ts ui/table-zones.test.ts
Test Files  2 passed (2)
Tests       44 passed (44)

npm --prefix test exec -- tsx -e "<body pairwise intersection check>"
四横屏 hero/opponentLeft/opponentRight pairwise intersection=0

npm --prefix test test
Test Files  141 passed (141)
Tests       727 passed (727)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed

rg -n "from 'cc'|from \"cc\"|import .*cc" assets/scripts/ui/table-zones.ts || true
仅命中源码注释中的 `import cc` 禁止说明；无实际 `cc` import。
```

---

## 审查者复审段（GLM-5.2 · 2026-07-05 · round 1 changes-requested → 复审）

### 复审范围

- 增量审：三次返工提交 `7c9a55b` / `927b375` / `602c9b1`（仅 `table-zones.ts` + 本报告）
- 全量回扫：`table-zones` 全仓消费方 + `table-layout` legacy 依赖链 + 分层不变量
- 技术门复跑（worktree `../斗地主.worktrees/T-LAYOUT3`，HEAD `602c9b1`）：
  - `npm --prefix test exec -- vitest run ui/table-zones-v13.test.ts ui/table-zones.test.ts` → 2 文件 / 44 用例全绿
  - `npm --prefix test test` → **141 文件 / 727 用例全绿**
  - `npm --prefix test run typecheck` → tsc --noEmit exit 0
  - `git diff --check` → exit 0
  - `grep "from 'cc'" assets/scripts/ui/table-zones.ts` → 无匹配

### 复审重点逐项核销

**① 四横屏 heroBody / opponentLeftBody / opponentRightBody 不重叠**

独立 tsx 验证四档 pairwise gap + intersection：

| 分辨率 | H-L gap | H-R gap | L-R gap | H-L inter | H-R inter | L-R inter |
|----|----|----|----|----|----|----|
| 844×390 | 8 | 440 | 312 | 0 | 0 | 0 |
| 812×375 | 8 | 424 | 301 | 0 | 0 | 0 |
| 915×412 | 8 | 489 | 357 | 0 | 0 | 0 |
| 780×360 | 8 | 403 | 283 | 0 | 0 | 0 |

所有 gap ≥ 8px、intersection = 0。round 1 域内致命已修复。

**② 玩家位于手牌左侧，不进入牌桌中央**

四档 `heroBody.x + heroBody.width ≤ heroHandLarge.x` 均成立（844×390: 137 ≤ 176 ✓，其余同形）。heroBody 锚定左下贴屏（`heroBodyY = height - bodyHeight`），不进入手牌区或牌桌中央。

**③ 左上、右上人物相对用户参考图已左移，且不压手牌**

- 不压手牌：四档 `opponentLeftBody / opponentRightBody` vs `heroHandLarge` gap = 61–74px（≥ 8 ✓）
- 已左移：round 2→3 diff 显示 `opponentLeftBody.x` 从 `heroBody.x + heroBody.width + gap` 起算（仍为玩家右侧 8px 分离），`opponentRightBody.x = width - rightBodyInset - bodyWidth - round(width*0.055)`（从右缘向内收并左移）。代码层面已左移；**相对用户参考图的视觉吻合度由用户终审判定**。

**④ legacy 6 字段仍与 tableLayout(width, height) 深相等**

独立 tsx 逐字段 `JSON.stringify` 比对四档 `topBar / opponentLeft / opponentRight / playArea / actionButtons / playerHand` 全部深相等。`tableLayout` 调用结果直接 `...legacy` 展开入返回对象，未改 `table-layout.ts`。

**⑤ 未改种子测试、未 import cc、未越域**

- `git diff ff43262..HEAD --stat` 仅 3 文件：`table-zones.ts`(+116) / `T-LAYOUT3.report.md`(+523) / `table-zones-v13.test.ts`(+93·种子提交 only)
- 种子测试 `table-zones-v13.test.ts` 仅出现在种子提交 `eca5345`（架构种子），执行者 4 个提交（`45f2450`/`7c9a55b`/`927b375`/`602c9b1`）均未碰 `test/`
- `grep "from 'cc'" assets/scripts/ui/table-zones.ts` → 无匹配
- `git diff ff43262..HEAD -- assets/scripts/ui/table-zones.ts` 纯加法：接口新增 9 字段、`tableZones()` 末尾 `...v13` 展开、新 `gameRemakeZones()` + `clamp()` 函数；legacy 字段逐字未改

### 全量回扫结果

- **消费方回归**：`game-scene-skeleton.ts:349` 调 `tableZones(canvas.width, canvas.height)` 但仅消费 legacy zone（`topBar`/`infoStrip`/`opponentLeft`/`playArea`/`bottomCardsDock`/`dropZone*`/`playerHand`）；`game-scene/{bid-actions-renderer,hud-renderer,result-overlay-renderer,seats-renderer}.ts` 均不消费 v13 新增 zone。当前无运行时回归；P-G4 接线时才消费 v13 zone。
- **跨任务回归**：无。`table-zones.ts` 改动纯加法，legacy zone 数值不变；`table-layout.ts` 未改；其它模块零触碰。
- **分层不变量**：`table-zones.ts` 无 `cc` import；仅 import `table-layout`（同层 ui 纯岛），分层正确。
- **合并预检**：`git merge-tree` 预演 `task/T-LAYOUT3` → main 无冲突（main 自 `ff43262` 起仅改 spec/BOARD，task 分支未碰这些文件，3-way merge 自动取 main 版本）。

### 非阻断建议（拿不准 → 转规划者·round 1 遗留）

以下两项在 round 1 已转规划者，本轮仍为非阻断（不阻塞合并）：

1. **body vs nameplate 间距**：nameplate 设计上"贴近"body（注释"贴近玩家立绘下方"），gap 为负属 by-design。若规划者认为 nameplate 是独立 zone 需 ≥ 8px 间距，另拆微调任务。
2. **settlementShowcase 相位互斥**：settlementShowcase 是"结算覆盖区"（注释"暗幕牌桌上的胜负大字与三家分数面板"），与底层 body/nameplate 不同相位（结算时 body 可能隐藏或被暗幕覆盖）。若规划者认为需明确相位互斥契约，在 P-G4 spec 中补明。

### 结论

**approved** — round 1 域内致命（heroBody vs opponentLeftBody 四档重叠）已在三次返工中修复，四档 pairwise gap ≥ 8px、intersection = 0。复审重点五项逐项通过：四横屏 body 不重叠 / 玩家位于手牌左侧 / 左上右上人物已左移且不压手牌 / legacy 6 字段深相等 / 未改种子未 import cc 未越域。全量回扫无回归。视觉吻合度（相对用户参考图的人物位置）由用户终审判定。

打回轮次：1（round 1 changes-requested → round 3 复审 approved）
非阻断建议：2 项转规划者（body/nameplate 间距豁免？settlementShowcase 相位互斥？——round 1 遗留，仍非阻断）
