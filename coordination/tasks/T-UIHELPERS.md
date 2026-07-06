# T-UIHELPERS — 皮肤化 UI helper 上移共享 + 死导出清理 + 文案迁移 rider

- 状态：ready
- 任务模式：editor-evidence（组件机械重构·四横屏视觉等价对照）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/ui-helpers.ts`（新增共享 `addSkinnedButton`/`addSkinnedSprite`/`drawPanelSkin`——以 loadSprite 回调与皮肤/字色策略为参数；**删除死导出 `addUiButton`**；`drawPanel`/`addUiTransform`/`addLabel`/`loadSprite` 保留不动）
  - `assets/scripts/ui/components/game-scene-skeleton.ts` + `assets/scripts/ui/components/lobby-scene.ts`（本地 `addButton`/`addSprite`/`drawPanelSkin` 改为消费共享件的薄壳或直换——**机械替换、渲染结果不变**）
  - `assets/scripts/ui/strings.ts`（**文案迁移 rider**：先在报告列两组件硬编码中文文案清单 → 常量化进 strings.ts → 组件改引用；纯机械替换，逐字相同）
  - `coordination/reports/T-UIHELPERS.report.md`
- 依赖：—（B 波首任务）
- 分支：`task/T-UIHELPERS`

## 行为要求
1. 共享件语义 = 现 skeleton 版实现（v13 皮肤 9-slice + enabled/disabled 皮肤策略 + 图标策略 + 字色策略可注入）；lobby 版差异（v12 键、字色）通过参数表达——**两组件渲染输出逐像素等价**。
2. 死导出清理仅 `addUiButton`（`drawPanel` 活跃保留——旧账修正）。
3. 文案迁移不改任何字面内容（grep 清单前后一致）；`ui/strings.ts` 只加不删。

## 验收
- 四横屏（844×390/812×375/915×412/780×360）× {lobby home、牌桌 playing、结算、暂停} **改前/改后截图对照视觉等价** + `productErrors=[]`。
- `git diff` 核：组件侧为机械替换；全量 vitest/typecheck 零回归。
- **双层视觉预审**：执行者自审（等价对照勾销表）→ 规划者视觉审 → 才转审查者。
- 审查按 R-WAVE8 R:T-UIHELPERS（常规·grep 核文案零漂移 + addUiButton 消失 + 无越域）。
