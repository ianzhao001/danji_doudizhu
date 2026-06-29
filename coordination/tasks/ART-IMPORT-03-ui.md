# ART-IMPORT-03 UI 元素预览包导入 assets/（第十一批·核心·gated）

- 状态：**blocked（待用户对 ART-03 UI 视觉终审通过）**——ART-03 仍 `in-review`
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·导入资源·.meta 编辑器生成）
- 文件域：`assets/resources/art/ui/*`（导入 PNG）+ `assets/scripts/ui/asset-keys.ts`（加 UI 键）+ `.meta`、report
- 依赖：用户视觉终审 ART-03（`asset-previews/pink-cartoon-production-v2/ui/` 15 张）；照 **M3-29 导入流程**

## 目标
把用户认可的 ART-03 UI 元素（按钮 240×96 / 图标 96² / 状态徽章 128² / 面板 900×1100，全透明）导入 `assets/resources/`，登记 `asset-keys.ts`，供按钮/图标/面板组件按键加载。

## 行为要求
1. 15 张 PNG 导入 `assets/resources/art/ui/`，**编辑器生成 .meta**；按钮类按九宫格/sprite 需要设置（参照 M3-29）。
2. `asset-keys.ts` 加 UI 键→路径；命名与文件名对齐。
3. 不改美术内容；不动其他键。
4. 若 `asset-keys.test.ts` 锁键集则同步补测试（ui 纯岛·零 cc）。

## 验收
- UI 资源在 `assets/resources/art/ui/`，.meta 编辑器生成；键解析正确。
- 纯逻辑测试/typecheck 不受影响；编辑器加载无报错；report 记清单 + 键映射。
