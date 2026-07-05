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

## 审查者验收披露段（GLM-5.2 · 2026-07-05 17:08）

### 评审结论

**approved** — T-LAYOUT4 纯逻辑布局整改审查通过。名字牌分离、HUD 让位、角色外移上移均落地；种子三组断言全绿；既有 T-LAYOUT3 16 断言 + T-LAYOUT2 全部断言零改动全绿。

### 打回轮次

0 轮。

### 检查单核销（R-WAVE5 R:T-LAYOUT4）

- [x] **种子未被改动**：executor commit `aae324c` 不触 `test/`；`git diff main..task/T-LAYOUT4 -- test/` 仅含规划者种子提交 `99dd541`（T-LAYOUT4 describe 块新增 12 断言）。既有 16 断言逐字未动。
- [x] **名字牌 vs 宿主 body rectGap ≥ 8**（三对×四横屏=12）：独立复算 844×390 全三对 rectGap=8（=gap，名字牌在 body 正上/正下方 gap 像素分离）；报告表四档全 8，与种子断言一致。
- [x] **名字牌 vs heroHandLarge/tableActionBar ≥ 0**：报告表 844×390 heroNameplate-hand=82、heroNameplate-actionBar=149（四档全 ≥0）。
- [x] **HUD vs 对家 body ≥ 8**：strength/memory vs leftBody 59/56/77/54；advisor vs rightBody 59/56/76/54（四档全 ≥8）。根因=opponent body 外移到屏缘（x=gap / x=width-gap-bodyWidth）+ 缩窄 bodyWidth（96-112），HUD 坐标（legacy actionButtons 相对）未改 → 自然分离。
- [x] **零改动全绿**：`table-zones-v13.test.ts` 28/28 + `table-zones.test.ts` 28/28 = 56/56 全绿；T-LAYOUT2 语义（strength 左于 actionBar / memory 左半 / advisor 右半）由 `table-zones.test.ts` 锁定且通过。
- [x] **legacy 6 字段深相等**：executor 仅改 `gameRemakeZones` 函数体；`tableZones` 函数体零改动（`{ ...legacy, ... }` spread 不变），`tableLayout` 零改动。
- [x] **纯层无 cc import**：`rg -n "^import .*['\"]cc['\"]" assets/scripts/ui/table-zones.ts` 零命中。
- [x] **全量 vitest/typecheck/diff-check**：141 文件/739 用例全绿（26.74s）+ typecheck 净 + `git diff --check` 净。
- [x] **报告四横屏 rectGap 表**：zone 数值表 + rectGap 证据表齐全（4 档 × 9 zone + 11 gap 对）。

### 逐行细读 gameRemakeZones 变更

- **body 尺寸缩减 + 位置外移**：topBodyY 0.12→0.075（上移）、bodyWidth 0.142→0.125（缩窄）、bodyHeight 0.49→0.41（缩矮）；heroBodyX 改 `gap`（贴左缘）；rightBodyInset 删除，opponentRightBody 改 `width-gap-bodyWidth`（贴右缘）。三 body 形成左下(hero)/左上(opponentLeft)/右上(opponentRight)围桌，中部腾出给 HUD + 牌桌。
- **名字牌分离**：heroNameplate 移到 heroBody 正上方（y=body.y-gap-nameplateHeight，rectGap=gap=8）；opponentLeftNameplate/opponentRightNameplate 移到各自 body 正下方（y=body.y+body.height+gap，rectGap=gap=8）。旧 T-LAYOUT3「贴附 body 允许重叠」裁定被推翻，新布局满足用户「元素不可重叠」硬约束。
- **nameplateWidth clamp** 124-164→132-156（略缩）；heroNameplate width 上限 `heroBody.width+24`（原 +18，适应更窄 body）。数值合理，无魔法数。
- **return 对象**：9 zone 全部返回，结构与 TableZones 接口一致。

### 全量回扫（写 approved 前）

- **文件域纯净**：executor commit 仅 `table-zones.ts`(+14/-15) + `T-LAYOUT4.report.md`(+148)，零越界。
- **跨模块回归**：`table-zones.ts` 被 `game-scene-skeleton.ts` + `screen-view.ts` 消费，但 P-G5-UIFIX 尚未做（zone 值变化将在 P-G5 接线时生效）；纯逻辑层改动，无运行时副作用。
- **证据链**：报告 zone 数值表 + rectGap 表完整；种子 8 红→绿可复现（红测基线段记录 8 断言失败）。
- **打回轮次**：0。

### 分流

- 域内致命：无。
- 域外致命：无。
- 拿不准（非阻断）：无。
- 阻塞：无。

### 合并执行

纯逻辑任务（随到随合 lane），审查者本人跑双闸全绿后执行 claim/merge/release。

### 最终测试基线

合并后 main 审查者独立复跑结果将追加于下方「合并后基线」段。

### 合并后基线

合并后 main（`9d5e70b`）审查者独立复跑：
- `npm --prefix test test` → **141 文件 / 739 用例全绿**（26.47s）
- `npm --prefix test run typecheck` → tsc --noEmit 通过（exit 0）
- `git diff --check` → passed

合并证据：claim `fd84d4c` → merge `9d5e70b`（--no-ff，3 文件 +248−15）→ release `5adaf03`；分支 `task/T-LAYOUT4` 已删除，worktree 已清理。

---

## 交接（交规划者）

T-LAYOUT4 **done**（`9d5e70b`）。v1.2 第五波 UI-FIX 第一步闭合。下一步 **P-G5-UIFIX** 解锁（依赖 T-LAYOUT4 ✅），执行者可进驻。
