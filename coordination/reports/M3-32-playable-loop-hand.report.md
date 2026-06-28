# M3-32-playable-loop-hand 实现报告

- 实现方标识：Codex
- 分支：`task/M3-interaction`
- 状态：blocked（代码接线完成；Cocos Creator 未能切到本 worktree，编辑器预览/截图待执行）

## 改了哪些文件
- `assets/scripts/ui/components/game-scene-skeleton.ts`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  85 passed (85)
Tests       437 passed (437)

npm --prefix test run typecheck
tsc --noEmit

临时严格组件检查：
tsc --noEmit -p /private/tmp/m3-component-tsconfig.json
<no output>

git diff --check
<no output>
```

## 与 spec 的偏差 / 关键决策
- 保留 `GameSceneSkeleton` 类名，避免 scene 引用 churn。
- 去除 mock runtime，改为真实 `startRoundRuntime` / `resumeRoundRuntime`。
- 组件侧直引 `../../flow/round-runtime` 与 `../../data/session`，因为当前 barrel 未导出这些模块。
- 动态创建 `runtime-ui` 层，手牌、座位、出牌区等节点运行时生成，不手写 `.scene` / `.meta`。
- `layoutOpts.containerWidth` 读取 Canvas `UITransform` 实际宽度。

## 疑问（给架构）
- 需要用 Cocos Creator 3.8.8 打开 `../斗地主.worktrees/M3-interaction`，预览并保存 390x844 运行中截图。
- 当前本机 Creator 进程仍锁在旧 `M3-editor-integration` project；命令行 `--path`/`--project` 未能切换，未关闭用户现有窗口。

## 自检（对照验收项）
- [x] 真实 runtime start/resume/persist/settle 接线
- [x] hero 手牌点击选择、选中上浮逻辑
- [x] AI 自动推进依赖 `round-runtime`
- [x] 组件不被 Vitest 导入
- [x] 纯层零 `cc` import
- [ ] Cocos Creator 打开本 worktree 无报错
- [ ] 390x844 运行中截图
