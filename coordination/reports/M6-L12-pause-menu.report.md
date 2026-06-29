# M6-L12-pause-menu 实现报告

- 实现方标识：Codex
- 分支：`task/M6-L12-pause-menu`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/pause-menu.ts`：新增暂停菜单/退出确认纯状态机。
- `test/ui/pause-menu.test.ts`：覆盖初始 closed、合法转移、非法转移返回原状态。

## 测试与类型检查输出
```text
npm --prefix test test -- --testTimeout=60000
Test Files  93 passed (93)
Tests       472 passed (472)
ui/pause-menu.test.ts (3 tests) passed

npm --prefix test run typecheck
tsc --noEmit
exit 0
```

## 与 spec 的偏差 / 关键决策
- 标准 `npm --prefix test test` 在当前机器上被既有 `selfplay/selfplay.test.ts` 5s timeout 擦边影响；用 `--testTimeout=60000` 全量通过作为佐证，未修改任何既有测试。
- `openMenu` / `closeMenu` 对任意状态归一到目标状态；`askQuit` 和 `cancelQuit` 的非法转移返回原对象。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
