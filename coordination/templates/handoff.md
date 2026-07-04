# 交接提示（Handoff）— 每个窗口回合结束时用中文输出给用户

> 目的：用户在多窗口人工中转，交接须让用户「知道下一步找谁」并「拿到可直接粘贴的提示词」。
> 原则：提示词**指针化**——只给角色 + 批次/任务号 + 要读的文件路径，**不复述正文**（上下文已种在仓库：`tasks/`、`reports/`、`BOARD.md`）。

## 本回合结论 / 状态
- 角色：规划者（Opus）/ 执行者（GPT-5.5）/ 审查者（GLM-5.2）
- 批次 / 任务号：`<IDs>`
- 结论（一句话）：例「批次 `<IDs>` 已实现 + 自检全绿，待审查」/「`<ID>` approved 已合并」/「`<ID>` changes-requested」/「高风险 `<ID>` approved（待规划者把关）」/「`<ID>` blocked，转规划者」
- 改动 / 证据落档：`reports/<ID>.report.md`、`BOARD.md` 本行、截图/日志路径…

## 下一步找谁
- ☐ 规划者（Opus）　☐ 执行者（GPT-5.5）　☐ 审查者（GLM-5.2）　☐ 用户视觉/听觉终审
- 原因（一句话）：

## 给下一窗口的可粘贴提示词（指针化，直接复制给目标窗口）
```
<目标角色 bootstrap 一句话（见 PROTOCOL.md 尾部）>。本批/任务号：<IDs>。
先读：coordination/PROTOCOL.md、coordination/tasks/<ID>.md、coordination/reports/<ID>.report.md、coordination/BOARD.md 本行。
本回合最小增量：<如「打回意见见报告 <ID> 评审段」/「待把关高风险清单 <IDs>」/「批次依赖顺序 A→B→C」>。
```

## 待用户终审事项（如有）
- <图像/音频/视频视觉终审项 + 证据路径；无则「无」>
