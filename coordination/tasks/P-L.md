# P-L lobby 横屏全屏 + 入口真按钮 + 命名

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/lobby-scene.ts`
  - `coordination/reports/P-L.report.md`
- 依赖：E-0 ✅ / T-0 ✅ / T-C0 ✅（均已并 main）
- 分支：`task/P-L`
- **单写者流水线**：单分支，**分阶段 commit + 分段送审**（① 横屏全屏重排 → ② 入口真按钮 → ③ 命名）。
- **worktree 测试环境**：新 worktree 若报缺 `./temp/cli/tsconfig.cocos.json`，`mkdir -p temp/cli && cp /Users/admin/Documents/Cocos/斗地主/temp/cli/tsconfig.cocos.json temp/cli/`。

## 背景（关联规划书 §6 P-L）

E-0 已把工程翻 844×390 横屏。lobby 的面板/入口坐标仍是竖屏纵向硬编码（`-112/-210/-320` 之类），且主入口用裸 `Label + TOUCH_END`。本任务把大厅横屏成形、入口按钮化、命名规范。

## 行为要求（分阶段）

### 阶段① 横屏全屏重排（**覆盖全部子屏**）
1. `renderRuntimeControls` 分派的**全部 6 个子屏**都要横屏适配、390 高内不溢出：home（难度面板/toggle/四入口）、教程、帮助、战绩、历史、难度/设置。**防「首页好、二级溢出」**——每屏都要截图验收。
2. 竖屏纵向堆叠坐标改为横屏横向分栏（如左侧战绩/难度、右侧设置/入口，或按屏内容合理排布）。
3. **运行时纯色/渐变占位背景**：横图 ready 前**不加载竖 `lobbyBg`**，改画纯色/渐变（同 P-G 口径）。横图作美术依赖登记后补。

### 阶段② 入口真按钮
4. 删除裸 `wireGameSceneLabel`（`continueLabel`/`start-label` 的 `Node.EventType.TOUCH_END` 接线）。
5. 用共享 `addButton`（经 lobby 薄包装）生成「开始新局 / 继续游戏」**真按钮**（有按压态），点击进 game 场景。
6. 复核其余入口（教程/帮助/战绩/历史、难度、设置开关）统一按压/选中态样式。

### 阶段③ 命名规范
7. `ensureNode` 运行时节点用清晰稳定语义命名，去命名不清/开发味残留。
8. **lobby 文案本轮不改**（经核实已 player-facing，P-Text 无 lobby 项）。

## 验收（编辑器/运行时·无 vitest 新增）
- `npm --prefix test test`（133/654 基线不回归）+ `npm --prefix test run typecheck` 净。
- **四横屏截图**（844×390 / 812×375 / 915×412 横 / 780×360）× **6 子屏**：home + 教程/帮助/战绩/历史/难度设置均不溢出、不叠压；CDP `productErrors=[]`。
- **交互证据**：主入口为真按钮、有可见按压态、点击进 game；无纯文字裸点击区残留。
- 证据落 `coordination/reports/P-L.report.md`。

## 交付物
- 分支 `task/P-L` 分阶段提交；报告。
- 获架构 `approved` 后 `claim → merge → release` 自合（与 P-G 共用单 lane，排队）。

## 测试命令
`npm --prefix test test`
