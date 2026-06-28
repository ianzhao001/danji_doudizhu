# M3-33-action-buttons-hint 实现报告

- 实现方标识：Codex
- 分支：`task/M3-interaction`
- 状态：in-review（提示/出牌/不要完整行为已由用户验收）

## 改了哪些文件
- `assets/scripts/ui/components/game-scene-skeleton.ts`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  85 passed (85)
Tests       437 passed (437)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
<no output>

2026-06-28 复验：
npm --prefix test test -- --testTimeout=10000
Test Files  85 passed (85)
Tests       437 passed (437)

2026-06-28 用户手动验收：
- 玩家回合可见 `出牌 / 不要 / 提示`。
- 提示会高亮建议牌，不会自动出牌。
- `出牌 / 不要` 可推进流程。
```

## 与 spec 的偏差 / 关键决策
- 出牌 / 不要 / 提示按钮运行时创建，使用真实 `cc.Button`，带明确命中底板。
- 按钮可用态来自 `deriveScreenVM().actions`。
- 出牌/不要调用 `runtime.submitPlayerAction`；失败原因写到 `actionLabel`，成功出牌清空选中。
- 提示使用 `nextHint(snapshot.viewerHand, snapshot.top?.pattern ?? null, selected)`，只高亮建议，不自动出牌。
- 按钮已上移到手牌上方，避免 390×844 下贴底或被 vConsole 遮挡。

## 疑问（给架构）
- 用户截图已确认 390×844 下 `出牌 / 不要 / 提示` 可见；用户后续确认提示、出牌、不要交互可用。

## 自检（对照验收项）
- [x] 出牌/不要/提示代码接线
- [x] 非 hero 回合按钮置灰
- [x] 提示循环高亮逻辑
- [x] 组件不被测试导入
- [x] 390x844 按钮可见
- [x] 用户确认提示高亮且不自动出牌
- [x] 用户确认出牌/不要可推进流程
- [ ] 提示高亮正式截图
