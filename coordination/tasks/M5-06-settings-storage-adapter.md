# M5-06 设置存储适配器（localStorage 前置，无浏览器依赖）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/settingsStorage.ts`（新）
  - 可读不可改：`assets/scripts/data/index.ts`（桶由架构维护，已加导出）、`assets/scripts/data/settings.ts`、`assets/scripts/data/settingsCodec.ts`、`test/data/**`
- 依赖：M5-05（已并 main，`serializeSettings`/`deserializeSettings` 可用）
- 分支：`task/M5-06-settings-storage-adapter`

## 背景
M5-05 给了纯字符串编解码；本任务把它接到一个**注入的**存储抽象，使真实 `localStorage` 可后续替换、
当前用内存 fake 测试。**不直接碰浏览器 `localStorage`**（评审建议：不直接碰）。

## 行为要求
1. 类型 `StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }`。
2. `loadSettings(storage: StorageLike, key: string): Settings`：
   - `const raw = storage.getItem(key)`；`raw === null` → `defaultSettings()`；否则 `deserializeSettings(raw)`。
3. `saveSettings(storage: StorageLike, key: string, s: Settings): void`：`storage.setItem(key, serializeSettings(s))`。
4. `removeSettings(storage: StorageLike, key: string): void`：`storage.removeItem(key)`。
5. 纯逻辑、确定性、禁止 import `cc`、**不**引用 `localStorage`/`window`（由调用方注入）。

## 验收（test/data/settings-storage.test.ts，架构种入·不可改）
- 用内存 fake `StorageLike`（Map 实现）：`saveSettings` 后 `loadSettings` 往返深相等。
- `loadSettings` 空 key（getItem 返回 null）→ `defaultSettings()`。
- `saveSettings` 写入的是合法 JSON（`deserializeSettings` 可还原）。
- `removeSettings` 后 `loadSettings` → `defaultSettings()`。
- 损坏字符串（`storage.setItem(key,'not json')`）→ `loadSettings` 返回 `defaultSettings()`（不抛错）。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`、未引用 `localStorage`/`window`。

## 测试命令
`npm --prefix test test`
