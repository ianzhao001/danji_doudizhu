# M2-08-bidding-pure 实现报告

- 实现方标识：Codex
- 分支：`task/M2-08-bidding-pure`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/game/bidding.ts`：删除模块级 `WeakMap`/隐藏上下文，改为直接使用 `BiddingState` 上的 `caller`、`callingPasses`、`grabQueue`、`grabbed` 作为唯一状态源。
- `coordination/reports/M2-08-bidding-pure.report.md`：记录实现与验收结果。

## 测试与类型检查输出
```
$ npm --prefix test test
> doudizhu-rules-tests@0.0.0 pretest
> node ensure-tsconfig-shim.cjs

> doudizhu-rules-tests@0.0.0 test
> vitest run

 Test Files  12 passed (12)
      Tests  58 passed (58)
```

```
$ npm --prefix test run typecheck
> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `BiddingState` 每次返回新对象，`grabQueue` 消费时使用 `slice(1)`，完成叫抢时清空为 `[]`。
- 保留原有非法动作错误原因；JSON 往返后继续叫抢由公开纯数据字段驱动。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
