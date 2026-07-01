# ART-04-cards 实现报告

- 实现方标识：Codex
- 分支：`task/art-final-review-assets`
- 状态：in-review

## 改了哪些文件
- `asset-previews/pink-cartoon-production-v2/cards/card-back.png`：视觉预审后返工，替换旧版黑角/重黑描边牌背。
- `asset-previews/pink-cartoon-production-v2/cards/source/card-back-source.png`：替换为新版 built-in `image_gen` source。
- `asset-previews/pink-cartoon-production-v2/cards/PROMPTS.md`：更新新版 card-back prompt/source/post-processing。
- `joker-small.png`、`joker-big.png`、`card-template.png` 保持原 ART-04 技术验收版本。

## 测试与类型检查输出
```
Pillow validation:
missing []
bad_sizes []
alpha_issues []

card-back edge validation:
dark_edge 0
corners [253,254,253,255] [255,254,254,255] [254,255,254,255] [254,254,254,255]
```

## 与 spec 的偏差 / 关键决策
- `card-back.png` 使用新版内置 `image_gen` source，裁到 400x560 后保持不透明；这次 prompt 明确规避 black corners / heavy dark border。
- `joker-small.png` / `joker-big.png` 复用 v1 已验收的 built-in image_gen source，重新抠透明并统一输出到 v2 cards。
- `card-template.png` 继续用 deterministic Pillow 生成，保持与 v1/MANIFEST/`asset-keys.ts` 的 `card-template` 命名一致。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 文件存在、400x560 尺寸符合
- [x] 大小王透明外区符合
- [x] 牌背不透明，且无黑角/重黑边
- [x] 无点数/字母/牌点/可读文字
- [x] `card-template.png` 命名与代码键名一致
- [x] source/ 齐全，PROMPTS.md 已落盘
- [x] 不进 assets、不手写 .meta
