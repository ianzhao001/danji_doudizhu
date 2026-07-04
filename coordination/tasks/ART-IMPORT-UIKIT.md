# ART-IMPORT-UIKIT — v12 皮肤件导入 + 九宫格 border 配置

- 状态：ready（ART-UIKIT ✅ done `7f71cf2`·用户视觉终审通过，previews 已在 main）
- 类型：美术·导入（Cocos Creator 实操——执行者代验取证，PROTOCOL 铁律 6）
- 文件域（**只允许改这些**）：
  - `assets/resources/art/ui/seat-nameplate.png`、`bottom-cards-dock.png`（**新增**）+ `.meta`（Creator 生成）
  - `assets/resources/art/ui/btn-primary.png`、`btn-secondary.png`、`btn-disabled.png`（**用 v12 重制版覆盖**）+ `.meta`
  - `assets/resources/art/ui/panel-popup.png` 的 **`.meta` 仅配 border**（图**不替换**——角部判定安全）
  - `assets/scripts/ui/asset-keys.ts`（新增 2 键，**种子断言已钉**：`seatNameplate: 'art/ui/seat-nameplate'`、`bottomCardsDock: 'art/ui/bottom-cards-dock'`）
  - `coordination/reports/ART-IMPORT-UIKIT.report.md`
  - **禁碰两巨组件**（接线归 P-G3③/P-L3②）；不碰 `*-set` 图集（已弃用登记）
- 依赖：ART-UIKIT ✅
- 分支：`task/ART-IMPORT-UIKIT`（自含 previews 的 main 创建）

## 行为要求
1. 从 `asset-previews/v12-uikit/` 拷入上述 5 张图（**逐字节不动**，审查者 sha256 对比）；panel-popup 不拷。
2. **在 Creator 3.8.8 检视器**为 6 张图（btn×3 + panel-popup + seat-nameplate + bottom-cards-dock）配九宫格 border（依 preview 的 corner-metrics：按钮/名字牌/托架四角平坦区 ≥24px；panel-popup 依其角样取值），re-import 让 `.meta` 落盘。**不手写 `.meta`**。
3. `asset-keys.ts` 增 2 键（种子测试转绿）。

## 验收
- 种子键断言绿 + 全量 vitest/typecheck 不回归。
- 报告：每张图 sha256（与 preview 对照）、`.meta` UUID、border 四值与取值依据、Creator 版本。
- 审查按 `tasks/R-WAVE2.md` R:ART-IMPORT-UIKIT 检查单。

## 交付物
分支提交 + 报告 → 提审 → 审查者 approved 后合并（lane 排队）。
