# ART-IMPORT-GAME-REMAKE 实现报告

- 实现方标识：Codex
- 分支：`task/ART-IMPORT-GAME-REMAKE`
- 状态：in-review（v13 资源导入完成，待 R:ART-IMPORT-GAME-REMAKE 审查）

## 改了哪些文件

- 新增 `assets/resources/art/backgrounds/game-table-bg-v13.png` + `.meta`
- 新增 `assets/resources/art/avatars/{hero,left-ai,right-ai}-body-v13.png` + `.meta`
- 新增 `assets/resources/art/ui/*-v13.png` + `.meta`（本轮必选 11 件，不导入 `badge-role-v13`）
- 新增 `assets/resources/art/cards/*-v13.png` + `.meta`
- `assets/scripts/ui/asset-keys.ts` 纯增 `xxxV13` 键组
- `coordination/reports/ART-IMPORT-GAME-REMAKE.report.md`

未改大厅资源、既有非 `-v13` PNG、既有资源键、场景、规则、AI、流程或存档。

## 导入决策

- 只导入 `ART-GAME-REMAKE` 用户图审 passed 且属于 import 必选清单的正式件。
- 未导入 `ui/badge-role-v13.png`：`ART-GAME-REMAKE.report.md` 将其列为“附加但不进入 import 必选清单”，本任务 spec 与 P-G4 消费要求未要求该键。
- 所有导入 PNG 均从 `asset-previews/v13-pink-game-remake/` 逐字节复制到 `assets/resources/art/**`，不做二次处理。
- `.meta` 由 Cocos Creator 3.8.8 生成/保存；临时扩展只调用 Creator `asset-db`，完成后已删除，未纳入提交。

## asset-keys 纯增键组

新增键均以 `xxxV13` 命名，既有键和值保持不变：

```
cardTemplateV13, cardBackV13,
suitSpadeV13, suitHeartV13, suitClubV13, suitDiamondV13,
jokerSmallV13, jokerBigV13,
gameTableBgV13,
heroBodyV13, leftAiBodyV13, rightAiBodyV13,
btnPrimaryV13, btnSecondaryV13, btnTertiaryV13, btnDisabledV13,
seatNameplateV13, bottomCardsDockV13,
settlementBannerWinV13, settlementBannerLoseV13, settlementPanelV13,
badgeMultiplierV13, badgeTimerV13
```

## Cocos Creator 3.8.8 实操证据

启动命令：

```
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator --project /Users/admin/Documents/Cocos/斗地主.worktrees/ART-IMPORT-GAME-REMAKE
```

临时扩展调用的 Creator `asset-db` 能力：

```
refresh-asset
query-uuid
query-asset-meta
save-asset-meta
reimport-asset
```

结果文件（ignored，本 worktree 保留供审查者查看）：

```
temp/art-import-game-remake-meta-result.json
```

关键结果：

```
ok true
count 23
borderValue 24
```

Creator 日志：

```
temp/logs/project.log
[Scene] Cocos Creator v3.8.8
[art-import-game-remake-meta] wrote /Users/admin/Documents/Cocos/斗地主.worktrees/ART-IMPORT-GAME-REMAKE/temp/art-import-game-remake-meta-result.json
```

非阻塞日志：

- `The provided project name "斗地主" is not suitable for use as an executable name. 'CocosGame' is applied instead.`
- 临时扩展提示 `package_version is not defined`，扩展已删除，不进提交。

## PNG sha256 / meta / border 核验

机械核验脚本结果：

```
count 23
errors []
duplicateUuids []
```

| preview path | import path | sha256 前 16 | size | alpha | base UUID | SpriteFrame UUID | border |
|---|---|---:|---:|---|---|---|---|
| `backgrounds/game-table-bg-v13.png` | `assets/resources/art/backgrounds/game-table-bg-v13.png` | `7c36e82a352354e0` | `1688x780` | false | `925db455-3b06-48ff-9a5f-ed672bd3caae` | `925db455-3b06-48ff-9a5f-ed672bd3caae@f9941` | `0/0/0/0` |
| `avatars/hero-body-v13.png` | `assets/resources/art/avatars/hero-body-v13.png` | `f2cf7b839ccf0a56` | `320x360` | true | `04b7fb2a-e9fc-4191-ae4a-16a3e5dae0e3` | `04b7fb2a-e9fc-4191-ae4a-16a3e5dae0e3@f9941` | `0/0/0/0` |
| `avatars/left-ai-body-v13.png` | `assets/resources/art/avatars/left-ai-body-v13.png` | `87d139fe18034eb3` | `360x520` | true | `a16534c0-85b0-4f69-8368-984fadbd5f54` | `a16534c0-85b0-4f69-8368-984fadbd5f54@f9941` | `0/0/0/0` |
| `avatars/right-ai-body-v13.png` | `assets/resources/art/avatars/right-ai-body-v13.png` | `bb3a197ed1baf689` | `360x520` | true | `e67782e0-0c5f-4c17-88aa-474d86148fef` | `e67782e0-0c5f-4c17-88aa-474d86148fef@f9941` | `0/0/0/0` |
| `ui/seat-nameplate-v13.png` | `assets/resources/art/ui/seat-nameplate-v13.png` | `439301a5435380d6` | `360x96` | true | `7f7024b1-0739-48ef-8d9a-04de7ac023ce` | `7f7024b1-0739-48ef-8d9a-04de7ac023ce@f9941` | `24/24/24/24` |
| `ui/btn-primary-v13.png` | `assets/resources/art/ui/btn-primary-v13.png` | `5fd35d740d5e44d1` | `480x160` | true | `68288668-374d-4c48-a965-8c8584dcb680` | `68288668-374d-4c48-a965-8c8584dcb680@f9941` | `24/24/24/24` |
| `ui/btn-secondary-v13.png` | `assets/resources/art/ui/btn-secondary-v13.png` | `fd8e4989d0b3c7fc` | `480x160` | true | `6f2e4368-d0cc-4cd8-b9c0-2a2e668338e9` | `6f2e4368-d0cc-4cd8-b9c0-2a2e668338e9@f9941` | `24/24/24/24` |
| `ui/btn-tertiary-v13.png` | `assets/resources/art/ui/btn-tertiary-v13.png` | `4f66efeb4430da48` | `480x160` | true | `5cae9a4f-8749-4bbb-b26f-4b2489f18642` | `5cae9a4f-8749-4bbb-b26f-4b2489f18642@f9941` | `24/24/24/24` |
| `ui/btn-disabled-v13.png` | `assets/resources/art/ui/btn-disabled-v13.png` | `ee859ef5bd84d724` | `480x160` | true | `66cd2001-3009-461b-ad29-152ca5f212af` | `66cd2001-3009-461b-ad29-152ca5f212af@f9941` | `24/24/24/24` |
| `ui/settlement-banner-win-v13.png` | `assets/resources/art/ui/settlement-banner-win-v13.png` | `f0c234fc697e6b0f` | `640x180` | true | `e830b078-dd86-45ce-8daf-7ad2ae96788f` | `e830b078-dd86-45ce-8daf-7ad2ae96788f@f9941` | `0/0/0/0` |
| `ui/settlement-banner-lose-v13.png` | `assets/resources/art/ui/settlement-banner-lose-v13.png` | `e9f51f5bc7e7c15a` | `640x180` | true | `a81a4539-72d0-49e0-9ed2-24ab39185837` | `a81a4539-72d0-49e0-9ed2-24ab39185837@f9941` | `0/0/0/0` |
| `ui/settlement-panel-v13.png` | `assets/resources/art/ui/settlement-panel-v13.png` | `4face92eebd2a792` | `760x380` | true | `af9ecc23-56c8-413b-945f-7da197a8d334` | `af9ecc23-56c8-413b-945f-7da197a8d334@f9941` | `24/24/24/24` |
| `ui/bottom-cards-dock-v13.png` | `assets/resources/art/ui/bottom-cards-dock-v13.png` | `87932111eac3a59c` | `440x140` | true | `bd93b759-a869-4f6c-8f8d-4a053a3eb7f6` | `bd93b759-a869-4f6c-8f8d-4a053a3eb7f6@f9941` | `24/24/24/24` |
| `ui/badge-multiplier-v13.png` | `assets/resources/art/ui/badge-multiplier-v13.png` | `e31db64b06626c56` | `180x180` | true | `cd2cecb2-41d9-4d17-8d5f-3a5fb6b1e6c3` | `cd2cecb2-41d9-4d17-8d5f-3a5fb6b1e6c3@f9941` | `0/0/0/0` |
| `ui/badge-timer-v13.png` | `assets/resources/art/ui/badge-timer-v13.png` | `e4e3b36b27271b49` | `180x180` | true | `81a3e019-0750-4b30-b6e6-6b0bb779c9ed` | `81a3e019-0750-4b30-b6e6-6b0bb779c9ed@f9941` | `0/0/0/0` |
| `cards/card-template-v13.png` | `assets/resources/art/cards/card-template-v13.png` | `45d9aecc40e1d65e` | `220x320` | true | `3c8caccf-eab3-4f63-9f73-a423a927615b` | `3c8caccf-eab3-4f63-9f73-a423a927615b@f9941` | `0/0/0/0` |
| `cards/card-back-v13.png` | `assets/resources/art/cards/card-back-v13.png` | `30768ee5b3994c87` | `220x320` | true | `f3646a43-f92e-40db-b6d7-be89cd20f258` | `f3646a43-f92e-40db-b6d7-be89cd20f258@f9941` | `0/0/0/0` |
| `cards/suit-spade-v13.png` | `assets/resources/art/cards/suit-spade-v13.png` | `f1fb7153001e6ba6` | `128x128` | true | `b5ae7622-80fb-4e05-9279-aeafcfc6d042` | `b5ae7622-80fb-4e05-9279-aeafcfc6d042@f9941` | `0/0/0/0` |
| `cards/suit-heart-v13.png` | `assets/resources/art/cards/suit-heart-v13.png` | `0af62567b214f762` | `128x128` | true | `93f9437b-d552-497a-a043-74a999c57fd9` | `93f9437b-d552-497a-a043-74a999c57fd9@f9941` | `0/0/0/0` |
| `cards/suit-club-v13.png` | `assets/resources/art/cards/suit-club-v13.png` | `4a80a76d6c98aff9` | `128x128` | true | `a4f5c1d6-a73e-455f-95be-df589f15942c` | `a4f5c1d6-a73e-455f-95be-df589f15942c@f9941` | `0/0/0/0` |
| `cards/suit-diamond-v13.png` | `assets/resources/art/cards/suit-diamond-v13.png` | `4df5921f0fc127f2` | `128x128` | true | `902a14bd-397e-46cc-912d-74152c35d701` | `902a14bd-397e-46cc-912d-74152c35d701@f9941` | `0/0/0/0` |
| `cards/joker-small-v13.png` | `assets/resources/art/cards/joker-small-v13.png` | `3e15df7fc1162693` | `220x320` | true | `942d1e46-55e2-4d07-80ed-ee398042a4cf` | `942d1e46-55e2-4d07-80ed-ee398042a4cf@f9941` | `0/0/0/0` |
| `cards/joker-big-v13.png` | `assets/resources/art/cards/joker-big-v13.png` | `4b635fac10d47c2d` | `220x320` | true | `bedf96d8-d1a4-4aad-bf25-afdd2c04ce32` | `bedf96d8-d1a4-4aad-bf25-afdd2c04ce32@f9941` | `0/0/0/0` |

所有 `.meta` 顶层 `userData.type` 均为 `sprite-frame`，且均包含真实 `@f9941` SpriteFrame 子资源。

## 九宫格 border

取值依据：v13 preview 提供 7 张 64px / 176px 横向拉伸模拟；本轮沿 v12 UIKIT 已审通过的安全口径配置四边 24px。24px 在按钮、名字牌、底牌托架与结算面板角区内，且满足审查单要求的四值 `> 0`。

配置为 `24/24/24/24` 的 7 件：

```
btn-primary-v13
btn-secondary-v13
btn-tertiary-v13
btn-disabled-v13
settlement-panel-v13
seat-nameplate-v13
bottom-cards-dock-v13
```

## 测试与类型检查输出

```
npm --prefix test install
added 47 packages, and audited 48 packages
5 vulnerabilities in test dependencies reported by npm audit; no dependency changes made in this task.

npm --prefix test test
Test Files  141 passed (141)
Tests       727 passed (727)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed
```

## 工作树状态

当前预期改动：

```
M  assets/scripts/ui/asset-keys.ts
?? assets/resources/art/**/*-v13.png
?? assets/resources/art/**/*-v13.png.meta
?? coordination/reports/ART-IMPORT-GAME-REMAKE.report.md
```

临时扩展已删除；`temp/`、`library/` 等 Creator 运行产物保持 ignored，不纳入提交。

## 疑问 / 需规划者裁定

- 无。

## 批次交接记录 / 下一步

- 所属批次 / 任务号：UI-REMAKE / `ART-IMPORT-GAME-REMAKE`
- 本回合结论 / 状态：v13 passed 资源已导入为 `-v13` 新文件，meta 为 Creator 3.8.8 生成的 `sprite-frame`，九宫格 border 已配置，测试/typecheck 通过，待审查。
- 下一步找谁：审查者（GLM-5.2）
- 原因：按 `R-UI-REMAKE.md` 的 R:ART-IMPORT-GAME-REMAKE 核 sha、meta、border、asset-keys 和全量测试；通过后由审查者合并。
- 给下一窗口的可粘贴提示词（指针化）：

```
你是本仓库 斗地主 的审查型 AI，审查任务 ART-IMPORT-GAME-REMAKE。
先读：coordination/PROTOCOL.md、coordination/tasks/ART-IMPORT-GAME-REMAKE.md、coordination/tasks/R-UI-REMAKE.md 的 R:ART-IMPORT-GAME-REMAKE、coordination/reports/ART-IMPORT-GAME-REMAKE.report.md、coordination/BOARD.md 的 UI-REMAKE 段。
当前分支：task/ART-IMPORT-GAME-REMAKE。请审查 git diff main..task/ART-IMPORT-GAME-REMAKE：确认只新增 -v13 资源与 .meta、asset-keys.ts 仅纯增 xxxV13 键、既有 lobby 键/文件零改动；逐件 sha256 与 asset-previews/v13-pink-game-remake/manifest-v13.json 对照一致；所有新 .meta 为 Creator 3.8.8 生成的 sprite-frame 且含 @f9941；btn×4/settlement-panel/nameplate/dock border 四值均为 24；test/typecheck/diff-check 证据齐。通过后按协议写 approved 并由审查者 claim/merge/release。
```

## 自检（对照验收项）

- [x] 仅导入用户图审 passed 且属 import 必选清单的件
- [x] `-v13` 新文件，不同名覆盖
- [x] 逐字节 sha256 对照 preview
- [x] `.meta` 由 Cocos Creator 3.8.8 / asset-db 生成并保存
- [x] 所有新 PNG 为 `sprite-frame` 类型并含 `@f9941`
- [x] 九宫格件 border 四值 `> 0`
- [x] `asset-keys.ts` 纯增 `xxxV13` 键，既有键零改动
- [x] 全量测试通过
- [x] typecheck 通过
- [x] `git diff --check` 通过
