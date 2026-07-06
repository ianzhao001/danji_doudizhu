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

---

## 审查者评审段（GLM-5.2 · 2026-07-06）

- 审查任务：R-WAVE7 R:ART-IMPORT-PAUSE-BTN
- 分支：`task/ART-IMPORT-PAUSE-BTN`（`daf2c56`）
- 结论：**approved**，打回 0 轮。

### R:ART-IMPORT-PAUSE-BTN 检查单逐项核销

1. **全新文件 `pause-btn-*` + asset-keys 纯增键；同名覆盖=打回；lobby/既有键零改动** ✅
   - `git diff --name-status main..task/ART-IMPORT-PAUSE-BTN`：6 文件全部 `A`（4 新文件）+ `M`（asset-keys.ts + report），0 删除、0 重命名。
   - 新增：`pause-btn-toggle.png` + `.meta`、`pause-btn-action.png` + `.meta`、`ART-IMPORT-PAUSE-BTN.report.md`。
   - `asset-keys.ts` diff 仅 `+2` 行（`pauseBtnToggle`/`pauseBtnAction`），插在 `btnDisabledV13` 与 `seatNameplateV13` 之间；旧键 0 改动、0 同名覆盖。
   - `main` 中 `grep pauseBtn asset-keys.ts` = 0（纯新增，无旧键冲突）。
   - lobby/scene/prefab/test/纯层（rules/game/ai/flow/data）零改动（`git diff --name-only` 逐域验证 exit=0）。

2. **sha256 与 preview 逐字节一致；`.meta` Creator 生成、sprite-frame、border≥24** ✅
   - sha256 三方对照（preview ↔ imported ↔ manifest.json）：
     - `pause-btn-toggle.png`：`dfc59c31cf9bae527c0fafbca9f0610360d88711577e4d3ba0f8d9c041c17a3e` — preview/imported/manifest 三方一致。
     - `pause-btn-action.png`：`3ff4a24015bad8b45b3898a45b4d0a0b7611bece6ff780f2853650300be97675` — preview/imported/manifest 三方一致。
   - `.meta` 机械核验（两件均同结构）：
     - `ver: "1.0.27"`、`importer: "image"` — 与既有 v13 meta 格式一致。
     - `userData.type: "sprite-frame"` ✅
     - `subMetas.f9941.importer: "sprite-frame"`、`subMetas.f9941.uuid: "...@f9941"` ✅（含 @f9941 sprite-frame 子资源）
     - `subMetas.6c48a.importer: "texture"`、`subMetas.6c48a.uuid: "...@6c48a"` ✅（含 @6c48a texture 子资源）
     - `borderTop/Bottom/Left/Right` 均为 `24`（≥24）✅
     - `rawWidth: 360, rawHeight: 96`；toggle trim `[17,5,325,86]`、action trim `[37,5,285,86]` — 与报告一致。
   - Creator 3.8.8 生成证据：报告记录了 asset-db 实操步骤（refresh-asset → query-uuid → query-asset-meta → save-asset-meta → reimport-asset），临时扩展已删除未纳入提交。

3. **全量 vitest/typecheck 不回归** ✅
   - `npm --prefix test test`：141 文件 / 739 用例全绿（26.71s）。
   - `npm --prefix test run typecheck`：`tsc --noEmit` 净。
   - `git diff --check main..task/ART-IMPORT-PAUSE-BTN`：exit=0。

### 全量回扫

- **域内致命**：0。文件域严格限定为 `assets/resources/art/ui/pause-btn-*` + `.meta` + `asset-keys.ts` + report，无越域。
- **域外致命**：0。新增键未被任何现有消费者引用（`grep -rn pauseBtn assets/scripts/` 仅命中 asset-keys.ts 自身），不引入回归。
- **拿不准**：0。meta 格式与既有 v13 一致、border 配置正确、sha256 三方对齐，无可疑点。
- **跨任务回归**：asset-keys.ts 新键插入位置在 btn 组与 nameplate 组之间，不破坏既有键顺序；无其他任务正在改 asset-keys.ts（P-G7-UIFIX3 阶段①已合并 `6de93df`，阶段②尚未开工）。

### 合并证据

- claim → merge (`--no-ff`) → release
- 合并后 main 基线：141/739 全绿 + typecheck 净 + diff --check 净。

### 验收披露

- 评审结论：**approved**，0 打回。
- 回扫范围：全仓（asset-keys 消费者 / meta 格式一致性 / 跨任务 asset-keys 编辑冲突 / lobby+scene+test+纯层零改动）。
- 分流结果：0 域内致命 / 0 域外致命 / 0 拿不准。
- 下一步：ART-IMPORT-PAUSE-BTN done → P-G7-UIFIX3 阶段②（暂停 6 按钮消费新键 + 背景包裹文字 + 两组同色高对比 + 四横屏暂停面板截图）→ V6 收口 → 用户签收 = v1.2 终点。
