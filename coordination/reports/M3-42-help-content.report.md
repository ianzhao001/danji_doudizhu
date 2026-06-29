# M3-42-help-content 实现报告

- 实现方标识：Codex
- 分支：`task/M3-42-help-content`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/help-content.ts`：新增离线规则帮助内容模型，按牌型、比较、叫抢、计分四节组织。
- `test/ui/help-content.test.ts`：覆盖 section id 稳定、标题/内容非空、关键术语、返回防御性拷贝。

## 测试与类型检查输出
```text
npm --prefix test test
Test Files  93 passed (93)
Tests       472 passed (472)
ui/help-content.test.ts (3 tests) passed

npm --prefix test run typecheck
tsc --noEmit
exit 0
```

## 与 spec 的偏差 / 关键决策
- 内容按 `docs/RULES.md` 当前首版范围整理，不加入癞子、明牌、主动加倍、道具等暂不支持内容。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
