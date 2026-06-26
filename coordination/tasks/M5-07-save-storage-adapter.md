# M5-07 断局槽位存储适配器（localStorage 前置，无浏览器依赖）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/data/saveStorage.ts`（新）
  - 可读不可改：`assets/scripts/data/index.ts`（桶由架构维护，已加导出）、`assets/scripts/data/save.ts`、`test/data/**`
- 依赖：M5-04（已并 main，`serializeSave`/`deserializeSave`/`SaveSlot` 可用）
- 分支：`task/M5-07-save-storage-adapter`

## 背景
断局重开需要把 `SaveSlot` 落到存储。本任务用与 M5-06 相同的**注入 `StorageLike`** 抽象做适配，
不直接碰浏览器 `localStorage`。损坏存档应**抛错**而非静默回默认（与设置不同：存档损坏需让 UI 提示「无可用断局」）。

## 行为要求
1. `StorageLike`：本文件**独立定义**（与 M5-06 `settingsStorage.ts` 形状一致；二者尚未合并，避免跨分支依赖。合并后由架构统一为单一真相源——届时改 M5-07 从 `./settingsStorage` import type，删除本地定义）。
2. `loadSave(storage: StorageLike, key: string): SaveSlot | null`：
   - `raw = storage.getItem(key)`；`null` → 返回 `null`（无断局）。
   - 否则 `deserializeSave(raw)`（损坏 → 透传抛错，**不**吞）。
3. `saveSave(storage: StorageLike, key: string, slot: SaveSlot): void`：`storage.setItem(key, serializeSave(slot))`。
4. `removeSave(storage: StorageLike, key: string): void`：`storage.removeItem(key)`。
5. 纯逻辑、禁止 import `cc`、不引用 `localStorage`/`window`。

## 验收（test/data/save-storage.test.ts，架构种入·不可改）
- 内存 fake：`saveSave` 后 `loadSave` 往返深相等（`round`/`savedAt`/`version` 保真）。
- `loadSave` 空 key → `null`。
- 损坏字符串（`setItem(key,'not json')`）→ `loadSave` **抛错**（不吞，区别于设置）。
- `removeSave` 后 `loadSave` → `null`。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`、未引用 `localStorage`/`window`。

## 测试命令
`npm --prefix test test`
