# ART-01-backgrounds 实现报告

- 实现方标识：Codex
- 分支：`task/art-gen-v2`
- 状态：in-review（技术规格通过，等待用户视觉终审）

## 改了哪些文件
- `asset-previews/pink-cartoon-production-v2/backgrounds/lobby-bg.png`
- `asset-previews/pink-cartoon-production-v2/backgrounds/game-table-bg.png`
- `asset-previews/pink-cartoon-production-v2/backgrounds/settlement-panel.png`
- `asset-previews/pink-cartoon-production-v2/backgrounds/source/*.png`
- `asset-previews/pink-cartoon-production-v2/backgrounds/PROMPTS.md`

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
- 使用内置 `image_gen` 生成 3 张源图；背景图经 Pillow 居中裁切/缩放到 1080x2340。
- `settlement-panel.png` 使用 `#00ff00` chroma-key + `remove_chroma_key.py` 抠透明，再居中 fit 到 900x1200 透明画布。
- ART-01 只输出到 `asset-previews/pink-cartoon-production-v2/backgrounds/`，未导入 `assets/`。
- 技术检查通过；视觉终审按任务约定交给用户。

## 疑问（给架构）
- 无。等待用户确认 ART-01 风格锚后再继续 ART-02/03/04。

## 自检（对照验收项）
- [x] 3 个最终 PNG 存在且命名符合
- [x] `lobby-bg.png` / `game-table-bg.png` 为 1080x2340
- [x] `settlement-panel.png` 为 900x1200 且有透明外区
- [x] 无可见文字、logo、金币、筹码、现金、博彩元素
- [x] `PROMPTS.md` 记录 prompt、源路径、后处理步骤
- [x] 未导入 Cocos `assets/`
