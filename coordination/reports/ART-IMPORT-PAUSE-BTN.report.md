# ART-IMPORT-PAUSE-BTN 实现报告

- 任务：ART-IMPORT-PAUSE-BTN — 暂停按钮导入
- 分支：`task/ART-IMPORT-PAUSE-BTN`
- 实现者：Codex
- 日期：2026-07-06
- 状态：in-review

## 改动概述

- 从 `asset-previews/v13-pause-buttons/ui/` 逐字节导入 2 张用户图审通过件：
  - `pause-btn-toggle.png`
  - `pause-btn-action.png`
- 新增 Creator 3.8.8 生成/保存的 `.png.meta`，均为 `sprite-frame`，含 `@6c48a` texture 与 `@f9941` sprite-frame 子资源。
- `assets/scripts/ui/asset-keys.ts` 纯增：
  - `pauseBtnToggle: 'art/ui/pause-btn-toggle'`
  - `pauseBtnAction: 'art/ui/pause-btn-action'`
- 未改旧键、lobby、scene、prefab、test、纯逻辑层或既有资源文件。

## 图审来源

- `coordination/BOARD.md` 第七波「ART-PAUSE-BTN 终局裁定 + ART-IMPORT-PAUSE-BTN 派发」确认：
  - `ART-PAUSE-BTN` done `1a81e8d`
  - 图审由规划者代批（用户授权）
  - `pause-btn-toggle` / `pause-btn-action` 可进入导入

## PNG sha256

| 资源 | preview sha256 | imported sha256 | 结果 |
|---|---|---|---|
| `pause-btn-toggle.png` | `dfc59c31cf9bae527c0fafbca9f0610360d88711577e4d3ba0f8d9c041c17a3e` | `dfc59c31cf9bae527c0fafbca9f0610360d88711577e4d3ba0f8d9c041c17a3e` | 一致 |
| `pause-btn-action.png` | `3ff4a24015bad8b45b3898a45b4d0a0b7611bece6ff780f2853650300be97675` | `3ff4a24015bad8b45b3898a45b4d0a0b7611bece6ff780f2853650300be97675` | 一致 |

命令：

```bash
shasum -a 256 \
  asset-previews/v13-pause-buttons/ui/pause-btn-toggle.png \
  asset-previews/v13-pause-buttons/ui/pause-btn-action.png \
  assets/resources/art/ui/pause-btn-toggle.png \
  assets/resources/art/ui/pause-btn-action.png
```

## Cocos Creator 3.8.8 导入证据

Creator 启动/导入命令：

```bash
env -u ELECTRON_RUN_AS_NODE \
  /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /Users/admin/Documents/Cocos/斗地主.worktrees/ART-IMPORT-PAUSE-BTN
```

实操步骤：

1. 先复制 PNG 到 `assets/resources/art/ui/`。
2. 用 Cocos Creator 3.8.8 打开 worktree，触发 asset-db 生成初始 `.meta`。
3. 使用一次性临时项目扩展调用 Creator `asset-db`：
   - `refresh-asset`
   - `query-uuid`
   - `query-asset-meta`
   - `save-asset-meta`
   - `reimport-asset`
4. 临时扩展完成后已删除，未纳入提交。

结果文件（ignored，保留在 worktree 供审查者现场核查）：

```text
temp/art-import-pause-meta-result.json
temp/art-import-pause-meta-progress.log
```

关键结果：

```text
ok true
creator Cocos Creator 3.8.8
borderValue 24
```

Creator 日志：

```text
[Scene] Cocos Creator v3.8.8
[art-import-pause-meta] wrote /Users/admin/Documents/Cocos/斗地主.worktrees/ART-IMPORT-PAUSE-BTN/temp/art-import-pause-meta-result.json
```

非阻塞日志：

- `The provided project name "斗地主" is not suitable for use as an executable name. 'CocosGame' is applied instead.`
- 首次构建式导入命令 exit 36，但日志显示 `build Task (web-mobile) Finished`；随后改用 asset-db 实操并成功退出 0。

## Meta 与九宫格 border

| 资源 | base UUID | Texture UUID | SpriteFrame UUID | type | border | raw size | trim |
|---|---|---|---|---|---|---|---|
| `pause-btn-toggle.png` | `1ee2273b-36fd-40c9-9777-ed5d0ca11660` | `1ee2273b-36fd-40c9-9777-ed5d0ca11660@6c48a` | `1ee2273b-36fd-40c9-9777-ed5d0ca11660@f9941` | `sprite-frame` | `24/24/24/24` | `360x96` | `17,5,325x86` |
| `pause-btn-action.png` | `e6ea7bc8-65d4-4756-a5d4-b1c82a7aee92` | `e6ea7bc8-65d4-4756-a5d4-b1c82a7aee92@6c48a` | `e6ea7bc8-65d4-4756-a5d4-b1c82a7aee92@f9941` | `sprite-frame` | `24/24/24/24` | `360x96` | `37,5,285x86` |

机械核验：

```text
pause-btn-toggle {"importer":"image","type":"sprite-frame","uuid":"1ee2273b-36fd-40c9-9777-ed5d0ca11660","textureUuid":"1ee2273b-36fd-40c9-9777-ed5d0ca11660@6c48a","spriteFrameUuid":"1ee2273b-36fd-40c9-9777-ed5d0ca11660@f9941","spriteFrameImporter":"sprite-frame","border":[24,24,24,24],"raw":[360,96],"trim":[17,5,325,86]}
pause-btn-action {"importer":"image","type":"sprite-frame","uuid":"e6ea7bc8-65d4-4756-a5d4-b1c82a7aee92","textureUuid":"e6ea7bc8-65d4-4756-a5d4-b1c82a7aee92@6c48a","spriteFrameUuid":"e6ea7bc8-65d4-4756-a5d4-b1c82a7aee92@f9941","spriteFrameImporter":"sprite-frame","border":[24,24,24,24],"raw":[360,96],"trim":[37,5,285,86]}
```

## asset-keys 变更

`assets/scripts/ui/asset-keys.ts` 仅纯增 2 行：

```ts
pauseBtnToggle: 'art/ui/pause-btn-toggle',
pauseBtnAction: 'art/ui/pause-btn-action',
```

`rg -n "pauseBtn|pause-btn" assets/scripts/ui/asset-keys.ts` 结果：

```text
53:  pauseBtnToggle: 'art/ui/pause-btn-toggle',
54:  pauseBtnAction: 'art/ui/pause-btn-action',
```

## 验证

- ✅ `npm --prefix test test`
  - `Test Files  141 passed (141)`
  - `Tests  739 passed (739)`
- ✅ `npm --prefix test run typecheck`
  - `tsc --noEmit` passed
- ✅ `git diff --check`
  - exit 0
- ✅ `shasum -a 256`：2 张导入 PNG 与 preview 逐字节一致
- ✅ `.meta`：2/2 `userData.type == "sprite-frame"`，2/2 含 `@f9941`，2/2 border 四值均为 24

测试环境备注：

- 当前 worktree 初始缺 `test/node_modules`，首次测试命令报 `vitest: command not found` / `tsc: command not found`，未进入用例执行。
- 已按本地 worktree 常规做法临时软链主工作区 `test/node_modules`，该路径被 `.gitignore` 忽略，不纳入提交；随后全量测试/typecheck 均通过。

## 文件域与本地残留

预计提交文件：

```text
assets/resources/art/ui/pause-btn-action.png
assets/resources/art/ui/pause-btn-action.png.meta
assets/resources/art/ui/pause-btn-toggle.png
assets/resources/art/ui/pause-btn-toggle.png.meta
assets/scripts/ui/asset-keys.ts
coordination/reports/ART-IMPORT-PAUSE-BTN.report.md
```

未提交/忽略的本地状态：

```text
build/
library/
profiles/
settings/v2/packages/cocos-service.json
temp/
test/node_modules
```

这些均为 Creator / 测试运行临时状态或本地依赖软链，未纳入任务提交。

## 交接

本回合结论：`ART-IMPORT-PAUSE-BTN` 已导入 + 自检全绿，待审查者核 R-WAVE7。

下一步找：审查者（GLM-5.2）。

可粘贴提示词：

```text
你是本仓库 斗地主 的审查者 AI。本任务：R-WAVE7 R:ART-IMPORT-PAUSE-BTN。
先读：coordination/PROTOCOL.md、coordination/tasks/R-WAVE7.md 的 R:ART-IMPORT-PAUSE-BTN、coordination/tasks/ART-IMPORT-PAUSE-BTN.md、coordination/reports/ART-IMPORT-PAUSE-BTN.report.md、coordination/BOARD.md 第七波 ART-IMPORT-PAUSE-BTN 行。
请审查 task/ART-IMPORT-PAUSE-BTN：确认仅新增 pause-btn-* 资源与 .meta、asset-keys.ts 仅纯增 pauseBtnToggle/pauseBtnAction、lobby/旧键/scene/test/纯层零改动；sha256 与 asset-previews/v13-pause-buttons/ui/ 对照逐字节一致；.meta 为 Creator 3.8.8 asset-db 生成/保存的 sprite-frame 且含 @f9941，border 四值均 >=24；全量 vitest/typecheck/diff-check 证据齐。通过后按协议写 approved 并合并。
```
