# M3-35-event-cues-av 实现报告

- 实现方标识：Codex
- 分支：`task/M3-interaction`
- 状态：blocked（代码接线完成；Cocos Creator 音效/动效预览待执行）

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
- onEvent 里调用 `cueForFlowEvent`，再用 `cueAudioPath` 查音效路径。
- `settings.sound` 控制 AudioSource 播放；`settings.animation` 控制轻动效。
- cue 缺路径或资源加载失败时静默跳过。
- 轻动效先实现为 root 层短促 scale 强调，覆盖 deal/play/bomb/rocket 的反馈；更细的逐牌 tween 留给后续 polish。

## 疑问（给架构）
- 需要 Creator 预览确认 WAV 加载、声音开关、动画开关与炸弹/火箭强调。

## 自检（对照验收项）
- [x] FlowEvent→CueId→AudioClip 接线
- [x] sound / animation 设置开关接入
- [x] 缺资源静默跳过
- [x] 组件不被测试导入
- [ ] Creator 音效/动效验证
- [ ] 390x844 截图/录屏
