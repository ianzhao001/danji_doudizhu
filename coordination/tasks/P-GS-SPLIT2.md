# P-GS-SPLIT2 — game-scene-skeleton 二次 move-only 拆分（1775 → <800）

- 状态：ready（派发·2026-07-07·唯一前置 T-UIHELPERS done `30a9e74`）
- 任务模式：editor-evidence（move-only·P-G3① 纪律照抄·无 vitest 种子——行为快照锚 = 既有测试全家零改动全绿，同 T-RUNTIME-SPLIT 先例）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - 新 `assets/scripts/ui/components/game-scene/{card-node,play-area-renderer,pause-overlay-renderer,top-bar-renderer,audio-vibration,tween-helpers}.ts`（名单可按实际耦合微调，报告说明；termination 反馈面板/toast 轮询建议随 play-area 或 top-bar 就近落位，报告写明归属）
  - `assets/scripts/ui/strings.ts`（rider 口径更新 2026-07-07：T-UIHELPERS 已迁尽两组件文案——skeleton 现零硬编码中文（`rg "[\p{Han}]"` 0 命中）；本任务预计 strings.ts **零改动**，拆出模块直接保持既有 `t()`/`*_TEXT` 引用；仅当拆分暴露残留字面量才迁移，逐字相同）
  - `coordination/reports/P-GS-SPLIT2.report.md`
- 依赖：T-UIHELPERS done `30a9e74` ✅（skeleton 漂移域已解锁：C 波七任务全 done 2026-07-07）
- 分支：`task/P-GS-SPLIT2`（已建自 main `1830e43`·含 C 波全部接线 + T-UIHELPERS 共享化）

## 基点期口径（规划者·2026-07-07 实测）
- skeleton 当前 **1775 行**（旧 spec 写 1670 是 C 波前口径：C 波三接线 +TERM-FEEDBACK/HUD-LIVE/RESUME-REPLAY 增重、T-UIHELPERS 共享化净效应后实测）；目标 **<800 行** 不变（约 975 行搬出·六模块可容纳）。
- **搬移警示（原样搬迁·不得改语义）**：起点已含——
  1. **C 波接线**：resume 路径 `rebuildRecentEvents(this.fullGameEvents)` 调用与底牌保守 null（T-RESUME-REPLAY）；顶栏 live 倍数/炸弹 VM 消费（T-HUD-LIVE）；`update()` 终止轮询 → `deriveTerminationFeedback` → pushToast + 去重 flag + 操作面板、`phaseText('disposed')='已终止'`、disposed 隐藏暂停入口（T-TERM-FEEDBACK）；**暂停接线** `openPauseMenu→runtime.pause()` / `closePauseMenu→runtime.resume()` / 重开与返回大厅走 dispose 不调 resume（T-TERM-FEEDBACK 骑士）。
  2. **T-UIHELPERS 共享化**：组件已消费共享 `addSkinnedButton`/`addSkinnedSprite`/`drawPanelSkin` + `strings.ts` 的 `t()`——拆出模块经 `GameSceneRendererContext` 透传或直接 import 共享件，**不得回退本地重实现**（两组件 `\bButton\b` 0 命中现状保持）。

## 纪律（P-G3① 先例逐字执行）
- **拆前四横屏×三相基线截图**（commit 附产物路径）→ 拆后逐屏对照视觉等价；拆前基线可与 `/tmp/doudizhu-t-uihelpers-after*`（48 张·当前 main 像素精确基线·其后产品代码零变化）交叉校验，但执行者仍须自拍同环境 before/after。
- `git diff --color-moved=zebra` 呈纯搬移；**零行为/坐标/文案改动**。
- `ensureNode`/`liveRenderNodes`/回调 owner 经既有 `GameSceneRendererContext` 透传（先例充分）。
- settled 门控（`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES`/`showTransientHud`）、相位互斥、逆时针映射、卡面无中心数字、暂停两组按钮、**C 波新增不变量**（disposed 隐藏暂停入口/顶栏 live 值/暂停冻结 + pause/resume 接线）——**不变量清单逐项自证**。
- `SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` 中 3 个 dead 条目 `last-action-0/1/2`（C 波续派记录 ⑥ 归档债务）**本任务原样搬迁不删**——move-only 阶段不动语义，删除留拆分后的 P-BID-POLISH 清理批（原裁定口径）。

## 验收
- `game-scene-skeleton.ts` **<800 行**；全量 vitest/typecheck 零回归（runtime/ui 测试全家零改动全绿）；四横屏对照 + `productErrors=[]`。
- **双层视觉预审**（等价对照：执行者自审四类硬伤 → 规划者视觉审）→ 审查 R-WAVE8 R:P-GS-SPLIT2（常规·color-moved 强化核 + C 波接线原样搬迁核）。

## 批次连做（压缩轮次·2026-07-08 规划者修订）
- 本任务与 **P-BID-POLISH 同窗批次连做**：完成本任务（提交+报告）后不交接，直接自本分支尖建 `task/P-BID-POLISH` 续做（见其 spec「批次连做流程」），**批末一次交接**覆盖两任务。
- **规划者视觉审②推迟到批末一并做**（两任务一次爆发），前提：本任务执行者自审必须含**四横屏 before/after 像素 diff 机械证据**（数字化 diffCount，同 T-UIHELPERS 48 对先例）——move-only 拆分预期 diff=0；若非 0 须逐处解释成因（如渲染顺序差异），无法解释即自修后再续批。
- 合并串行不变：审查者一次批量审两任务，SPLIT2 先合、BID-POLISH 后合（其分支含 SPLIT2 提交·序合无冲突）。
