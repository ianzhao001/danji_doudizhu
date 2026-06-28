# M6-C4 构建验证 + 发布验收记录（编辑器串行收尾）

- 状态：blocked（待 M6-C1/C2/C3 全 merge 入 main；同 `task/M6-editor` 串行 #4，编辑器单写者）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·构建·非 worktree·单写者）
- 执行分支：`task/M6-editor`
- 文件域（**只允许改这些**）：
  - `cocos.config.json`（补平台/build 配置；**不动根 package.json/tsconfig**）
  - `coordination/reports/M6-02-build-verification.report.md`（发布验收记录：产物路径/平台/Editor 版本/通过截图/构建面板配置摘要）
- 依赖：**M6-C1/C2/C3**（场景/.meta 定型才能构建）
- **不入库说明**：`/profiles/` 被 `.gitignore` 忽略（`:10`），`profiles/v2/packages/builder.json` **不作为提交文件**——构建面板配置/截图只记入 report；不走 `git add -f profiles/`（避免违反 AGENTS「不手动编辑 profiles」）。提交仅含 `cocos.config.json` + report。

## 目标
确定目标平台、Cocos Creator 3.8.8 构建产物验证、发布验收记录模板落盘。这是发布前最后一道硬门。

## 背景（侦察结论·必读）
- `cocos.config.json` 当前极简（仅 `scene.tick:false` + version），**无 platform 字段**。
- 无 `build/` 目录（`.gitignore` 忽略 `/build/`）——**构建产物不入库**，验收记录须另落 `coordination/reports/`。
- 无构建脚本/CI——只能 Cocos 编辑器串行执行。
- AGENTS.md/CLAUDE.md 说移动竖屏目标，但无原生 android/wechat 配置——**首版优先 web-mobile 平台**。

## 行为要求
1. 确定构建平台（**web-mobile 优先**；若用户后续要 wechat/android 再加）。
2. `cocos.config.json` 补平台配置字段（不动根 package.json/tsconfig）。
3. Cocos Creator 3.8.8 执行构建（Build 面板 → 选平台 → Build），验证产物可运行（无构建错误、主场景加载、无运行时报错）。
4. `coordination/reports/M6-02-build-verification.report.md` 落盘：产物路径（`build/web-mobile/`）、平台、Editor 3.8.8 版本、通过截图、已知遗留。
5. 构建产物**不入库**（`.gitignore` 已忽略 `/build/`）；只提交 report + config 变更。

## 验收
- 构建无错误，产物可运行（主场景加载、能开局、无运行时报错）。
- `M6-02-build-verification.report.md` 落盘（含平台/产物路径/Editor 版本/通过截图）。
- `cocos.config.json` 平台配置补全；未动根 package.json/tsconfig。
- `npm --prefix test test` 仍全绿（构建不改测试）。

## 测试命令
`npm --prefix test test`（构建验证不改测试，但须确认仍全绿）
