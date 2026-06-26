# M5-05 本地设置编解码（localStorage 前置）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/settingsCodec.ts`（新）
  - 可读不可改：`assets/scripts/data/index.ts`（桶由架构维护，已加导出）、`assets/scripts/data/settings.ts`、`test/data/**`
- 依赖：M5-03（已并 main，复用 `migrateSettings`）
- 分支：`task/M5-05-settings-codec`

## 背景
为后续把设置接入 localStorage 做准备：提供**纯字符串编解码**，并复用 M5-03 的容错 `migrateSettings`，
使任何脏/旧/损坏字符串都能安全落回合法 `Settings`。本任务**不**触碰真实存储 API（无 IO）。
顺带补齐 M5-03 评审意见 #4 的回归（非法布尔回默认、旧/缺 version 迁到当前）。

## 行为要求
1. `serializeSettings(s: Settings): string` = 该 `Settings` 的 JSON。
2. `deserializeSettings(json: string): Settings`：
   - `JSON.parse` 成功 → 交 `migrateSettings(parsed)`（容错、绝不抛错）。
   - `JSON.parse` 失败（非法 JSON）→ 返回 `defaultSettings()`（不抛错）。
3. 纯函数、确定性、禁止 import `cc`、无本地 IO。`difficulty` 经 `migrateSettings` 复用 `AiLevel`。

## 验收（test/data/settings-codec.test.ts，架构种入·不可改）
- `serializeSettings`→`deserializeSettings` 往返：与原 `Settings` 深相等。
- `deserializeSettings('not json')` → `defaultSettings()`（不抛错）。
- `deserializeSettings('{}')` → 全默认。
- 非法布尔回默认：`deserializeSettings('{"sound":"false"}')` → `sound === true`（默认）。
- 旧/缺 version：`deserializeSettings('{"version":0}')` → `version === SETTINGS_VERSION`。
- 非法 `difficulty` 字符串 → 回落默认 `difficulty`。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
