# ART-02-avatars 实现报告

- 实现方标识：Codex
- 分支：`task/art-gen-v2`
- 状态：in-review

## 改了哪些文件
- `asset-previews/pink-cartoon-production-v2/avatars/`：新增 6 个最终 PNG。
- `asset-previews/pink-cartoon-production-v2/avatars/source/`：新增 6 个 source PNG。
- `asset-previews/pink-cartoon-production-v2/avatars/PROMPTS.md`：记录 prompt/source/post-processing。

## 测试与类型检查输出
```
Pillow validation:
missing []
bad_sizes []
alpha_issues []
```

## 与 spec 的偏差 / 关键决策
- 三个主头像使用内置 `image_gen` 生成 source，再做 chroma-key 抠透明。
- 身份徽章与头像框为确定性 Pillow 绘制，以保证 128/256 小尺寸下边缘干净、无字、无赌场/金钱元素。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 6 文件存在
- [x] 尺寸/透明/命名符合
- [x] source/ 齐全
- [x] PROMPTS.md 可复现
- [x] 不进 assets、不手写 .meta

