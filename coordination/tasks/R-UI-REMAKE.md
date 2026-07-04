# R-UI-REMAKE — UI-REMAKE 审查检查单

## R:ART-GAME-REMAKE

- [ ] 文件域仅 `asset-previews/v13-pink-game-remake/` 与报告。
- [ ] preview 包含方向稿、分项 PNG、844/780 合成图、review sheet、PROMPTS/sha256。
- [ ] 保持 pink 粉色卡通风格；未复刻第三方截图 IP/角色/logo/图标。
- [ ] 无功能外按钮进入正式合成稿；若方向稿出现额外按钮，报告明确仅作风格参考。
- [ ] 用户视觉终审状态记录清楚；未通过前不得导入。

## R:ART-IMPORT-GAME-REMAKE

- [ ] 仅导入用户图审通过资源。
- [ ] 新增 body avatar 资源键正确，typecheck 通过。
- [ ] `.meta` 由 Creator 生成/更新，记录 UUID、尺寸、alpha/border。
- [ ] 未碰大厅/规则/AI/存档/流程。

## R:T-LAYOUT3

- [ ] `TableZones` 新增 zone 与测试一致，legacy 6 字段兼容。
- [ ] 四横屏新增 zone 落屏、不重叠，按钮触控区不小于 44px。
- [ ] 纯层无 `cc` import。
- [ ] 全量 test/typecheck/diff-check 通过。

## R:P-G4-UI-REMAKE

- [ ] 只改 game-scene 文件域和报告。
- [ ] 功能入口不变，无新增商店/托管/聊天/更多等新功能。
- [ ] 手牌、按钮、三家角色、名字牌、底牌托架、结算层级按 v13 布局接线。
- [ ] T-FIX-SETTLE 结算口径不回归。
- [ ] 四横屏 GUI 证据齐，`productErrors=[]`，重开/返回回归通过。
- [ ] 用户主观终审记录齐；审查者不替代用户判断视觉好坏。
