# M6-02-build-verification 实现报告

## 基本信息

- 任务：M6-C4-build-verification
- 执行者：Codex
- 分支：`task/M6-editor`
- 起始提交：`8ac4325 docs(coordination): close C3b review`
- 状态：in-review

## 文件改动

- `cocos.config.json`
  - 新增最小 `builder.common` 配置：
    - `platform`: `web-mobile`
    - `buildPath`: `project://build`
    - `outputName`: `web-mobile`
    - `mainBundleCompressionType`: `merge_dep`
- `coordination/reports/M6-02-build-verification.report.md`
  - 记录 Creator 构建、运行、截图、验证命令和本地残留。

未提交内容：

- `build/web-mobile/`：Creator 构建产物，保持 ignored。
- `temp/builder/log/web-mobile6-30-2026 02-45.log`：Creator 构建日志，保持 ignored。
- `/tmp/doudizhu-c4/M6-C4-web-mobile-run-390x844.png`：运行截图，保持仓库外证据。
- `profiles/v2/packages/builder.json`：Creator 本机状态，保持 ignored，不 force-add。

## Creator 构建环境

- Cocos Creator：3.8.8
- 项目路径：`/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor`
- 构建入口：Creator 构建发布面板
- 平台：Web 手机端 / `web-mobile`
- 输出路径：`project://build` + `web-mobile`，实际为 `build/web-mobile/`
- 游戏名称：`斗地主`
- 初始场景：`db://assets/scene/game.scene`
- 参与场景：
  - `db://assets/scene/game.scene`
  - `db://assets/scene/lobby.scene`
- 方向：竖屏
- Debug：关闭
- Source Maps：关闭
- MD5 Cache：关闭
- 主包压缩类型：`merge_dep`
- WebGL2：开启
- Cocos Service：未配置业务服务

说明：构建面板的完整任务状态写入 ignored 的 `profiles/v2/packages/builder.json`，本任务只把可复用的最小平台/输出配置同步到 `cocos.config.json`。

## 构建结果

- 面板结果：`2026-6-30 02:46:03 build success in 34 s!`
- 构建日志：`temp/builder/log/web-mobile6-30-2026 02-45.log`
- 日志尾部关键行：
  - `builder:build-project-total (34473ms)`
  - `build task(web-mobile) in 34473!`
  - `build Task (web-mobile) Finished in (34 s)`
- 构建产物：`build/web-mobile/`
- 产物体积：48M
- 文件数：132
- 关键文件：
  - `build/web-mobile/index.html`
  - `build/web-mobile/index.js`
  - `build/web-mobile/application.js`
  - `build/web-mobile/src/settings.json`
  - `build/web-mobile/src/chunks/bundle.js`
  - `build/web-mobile/assets/internal/config.json`
  - `build/web-mobile/assets/main/config.json`
  - `build/web-mobile/assets/resources/config.json`

`build/web-mobile/src/settings.json` 复核：

- `CocosEngine`: `3.8.8`
- `engine.platform`: `web-mobile`
- `engine.debug`: `false`
- `launch.launchScene`: `db://assets/scene/game.scene`
- `screen.designResolution`: 390 x 844
- `screen.orientation`: `portrait`
- `assets.projectBundles`: `internal`, `resources`, `main`

HTTP 访问验证：

- URL：`http://127.0.0.1:7456/web-mobile/web-mobile/index.html`
- `curl -I`：`HTTP/1.1 200 OK`

构建过程中有一次非阻塞的子进程 `SIGTERM`，随后 Creator 自动重新启动构建命令并完成成功构建；最终面板、日志和产物均为 success。

## 运行验证

运行方式：

- 使用 Creator 本地预览服务访问 `build/web-mobile`。
- 使用临时 headless Chrome 打开：
  - `http://127.0.0.1:7456/web-mobile/web-mobile/index.html`
  - 视口：390 x 844

CDP 复核：

- 页面标题：`Cocos Creator | 斗地主`
- `document.readyState`: `complete`
- `cc.GAME_VIEW` 场景：`game`
- Cocos 版本：`3.8.8`
- Canvas：390 x 844
- 游戏容器：390 x 844
- 点击叫地主区域后仍停留在 `game` 场景，未出现 fatal 跳转或崩溃。
- Console / pageerror：无脚本错误；仅保留浏览器/WebGL 级别非阻塞提示。

截图：

- 路径：`/tmp/doudizhu-c4/M6-C4-web-mobile-run-390x844.png`
- 尺寸：390 x 844
- 画面结论：游戏场景可渲染，进入叫抢/出牌相关状态；底部 CTA/状态/手牌标题仍存在 C3 基线遗留的拥挤问题，本任务未扩大该问题，作为后续 UI polish 风险登记，不作为 C4 构建 blocker。

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `python3 -m json.tool cocos.config.json` | exit 0 |
| `npm --prefix test run typecheck` | exit 0 |
| `npm --prefix test test -- --testTimeout=60000` | exit 0；127 files / 623 tests passed |
| `git diff --check` | exit 0 |
| `git status --short --ignored` | 仅 `cocos.config.json`、本报告，以及 ignored 的 `build/`、`library/`、`profiles/`、`temp/`、`test/node_modules/` |

## 自检

- [x] Cocos Creator 3.8.8 可打开 `task/M6-editor` 项目。
- [x] `web-mobile` 构建成功。
- [x] 构建产物位于 `build/web-mobile/`，未纳入提交。
- [x] 390 x 844 运行截图已生成。
- [x] 运行烟测无脚本错误。
- [x] 报告包含 Creator 版本、平台、输出路径、截图路径、配置摘要、Console 状态、本地残留说明。
- [x] 未提交 `profiles/`、`build/`、`temp/`、`package.json`、`settings/`。
