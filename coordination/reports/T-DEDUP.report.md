# T-DEDUP 实现报告

- 实现方标识：Codex
- 分支：`task/T-DEDUP`
- 状态：in-review

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

## 合并证据（approved 后由审查者回填）
- 合并前回归：
  - `npm --prefix test test`：
  - `npm --prefix test run typecheck`：
- merge commit：
- BOARD 状态：

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
