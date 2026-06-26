# M5-02C-serialize-pattern-semantic 实现报告

- 实现方标识：Codex
- 分支：`task/M5-02C-serialize-pattern-semantic`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/game/serialize.ts`
- `coordination/reports/M5-02C-serialize-pattern-semantic.report.md`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  37 passed (37)
Tests       164 passed (164)

npm --prefix test run typecheck
tsc --noEmit passed

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/game/serialize.ts
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 在既有 `top.pattern` 形状校验之后调用 `recognize(pattern.cards)`。
- 识别失败时报 `top.pattern.cards is not a valid pattern`；识别出的 category/mainRank/length 与声明不一致时报 `top.pattern semantics mismatch`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
