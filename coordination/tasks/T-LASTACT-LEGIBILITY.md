# T-LASTACT-LEGIBILITY — 三席"最近出牌"可读性收口（视觉审②存量转派·V7 前补）

- 状态：ready（2026-07-07 规划者视觉审第二层转派·editor-evidence 模式·无种子）
- 任务模式：editor-evidence（视觉调整·Creator 实操取证·无纯逻辑缝）
- 风险等级：常规（单文件渲染层微调）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene/seats-renderer.ts`（仅 `renderLastActions` 与其私有布点助手；`deriveLastActions` 调用与解包链不动）
  - `coordination/reports/T-LASTACT-LEGIBILITY.report.md`
- 依赖：—（seats-renderer 不在 P-GS-SPLIT2 漂移域·随到随合；建议排 C 波 UI 链后避免同批视觉噪声）
- 分支：`task/T-LASTACT-LEGIBILITY`（届时自 main 建）

## 背景（T-RESUME-REPLAY 规划者视觉审第二层发现·2026-07-07）

规划者逐张复核四横屏 playing-resumed + before-reload 对照截图，发现**两处存量观感问题**（live 与 resumed 完全一致 → 非 T-RESUME-REPLAY 回归·不重开该任务）：

1. **右家 last-action 文字对比不足（四类硬伤②）**：`renderLastActions` 文字色 `Color(255,244,209,230)`（暖白）直绘于亮色天空/桥背景上，右家「出 一对K」在 844×390/812×375/915×412 仅可辨「出 一」，780×360 几乎不可辨；左家因背景是深粉花丛而可读——可读性依赖运气（背景明度）。
2. **hero last-action 与操作按钮行叠压（四类硬伤①）**：hero 席位末次动作 label 布点与 出牌/不要/提示 按钮行同高，文字被按钮遮压只剩碎片。

两处直接削弱 BUG-03 修复的用户价值（"三席最近出牌可见"），须在 V7 用户签收前收口（与 T-VIEW-SEAT F3 同篮）。

## 行为要求

1. **加底衬**：三席 last-action 文字加深色半透药丸底（对齐 v1.2 既有药丸风格·如计时/建议关 pill），保证任意背景下对比达标；或改文字色+描边，二选一，以截图实证为准。
2. **hero 布点避让**：hero 席位 label 移出操作按钮行高度带（上移至出牌区下缘或手牌上缘间隙），四横屏零重叠。
3. **零行为变化**：只动渲染呈现（颜色/底衬/坐标），`deriveLastActions` 数据链、文案、`'—'` 占位语义不动。

## 红线
- 不改 `ui/last-action-view.ts`（文案纯函数不动）；不改 `game-scene-skeleton.ts`（避免与 C 波 UI 链共域冲突）；不改 `table-zones.ts`。
- 不新建场景/组件/资源；沿既有 `addLabel`/`drawPanel` 助手。

## 验收
- 无种子（无纯逻辑缝）；既有 UI 测试 + 全量 vitest/typecheck 零回归（渲染层改动不触测试面）。
- **双层视觉预审**：四横屏 × live-playing + resumed 两态截图——三席 last-action 全部可辨读（含右家压亮背景）、hero label 与按钮行零重叠；执行者自审四类硬伤勾销表 + 规划者视觉审。
- 审查按 `tasks/R-WAVE9.md` R:T-LASTACT-LEGIBILITY。
