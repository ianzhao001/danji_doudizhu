# M6-L2-animation-params 实现报告

- 实现方标识：Codex
- 分支：`task/M6-L2`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/animation-params.ts`：新增 `pulseParams()`、`dealCardDelay()`、`playFlyFromTo()` 及公开类型。
- `assets/scripts/ui/index.ts`：导出 `animation-params`。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  86 passed (86)
Tests       444 passed (444)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed

rg "^import .*['\"]cc['\"]" ...
no matches
```

## 与 spec 的偏差 / 关键决策
- `pulseParams()` 对 bomb/rocket 使用 1.12，对 deal/play 使用 1.04，时长沿用现状语义 `100ms + 160ms`。
- `dealCardDelay()` 对 17 张以内使用 24ms 步进；更大批量用 18ms，保持总入场时间短。
- `playFlyFromTo()` 返回相对位移参数，供组件侧按节点坐标解释。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
