# ART-IMPORT-UIKIT 实现报告

- 任务：ART-IMPORT-UIKIT — v12 皮肤件导入 + 九宫格 border 配置
- 分支：`task/ART-IMPORT-UIKIT`
- 实现者：Codex
- 日期：2026-07-04

## 改动概述

- 从 `asset-previews/v12-uikit/` 逐字节导入 5 张 v12 PNG：
  - `seat-nameplate.png`
  - `bottom-cards-dock.png`
  - `btn-primary.png`
  - `btn-secondary.png`
  - `btn-disabled.png`
- 保留 `panel-popup.png` 原图，仅更新其 `.meta` 九宫格 border。
- 通过 Cocos Creator 3.8.8 打开本 worktree，使用一次性临时项目扩展调用 Creator `asset-db`：
  - `refresh-asset`
  - `query-uuid`
  - `query-asset-meta`
  - `save-asset-meta`
  - `reimport-asset`
- 临时扩展完成后已删除，未纳入提交。
- 更新 `assets/scripts/ui/asset-keys.ts`，新增：
  - `seatNameplate: 'art/ui/seat-nameplate'`
  - `bottomCardsDock: 'art/ui/bottom-cards-dock'`

## PNG sha256

| 资源 | preview sha256 | imported sha256 | 结果 |
|---|---|---|---|
| `seat-nameplate.png` | `6fd69f57fc4c84ca1f71bc9718d272fe9235d14b4f7b2ef3e4eaf5b3f0958187` | `6fd69f57fc4c84ca1f71bc9718d272fe9235d14b4f7b2ef3e4eaf5b3f0958187` | 一致 |
| `bottom-cards-dock.png` | `d3a7b7a71e023085ce554cdf60efc34beb63eed9d8d7caf292ca76655c038e67` | `d3a7b7a71e023085ce554cdf60efc34beb63eed9d8d7caf292ca76655c038e67` | 一致 |
| `btn-primary.png` | `4380308eb1527e4e79ba12e15c4d44d9e76e5c507b3761a1acb2c0d281a1dccb` | `4380308eb1527e4e79ba12e15c4d44d9e76e5c507b3761a1acb2c0d281a1dccb` | 一致 |
| `btn-secondary.png` | `d3500cc7f3a74d780c9c778368528e7b813b858462d7aedd3127bae621c9667c` | `d3500cc7f3a74d780c9c778368528e7b813b858462d7aedd3127bae621c9667c` | 一致 |
| `btn-disabled.png` | `a82ac809184083dd67d2dbacae8fccf19061041560ee49038773b9279a67456e` | `a82ac809184083dd67d2dbacae8fccf19061041560ee49038773b9279a67456e` | 一致 |
| `panel-popup.png` | 不替换 | `db0fed2ee20de3b446656661ef768ae1dad6db460ca6b1d943594ace498c2d45` | 原图保留 |

## Meta 与 border

取值依据：v12 预览说明要求按钮、名字牌、托架的外侧 24px corner zones 无复杂纹理；`panel-popup` 的 24px 角样全透明，且预览拉伸模拟判定安全。因此 6 张图统一配置 `borderTop/Bottom/Left/Right = 24`。

| 资源 | base UUID | SpriteFrame UUID | border |
|---|---|---|---|
| `btn-primary.png` | `8c6cdd85-5637-4acd-9909-ce85a033ae18` | `8c6cdd85-5637-4acd-9909-ce85a033ae18@f9941` | `24/24/24/24` |
| `btn-secondary.png` | `09ba36a8-6c04-4706-8e80-d0d346ef2af6` | `09ba36a8-6c04-4706-8e80-d0d346ef2af6@f9941` | `24/24/24/24` |
| `btn-disabled.png` | `b1b5d936-2807-473a-ab63-1e343ed6cbdf` | `b1b5d936-2807-473a-ab63-1e343ed6cbdf@f9941` | `24/24/24/24` |
| `panel-popup.png` | `b37eb100-cf1b-42fb-a7cf-627003c78e02` | `b37eb100-cf1b-42fb-a7cf-627003c78e02@f9941` | `24/24/24/24` |
| `seat-nameplate.png` | `ff15216a-3434-451e-93c9-8248be755f10` | `ff15216a-3434-451e-93c9-8248be755f10@f9941` | `24/24/24/24` |
| `bottom-cards-dock.png` | `c17cd644-cd46-4357-909f-75f64f69dd72` | `c17cd644-cd46-4357-909f-75f64f69dd72@f9941` | `24/24/24/24` |

## 验证

- ✅ Cocos Creator 3.8.8 asset-db 执行成功
  - `temp/art-import-uikit-border-result.json`: `ok: true`
  - 6 张目标图均有 SpriteFrame 子资源与 `borderTop/Bottom/Left/Right = 24`
- ✅ `shasum -a 256` 对比 5 张导入 PNG 与 preview，逐字节一致。
- ✅ `rg -n "borderTop|borderBottom|borderLeft|borderRight" assets/resources/art/ui/{btn-primary,btn-secondary,btn-disabled,panel-popup,seat-nameplate,bottom-cards-dock}.png.meta`
  - 6 张图四边 border 全部为 `24`。
- ✅ `npm --prefix test test -- ui/asset-keys.test.ts`
  - 1 file / 8 tests passed。
- ✅ `npm --prefix test test`
  - 139 files / 704 tests passed。
- ✅ `npm --prefix test run typecheck`
  - `tsc --noEmit` passed。
- ✅ `git diff --check`

## 备注

- 因当前 shell 带有 `ELECTRON_RUN_AS_NODE=1`，启动 Creator 时使用 `env -u ELECTRON_RUN_AS_NODE ... --project <worktree>`，避免 Creator 被当作 Node 运行。
- 当前 worktree 仍有两份无关未跟踪 `.meta` 文件，未纳入本任务提交。
