# M6-D2 QA 清单校准 + 人工项执行（第十一批·核心）

- 状态：**ready**（纯文档/验证；可随时认领）
- 派发模式：架构/文档执行者（无 worktree·改 docs）
- 文件域：`docs/QA_CHECKLIST.md`、`coordination/reports/M6-D2-qa.report.md`（新）
- 不改产品码/测试

## 目标
`QA_CHECKLIST.md` 大量 `[ ]` 项其实已由代码 + 测试实现（如「地主 20 张」game/core.test、「无人叫重发」redeal、「春天结算」settlement-spring-boundaries、「N 局无非法/死循环」selfplay/selfplay-long、「三档 AI 合法」legality-matrix、「读档继续」resume/M6-G9 等）。本任务**对照实际代码 + 测试逐项核对并更新勾选**，并标注每项的证据（测试文件名/场景），UI 人工项据 C1/C3 截图勾选。

## 行为要求
1. 逐项核对：把已被自动化测试覆盖的项打 `[x]` 并在行尾注证据（如「← test/game/core.test.ts」）。
2. 仍需人工的项（UI 验收/编辑器打开/构建）保留 `[ ]` 或标注「待 C3/C4」。
3. 不虚标：未有证据的项不得打勾；存疑项在 report 列出。
4. 「当前 M1 验收」段的 `25 用例` 等历史数字保留为历史，不改写历史段。

## 验收
- QA_CHECKLIST 勾选与实际测试/代码一致，证据可追溯。
- report 落盘（核对矩阵：项 → 证据 → 结论）。
