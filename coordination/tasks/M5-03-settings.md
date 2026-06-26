# M5-03 本地设置纯数据层

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/settings.ts`（新）
  - 可读不可改：`assets/scripts/data/index.ts`（桶由架构维护，已加导出）、`assets/scripts/ai/strategy.ts`、`test/data/**`
- 依赖：无（独立）
- 分支：`task/M5-03-settings`

## 背景
进入 M3 UI 前，先把本地设置做成**无 cc 的纯数据层**，易测、易序列化（后续 data IO / 断局重开周边消费）。

## 行为要求
1. `Settings` 类型：`{ version: number; difficulty: AiLevel; sound: boolean; vibration: boolean; animation: boolean }`。
2. `defaultSettings(): Settings`：返回稳定默认（`difficulty = AiLevel.Normal`、`sound/vibration/animation = true`、`version = ` 当前值）。
3. `migrateSettings(raw: unknown): Settings`：**容错迁移**，尽量恢复、**不抛错**：
   - 非对象（`null`/数组/字符串/数字）→ 全默认。
   - 对象但缺字段 → 只补缺失字段为默认值。
   - 非法 `difficulty`（不在 `AiLevel`）→ 回落默认。
   - 旧/缺 `version` → 迁移并标记为当前 `version`。
   - 返回**完整当前形** `Settings`。
4. 纯数据、确定性；禁止 import `cc`。`difficulty` 复用 `ai` 导出的 `AiLevel`（单一真相源，type/枚举引用）。

## 验收（test/data/settings.test.ts，不可改）
- `defaultSettings()` 返回稳定默认且 `version` 为当前值。
- `migrateSettings({})` 深相等于全默认。
- 部分字段对象只补缺失、保留已有合法值。
- 非法 `difficulty` 回落默认；`migrateSettings(null / 数组 / 字符串)` 返回全默认。
- `migrateSettings(defaultSettings())` 幂等（深相等）。
- `npm --prefix test test` 全绿、`npm --prefix test run typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
