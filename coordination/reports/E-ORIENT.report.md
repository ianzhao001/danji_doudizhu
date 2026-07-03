# E-ORIENT 实现报告

- 实现方标识：Codex
- 分支：`task/E-ORIENT`
- 状态：in-review

## 改了哪些文件
- `settings/v2/packages/builder.json`
  - 增加 web-mobile package 配置：`orientation:"landscape"`、`embedWebDebugger:false`、`polyfills.asyncFunctions:true`。
  - 按复审要求只保留 `__version__` + `common.packages.web-mobile`；未保留 `BuildTaskManager.queue[...]` 构建会话快照。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  134 passed (134)
Tests       659 passed (659)

npm --prefix test run typecheck
tsc --noEmit passed
```

## 构建 / CDP 证据
有效构建命令：
```
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator --project /Users/admin/Documents/Cocos/斗地主.worktrees/E-ORIENT --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;packages={\"web-mobile\":{\"orientation\":\"landscape\",\"embedWebDebugger\":false,\"polyfills\":{\"asyncFunctions\":true}}};startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

- 构建日志结尾：`build Task (web-mobile) Finished in (3 s)`；Creator CLI 进程退出码为 36（metrics/shutdown 阶段），产物已生成。
- `build/web-mobile/src/settings.json`：
  - `screen.orientation = "landscape"`
  - `screen.designResolution = { width: 844, height: 390, policy: 3 }`
- changes-requested 修正后已删除 `BuildTaskManager.queue[...]`，重新构建验证仍为 `orientation:"landscape"` / `844×390`。
- 四横屏 CDP sanity（使用既有 ART-IMPORT smoke 脚本复用页面链路）：`productErrors=[]`。
- 证据文件：
  - `/tmp/doudizhu-v11-visual-gate/E-ORIENT/summary.json`
  - `/tmp/doudizhu-v11-visual-gate/E-ORIENT/ART-IMPORT-06-*-lobby.png`
  - `/tmp/doudizhu-v11-visual-gate/E-ORIENT/ART-IMPORT-06-*-game.png`
  - `/tmp/doudizhu-v11-visual-gate/E-ORIENT/ART-IMPORT-06-*-settlement.png`

## 合并证据（approved 后由执行者回填）
- 合并前回归：
  - `npm --prefix test test`：
  - `npm --prefix test run typecheck`：
- merge commit：
- BOARD 状态：

## 与 spec 的偏差 / 关键决策
- 先试过在 `settings/v2/packages/project.json` 添加 `general.orientation:"landscape"`，产物仍为 `orientation:"auto"`，已回退该试验改动。
- 通过解包 Creator 3.8.8 的 web-mobile extension 类型定义确认方向配置属于 `packages["web-mobile"].orientation`，合法值为 `auto | landscape | portrait`。
- 当前 Creator CLI shorthand `--build "platform=web-mobile;..."` 在本机不会自动读取本分支写入的 `builder.json` package 配置；实际验证横屏产物时必须在 CLI build 字符串中显式传入同一个 `packages.web-mobile.orientation` 对象，或由审查者在 Creator Build 面板确认该配置被读取。
- 复审裁决已接受 `common.packages.web-mobile.orientation` 为正确配置落点；CLI shorthand 不合并 `builder.json` 属 Creator 行为，发布走 GUI 构建即可读取，CLI 复现需显式传 orientation。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 构建产物可达到 `orientation:"landscape"`
- [x] 四横屏 CDP sanity 通过
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获 `approved` 前未合并 main；获批后仅通过 `agentctl.sh claim/merge/release` 合并
- [x] 未 import cc
