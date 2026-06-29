# ART-IMPORT-04 牌面预览包导入 assets/（第十一批·核心·gated）

- 状态：**blocked（待用户对 ART-04 牌面视觉终审通过）**——ART-04 仍 `in-review`
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·导入资源·.meta 编辑器生成）
- 文件域：`assets/resources/art/cards/*`（导入 PNG）+ `assets/scripts/ui/asset-keys.ts`（更新牌面键）+ `.meta`、report
- 依赖：用户视觉终审 ART-04（`asset-previews/pink-cartoon-production-v2/cards/` 4 张：card-back/joker-small/joker-big/card-template）；照 **M3-29 导入流程**

## 目标
把用户认可的 ART-04 牌面（牌背/大小王/牌框 card-template，400×560）导入 `assets/resources/`，**命名须对齐 `asset-keys.ts` 现有 `cardTemplate` 键**（否则加载断），替换/补齐既有占位牌面。

## 行为要求
1. 4 张 PNG 导入 `assets/resources/art/cards/`，**编辑器生成 .meta**；与 M3-29 既有 7 张牌面共存或替换（择一，report 说明哪些被替换）。
2. **card-template.png 命名与 `asset-keys.ts:cardTemplate` 键严格一致**；joker/card-back 键对齐。
3. 不改美术内容；不破坏既有牌面键解析（M3-32 手牌渲染依赖 `cardAssetPath`）。
4. 若替换占位牌面，确认 `card-view`/`cardAssetPath` 路径仍解析（必要时同步 `asset-keys.test.ts`，ui 纯岛·零 cc）。

## 验收
- 牌面在 `assets/resources/art/cards/`，.meta 编辑器生成；`cardTemplate`/joker/card-back 键解析正确。
- 手牌渲染（M3-32）仍能按键加载；纯逻辑测试/typecheck 不受影响；编辑器无报错；report 记清单 + 替换说明。
