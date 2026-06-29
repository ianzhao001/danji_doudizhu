# M6-C2-animation-wiring 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：in-review（需编辑器复核 390×844 动效截图）
- 同步状态：已将 `main` 合入 `task/M6-editor`（merge commit `23f7027`），当前差异仍仅限 C2 范围。

## 改了哪些文件
- 更新 `assets/scripts/ui/components/game-scene-skeleton.ts`
- 未改 `assets/scene/game.scene` / `.meta`：出牌区节点与牌面均由组件运行时创建，避免手写 Cocos 场景资产。

## 测试与类型检查输出
```
npm --prefix test test -- --testTimeout=60000
Test Files  92 passed (92)
Tests       469 passed (469)

2026-06-30 同步 main 后复验：
npm --prefix test test -- --run --testTimeout=60000
Test Files  127 passed (127)
Tests       623 passed (623)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
通过
```

## 与 spec 的偏差 / 关键决策
- `playEffect(cue)` 已改为消费 `pulseParams(cue)`；非 pulse cue 走 null 分支不触发缩放。
- 事件回调顺序改为先 `render()` 后 `playCue(event)`，确保 bomb/rocket/play 的局部动效作用在新渲染出的出牌区节点，而不是即将被清理的旧节点。
- 出牌区从纯文本改为运行时卡牌节点，`playFlyFromTo()` 控制出牌飞入；bomb/rocket 作用对象收窄到出牌区节点，并附加短 shake。
- 手牌发牌/手牌变化使用 `dealCardDelay(index,total)` 做逐张位移 + 透明度进入；选中上浮去掉原硬编码 `+4`，只使用 VM `slot.y`，选中变化用短 tween。
- 结算面板使用 scale-in + opacity tween；所有渲染动效受 `settings.animation` 门控。
- 当前命令行无法可靠产出 Cocos 390×844 动效截图；本机 Creator 3.8.8 可见，但 `CocosCreator --help` 返回内置 Node 帮助。请架构/编辑器复核时在 Creator 预览中补炸弹/火箭局部动效截图。
- 原 worktree 中未纳入 C2 的本地 Creator 配置改动（`package.json` 格式/uuid、`settings/` 目录）已移入 stash：`stash@{0}` / `pre-c2-main-merge local Creator config noise`。同步 main 后工作树干净；C2 不提交 `package.json` / `settings/` / `profiles/` 噪声。

## 疑问（给架构）
- 若后续要求出牌区节点持久写入 `game.scene`，请用 Cocos Creator 编辑器生成并保存 scene/meta；本次按 guardrail 未手写场景资产。

## 自检（对照验收项）
- [x] 消费 M6-L2 animation-params
- [x] deal 逐张飞入逻辑
- [x] play 出牌区牌面飞入逻辑
- [x] bomb/rocket 出牌区局部强调，不再整屏 pulse
- [x] 结算弹窗入场逻辑
- [x] 选中上浮去硬编码双重 lift
- [x] animation 关闭时不触发渲染动效
- [x] 测试全绿
- [x] typecheck 无错
- [ ] 390×844 炸弹/火箭局部动效截图（待 Creator 复核）
