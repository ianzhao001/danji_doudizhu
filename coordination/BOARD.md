# Project Board

本文件只保留项目状态、版本结果与发布结论，不记录本地协作、评审或提交过程。

## Current Status

- 当前发布版本：v1.9-R4。
- 当前形态：离线单机、经典三人斗地主、手机横屏。
- 当前分支包含完整玩法、三档 AI、断局恢复、本地设置与记录、视觉动画和发布验证。
- 项目可使用 Cocos Creator 3.8.8 打开、预览并构建为 `web-mobile`。

## Unreleased AI Candidate

- 修复 rollout 对完整裸飞机和队友顶牌可清手的模拟误判。
- 评测改为逐对 self 自证、seed 聚类置信区间和完整实验/分片身份核验；时延使用冻结策略生成的分层语料。
- 升级代码在独立分支验证，尚未发布。提示推荐与历史点击记录不同，必须在 Cocos Creator 3.8.8 冷构建后重新采证。
- 当前已发布版本仍为 v1.9-R4，不将历史构建结论用于替代本轮运行时验证。

## Release Summary

| 项目 | 当前结果 |
| --- | --- |
| 启动场景 | `assets/scene/lobby.scene` |
| 设计分辨率 | `844x390` |
| AI | 简单、普通、困难三档；确定化决策 |
| 提示 | 与困难档共享决策引擎，支持候选榜单轮换与过牌建议 |
| 本地数据 | 设置、战绩、历史与未完成对局 |
| 网络依赖 | 无；不调用外部 AI API |

## Historical v1.9-R4 Verification

- 215 个测试文件、1301 个用例通过。
- 3 个环境或空目录门控用例跳过。
- 产线 TypeScript strict typecheck 通过。
- Cocos Creator 3.8.8 冷构建记录为 exit 36，`launchScene=lobby.scene`，`builtinAssets=33`。

## Version Results

- v1.6：视觉与架构约束收口。
- v1.7：视觉构图、卡牌动画与双色按钮体系完成。
- v1.8：三档 AI 整体强化，确定化 PIMC 与残局搜索上线。
- v1.9：困难 AI 评分、明牌世界求解、过牌推断和提示交互升级。
- v1.9-R3：通过冻结基线、固定叫牌、角色分层与配对置信区间隔离验证出牌能力；修正候选预算和残局边界，提示 p95 延迟约降低 39%，合法跟牌定向生成中位性能约提升 4.75 倍。保留集未检出相对 v1.9 的显著差异，不宣称胜率提升；这不构成统计等价证明。
- v1.9-R4：增加本地详细对局记录、单局与全量 JSON 导出、回放坏例分析和受限调参工具；修正 PIMC 过牌状态、队友救场和绝对控牌保护，并复用明牌求解缓存。最终困难档镜像差约 +17.2pp、ADP +2.62，决策 p95 约 29ms；未采纳无统计增益的调参候选。

## Public References

- 用户可见说明与第三方采用边界见 [README.md](../README.md)。
- 版本变化见 [docs/RELEASE_NOTES.md](../docs/RELEASE_NOTES.md)。
- AI 架构与外部参考见 [docs/AI_DESIGN.md](../docs/AI_DESIGN.md)。
- 已知限制见 [docs/KNOWN_LIMITATIONS.md](../docs/KNOWN_LIMITATIONS.md)。
