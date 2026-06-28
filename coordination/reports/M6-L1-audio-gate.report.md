# M6-L1-audio-gate 实现报告

- 实现方标识：Codex
- 分支：`task/M6-L1`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/audio-gate.ts`：新增 `decideCuePlayback()` 与 `CuePlaybackDecision`，按 settings + cue 决定 sound/effect/vibrate。
- `assets/scripts/ui/index.ts`：导出 `audio-gate`。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  86 passed (86)
Tests       443 passed (443)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed

rg "^import .*['\"]cc['\"]" ... 
no matches
```

## 与 spec 的偏差 / 关键决策
- `effect` 仅对 `deal/play/bomb/rocket` 为 true。
- `vibrate` 仅对 `bomb` 为 true，满足当前 seed 契约并避免普通音效 cue 产生过度震动。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
