# ART-PAUSE-BTN Prompts

任务：ART-PAUSE-BTN  
状态：preview-only，等待用户图审  
生成日期：2026-07-06  

## 约束

- 正式源图由内置 `image_gen` 文生图生成。
- Pillow 仅用于非创作后处理：chroma-key 去背、裁切、透明画布归一、九宫格拉伸模拟、review sheet 排版、sha256 计算。
- 不导入 `assets/resources/**`，不生成 `.meta`，不改产品代码。
- 按用户裁决先出 2 组按钮皮肤：设置切换组、动作组。若用户图审要求 6 个独立按钮，再扩展为 6 件。

## 生成件

| 件名 | 文件 | 来源 | 后处理 | 尺寸 | alpha | 建议 border | sha256 | 图审状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| pause-btn-toggle | `ui/pause-btn-toggle.png` | built-in `image_gen`，源图 `source/pause-btn-toggle-source.png` | green chroma-key 去背；alpha crop；contain 到透明 360x96；生成 64/176 拉伸模拟 | 360x96 | yes | 24 | `dfc59c31cf9bae527c0fafbca9f0610360d88711577e4d3ba0f8d9c041c17a3e` | pending user review |
| pause-btn-action | `ui/pause-btn-action.png` | built-in `image_gen`，源图 `source/pause-btn-action-source.png` | green chroma-key 去背；alpha crop；contain 到透明 360x96；生成 64/176 拉伸模拟 | 360x96 | yes | 24 | `3ff4a24015bad8b45b3898a45b4d0a0b7611bece6ff780f2853650300be97675` | pending user review |

## Source Hashes

| 源图 | sha256 |
| --- | --- |
| `source/pause-btn-toggle-source.png` | `d00d6d1ee5137cec6981a07bec814bc762bb2e2a829df006be3f0978e2d7ad02` |
| `source/pause-btn-action-source.png` | `38ba98aa373f166c150579016c0b8be686e518a63a20f3b051a4cede6e04ea21` |
| `review-sheet.png` | `dba738a752f5453dea1a5ed590d2afbb50edb39dfd0b8f926518407fa7678b88` |

## Prompt Summaries

### pause-btn-toggle

Sweet pink cartoon mobile game UI button skin, front-facing orthographic 9-slice ready capsule button, strawberry pink outer rim, cream inner panel, soft highlights and tiny heart/star accents, no text, no logo, no icon, centered on flat pure green chroma-key background, transparent-looking edges, high contrast for dark purple Chinese text, corners broad and stable for 24px sprite border.

### pause-btn-action

Sweet pink cartoon mobile game UI action button skin, front-facing orthographic 9-slice ready rounded capsule, coral-pink bevel frame, warm golden-cream center, soft candy gloss, subtle heart/star decorations only on corners, no text, no logo, no icon, centered on flat pure green chroma-key background, high contrast for dark purple Chinese text, corners broad and stable for 24px sprite border.

## Stretch Simulations

`stretch/` contains 12 simulations:

- `pause-btn-toggle`: 64px and 176px for `音效开` / `动效开` / `震动开`
- `pause-btn-action`: 64px and 176px for `继续` / `重开` / `退出`

These are Cocos text-rendering simulations only. The approved import should use the clean skin PNGs and Cocos labels.

