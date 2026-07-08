---
to: 执行者
subject: 执行 V7（v1.3 收口验证·verify-only）
---

# V7 执行任务

你是本仓库的执行者，负责 V7 任务：v1.3 收口验证（verify-only）。

## 任务性质
**verify-only**：不改产品代码、不改测试代码，只跑验证并落盘报告。

## 执行步骤

### 1. 认领任务
```bash
cd /Users/admin/Documents/Cocos/斗地主
git checkout main && git pull
./coordination/agentctl.sh claim V7
cd ../斗地主.worktrees/V7
npm install
```

### 2. 固定 seed 四横屏全相位 E2E
- **seed**: `20260705`（与 v1.2 一致）
- **四横屏**: 844x390, 812x375, 915x412, 780x360
- **全相位**: lobby → bidding → playing → settlement → lobby（含暂停、续局）
- **不变量回归**: v1.2 全部不变量（settled 门控、相位互斥、逆时针、零重叠、暂停按钮、卡面）
- **新面验证**: 叫抢建议面板（开关两态）、微调项（手牌徽章、记牌 dock、termination 按钮）
- **验收标准**: 全部 `productErrors=[]`

### 3. AI 新基线记账
**真记牌新基线**经真历史链路取数：
```bash
cd /Users/admin/Documents/Cocos/斗地主.worktrees/V7
npm run selfplay:difficulty  # 复用 test/selfplay/difficulty.ts harness
```
- **对照 v1.2**: Hard−Normal +0.133 / Hard−Simple +0.633
- **期望**: 同向或更优
- **记录新值**: 作为 v1.3 基线写入报告

### 4. 拆分/共享化视觉等价抽查
- 对照 T-UIHELPERS/P-GS-SPLIT2 基线截图（`/tmp/doudizhu-t-uihelpers-after*`、`/tmp/doudizhu-p-gs-split2-after/`）
- 抽查 4-6 张关键画面，确认视觉等价（无布局偏移、无样式回归）

### 5. Profiling 数据归档复述
- 复述 T-PROFILE-FOLLOWS 结果：`legalFollows` ratio 4.4% < 40% → 不剪枝
- 记录规划者裁定：归档不剪枝（见 BOARD B 波收官记录）

### 6. 同屏验收页（关键交付物）
**沿 V6 布局**（`build/v6-signoff.html`），产出 `build/v7-signoff.html`：
- **内嵌实机**: iframe 嵌入 `http://localhost:7456/`（或构建产物路径）
- **签收卡片**: 4 张卡片网格
  1. 叫抢建议观感（面板文案、位置、不遮挡）
  2. 微调项（手牌徽章左移、记牌 dock 下移、termination 按钮装饰）
  3. 整体手感（v1.3 整体流畅度、无回归）
  4. AI 更聪明了吗（Hard 档是否明显优于 v1.2）
- **证据分组**: 按任务分组展示截图（A 波/B 波/C 波）
- **用户轻签收**: 用户点选后生成签收记录（`reports/V7-user-review.md`）

### 7. 落盘报告
`coordination/reports/V7.report.md` 包含：
- 执行者自审（verify-only·不改产品码/测试）
- 四横屏全相位 E2E 结果表（每档 settled 门控、productErrors、failedResponses）
- AI 新基线表（v1.2 vs v1.3 胜率差对照）
- 视觉等价抽查（4-6 张关键画面对照）
- Profiling 归档复述（ratio 4.4% · 不剪枝）
- 同屏验收页路径（`build/v7-signoff.html`）
- 用户轻签收记录（`reports/V7-user-review.md`）
- 截图证据路径（`reports/V7-evidence/**`）

### 8. 提交并通知审查者
```bash
git add coordination/reports/V7.report.md reports/V7-evidence/ build/v7-signoff.html
git commit -m "verify(V7): v1.3 收口验证（15/15全done·四横屏全相位E2E·AI新基线·同屏验收页）"
git push origin task/V7
```
然后通知审查者按 `coordination/tasks/R-WAVE8.md` R:V7 检查单审查。

## 质量门
- `npm run test`: 149 files / 770 tests 全绿
- `npm run typecheck`: 净
- `git diff --check`: 净
- 四横屏 E2E 全部 `productErrors=[]`
- AI 新基线对照 v1.2 同向或更优

## 审查检查单
R-WAVE8 R:V7（verify-only）：
- diff 仅 reports/V7*
- 四横屏全相位 E2E + 不变量回归 + 新面证据
- AI 新基线表对照 v1.2（回退即报）
- 同屏验收页产出
- 用户轻签收项列明不代判

## 终点
V7 done + 用户轻签收 = v1.3 终局裁定（规划者版本终局裁定·BOARD 记裁定·发布归档）

## 基线参考
- main HEAD: `84a6efc`
- 基线测试: 149 files / 770 tests 绿
- 基线 typecheck: 净

## 注意事项
- verify-only 任务，**绝对不改产品代码或测试代码**
- 同屏验收页是用户轻签收的关键交付物，必须产出
- AI 新基线必须经真历史链路取数，不能用旧路径（statsPolicy 两参直调）
- 截图证据按任务分组（A 波/B 波/C 波），便于审查者核对
