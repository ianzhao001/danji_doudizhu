# P-GS-SPLIT2 — game-scene-skeleton 二次 move-only 拆分（1670 → <800）

- 状态：blocked（等 T-UIHELPERS 落 main——共享化先缩体积，同域串行）
- 任务模式：editor-evidence（move-only·P-G3① 纪律照抄）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - 新 `assets/scripts/ui/components/game-scene/{card-node,play-area-renderer,pause-overlay-renderer,top-bar-renderer,audio-vibration,tween-helpers}.ts`（名单可按实际耦合微调，报告说明）
  - `assets/scripts/ui/strings.ts`（**文案迁移 rider 第二批**：拆分过程中触达的硬编码文案顺手迁表，逐字相同）
  - `coordination/reports/P-GS-SPLIT2.report.md`
- 依赖：T-UIHELPERS done
- 分支：`task/P-GS-SPLIT2`（届时自 main 建）

## 纪律（P-G3① 先例逐字执行）
- **拆前四横屏×三相基线截图**（commit 附产物路径）→ 拆后逐屏对照视觉等价；
- `git diff --color-moved=zebra` 呈纯搬移；**零行为/坐标/文案改动**（文案 rider 仅改引用处、字面进 strings.ts，grep 前后清单一致）；
- `ensureNode`/`liveRenderNodes`/回调 owner 经既有 `GameSceneRendererContext` 透传（先例充分）；
- settled 门控（`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES`/`showTransientHud`）、相位互斥、逆时针映射、卡面无中心数字、暂停两组按钮——**不变量清单逐项自证**。

## 验收
- `game-scene-skeleton.ts` **<800 行**；全量 vitest/typecheck 零回归；四横屏对照 + `productErrors=[]`。
- **双层视觉预审**（等价对照）→ 审查 R-WAVE8 R:P-GS-SPLIT2（常规·color-moved 强化核）。
