# E-ORIENT — 构建方向锁定为 landscape

- 状态：ready（V 发现 #1，用户裁决「先修·执行者试改 project.json」）
- 类型：**编辑器/配置**（Creator 项目设置 → 构建产物验证）
- 文件域（**只允许改这些**）：
  - `settings/v2/packages/project.json`（Creator 项目配置，加 orientation）
  - 若 Creator 把方向写在同目录其他 `settings/v2/packages/*.json`，该文件亦在域内（以**构建产物 settings.json 生效**为准）
  - `coordination/reports/E-ORIENT.report.md`
- 依赖：E-0 ✅（已翻 844×390 / fitHeight）
- 分支：`task/E-ORIENT`
- **worktree 测试环境**：缺 `./temp/cli/tsconfig.cocos.json` 时 `mkdir -p temp/cli && cp /Users/admin/Documents/Cocos/斗地主/temp/cli/tsconfig.cocos.json temp/cli/`。

## 背景（V 发现 #1）

E-0（`912d463`）只翻了 `designResolution`（844×390 / fitWidth:false / fitHeight:true），**漏了方向锁定**。V 实测 `build/web-mobile/src/settings.json` 的 `orientation` 仍是 `"auto"`，真机上可能允许竖屏旋转，与 v1.1「横屏发布态」目标不符（规划书 §6 E-0 原本就把 `orientation:auto→landscape` 列为验收项）。

## 行为要求

1. 让**构建产物** `build/web-mobile/src/settings.json` 的 `orientation` 变为 `"landscape"`：
   - 首选：在 `settings/v2/packages/project.json` 的 `general` 内加 Creator 3.8.8 认可的方向键（试 `"orientation": "landscape"`；以 Creator re-import/build 后**能被保留且生效**为准）。
   - 若该键不被 Creator 识别/被回写清除：改在 **Cocos Creator 项目设置 GUI**（Project → 相关方向设置）里设为 landscape，让编辑器写正确配置，再提交编辑器实际改动的 `settings/v2/packages/*.json`。
2. **不改** `designResolution`（保持 844×390 / fitHeight）、**不碰** `.scene`/`.meta`/`asset-keys`。

## 验收（构建产物为准）

- `build/web-mobile/src/settings.json`：`orientation === "landscape"`；`designResolution` 仍 `{844,390}`。
- **四横屏轻量 smoke**（844×390 / 812×375 / 915×412 / 780×360）：大厅+game 满屏无变形、`productErrors=[]`（方向改动不应影响内容渲染，作回归 sanity）。
- `npm --prefix test test`（134/659 不回归）+ `npm --prefix test run typecheck` 净（配置改动，应天然通过）。
- 证据落 `coordination/reports/E-ORIENT.report.md`：改了哪个键/文件、构建 `settings.json` orientation 前后值、四横屏截图路径 + CDP summary。

## 不可做（护栏）

- 不改产品代码/测试；不改 `designResolution`；不手写 `.scene`/`.meta`。
- 不为「让脚本通过」而伪造构建产物——以真实 Creator 构建的 `settings.json` 为准。

## 交付物

- 分支 `task/E-ORIENT` 提交（Creator 实际改动的配置文件）；报告。
- 获架构 `approved` 后 `claim → merge → release` 自合（单 lane）。

## 测试命令

`npm --prefix test test`
