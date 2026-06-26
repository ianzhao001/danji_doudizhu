# M5-G3 StorageLike 空串契约 green-guard

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/data/save-storage-empty-string.test.ts`（新）
  - `test/data/settings-storage-empty-string.test.ts`（新）
  - 可读不可改：`assets/scripts/data/**`、`test/data/**`（既有不可改）
- 依赖：M5-06/M5-07 已并 main
- 分支：`task/M5-G3-storage-empty-string`
- **green-guard**：现码即对，新建测试应直接绿。

## 背景
`StorageLike.getItem` 可能返回 `''`（空串，某些存储对缺失 key 返回空串而非 null）。当前：`loadSave` 把 `''` 当数据→`deserializeSave('')` 抛错（损坏）；`loadSettings` 把 `''`→`deserializeSettings('')`→`JSON.parse` 失败→回默认（容错）。**此非对称是 UI 错误处理的契约**（存档损坏要提示、设置损坏要静默回默认），需锁。

## 行为要求（纯测试、禁 cc）
1. `save-storage-empty-string.test.ts`：内存 fake `getItem` 返回 `''` → `loadSave` **抛错**（不吞，区别于 null→null）。
2. `settings-storage-empty-string.test.ts`：内存 fake `getItem` 返回 `''` → `loadSettings` 返回 `defaultSettings()`（不抛）。
3. 两文件各再加一条 `null` 路径对照（`loadSave`→null、`loadSettings`→默认），形成 `''` vs `null` 对照表。
4. 纯测试、禁 cc。

## 验收
- 新测试全绿、`npm --prefix test test` 全绿、`typecheck` 无错。

## 测试命令
`npm --prefix test test`
