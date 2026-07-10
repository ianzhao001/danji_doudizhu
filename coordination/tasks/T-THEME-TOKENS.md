# T-THEME-TOKENS — 主题令牌纯岛（v1.4 统一 UI 风格的唯一真相源）

- **批次**：v1.4 第一波 W-UNIFY·纯逻辑批（T-THEME-TOKENS → T-INTERACT-VIEWS → T-LASTPLAY-CARDS 单窗链式）
- **类型**：纯逻辑（ui 纯岛·禁 `cc`）·**纯 spec 派发**（覆盖级测试执行者自写，见 PROTOCOL 铁律 1 种子分级）
- **分支**：`task/T-THEME-TOKENS`（已建自 main）
- **执行者**：Cursor　**审查者**：Codex（按 `tasks/R-WAVE10.md`）

## 背景与动机
当前视觉常量散落在 cc 层：`ui/components/ui-helpers.ts` 内联 ~15 处 `new Color(...)`（含按钮四态、面板填充、选中/禁用透明度），`lobby-scene.ts` / `game-scene/*` 各自还有魔法色值与字号。v1.4 目标「统一 UI 风格」的第一步是把**颜色/字号/间距/圆角/透明度**收敛为一个可测试的纯岛真相源，后续 P-THEME-APPLY 让 cc 层全部改经令牌取值。

## 目标
新建 `assets/scripts/ui/theme.ts`——**零依赖、禁 `cc`** 的主题令牌模块。

## 文件域
- 新 `assets/scripts/ui/theme.ts`
- `assets/scripts/ui/index.ts` 桶：**仅允许追加一行导出**（铁律 4 授权）
- 新 `test/ui/theme.test.ts`（执行者自写）
- `coordination/reports/T-THEME-TOKENS.report.md`
- `.meta` 交由 Cocos 编辑器生成，不手写（可留待 P 波编辑器侧补，报告注明即可）

## 契约
```ts
export interface ThemeColor { r: number; g: number; b: number; a: number }  // 0-255 整数

export interface Theme {
  palette: {
    // 品牌与桌面（保持 v1.2 UI-REMAKE 既定粉色基调，禁止发明新配色方向）
    brand: ThemeColor; brandDark: ThemeColor;
    surface: ThemeColor; surfaceRaised: ThemeColor; overlayScrim: ThemeColor;
    textPrimary: ThemeColor; textSecondary: ThemeColor; textDisabled: ThemeColor; textOnAccent: ThemeColor;
    accentGold: ThemeColor; accentCream: ThemeColor;
    danger: ThemeColor; success: ThemeColor; warning: ThemeColor;
    selectedTint: ThemeColor; // 手牌/按钮选中底（对应现 ui-helpers 255,224,232 系）
  };
  typography: { xs: number; sm: number; md: number; lg: number; xl: number; display: number };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  radius: { sm: number; md: number; lg: number; pill: number };
  alpha: { disabled: number; hover: number; pressed: number; scrim: number }; // 0-255
}

export const THEME: Theme; // 深度冻结（Object.freeze 递归）
```
- **取值方法（重要·统一≠重设计）**：先盘点 `ui/components/ui-helpers.ts`、`lobby-scene.ts`、`game-scene/*` 现存内联色值/字号，**归并相近值**填充令牌（例如按钮选中底 255,224,232 系、白字 255,255,255 与各透明度档）；令牌值应让 P-THEME-APPLY 阶段的替换**默认视觉零漂移或仅微调**。盘点清单（原色值 → 归并到哪个令牌）写进报告。
- 允许按盘点结果**增补**少量键（如 `palette.tableFelt`），但结构分组（palette/typography/spacing/radius/alpha）不得改；总色彩令牌数 ≤ 24。
- 本任务**不改任何消费方**——ui-helpers/场景组件在 P-THEME-APPLY 才接线。

## 必须覆盖用例清单（执行者自写 vitest，缺一不收）
1. `THEME` 及全部嵌套对象 `Object.isFrozen` 为 true（递归抽查每个分组）。
2. 所有 `ThemeColor` 通道均为 0–255 **整数**（遍历断言）。
3. `typography` 与 `spacing` 各自**严格单调递增**（xs < sm < md < lg < xl [< display]）。
4. `theme.ts` 源码不含 `from 'cc'`（读文件断言，沿用既有护栏测试手法）。
5. 快照锁形：`Object.keys` 的分组与键集合与本契约一致（防后续静默增删键）。

## 红线
- 禁 import `cc` 及任何运行时依赖（纯常量 + 类型）。
- 不动 `ui/components/**`、不动既有纯岛、不改既有测试。
- 不引入色彩计算/转换函数（cc `Color` 转换属 P-THEME-APPLY 的 cc 层）。

## 验收
- 全量 `npm --prefix test test` + `typecheck` 绿；新测试覆盖上述清单。
- 报告含：盘点清单（现存色值→令牌映射表）、令牌总数、桶导出 diff 一行。
