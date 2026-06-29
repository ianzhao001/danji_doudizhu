# M6-C2-animation-wiring 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：done（已并 main：`17b96f3`）
- 同步状态：已将 `main` 合入 `task/M6-editor`（merge commit `23f7027`），最终并入范围为 C2 脚本 + 本报告 + 390×844 截图。

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

## Creator 3.8.8 复核
- 打开方式：Cocos Dashboard → `M6-editor` → Cocos Creator 3.8.8，项目路径 `/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor`。
- 场景：`game.scene` 已打开并可预览，Chrome 预览地址 `http://localhost:7456/`。
- 预览分辨率：设备档 `Apple iPhone 12; 13; 14; 12/13 Pro (390X844)`；CDP 确认 `GameCanvas` 边界为 `390×844`。
- 截图：`coordination/reports/M6-C2-bomb-effect-390x844.png`。
- bomb 局部动效验证：运行时调用 `GameSceneSkeleton.playEffect('bomb')`，返回目标节点 `play-area-runtime`；40ms 动效帧中目标从 `{x:0,y:62,scale:1}` 变为约 `{x:4.14,y:62,scale:1.04}`，验证为出牌区局部位移/缩放，不是整屏 `uiRoot`。
- Console 状态：Creator Console 仅见 `[Scene]` / physics 初始化日志，未见 Error 行；Chrome 预览可渲染运行画面。

## 与 spec 的偏差 / 关键决策
- `playEffect(cue)` 已改为消费 `pulseParams(cue)`；非 pulse cue 走 null 分支不触发缩放。
- 事件回调顺序改为先 `render()` 后 `playCue(event)`，确保 bomb/rocket/play 的局部动效作用在新渲染出的出牌区节点，而不是即将被清理的旧节点。
- 出牌区从纯文本改为运行时卡牌节点，`playFlyFromTo()` 控制出牌飞入；bomb/rocket 作用对象收窄到出牌区节点，并附加短 shake。
- 手牌发牌/手牌变化使用 `dealCardDelay(index,total)` 做逐张位移 + 透明度进入；选中上浮去掉原硬编码 `+4`，只使用 VM `slot.y`，选中变化用短 tween。
- 结算面板使用 scale-in + opacity tween；所有渲染动效受 `settings.animation` 门控。
- 原 worktree 中未纳入 C2 的本地 Creator 配置改动（`package.json` 格式/uuid、`settings/` 目录）已移入 stash：`pre-c2-main-merge local Creator config noise`；一次 Creator 启动产生的 `package.json` 噪声也已移入 stash：`post-c2-creator-open package noise`。当前仅保留 ignored 的 `library/` / `profiles/` / `temp/` 运行目录；C2 不提交 `package.json` / `settings/` / `profiles/` 噪声。

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
- [x] 390×844 炸弹/火箭局部动效截图（`M6-C2-bomb-effect-390x844.png`）
