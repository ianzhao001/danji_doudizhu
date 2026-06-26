# M3-00-hand-layout-guards 实现报告

- 实现方标识：Codex
- 分支：`task/M3-00-hand-layout-guards`
- 状态：in-review

## 改了哪些文件
- `test/ui/hand-layout-guards.test.ts`
- `coordination/reports/M3-00-hand-layout-guards.report.md`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  39 passed (39)
Tests       175 passed (175)

npm --prefix test run typecheck
tsc --noEmit passed

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" test/ui/hand-layout-guards.test.ts
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 新增输入守卫回归测试：非法 `count`、非法容器宽度、非法牌宽、多张牌时牌宽超过容器均抛错。
- 明确 `count=0` 不抛且返回 `[]`，单张牌允许 `cardWidth > containerWidth` 并居中。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
