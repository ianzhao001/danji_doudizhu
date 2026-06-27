# M3-29-resource-baseline-import 实现报告

- 实现方标识：Codex
- 分支：`task/M3-editor-integration`
- 状态：blocked（CLI 部分完成，编辑器导入未完成）

## 改了哪些文件
- `assets/resources/art/cards/`：导入 `card-template`、4 个 `suit-*`、`joker-small`、`joker-big`
- `assets/resources/audio/`：导入 9 个 WAV 音效
- `assets/resources/fonts/`：导入 Source Han Sans CN Regular / Heavy 与 LICENSE
- `assets/scripts/ui/asset-keys.ts`
- `test/ui/asset-keys.test.ts`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  83 passed (83)
Tests       427 passed (427)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
<no output>
```

## 与 spec 的偏差 / 关键决策
- 音效未转 mp3，按 spec fallback 导入 WAV。
- `RESOURCE_PATHS` 只记录真实资源路径且不重复；普通牌 `cardView.assetKey` 通过 `cardAssetPath` 映射到 `art/cards/card-template`，双王映射到 joker 图。
- 已尝试通过 `/Applications/Cocos/Creator/3.8.8/CocosCreator.app` 打开 worktree；`--project` / `--path` 均不被该可执行体支持，macOS `open -a` 与 UI 打开流程未能稳定进入 `M3-editor-integration` worktree。
- 新增资源的 `.meta` 未生成（仅既有 `card-back.png.meta` 存在），因此 Cocos 导入/编译验收未完成。

## 疑问（给架构）
- 需要编辑器执行者在 Cocos Creator 内手动打开 `../斗地主.worktrees/M3-editor-integration`，生成 `.meta` 并确认资源导入无错。

## 自检（对照验收项）
- [x] asset-keys 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] `asset-keys.ts` 未 import cc
- [ ] Cocos 自动生成新增资源 `.meta`
- [ ] Cocos Creator 打开工程无导入/编译错误
