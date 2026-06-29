# M6-D2-qa-checklist-refresh 实现报告

- 实现方标识：Codex
- 分支：`task/M6-D2-qa-checklist-refresh`
- 状态：in-review

## 改了哪些文件
- 更新 `docs/QA_CHECKLIST.md`

## 测试与类型检查输出
```
npm --prefix test test -- --testTimeout=60000
Test Files  92 passed (92)
Tests       469 passed (469)

npm --prefix test run typecheck
tsc --noEmit
```

## 核对矩阵
- 流程测试：地主 20 张、重发、叫抢倍数、连过牌权、结算、春天/反春天均已打勾，证据落到 `test/game/*`、`test/flow/*`。
- 序列化与断局：序列化往返、save/resume/session/runtime resume 已打勾；第十一批 `task/M6-G9-save-resume-e2e` 已补端到端护栏，当前在行尾标为待合并增强证据。
- 自对弈与 AI：selfplay、selfplay-long、difficulty、legality-matrix 已打勾；第十一批 `task/M6-G12-ai-no-starve` 已补难度矩阵，当前标为待合并增强证据。
- UI：已有 390x844、地主身份、叫抢提示、按钮、结算弹窗证据打勾；当前出牌区域真实卡牌渲染、设置弹窗多尺寸截图仍保留待 C2/C3/C4。
- 发布前：Creator 打开/编译、Vitest、selfplay、设置和战绩保存已打勾；目标平台构建仍保留待 M6-C4。

## 与 spec 的偏差 / 关键决策
- 保留「当前 M1 验收」历史数字，不改写 6 文件 / 25 用例。
- 对第十一批 G9/G10/G12 已完成但尚未合并 main 的增强护栏，只作为“待合并增强证据”标注，不把它们伪装成当前 main 已合并。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] QA 勾选与实际测试/代码一致
- [x] 证据可追溯到测试文件/报告/当前任务状态
- [x] 未改产品码/测试
- [x] typecheck 无错
- [x] 测试全绿
