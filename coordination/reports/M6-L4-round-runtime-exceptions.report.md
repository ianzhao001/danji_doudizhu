# M6-L4-round-runtime-exceptions 实现报告

- 实现方标识：Codex
- 分支：`task/M6-L4`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/flow/round-runtime.ts`：resume 构造路径遇到 `GamePhase.Settled` 时立即调用 `finishIfSettled()`，补 settlement 投影与 `onSettled` 通知。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  87 passed (87)
Tests       442 passed (442)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed

rg "^import .*['\"]cc['\"]" ...
no matches
```

## 与 spec 的偏差 / 关键决策
- 未改 `game/bidding.ts`：两条 bidding reason 已由 seed 绿护栏通过，保持现有契约即可。
- `finishIfSettled()` 仍复用 `settledNotified` 守卫，重复 flush 不会重复触发 `onSettled`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
