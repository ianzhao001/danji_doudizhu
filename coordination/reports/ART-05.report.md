# ART-05-misc-assets 实现报告

- 实现方标识：Codex
- 分支：`task/art-final-review-assets`
- 状态：in-review

## 改了哪些文件
- `asset-previews/pink-cartoon-production-v2/misc/`：新增 `splash.png`、`app-icon.png`、`empty-records.png`、`badge-win.png`、`badge-lose.png`。
- `asset-previews/pink-cartoon-production-v2/misc/source/`：新增 5 个 source PNG。
- `asset-previews/pink-cartoon-production-v2/misc/PROMPTS.md`：记录 prompt/source/post-processing。

## 测试与类型检查输出
```
Pillow validation:
splash.png       1080x2340 opaque dark_edge=0
app-icon.png     1024x1024 opaque dark_edge=0
empty-records.png 512x512 transparent dark_edge=0
badge-win.png    512x512 transparent dark_edge=0
badge-lose.png   512x512 transparent dark_edge=0

git diff --check
通过，无输出
```

## 与 spec 的偏差 / 关键决策
- `splash.png` 与 `app-icon.png` 使用 built-in `image_gen` source，最终保存为不透明 PNG。
- `empty-records.png`、`badge-win.png`、`badge-lose.png` 使用 built-in `image_gen` + `#00ff00` chroma-key，再用系统 imagegen helper 抠透明。
- `app-icon` 原 source 外圈有黑底；最终图只移除连通黑底，并放到柔粉不透明安全区上，避免黑角进入预览资产。
- `badge-win` / `badge-lose` 为可选项，本次一并生成，便于后续发布资源导入时选择。
- 本任务只写 `asset-previews/` 和 report；未导入 `assets/`，未手写 `.meta`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] splash / app-icon / empty-records / badge-win / badge-lose 文件存在
- [x] 尺寸符合本报告约定
- [x] 透明/不透明符合用途
- [x] 无字、无 logo、无牌点、无赌场/金钱元素
- [x] source/ 齐全，PROMPTS.md 已落盘
- [x] 不进 assets、不手写 .meta
