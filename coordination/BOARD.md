# Project Board

本文件只保留项目状态、版本结果与发布结论，不记录本地协作过程。

## Current Status

- 当前分支对应的发布线已经完成单机斗地主首版闭环。
- 主线包含完整离线玩法、三档难度、断局恢复、本地设置、本地战绩、横屏 UI 与发布验证。
- 当前代码基线可用于本地编译、测试与 `web-mobile` 构建。

## Release Summary

- 引擎版本：Cocos Creator 3.8.8
- 当前发布形态：离线单机、横屏、经典三人斗地主
- 启动场景：`lobby.scene`
- 设计分辨率：`844x390`
- 构建目标：`web-mobile`

## Verification Baseline

- 规则、状态机、运行时、提示与难度分层测试已纳入 `test/**`
- 当前基线记录为：133 个测试文件、653 个用例通过、typecheck 通过
- 当前构建口径为：`launchScene=lobby.scene`

## Main Milestones

- M0：项目、文档与资源基线完成
- M1：纯规则层完成
- M2：单局状态机、结算、回放与自对弈完成
- M3：大厅、牌桌、交互、提示、结算与横屏适配完成
- M4：简单、普通、困难三档策略与提示策略完成
- M5：本地设置、战绩、断局恢复与运行时门面完成
- M6：发布前硬化、构建验证与发布验收完成
- v1.4：UI 统一、交互优化、提示升级与困难档增强完成

## Current Notes

- 代码、测试与文档均已收口到可发布状态。
- 仓库中保留的 `coordination/scripts/**` 用于验证与辅助复现，不依赖本地协作流程说明即可使用。
- 详细限制与后续债务见 [docs/KNOWN_LIMITATIONS.md](../docs/KNOWN_LIMITATIONS.md)。
