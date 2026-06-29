# ART-IMPORT-02 头像预览包导入 assets/（第十一批·核心·gated）

- 状态：**blocked（待用户对 ART-02 头像视觉终审通过）**——ART-02 仍 `in-review`
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·导入资源·.meta 编辑器生成）
- 文件域：`assets/resources/art/avatars/*`（导入的 PNG）+ `assets/scripts/ui/asset-keys.ts`（加头像键→路径）+ 生成的 `.meta`、report
- 依赖：用户视觉终审 ART-02（`asset-previews/pink-cartoon-production-v2/avatars/` 6 张）；照 **M3-29 导入流程**

## 目标
把已技术验收 + 用户视觉认可的 ART-02 头像预览包（玩家/两 AI/地主农民徽章/头像框，256²/128²）从 `asset-previews/` 物理导入 `assets/resources/`，登记到 `asset-keys.ts` 对照表，供组件按键加载。

## 行为要求
1. 把 6 张 PNG 复制/导入到 `assets/resources/art/avatars/`，**由 Cocos 编辑器生成 .meta**（勿手写）；spriteframe/texture 设置参照 M3-29 既有牌面导入。
2. `asset-keys.ts` 的 `RESOURCE_PATHS` 加头像键（命名与文件名对齐，键名风格随既有 cardTemplate 等）。
3. 不改美术内容（导入即用）；不动其他资源键。
4. `asset-keys.test.ts` 若锁键集，同步补该测试（属 ui 纯岛·零 cc）。

## 验收
- 头像在 `assets/resources/art/avatars/` 且 .meta 由编辑器生成（唯一 uuid）。
- `asset-keys` 新键解析正确；纯逻辑测试/typecheck 不受影响。
- 编辑器加载无报错；report 记导入清单 + 键映射。
