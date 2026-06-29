# M6-D4 架构决策记录 + 已知限制（第十二批·核心文档）

- 状态：**ready**（纯文档）
- 派发模式：架构/文档执行者（改/加 docs）
- 文件域：`docs/ARCH_DECISIONS.md`（新）、`docs/KNOWN_LIMITATIONS.md`（新）、`coordination/reports/M6-D4.report.md`、report
- 不改产品码/测试/现有 docs 正文（仅新增两份）

## 目标
沉淀本项目多 AI 协作中已成既定事实的关键架构决策与 v1 已知限制，便于交接/复盘。

## 行为要求
1. `ARCH_DECISIONS.md`（ADR 风格·每条：背景/决策/理由/影响），至少收录：
   - 纯逻辑层与 cc 表现层硬隔离（依赖方向 rules→game→ai→flow→ui；data 旁路）。
   - `CueId` 收紧为字面量联合（M6-L6）。
   - 持久化分层校正（M5-14：DTO 上移、events 校验、commit 幂等）。
   - 编辑器设置控件「运行时注入而非手写 scene」（C1 决策 + guardrail）。
   - 美术「先 asset-previews 预览包、用户视觉终审后再导入 assets」。
   - 「import 直引 + 后置桶整合」派发策略（M6-I1）。
2. `KNOWN_LIMITATIONS.md`：首版单机范围（无联网/账号/支付/广告/匹配）、仅竖屏 390×844 基线、AI 不读隐藏牌、音效 WAV 待转码、bidding resume 不支持（RoundState 仅 Playing/Settled）等。
3. 与 BOARD/RULES/ARCHITECTURE 口径一致，不造事实；引用对应 commit/任务号。

## 验收
- 两份文档落盘、条目可追溯到 BOARD/commit；report 列收录条目清单。
