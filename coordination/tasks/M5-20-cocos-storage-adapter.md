# M5-20 Cocos 存储适配器（sys.localStorage → StorageLike，runtime 桥接层）

- 状态：ready
- 派发模式：纯 spec（无架构种入测试）——实现方按本 spec 自写 vitest 测试 + 实现。
- 文件域（**只允许改这些**）：
  - `assets/scripts/runtime/storage-adapter.ts`（新·**纯逻辑·禁 cc**·可单测）
  - `assets/scripts/runtime/cocos-storage.ts`（新·**import cc**·仅 Cocos 编辑器编译，**任何测试都不得 import**）
  - `test/runtime/storage-adapter.test.ts`（新·实现方自写·只 import storage-adapter.ts，**绝不** import cocos-storage.ts）
  - 可读不可改：`assets/scripts/data/settingsStorage.ts`（`StorageLike` 单一真相源）
- 依赖：无（与 M5-21 并行，文件域不相交）
- 分支：`task/M5-20-cocos-storage-adapter`（worktree）

## 背景与目标
`data` 全层禁 cc、只接收注入的 `StorageLike`（`getItem/setItem/removeItem`，见 `data/settingsStorage.ts:10-14`）。需要一个 **import cc 的薄桥接层**，把 Cocos 的 `sys.localStorage` 适配成 `StorageLike`，供组合根注入给 `loadSettings`/`saveSettings`/`session` 等。新建 `assets/scripts/runtime/` 层承载所有 import cc 的桥接代码（**非纯逻辑层、不进 data/**）。

## 关键约束：两文件硬拆分（否则 Vitest/typecheck 必炸）
`npm --prefix test {test,run typecheck}` 用 esbuild/`tsc` 编译**从测试可达的所有文件**；任何 `import 'cc'` 在 CLI 无法解析。因此：
- **纯可测逻辑**放 `storage-adapter.ts`（**零 cc**），实现方对它写 Vitest。
- **唯一 import cc 处**放 `cocos-storage.ts`，**任何 test 文件都不得 import 它**（被任一测试传递依赖即编译失败）。它只由 Cocos 编辑器编译验证。

## 公共 API 契约
```ts
// runtime/storage-adapter.ts —— 纯·禁 cc·可单测
import type { StorageLike } from '../data/settingsStorage'; // 仅 import type

export interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** 把任意「Web Storage 形」对象（含 sys.localStorage）适配为 StorageLike；
 *  入参缺失/不可用时回落到进程内 Map（不抛错；非持久）。 */
export function storageFrom(ls: WebStorageLike | null | undefined): StorageLike;

/** 进程内内存兜底（无持久化）。 */
export function memoryStorage(): StorageLike;
```
```ts
// runtime/cocos-storage.ts —— import cc·任何测试都不得 import
import { sys } from 'cc';
import { storageFrom } from './storage-adapter';
import type { StorageLike } from '../data/settingsStorage';

/** 组合根用：返回绑定 Cocos sys.localStorage 的 StorageLike。 */
export function cocosStorage(): StorageLike; // return storageFrom(sys.localStorage)
```

## 行为要求
1. `storageFrom(ls)`：返回委派到 `ls` 的 StorageLike，三方法直透。
2. `storageFrom(null | undefined)`：返回 `memoryStorage()`（**不抛错**，存取走内存 Map）——容许平台无 localStorage。
3. `memoryStorage()`：`getItem` 命中返回字符串、未命中返回 `null`；`setItem` 覆盖；`removeItem` 删除；值一律按字符串存（与 Web Storage 语义一致）。
4. `cocosStorage()`：`return storageFrom(sys.localStorage)`。**仅此一处** import cc。
5. `runtime/` 对 `../data` **只 import type**（零运行时 import，避免重蹈 M5-14 分层违规）。

## 验收
- `npm --prefix test test` 全绿（含 storage-adapter 自写测试：透传 / 内存兜底 / null 回落 / 往返 / removeItem）。
- `npm --prefix test run typecheck` 无错（即证明**无任何测试传递 import 了 cocos-storage.ts**；否则 `cc` 解析失败必报错）。
- `grep -rn "import .*'cc'" assets/scripts/runtime/` **仅** `cocos-storage.ts` 命中；`storage-adapter.ts` 零命中。
- `grep -n "from '\.\./data" assets/scripts/runtime/*.ts` 命中行**全为** `import type`。
- 报告注明 `cocos-storage.ts` 是否已在 Cocos Creator 编译验证（无编辑器则标「待编辑器执行者验证」）。

## 测试命令
`npm --prefix test test`
