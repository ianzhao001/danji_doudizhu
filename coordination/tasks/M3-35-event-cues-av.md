# M3-35 动画/音效 cue 驱动（FlowEvent → cue → 音效 + 轻动效）

- 状态：blocked（待 M3-32；同 `task/M3-interaction` 串行 #4）
- 派发模式：编辑器执行者（非 worktree·Cocos Creator）
- 执行分支：`task/M3-interaction`
- 文件域：`assets/scene/game.scene`（AudioSource + 动效节点）、`assets/scripts/ui/components/*`、`.meta`（编辑器）
- 依赖：M3-32（onEvent 回流）；`event-cues`（`cueForFlowEvent`→CueId）、`asset-keys`（`cueAudioPath` 已映射 deal/play/pass/bomb/rocket/win）均在 main；音效资源 `assets/resources/audio/*`（M3-29 导入·WAV）

## 目标
消费门面 `onEvent` 的 `FlowEvent`，经 `cueForFlowEvent` 映射 `CueId`，驱动**音效播放**与**轻量动效**（发牌/出牌/炸弹/火箭强调），让闭环有反馈。提示复用已有 cue，不在组件重判规则。

## 行为要求
1. onEvent(e)：`const cue = cueForFlowEvent(e);` 若非 null → `playCue(cue)`。
2. `playCue(cue)`：`const path = cueAudioPath(cue);` 若非 null → `resources.load(path, AudioClip, ...)` 用 AudioSource 播一次；受 `settings.soundOn` 开关（`loadSettings`）。
3. 轻动效（受 `settings.animationOn`）：deal→手牌淡入/位移、play→出牌区牌面入场 tween、bomb/rocket→出牌区短促放大/抖动强调；win/lose→结算弹窗入场（与 M3-34 弹窗联动）。动效用 cc `tween`，时长短（≤300ms），不阻塞交互。
4. 音效缺资源/加载失败静默跳过（不报错、不阻塞）。
5. WAV 直接用（M3-29 已导入）；mp3 转码为后续优化，非本任务阻塞。

## 验收
- 出牌/炸弹/火箭/发牌有对应音效（soundOn）与轻动效（animationOn）；关开关后静默/无动效。
- 组件不被测试 import；纯逻辑/typecheck 不受影响。
- **390×844 截图/录屏**（炸弹强调动效一帧）。
