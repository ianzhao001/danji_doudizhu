# T-PROFILE-FOLLOWS — legalFollows 性能实测（两段式第一段·数据先行）

- 状态：ready
- 任务模式：pure-spec（**不改产品代码**·仅新增 bench 脚本与报告）
- 文件域（**只允许改这些**）：
  - 新 `test/bench/legal-follows.bench.ts`（或 `test/bench/*.ts`·不进 vitest 默认套件——独立脚本经 `npm --prefix test exec tsx` 跑，避免拖慢 CI 套件）
  - `coordination/reports/T-PROFILE-FOLLOWS.report.md`
- 依赖：—
- 分支：`task/T-PROFILE-FOLLOWS`

## 行为要求
1. bench 实测三组数据（固定 seeds 确定性、报告记录机器环境与并发状况）：
   - selfplay 60 seeds（三档轮换）总时长；
   - `legalFollows` 调用次数与累计耗时占比（wrap 计时或采样 profiler——不改产品源，可在 bench 内用包装函数复刻调用路径或 `node --cpu-prof` 分析）；
   - 最重单次调用的手牌形状 top5（大手牌+复杂型）。
2. **裁定阈值（规划者定）**：`legalFollows` 占比 >40% 或 selfplay 60 seeds >30s（无并发负载）→ 转规划者派第二段等价剪枝任务（守护种子=剪枝前后枚举**结果集合逐元素相等**）；否则记录归档、维持既有「不动 keystone」立场。
3. 报告只交数据与复现命令，**不做优化实现**。

## 验收
bench 可复现（命令+seed+环境）；报告数据齐；全量 vitest/typecheck 零回归（bench 不入套件）。审查按 R-WAVE8 R:T-PROFILE-FOLLOWS（常规）。
