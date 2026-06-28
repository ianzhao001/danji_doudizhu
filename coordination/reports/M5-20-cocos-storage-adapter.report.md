# M5-20-cocos-storage-adapter 实现报告

- 实现方标识：Codex
- 分支：`task/M5-20-cocos-storage-adapter`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/runtime/storage-adapter.ts`
- `assets/scripts/runtime/cocos-storage.ts`
- `test/runtime/storage-adapter.test.ts`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  83 passed (83)
Tests       427 passed (427)

npm --prefix test run typecheck
tsc --noEmit

rg -n "import .*['\"]cc['\"]" assets/scripts/runtime
assets/scripts/runtime/cocos-storage.ts:1:import { sys } from 'cc';

rg -n "from '\\.\\./data|from \"\\.\\./data" assets/scripts/runtime/*.ts
assets/scripts/runtime/storage-adapter.ts:1:import type { StorageLike } from '../data/settingsStorage';
assets/scripts/runtime/cocos-storage.ts:2:import type { StorageLike } from '../data/settingsStorage';
```

## 与 spec 的偏差 / 关键决策
- `storage-adapter.ts` 纯逻辑、零 `cc`，测试只导入该文件。
- `cocos-storage.ts` 是唯一 `cc` import 文件。
- `cocos-storage.ts` 尚未由 Cocos Creator 编译验证；需要编辑器执行者在编辑器内确认。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] `storage-adapter.ts` 未 import cc；仅 `cocos-storage.ts` import cc
