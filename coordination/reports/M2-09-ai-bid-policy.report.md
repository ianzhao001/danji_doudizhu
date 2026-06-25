# M2-09-ai-bid-policy 实现报告

- 实现方标识：Codex
- 分支：`task/M2-09-ai-bid-policy`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ai/bidding.ts`
- `coordination/reports/M2-09-ai-bid-policy.report.md`

## 测试与类型检查输出
```
$ npm --prefix test test

> doudizhu-rules-tests@0.0.0 pretest
> node ensure-tsconfig-shim.cjs


> doudizhu-rules-tests@0.0.0 test
> vitest run

▲ [WARNING] "3d" is not a valid value for the "type" field [package.json]

    ../package.json:3:12:
      3 │     "type": "3d",
        ╵             ~~~~

  The "type" field must be set to either "commonjs" or "module".

The CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.

 RUN  v2.1.9 /Users/admin/Documents/Cocos/斗地主.worktrees/M2-09-ai-bid-policy/test

 ✓ rules/deal.test.ts (2 tests) 2ms
 ✓ game/bidding.test.ts (5 tests) 1ms
 ✓ game/serialize.test.ts (2 tests) 2ms
 ✓ rules/compare.test.ts (3 tests) 2ms
 ✓ rules/legal-follows.test.ts (3 tests) 2ms
 ✓ game/settlement.test.ts (10 tests) 2ms
 ✓ rules/pattern.test.ts (6 tests) 3ms
 ✓ game/core.test.ts (9 tests) 4ms
 ✓ rules/moves.test.ts (9 tests) 5ms
 ✓ ai/bidding.test.ts (5 tests) 2ms
 ✓ ai/baseline.test.ts (3 tests) 2ms
 ✓ rules/card.test.ts (2 tests) 1ms
 ✓ rules/validate.test.ts (3 tests) 1ms

 Test Files  13 passed (13)
      Tests  62 passed (62)
   Start at  01:05:44
   Duration  555ms (transform 276ms, setup 0ms, collect 723ms, tests 30ms, environment 1ms, prepare 1.09s)

$ npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。`chooseBid` 按 calling/grabbing 阶段返回 call/grab/pass，强牌判定固定为火箭、炸弹、或至少两张 `rank >= Rank.R2`。
- `done` / `redeal` 阶段抛出 `Error('chooseBid cannot act during closed bidding phase')`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
