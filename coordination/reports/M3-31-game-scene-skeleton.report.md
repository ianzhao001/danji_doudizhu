# M3-31-game-scene-skeleton 实现报告

- 实现方标识：Codex
- 分支：`task/M3-editor-integration`
- 状态：ready-for-review

## 改了哪些文件
- `assets/scripts/ui/components/game-scene-skeleton.ts`
- `assets/scene/game.scene`
- `assets/scene/game.scene.meta`
- `coordination/reports/M3-31-game-scene-skeleton-390x844.png`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  83 passed (83)
Tests       427 passed (427)

npm --prefix test run typecheck
tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 已新增游戏骨架 Cocos 组件，用 mock runtime 形状生成 snapshot，并通过 `deriveScreenVM` 渲染顶栏/手牌/action 文案。
- 已确认 Cocos Creator 3.8.8 可打开 `../斗地主.worktrees/M3-editor-integration`，控制台无导入错误。
- 已通过 Cocos Creator 创建并保存 `assets/scene/game.scene`，挂载 `GameSceneSkeleton` 并绑定桌面背景、牌面模板、阶段/地主/倍数/手牌/action 标签。
- 已加入 AI 座位、底牌区、出牌区、玩家手牌等可见占位节点。
- 已保存 390x844 验收截图：`coordination/reports/M3-31-game-scene-skeleton-390x844.png`。
- 场景和 `.meta` 均由 Cocos Creator 生成，未手写 `.scene` / `.prefab`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 组件层允许 import cc，未被 Vitest 导入
- [x] 纯逻辑测试全绿
- [x] typecheck 无错
- [x] 场景在 Cocos Creator 打开无报错
- [x] 390x844 预览截图
