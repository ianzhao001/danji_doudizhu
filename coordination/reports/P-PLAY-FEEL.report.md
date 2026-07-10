# P-PLAY-FEEL Report

- status: approved
- branch: `task/P-PLAY-FEEL`
- base: `task/P-THEME-APPLY @ b523975`
- original implementation: `afad056`（在新 THEME 尖上重放）

## 实现摘要

1. **划选多张**：卡牌 `TOUCH_START/MOVE/END` 接到 `bindHandDragHandlers`；坐标换算到 hand slot 同一坐标系；抬起时只调用一次 `dragSelectCards`，并把扫过牌按 Card 身份并入既有选择。
2. **取消收口**：每次绑定前清旧 `TOUCH_MOVE` listener；`TOUCH_CANCEL` 恢复按压视觉并清 `handDragActive/handDragMoved`，不结算选牌。
3. **命中单一真相源**：cc 层通过 `layoutHandInteractive` 取得 `x/hitRight`，只将几何槽映射到 `sortForDisplay` 的降序牌序；不再出现 `x + cardWidth` 或相邻 x 反推。
4. **要不起**：消费 `deriveFollowUx().mustPass`，只在呈现层禁用 play/hint 并把 pass 文案改为『要不起』；按钮仍仅在用户点击时调用 `submitPass`。
5. **降序理牌**：渲染使用 `sortForDisplay`；选中、hint 与提交均按 Card 身份匹配。

## Files Changed

- `assets/scripts/ui/components/game-scene-skeleton.ts`
- `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`
- `assets/scripts/ui/components/game-scene/card-node.ts`
- `assets/scripts/ui/components/game-scene/play-area-renderer.ts`
- `assets/scripts/ui/strings.ts`（只追加 `action.mustPass`）
- `coordination/reports/P-PLAY-FEEL.report.md`

## 结构门禁

- `ui/*.ts` 纯岛：除授权 `strings.ts` 追加外零 diff。
- `test/**`：零 diff。
- `event-cues.ts`：零 diff。
- `submitPass` / `submitPlay`：新增调用只在按钮 click callback；无 timer/schedule 自动过牌或自动出牌。
- `dragSelectCards`：唯一命中判定函数；cc 层不计算 `hitRight` 宽度。

## 视觉与运行证据

- `/tmp/doudizhu-w-unify-ui/summary.json`：`productErrors=[]`。
- 已有 844/780 playing 冒烟帧可见降序手牌。
- 划选与要不起录屏、四横屏动态证据已由规划者视觉审②按用户裁量递延至 V8；不作为本棒机械合并阻断。

## 视觉自审①

| 硬伤类 | 结论 | 证据边界 |
|---|---|---|
| 元素重叠 | 已有 playing 冒烟帧无新增 | 动态划选递延 V8 |
| 文字对比 | 已有帧无新增 | mustPass 指定 THEME 强调皮肤 |
| 文字包裹 | 已有帧无新增 | 三按钮原布局不变 |
| 闪烁/重渲 | `productErrors=[]` | 完整录屏递延 V8 |

## 兜底修复披露（Codex·2026-07-10）

- 原因：首轮机械复审发现 cc 层重复实现 `hitRight` 宽度公式、`TOUCH_CANCEL` 未清 drag 状态；同时主题替换应归前棒。修复量低于一次执行者窗口往返，按 PROTOCOL 由审查者在原文件域兜底并重建链。
- 范围：改用 `layoutHandInteractive` 提供命中边界；追加 cancel handler 与 MOVE listener 清理；划选结果与既有选择做 Card 身份并集；将本棒重放在新 THEME 尖并补齐独立报告。
- 未改：纯岛/API、测试、AI/flow/game、event cue 契约。

## 审查记录

- 原审查尖：`64d4fe0`，结论 `changes-requested`。
- 复审范围：`b523975..1873bc1`；逐行审行为 diff，定向抽查 `dragSelectCards`、`layoutHandInteractive`、`deriveFollowUx`、`sortForDisplay` 消费链。
- 结构结论：cc 层只透传 cardWidth 给纯 helper 并消费 `hitRight`；无命中宽度算法；mustPass 无自动过牌/出牌；strings 只追加；纯岛/test/event-cues 零 diff。
- 分支回归：152 files / 815 tests 绿；`npm --prefix test run typecheck` 绿；`git diff --check` 净。
- 视觉结论：继承 BOARD「UI 批视觉审②」分级放行；动态证据债转 V8。
- 合并门：常规任务，批准在 P-THEME-APPLY 合并后进入 `claim/merge/release`；main 双闸、merge commit 与 done 状态在合并后回填。
