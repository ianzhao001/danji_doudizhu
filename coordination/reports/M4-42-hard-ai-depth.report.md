# M4-42-hard-ai-depth 实现报告

- 实现方标识：Codex
- 分支：`task/M4-42-hard-ai-depth`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ai/levels/hard.ts`
  - 消费 `M4-30 handStrength`：非压迫领牌时对候选着法做剩余手牌评分，优先减少粗略手数并保留控制牌。
  - 消费 `M4-31 cardMemory`：基于自手牌扣减后的剩余大牌/潜在炸弹压力，调高 A/2/王的消耗成本。
  - 消费 `M4-32 endgame`：可一手走完时直接走完整手牌，跟牌时可终结则优先终结。
  - 增加农民协作：非终结态不抢队友牌权。
  - 保留原有 pressing 逻辑：对手低手牌数时继续炸弹/大牌压制。
- `test/ai/hard-depth.test.ts`
  - 新增中盘领牌不再退化为 Normal 的行为断言。
  - 新增一手走完、农民不抢队友牌权断言。
  - 新增固定 seeds selfplay 验收：Hard 地主相对 Normal 基线胜率不低、均分更高。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  133 passed (133)
Tests       652 passed (652)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
通过，无输出

cc import 护栏
rg "from ['\"]cc['\"]|import\(['\"]cc['\"]\)" assets/scripts/ai test/ai/hard-depth.test.ts
无命中
```

## Selfplay 指标
- 固定 seeds：`1..12`
- 对照方式：
  - Hard 地主：`[Hard, Normal, Normal]`
  - Normal 基线：`[Normal, Normal, Normal]`
- 结果：
  - Hard 地主：胜率 `7/12 = 58.3%`，seat0 均分 `0.83`
  - Normal 基线 seat0：胜率 `3/12 = 25.0%`，均分 `-1.83`
- 新测试同时锁定零和、终止、地主 seat0 一致性，以及 Hard 均分严格高于 Normal 基线。

## 与 spec 的偏差 / 关键决策
- 未改 `_shared` / Normal 签名，所有新增启发式均为 `hard.ts` 私有 helper。
- `AiStrategy` 快照当前不带历史事件；`trackPlayed` 因此只用公开可得的自手牌扣减来估计外部剩余高牌/炸弹压力，不读取隐藏手牌。
- 没有引入随机调参；策略仍完全确定性，`rng` 不参与决策。
- 没有扩展 selfplay 平衡测试文件，避免削弱或扰动 M6-G15 护栏；M4-42 专属 selfplay 放在新增测试文件中。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] Hard 中盘不再完全等同 Normal
- [x] 消费 handStrength / cardMemory / endgame
- [x] 地主/农民协作行为有测试覆盖
- [x] 固定 seed selfplay 有可测正向优势
- [x] M4-08 合法性审计 / G14 隐藏态隔离 / G15 平衡护栏全量通过
- [x] full suite 全绿
- [x] typecheck 无错
- [x] 未 import cc
- [x] 未改 `_shared` / Normal 共用签名
