# T-DEDUP 实现报告

- 实现方标识：Codex
- 分支：`task/T-DEDUP`
- 状态：approved

## 改了哪些文件
- `assets/scripts/data/storage-keys.ts`：实现 `STORAGE_KEYS` 单一事实源。
- `assets/scripts/data/settings.ts`：导出唯一 `isAiLevel`。
- `assets/scripts/data/difficultyConfig.ts`：复用 `settings.ts` 的 `isAiLevel`。
- `assets/scripts/ai/handStrength.ts`：导出 `ALL_RANKS` 作为 AI rank 顺序源。
- `assets/scripts/ai/cardMemory.ts`：复用 `ALL_RANKS`，删除本地重复 rank 数组。
- `assets/scripts/ui/components/game-scene-skeleton.ts`：存储 key 改为 `STORAGE_KEYS` 机械替换。
- `assets/scripts/ui/components/lobby-scene.ts`：存储 key 改为 `STORAGE_KEYS` 机械替换。
- `assets/scripts/data/storage-keys.ts.meta`：Cocos Creator 3.8.8 构建时为新增脚本自动生成，未手写。

## 测试与类型检查输出
```
npm --prefix test test -- storage-keys.test.ts
=> 1 file / 2 tests passed

grep 约束：
rg -n "doudizhu\\." assets/scripts --glob '*.ts'
=> 仅命中 assets/scripts/data/storage-keys.ts

npm --prefix test test
=> 135 files / 662 tests passed

npm --prefix test run typecheck
=> tsc --noEmit passed

git diff --check
=> passed

纯层 cc grep：
rg -n "from ['\\\"]cc['\\\"]|import .*['\\\"]cc['\\\"]" assets/scripts/rules assets/scripts/game assets/scripts/ai assets/scripts/flow assets/scripts/data
=> no matches
```

## Cocos / CDP 烟测
- Creator build 命令：
  `env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator --project /Users/admin/Documents/Cocos/斗地主.worktrees/T-DEDUP --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"`
- Creator 返回既有 metrics exit code `36`，但 `temp/logs/project.log` 末尾为 `build Task (web-mobile) Finished in (4 s)`，并生成 `build/web-mobile/`。
- CDP 命令：`node /tmp/doudizhu-v11-visual-smoke.mjs P-L /Users/admin/Documents/Cocos/斗地主.worktrees/T-DEDUP/build/web-mobile /tmp/doudizhu-v12-t-dedup-smoke`
- CDP summary：`/tmp/doudizhu-v12-t-dedup-smoke/summary.json`
- 截图：25 张，含 `/tmp/doudizhu-v12-t-dedup-smoke/P-L-844x390-home.png` 与 `/tmp/doudizhu-v12-t-dedup-smoke/P-L-844x390-difficulty-settings.png`。
- 结论：844x390 / 812x375 / 915x412 / 780x360 均加载 `sceneName="lobby"`；`productErrors=[]`；入口点击后 `afterClickScene="game"`。

## 审查（审查者）
- 评审日期：2026-07-03
- 评审基线：seed `b4f9524` → executor `961880e`；main HEAD `06b0b9b`

### R:T-DEDUP 检查单核销
- [x] `grep -rn "doudizhu\." assets/scripts --include=*.ts` 仅命中 `data/storage-keys.ts`（两巨组件 7 处字面量全替换：game-scene 4 处 + lobby-scene 3 处 = 7；键值一字不变）。
- [x] `isAiLevel` 全仓仅一处定义（`settings.ts:32` 导出；`difficultyConfig.ts` import 复用；回退 Normal 行为不变——函数体逐字未改）。
- [x] rank 数组归一：原始 `handStrength.ALL_RANKS` 与 `cardMemory.RANKS` 内容顺序完全一致（R3→BigJoker 15 项），合并为 `handStrength.ts` 导出的 `ALL_RANKS`（`readonly Rank[]`），语义零变化。
- [x] **红线**：`git diff b4f9524..961880e -- assets/scripts/ai/levels/` 空（未碰 ai/levels/）；`cardsSignature` 未在 diff 中出现（未合并顺序敏感签名）。
- [x] CDP 烟测：25 张截图（4 分辨率 × 6 屏含 difficulty-settings），`productErrors=[]` 全 viewport，`sceneName="lobby"`，`afterClickScene="game"`。

### 通用核验
- [x] 文件域：执行者提交 `git diff --name-only b4f9524..961880e` = 9 文件，全部在声明域内（storage-keys.ts + .meta / settings.ts / difficultyConfig.ts / handStrength.ts / cardMemory.ts / game-scene-skeleton.ts / lobby-scene.ts / report）。
- [x] 种子测试完整性：`git diff b4f9524..961880e -- test/` 空（执行者未碰任何测试文件）。
- [x] 双绿：135 files / 662 tests passed + `tsc --noEmit` 净。
- [x] `git diff --check`：无空白错误。
- [x] 纯层零 cc：rules/game/ai/flow/data 无 `cc` import。

### 自主判断
- `as const satisfies StorageKeys` 优于 spec 的 `as const`——保留字面量类型同时确保接口一致性，属安全改进。
- `ALL_RANKS` 导出为 `readonly Rank[]` 防突变，良好实践。
- `storage-keys.ts.meta` 由 Creator 构建自动生成（UUID 合法、格式标准），与 M6-G19 等先例一致，可接受。
- 无超出检查单的发现问题。

### 结论：approved @ 961880e

## 验收披露（审查者）
- 结论：approved @ `961880e`
- 打回轮次：0（一次通过）
- 检查单核销：全过（5/5 + 通用 5/5），无例外项
- 自主判断发现：无问题（`satisfies` 改进、`readonly` 防突变、.meta 先例均可接受）
- 合并：claim → merge → release（见下）
- 合并前回归：
  - `npm --prefix test test`：135 files / 662 tests passed
  - `npm --prefix test run typecheck`：tsc --noEmit passed
- merge commit：`d8b892b`（--no-ff merge）
- 合并后基线：135 files / 662 tests 绿 + typecheck 净

## 与 spec 的偏差 / 关键决策
- `handStrength.ts` 与 `cardMemory.ts` 的 rank 顺序和内容完全一致，因此以 `handStrength.ts` 导出的 `ALL_RANKS` 作为单一源，行为不变。
- `cardsSignature` 未改，保持顺序敏感动画 diff 语义。
- `storage-keys.ts.meta` 是 Creator 构建自动生成；为了新增脚本在 Cocos 工程中稳定导入，本次一并提交。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获 `approved` 前未合并 main
- [x] 纯层未 import cc
