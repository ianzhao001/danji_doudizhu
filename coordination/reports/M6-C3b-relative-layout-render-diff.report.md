# M6-C3b-relative-layout-render-diff 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：in-review（代码、纯验证、Creator 3.8.8 Preview 三分辨率复核已完成）

## 改了哪些文件
- 更新 `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `render()` 改为读取 Canvas `UITransform` 宽高，并向 `deriveScreenVM` 传入 `containerWidth` + `containerHeight`，消费 M6-L3 的参数化 `tableLayout(width,height)`。
  - 顶栏、运行时设置、AI 座位、出牌区、叫抢、手牌、状态、操作按钮、结算面板改为基于 `TableRegions` + Canvas 尺寸换算位置，不再使用旧的 390x844 固定坐标。
  - 移除 `render()` 中对 `runtime-ui` 的整树 `clearNode()` 销毁重建，改为每轮 render 标记活跃节点，复用稳定节点，末尾只清理本轮未使用节点。
  - `Label` / `Sprite` / `Button` / `Graphics` 组件改为 `getComponent(...) ?? addComponent(...)`，避免重复 render 时叠加组件。
  - 交互按钮和手牌卡牌节点在复用时先清理旧监听，避免重复绑定。

## 测试与类型检查输出
```
npm --prefix test run typecheck
tsc --noEmit

npm --prefix test test -- --testTimeout=60000
Test Files  127 passed (127)
Tests       623 passed (623)

git diff --check
<no output>
```

## Creator Preview 复核状态
- 已通过 Cocos Dashboard 重新打开 `/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor`，由 Cocos Creator 3.8.8 触发 Preview 重新编译。
- 已确认 Preview 编译缓存更新到 C3b 代码，`temp/programming/packer-driver/targets/preview/...` 中包含 `beginRenderDiff()` 与稳定节点名 `top-phase`。
- 三分辨率 Preview 复核截图已生成到本机临时目录（仅作验证证据，不纳入提交）：
  - `/tmp/doudizhu-c3b/M6-C3b-game-390x844.png`
  - `/tmp/doudizhu-c3b/M6-C3b-game-412x915.png`
  - `/tmp/doudizhu-c3b/M6-C3b-game-360x780.png`
- `sips` 校验截图像素尺寸：
  - `390x844`
  - `412x915`
  - `360x780`

| Preview 尺寸 | cc.view frame | cc.view visible | cc.view design | render 节点数 | 稳定节点复用 | action Button 组件数 |
| --- | --- | --- | --- | --- | --- | --- |
| 390x844 | 390x844 | 390x844 | 390x844 | 18 -> 18 | true | play/pass/hint 均为 1 |
| 412x915 | 412x915 | 390x866.1408 | 390x844 | 18 -> 18 | true | play/pass/hint 均为 1 |
| 360x780 | 360x780 | 390x845 | 390x844 | 18 -> 18 | true | play/pass/hint 均为 1 |

- Console / pageerror：未发现脚本错误或页面异常。截图采集期间仅出现 WebGL `GPU stall due to ReadPixels` 类警告，属于截图读取触发的运行时警告。
- 视觉观察：三张截图均能正常显示 `game` 场景，背景填充、节点未空白；画面与 C3a 基线一致。底部 CTA / 状态 / 手牌标题区域仍存在既有拥挤与重叠风险，属于后续 UI 精修任务范围，本次 C3b 未扩大该问题。

## 与 spec 的偏差 / 关键决策
- 本次只改 `.ts` + report，未改 scene/meta，符合 C3b 文件域。
- Canvas 尺寸兜底仍保留 `390/844`，仅用于 `UITransform` 不可读时避免除零；布局坐标本身已改为 `tableLayout(width,height)` + 相对区域换算。
- `render()` 不再全量销毁重建；仍会销毁本轮不再使用的旧节点，以防结算面板、叫抢按钮、已出牌卡牌等状态切换后残留。
- 多 FlowEvent 去抖未做；差分复用已覆盖本任务主要性能目标，后续如仍有抖动可单独补 schedule 合并。

## 疑问（给架构 / 审查者）
- 请优先审 `game-scene-skeleton.ts` 的节点复用与事件解绑是否足够稳健。
- 建议审查者复核 C3b 的 Creator Preview 证据与差分渲染实现；通过后再进入 C4。

## 自检（对照验收项）
- [x] 代码层不再使用旧 390x844 固定布局坐标
- [x] 消费 `deriveScreenVM(... layoutOpts.containerHeight ...)` / `tableLayout(width,height)`
- [x] `render()` 不再对 `runtime-ui` 全量 `clearNode()` 销毁重建
- [x] 重复 render 复用稳定节点与组件
- [x] `npm --prefix test test -- --testTimeout=60000` 全绿
- [x] `npm --prefix test run typecheck` 无错
- [x] `git diff --check` 无输出
- [x] 只改声明文件域
- [x] Creator 3.8.8 三分辨率 Preview 复核
