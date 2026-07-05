# T-LAYOUT4 实现报告

- 实现方标识：GPT-5.5 执行者
- 分支：`task/T-LAYOUT4`
- 状态：in-review
- 记录时间：2026-07-05 16:58:22 CST

## 改了哪些文件

- `assets/scripts/ui/table-zones.ts`
  - 仅调整 `gameRemakeZones` 内 v13 角色与名字牌布局公式。
  - 三名立绘统一使用同一套 `bodyWidth/bodyHeight`，整体较 T-LAYOUT3 略缩小。
  - `opponentLeftBody` / `opponentRightBody` 外移到左右屏缘并上移，给 legacy HUD 停靠点腾出横向空间。
  - `heroNameplate` 移到玩家立绘上方；`opponentLeftNameplate` / `opponentRightNameplate` 移到各自立绘下方，与宿主立绘 `rectGap >= 8`。

## 红测基线

先跑目标种子确认基线为红：

```text
npm --prefix test exec -- vitest run ui/table-zones-v13.test.ts ui/table-zones.test.ts

test/ui/table-zones-v13.test.ts (28 tests | 8 failed)
- hero nameplate vs hero body: expected -105/-101/-107/-96 to be >= 8
- strength vs left body: expected -57/-52/-58/-47 to be >= 8
test/ui/table-zones.test.ts (28 tests) passed
```

## Zone 数值表

格式：`x,y,width,height`。

| 分辨率 | heroBody | opponentLeftBody | opponentRightBody | heroNameplate | opponentLeftNameplate | opponentRightNameplate | heroHandLarge | tableActionBar | settlementShowcase |
|---|---|---|---|---|---|---|---|---|---|
| 844x390 | `8,230,106,160` | `8,29,106,160` | `730,29,106,160` | `8,189,130,33` | `8,197,143,33` | `693,197,143,33` | `176,304,660,86` | `287,247,270,49` | `186,35,473,195` |
| 812x375 | `8,221,102,154` | `8,28,102,154` | `702,28,102,154` | `8,181,126,32` | `8,190,138,32` | `666,190,138,32` | `171,292,633,83` | `276,237,260,47` | `179,34,455,188` |
| 915x412 | `8,243,112,169` | `8,31,112,169` | `795,31,112,169` | `8,200,136,35` | `8,208,156,35` | `751,208,156,35` | `176,321,731,91` | `311,261,293,52` | `202,37,512,206` |
| 780x360 | `8,212,98,148` | `8,27,98,148` | `674,27,98,148` | `8,173,122,31` | `8,183,133,31` | `639,183,133,31` | `164,280,608,80` | `264,227,252,45` | `172,32,437,180` |

## rectGap 证据表

| 分辨率 | heroNameplate-body | leftNameplate-body | rightNameplate-body | strength-leftBody | memory-leftBody | advisor-rightBody | hero-leftBody | heroBody-hand |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 844x390 | 8 | 8 | 8 | 59 | 59 | 59 | 41 | 62 |
| 812x375 | 8 | 8 | 8 | 56 | 56 | 56 | 39 | 61 |
| 915x412 | 8 | 8 | 8 | 77 | 77 | 76 | 43 | 56 |
| 780x360 | 8 | 8 | 8 | 54 | 54 | 54 | 37 | 58 |

额外守卫：

| 分辨率 | heroNameplate-hand | heroNameplate-tableActionBar | leftBody-rightBody |
|---|---:|---:|---:|
| 844x390 | 82 | 149 | 616 |
| 812x375 | 79 | 142 | 592 |
| 915x412 | 86 | 167 | 675 |
| 780x360 | 76 | 134 | 568 |

## 测试与类型检查输出

```text
npm --prefix test exec -- vitest run ui/table-zones-v13.test.ts ui/table-zones.test.ts

✓ test/ui/table-zones-v13.test.ts (28 tests)
✓ test/ui/table-zones.test.ts (28 tests)
Test Files  2 passed (2)
Tests  56 passed (56)
```

```text
npm --prefix test test

Test Files  141 passed (141)
Tests  739 passed (739)
```

```text
npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

```text
git diff --check

<no output>
```

```text
rg -n "^import .*['\"]cc['\"]" assets/scripts/ui/table-zones.ts

<no matches>
```

## 工作树状态

提交前：

```text
 M assets/scripts/ui/table-zones.ts
?? coordination/reports/T-LAYOUT4.report.md
```

## 非文字模态 / IDE 实操验收证据（如适用，由执行者填写）

- 验收面：不适用，本任务为纯逻辑布局契约。
- 用户主观终审状态：不适用；后续 `P-G5-UIFIX` / `V4` 产图后按双层视觉预审关执行。

## 执行者视觉自审勾销表（UI/场景任务·双层视觉预审第一层·交规划者前必填）

- 本任务不产出截图/实机画面，仅产出布局矩形逻辑。
- 已用 `rectGap` 数值表覆盖本任务内的客观重叠约束：名字牌 vs 宿主立绘、HUD vs 对家立绘、玩家立绘 vs 手牌。
- 双层视觉预审第一层将在后续 `P-G5-UIFIX` 生成四横屏截图后执行。

## 与 spec 的偏差 / 关键决策

- 无偏差。
- 没有移动 legacy 6 字段，也没有改 `tableLayout`；T-LAYOUT2 语义仍由 `table-zones.test.ts` 通过证明。
- `strengthMeter` / `memoryDock` / `advisorDock` 的 legacy 语义未改，通过外移上移 opponent body 来满足 HUD 让位。

## 疑问 / 需规划者裁定

- 无。

## 批次交接记录 / 下一步（种档，供下一窗口自助读；配合 templates/handoff.md）

- 所属批次 / 任务号：第五波 UI-FIX / `T-LAYOUT4`
- 本回合结论 / 状态：纯逻辑布局整改已实现，目标测试、全量测试、typecheck、diff check 均通过，待审查者评审。
- 下一步找谁：审查者（GLM-5.2）
- 用户终审配合：不适用。
- 备注：当前 `task/T-LAYOUT4` worktree 未带 `coordination/tasks/R-WAVE5.md`，但主工作树 `main` 存在该审查任务书；审查者若在任务 worktree 读不到，请先从 `main`/规划者处同步审查单再评审。
- 给下一窗口的可粘贴提示词（指针化）：

```text
你是本仓库 斗地主 的审查型 AI。本任务：R-WAVE5 R:T-LAYOUT4。
先读：coordination/PROTOCOL.md、coordination/tasks/T-LAYOUT4.md、coordination/tasks/R-WAVE5.md、coordination/reports/T-LAYOUT4.report.md、coordination/BOARD.md 的 UI-REMAKE 段。
请评审 task/T-LAYOUT4：核文件域、确认 test 未被执行者修改、逐行细读 table-zones.ts 的 gameRemakeZones 变更，复跑 npm --prefix test test、npm --prefix test run typecheck、git diff --check，并按 R-WAVE5 检查单决定 approved / changes-requested。此任务为纯逻辑随到随合；执行者不合并 main。
```

## 自检（对照验收项）

- [x] 测试全绿
- [x] typecheck 无错
- [x] `git status --short --untracked-files=all` 已记录，越域未跟踪文件已清理或说明
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获精确机器态 `approved` 前未合并 main
- [x] 未 import cc
