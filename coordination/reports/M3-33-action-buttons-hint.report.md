# M3-33-action-buttons-hint 实现报告

- 实现方标识：Codex
- 分支：`task/M3-interaction`
- 状态：blocked（代码接线完成；Cocos Creator 预览/截图待执行）

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
```

## 与 spec 的偏差 / 关键决策
- 出牌 / 不要 / 提示按钮运行时创建，不改 `game.scene`。
- 按钮可用态来自 `deriveScreenVM().actions`。
- 出牌/不要调用 `runtime.submitPlayerAction`；失败原因写到 `actionLabel`，成功出牌清空选中。
- 提示使用 `nextHint(snapshot.viewerHand, snapshot.top?.pattern ?? null, selected)`，只高亮建议，不自动出牌。

## 疑问（给架构）
- 需要 Creator 预览验证按钮点击与截图。

## 自检（对照验收项）
- [x] 出牌/不要/提示代码接线
- [x] 非 hero 回合按钮置灰
- [x] 提示循环高亮逻辑
- [x] 组件不被测试导入
- [ ] Creator 预览验证
- [ ] 390x844 按钮态 + 提示高亮截图
