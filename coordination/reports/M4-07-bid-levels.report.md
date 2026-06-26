# M4-07-bid-levels 实现报告

- 实现方标识：Codex
- 分支：`task/M4-07-bid-levels`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ai/bidding-levels.ts`
- `coordination/reports/M4-07-bid-levels.report.md`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  29 passed (29)
Tests       127 passed (127)

npm --prefix test run typecheck
tsc --noEmit passed

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/ai/bidding-levels.ts
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- Normal 直接委派 `chooseBid`，保证与基线深相等。
- Simple/Hard 复用同一强度判断，仅调整高牌数量阈值；火箭和炸弹始终视为强。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
