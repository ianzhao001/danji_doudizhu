# P-TABLE-INFO Report

- status: done 279dfd8
- branch: `task/P-TABLE-INFO`
- base: `task/P-PLAY-FEEL @ dcd6421`
- original implementation: `278d0fe`（在新 PLAY 尖上重放）

## 实现摘要

1. `deriveLastPlays(recentRoundEvents)` 驱动三席最近动作；play 渲染迷你真实牌面，pass 保持文字药丸。
2. bomb/rocket 使用既有 emphasis 资源；≤5 张常规间距，>5 张按最大宽度压缩，最长 12 张保持固定容器宽度。
3. `deriveFollowUx().alerts` 每次 render 全量传入席位名牌，按状态渲染『报单』『报双』徽标。
4. `deriveLastActions` 未删除：`deriveLastPlays` 内部继续复用它生成 text，pass/可达性文案只有一份真相源。
5. 未新增 CueId，`event-cues.ts` 零 diff；settled 仍由 `showTransientHud` 阻止最近动作反馈透出。

## Files Changed

- `assets/scripts/ui/components/game-scene-skeleton.ts`
- `assets/scripts/ui/components/game-scene/seats-renderer.ts`
- `assets/scripts/ui/strings.ts`（只追加 `seat.lastOne` / `seat.lastTwo`）
- `coordination/reports/P-TABLE-INFO.report.md`

## 结构门禁

- `ui/*.ts` 纯岛：除授权 strings 追加外零 diff。
- `test/**`：零 diff。
- `event-cues.ts`：零 diff，无新 CueId。
- `deriveLastPlays` / `deriveLastActions`：前者为 renderer 消费入口，后者仍由前者内部复用。
- alerts：每次 render 从当前 snapshot 重算并传入三席，无一次性本地状态。

## 视觉与运行证据

- `/tmp/doudizhu-w-unify-ui/summary.json`：`productErrors=[]`。
- 现有 844/780 playing 帧仅作冒烟。
- 12 张长顺子、报单+报双、resume 指定构造截图已由规划者视觉审②按用户裁量递延至 V8 强制补审，不作为本棒机械合并阻断。

## 视觉自审①

| 硬伤类 | 结论 | 证据边界 |
|---|---|---|
| 元素重叠 | 代码使用最大宽度与压缩间距 | 定向实拍递延 V8 |
| 文字对比 | danger/warning + textOnAccent | 定向实拍递延 V8 |
| 文字包裹 | 徽标/药丸固定容器 | 定向实拍递延 V8 |
| 闪烁/重渲 | 状态驱动全量重算，`productErrors=[]` | 动态恢复局递延 V8 |

## 兜底修复披露（Codex·2026-07-10）

- 原因：首轮机械复审发现 P-TABLE 文档提交越域修改前两棒报告；同时上游链需要修复。按 PROTOCOL 在原文件域内重建链并归位报告。
- 范围：把原产品 commit 重放在新 P-PLAY-FEEL 尖；本棒增量仅保留自身产品文件、strings 追加和自身报告。
- 产品逻辑未另改；未改纯岛、测试、event cue 契约。

## 审查记录

- 原审查尖：`9f51160`，结论 `changes-requested`。
- 复审范围：`dcd6421..318ab26`；逐行审 TABLE 增量，定向抽查 `deriveLastPlays`、`deriveLastActions`、`deriveFollowUx.alerts` 与 settled 门。
- 结构结论：迷你牌消费 `deriveLastPlays`，pass 文案链仍复用 `deriveLastActions`；alerts 每帧重算；settled 门保留；strings 只追加；纯岛/test/event-cues 零 diff。
- 分支回归：152 files / 815 tests 绿；`npm --prefix test run typecheck` 绿；`git diff --check` 净。
- 视觉结论：继承 BOARD「UI 批视觉审②」分级放行；长顺子/alerts/resume 证据债转 V8。
- 合并门：常规任务，批准在前两棒合并后进入 `claim/merge/release`；main 双闸、merge commit 与 done 状态在合并后回填。

## 验收披露

- 评审结论：最近出牌、pass 文案共存、alerts 状态驱动、settled 与 CueId 门均通过；首轮打回 1 次，Codex 仅重建链和归位报告，产品逻辑未另改。
- 合并前 main 双闸：152 files / 815 tests 绿；typecheck 绿。
- merge：`279dfd8`（`--no-ff`）；BOARD：`done 279dfd8`；release 后任务分支已删除。
- 终态批回归：152 files / 815 tests 绿；typecheck 与 `git diff --check` 净。
