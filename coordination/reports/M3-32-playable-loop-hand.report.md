# M3-32-playable-loop-hand 实现报告

- 实现方标识：Codex
- 分支：`task/M3-interaction`
- 状态：in-review（390×844 预览已进入真实运行时；手牌选中上浮仍建议 review 时复点确认）

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
- 保留 `GameSceneSkeleton` 类名，避免 scene 引用 churn。
- 去除 mock runtime，改为真实 `startRoundRuntime` / `resumeRoundRuntime`。
- 组件侧直引 `../../flow/round-runtime` 与 `../../data/session`，因为当前 barrel 未导出这些模块。
- 动态创建 `runtime-ui` 层，手牌、座位、出牌区等节点运行时生成；运行时节点显式继承 Canvas 图层并置顶，避免浏览器预览不可交互。
- `layoutOpts.containerWidth` 读取 Canvas `UITransform` 实际宽度。
- 隐藏 M3-31 静态骨架 label / 占位牌，避免与运行时 UI 叠加。

## 疑问（给架构）
- 用户已用 Cocos Creator 3.8.8 / Chrome 预览验证：390×844 可从叫抢进入 playing，AI 自动推进，手牌与操作区可见。
- 仍建议 review 时复点手牌选中上浮，并保存无 DevTools / 无 vConsole 的正式截图。

## 自检（对照验收项）
- [x] 真实 runtime start/resume/persist/settle 接线
- [x] hero 手牌点击选择、选中上浮逻辑
- [x] AI 自动推进依赖 `round-runtime`
- [x] 组件不被 Vitest 导入
- [x] 纯层零 `cc` import
- [x] Cocos Creator 打开本 worktree 无红色编译错误
- [x] 390x844 运行中预览（用户截图，未落盘）
- [ ] 正式截图落盘到 `coordination/reports/`
