# M3-22 设置界面 VM + 不可变变更器（Settings → SettingsView）

- 状态：ready
- **派发模式：纯 spec（无架构种入测试）**——实现方按本 spec 自写 vitest 测试 + 实现。新文件 **import 直引、不改 `ui/index.ts` 桶**。`ui/` 纯逻辑岛，**禁止 import `cc`**。
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/settings-view.ts`（新）
  - 新增 `test/ui/settings-view.test.ts`（实现方自写）
  - 可读不可改：`assets/scripts/data/settings.ts`（`Settings`）、`assets/scripts/ai/strategy.ts`（`AiLevel`）
- 依赖：`data/settings`（`Settings`/`defaultSettings`）、`ai/strategy`（`AiLevel`，均已并 main）
- 分支：`task/M3-22-settings-view`

## 背景
设置界面需把 `Settings`（difficulty/sound/vibration/animation）变成开关行 VM，并提供**不可变**的变更器（翻开关、改难度）供组件回写。组件不该手动 spread。

## 公共 API 契约
```ts
export type ToggleKey = 'sound' | 'vibration' | 'animation';
export interface SettingsView {
  toggles: { key: ToggleKey; on: boolean }[];   // 固定序 [sound, vibration, animation]
  difficulty: AiLevel;
}
export function deriveSettingsView(settings: Settings): SettingsView;
export function toggleSetting(settings: Settings, key: ToggleKey): Settings;   // 不可变：翻转该布尔
export function setDifficulty(settings: Settings, level: AiLevel): Settings;     // 不可变：改难度
```

## 行为要求
1. `deriveSettingsView`：`toggles` 固定序 `sound→vibration→animation`，`on` 取对应布尔；`difficulty` 透传。
2. `toggleSetting`/`setDifficulty`：返回**新对象**，仅改目标字段，其余（含 `version`）保持；**不修改入参**。
3. 纯函数、确定性、禁 import `cc`。

## 验收（实现方自写 test/ui/settings-view.test.ts）
- `deriveSettingsView(defaultSettings())` → `toggles` 三项全 `on:true`、顺序 sound/vibration/animation、`difficulty:'normal'`。
- `toggleSetting(s,'sound').sound===false` 且 `s.sound` 原值不变（不可变）；其余字段不变。
- `setDifficulty(s,'hard').difficulty==='hard'`、`version` 保持、入参不变。
- 连续变更可组合：`setDifficulty(toggleSetting(s,'vibration'),'simple')` 两字段都改、其余不变。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
