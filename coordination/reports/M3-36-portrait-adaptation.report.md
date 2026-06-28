# M3-36-portrait-adaptation 实现报告

- 实现方标识：Codex
- 分支：`task/M3-interaction`
- 状态：blocked（390×844 游戏预览已过最低可用；大厅与多尺寸截图待执行）

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
```

## 与 spec 的偏差 / 关键决策
- `deriveScreenVM` 的 `layoutOpts.containerWidth` 改为读取 Canvas `UITransform` 实际宽度，不再固定 390。
- 手动预览暴露的运行时 UI 重叠已修复：隐藏静态骨架节点、收窄手牌区域、下调手牌尺寸、将操作按钮移到手牌上方。
- `.scene` 由 Cocos Creator 保存，未手写。

## 疑问（给架构）
- 需要继续按 390x844 / 412x915 / 360x780 输出大厅和游戏截图，并视情况做 SafeArea/Widget 微调。
- 当前 390×844 游戏截图为用户聊天截图，尚未保存到 `coordination/reports/`。

## 自检（对照验收项）
- [x] 游戏组件动态读取实际宽度
- [x] 既有测试/typecheck 不受影响
- [x] 390x844 游戏预览无遮挡主流程 UI（用户截图，未落盘）
- [ ] 390x844 大厅 + 游戏正式截图
- [ ] 412x915 大厅 + 游戏截图
- [ ] 360x780 大厅 + 游戏截图
- [ ] SafeArea/Widget 实机确认
