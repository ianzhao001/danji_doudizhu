# M3-31-game-scene-skeleton 实现报告

- 实现方标识：Codex
- 分支：`task/M3-editor-integration`
- 状态：blocked（组件脚本已准备，场景创建/截图仍需编辑器执行）

## 改了哪些文件
- `assets/scripts/ui/components/game-scene-skeleton.ts`

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
- 未创建 `.scene` / `.prefab`，因为项目规则禁止手写，且本次只完成了资源/脚本导入验证，尚未在编辑器内搭建并保存游戏主场景。
- 未产出 390x844 截图。

## 疑问（给架构）
- 需要编辑器执行者在 Cocos Creator 内创建游戏主场景、挂载 `GameSceneSkeleton`、绑定桌面/牌面/标签节点，并截图验收。

## 自检（对照验收项）
- [x] 组件层允许 import cc，未被 Vitest 导入
- [x] 纯逻辑测试全绿
- [x] typecheck 无错
- [ ] 场景在 Cocos Creator 打开无报错
- [ ] 390x844 预览截图
