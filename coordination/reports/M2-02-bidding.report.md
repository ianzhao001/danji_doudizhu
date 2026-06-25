# M2-02-bidding 实现报告

- 实现方标识：Codex
- 分支：`task/M2-02-bidding`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/game/bidding.ts`
- `coordination/reports/M2-02-bidding.report.md`

## 测试与类型检查输出
```
$ npm --prefix test install

added 47 packages, and audited 48 packages in 3s

12 packages are looking for funding
  run `npm fund` for details

5 vulnerabilities (3 moderate, 1 high, 1 critical)

$ npm --prefix test test

> doudizhu-rules-tests@0.0.0 pretest
> node ensure-tsconfig-shim.cjs


> doudizhu-rules-tests@0.0.0 test
> vitest run

▲ [WARNING] "3d" is not a valid value for the "type" field [package.json]

 RUN  v2.1.9 /Users/admin/Documents/Cocos/斗地主.worktrees/M2-02-bidding/test

 ✓ rules/card.test.ts (2 tests) 1ms
 ✓ rules/deal.test.ts (2 tests) 2ms
 ✓ game/bidding.test.ts (5 tests) 1ms
 ✓ rules/validate.test.ts (3 tests) 1ms
 ✓ rules/pattern.test.ts (6 tests) 2ms
 ✓ game/core.test.ts (9 tests) 3ms
 ✓ rules/legal-follows.test.ts (3 tests) 2ms
 ✓ rules/compare.test.ts (3 tests) 2ms
 ✓ rules/moves.test.ts (9 tests) 4ms

 Test Files  9 passed (9)
      Tests  42 passed (42)

$ npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无行为偏差。
- 公开 `BiddingState` 字段保持任务契约不变，仅在模块私有 `WeakMap` 中保存叫牌 pass 数、首叫者、抢牌队列和是否发生过抢。
- `applyBid` 始终返回新对象，不原地修改传入 state。
- `test/node_modules/` 已被仓库 `.gitignore` 忽略，未进入提交范围。

## 方案审查 / 优化建议
- 当前 `WeakMap` sidecar 是在“不改固定类型”的约束下实现完整抢/反抢队列的合理折中；相比非枚举 Symbol 元数据，它不污染 state 自有属性，公开对象更干净。
- 主要风险是 `WeakMap` 上下文不能跨 JSON 序列化、对象 spread 或外部重建保留。如果后续要保存叫抢阶段，建议由架构扩展公开状态，把 `caller`、`callingPasses`、`grabQueue`、`grabbed` 等上下文字段显式放入纯数据 `BiddingState`。
- 本任务只要求同一运行序列内 `createBidding`/`applyBid` 推进到地主与倍率，因此暂不越权修改公共类型。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明代码文件域（另按协议新增报告）
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
