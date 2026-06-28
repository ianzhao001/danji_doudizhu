# ART-04-cards 实现报告

- 实现方标识：Codex
- 分支：`task/art-gen-v2`
- 状态：in-review

## 改了哪些文件
- `asset-previews/pink-cartoon-production-v2/cards/`：新增 `card-back.png`、`joker-small.png`、`joker-big.png`、`card-template.png`。
- `asset-previews/pink-cartoon-production-v2/cards/source/`：新增对应 source PNG。
- `asset-previews/pink-cartoon-production-v2/cards/PROMPTS.md`：记录 prompt/source/post-processing。

## 测试与类型检查输出
```
Pillow validation:
missing []
bad_sizes []
alpha_issues []
```

## 与 spec 的偏差 / 关键决策
- `card-back.png` 使用内置 `image_gen` source，裁到 400x560 后保持不透明。
- `joker-small.png` / `joker-big.png` 复用 v1 已验收的 built-in image_gen source，重新抠透明并统一输出到 v2 cards。
- `card-template.png` 继续用 deterministic Pillow 生成，保持与 v1/MANIFEST/`asset-keys.ts` 的 `card-template` 命名一致。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 文件存在、400x560 尺寸符合
- [x] 大小王透明外区符合
- [x] 牌背不透明
- [x] 无点数/字母/牌点/可读文字
- [x] `card-template.png` 命名与代码键名一致
- [x] source/ 齐全，PROMPTS.md 已落盘
- [x] 不进 assets、不手写 .meta

