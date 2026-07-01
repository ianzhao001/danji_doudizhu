# QA 检查清单

## 当前 M1 验收

- [x] M0 文档基线已完成，M0 资源导入例外已记录在 `docs/ASSET_LIST.md`。
- [x] 当前只完成 M1 规则层与独立测试，不包含 M2 状态机、AI、flow 或 UI。
- [x] 未新增 Cocos 场景或预制体。
- [x] 未修改根 `package.json`、`tsconfig.json`、`cocos.config.json`。
- [x] M1 期间未执行 Git 初始化；M2 起按用户决定启用 git + 多 AI worktree 协作（见 `coordination/`）。
- [x] `rules` 层未 import `cc`。
- [x] Vitest 测试工程隔离在 `test/` 下。
- [x] `cd test && npm test` 通过（6 个测试文件，25 个用例）。
- [x] 规则源码可用 `tsc --noEmit` 单独类型检查通过。
- [x] 已记录 Vite 对根 `package.json` 中 Cocos `"type": "3d"` 字段的非阻塞警告。

## 规则测试

- [x] 单牌识别正确。← `test/rules/pattern.test.ts`
- [x] 对子识别正确。← `test/rules/pattern.test.ts`
- [x] 三张识别正确。← `test/rules/pattern.test.ts`
- [x] 三带一识别正确。← `test/rules/pattern.test.ts`
- [x] 三带二识别正确。← `test/rules/pattern.test.ts`
- [x] 顺子识别正确，且不允许 2 和王参与。← `test/rules/pattern.test.ts`
- [x] 连对识别正确，且不允许 2 和王参与。← `test/rules/pattern.test.ts`
- [x] 飞机识别正确，且翼数与翼型匹配。← `test/rules/pattern.test.ts`
- [x] 飞机带单不允许用对子充当两张单翼。← `test/rules/pattern.test.ts`
- [x] 四带二识别正确，且识别为非炸弹、不能与炸弹跨型比较。← `test/rules/pattern.test.ts`; `test/rules/compare-edges.test.ts`
- [x] 四带两单不允许用一对充当两张单牌。← `test/rules/pattern.test.ts`
- [x] 炸弹识别正确。← `test/rules/pattern.test.ts`
- [x] 火箭识别正确。← `test/rules/pattern.test.ts`
- [x] 非法牌型被拒绝。← `test/rules/validate.test.ts`; `test/rules/pattern.test.ts`
- [x] 跨牌型比较被拒绝。← `test/rules/compare.test.ts`; `test/rules/compare-edges.test.ts`
- [x] 炸弹和火箭压制规则正确。← `test/rules/compare.test.ts`; `test/rules/compare-edges.test.ts`

## 流程测试

- [x] 三名玩家各获得 17 张牌。← `test/rules/deal.test.ts`; `test/flow/driver.test.ts`
- [x] 保留 3 张底牌。← `test/rules/deal.test.ts`; `test/flow/driver.test.ts`
- [x] 地主获得底牌后手牌为 20 张。← `test/game/core.test.ts`; `test/ui/hand-layout.test.ts`
- [x] 无人叫地主时能重新发牌。← `test/game/bidding.test.ts`; `test/flow/round-runtime-exceptions.test.ts`
- [x] 叫地主底倍为 1，每次抢 / 反抢倍数翻倍。← `test/game/bidding.test.ts`; `test/flow/policies-bid.test.ts`
- [x] 叫抢倍数与炸弹 / 火箭 / 春天倍数连乘正确。← `test/game/settlement.test.ts`; `test/game/settlement-spring-boundaries.test.ts`; `test/game/multiplier-stacking.test.ts`（第十一批·已并 main）
- [x] 连续过牌后回到当前牌权玩家。← `test/game/core.test.ts`; `test/game/replay.test.ts`
- [x] 任一玩家出完牌后立即进入结算。← `test/game/core.test.ts`; `test/flow/driver.test.ts`
- [x] 春天和反春天结算正确。← `test/game/settlement.test.ts`; `test/game/settlement-spring-boundaries.test.ts`

## 着法生成与提示

- [x] `enumerateMoves` 只返回合法着法。← `test/rules/moves.test.ts`
- [x] `enumerateMoves` 按点数组合完整枚举飞机翼与四带二余牌，不展开等价花色排列。← `test/rules/moves.test.ts`
- [x] `legalFollows` 只返回能压过当前牌权的着法。← `test/rules/legal-follows.test.ts`; `test/ai/hint.test.ts`
- [x] 无可出时正确提示过牌。← `test/ai/hint.test.ts`; `test/ui/action-buttons.test.ts`

## 序列化与断局

- [x] `RoundState` 存档 → 读档状态一致。← `test/game/serialize.test.ts`; `test/game/serialize-deep.test.ts`; `test/data/save.test.ts`
- [x] 读档后能合法继续当前局。← `test/game/resume.test.ts`; `test/data/session.test.ts`; `test/flow/round-runtime.test.ts`; `test/integration/save-resume-e2e.test.ts`（第十一批·已并 main）

## 自对弈与稳定性

- [x] N 局 AI vs AI 无非法状态。← `test/selfplay/selfplay.test.ts`; `test/selfplay/selfplay-long.test.ts`; `test/ai/legality-matrix.test.ts`
- [x] 自对弈无死循环、无无限等待。← `test/selfplay/selfplay.test.ts`; `test/selfplay/selfplay-long.test.ts`; `test/selfplay/difficulty.test.ts`; `test/selfplay/ai-no-starve.test.ts`（第十一批·已并 main）
- [x] 相同种子可复现洗牌结果。← `test/rules/deal.test.ts`; `test/selfplay/selfplay.test.ts`

## AI 测试

- [x] 简单 AI 只输出合法动作。← `test/ai/simple.test.ts`; `test/ai/legality-matrix.test.ts`
- [x] 普通 AI 只输出合法动作。← `test/ai/normal.test.ts`; `test/ai/legality-matrix.test.ts`
- [x] 困难 AI 只输出合法动作。← `test/ai/hard.test.ts`; `test/ai/legality-matrix.test.ts`
- [x] AI 可选择过牌。← `test/ai/baseline.test.ts`; `test/ai/simple.test.ts`; `test/ai/legality-matrix.test.ts`
- [x] AI 不造成无限等待。← `test/selfplay/selfplay.test.ts`; `test/selfplay/selfplay-long.test.ts`; `test/selfplay/difficulty.test.ts`
- [x] AI 不修改隐藏状态。← `test/game/core.test.ts`; `test/flow/policies.test.ts`; `test/ai/legality-matrix.test.ts`

## UI 验收

- [x] 390x844 竖屏下手牌不遮挡主要按钮。← `test/ui/hand-layout.test.ts`; `test/ui/table-layout.test.ts`; `coordination/reports/M3-33-action-buttons-hint.report.md`; `coordination/reports/M3-36-portrait-adaptation.report.md`
- [x] 当前出牌区域清晰。← `coordination/reports/M6-C2-bomb-effect-390x844.png`; `coordination/reports/M6-C3a-game-390x844.png`; `coordination/reports/M6-C3a-game-412x915.png`; `coordination/reports/M6-C3a-game-360x780.png`
- [x] 地主、农民身份可辨认。← `test/ui/screen-view.test.ts`; `coordination/reports/M3-31-game-scene-skeleton.report.md`
- [x] 叫地主/抢地主流程提示明确。← `test/ui/bidding-view.test.ts`; `coordination/reports/M3-34-bidding-settlement-popups.report.md`
- [x] 出牌、提示、不要按钮状态正确。← `test/ui/action-buttons.test.ts`; `test/ui/action-buttons-edges.test.ts`; `coordination/reports/M3-33-action-buttons-hint.report.md`
- [x] 结算弹窗不溢出屏幕。← `test/ui/result-view.test.ts`; `coordination/reports/M3-34-bidding-settlement-popups.report.md`
- [x] 设置 / 难度控件不溢出屏幕。← `coordination/reports/M6-C3a-lobby-390x844.png`; `coordination/reports/M6-C3a-lobby-412x915.png`; `coordination/reports/M6-C3a-lobby-360x780.png`; `coordination/reports/M3-59-difficulty-picker-390x844.png`; `coordination/reports/M3-65-home-density-390x844.png`; `coordination/reports/M3-65-subscreen-opaque-390x844.png`

## 发布前检查

- [x] Cocos Editor 打开项目无错误。← `coordination/reports/M3-29-resource-baseline-import.report.md`; `coordination/reports/M3-30-lobby-scene.report.md`; `coordination/reports/M3-31-game-scene-skeleton.report.md`; M6-C1 用户 Creator 验证记录见 `docs/TASKS.md`
- [x] 脚本编译无错误。← `docs/TASKS.md`（M6-C1 用户 Creator 验证编译零报错）; `coordination/BOARD.md`（main 133 文件 / 653 用例，typecheck 净）
- [x] Vitest 纯逻辑测试（规则 / 状态机 / AI）全部通过。← `coordination/BOARD.md`（main 133 文件 / 653 用例全绿）
- [x] 自对弈冒烟（N 局）无阻塞。← `test/selfplay/selfplay.test.ts`; `test/selfplay/selfplay-long.test.ts`
- [x] 目标平台构建通过。← `coordination/reports/M6-02-build-verification.report.md`; `coordination/reports/M6-D1-lobby-launch-rebuild.report.md`; D1 复测 `build/web-mobile/`（47M / 202 文件，CocosEngine 3.8.8，platform web-mobile，`launchScene=lobby.scene`）；`/tmp/doudizhu-d1-lobby-launch-smoke/summary.json`
- [x] 发布构建首屏进入大厅，且可从大厅进入对局并返回大厅。← `/tmp/doudizhu-d1-lobby-launch-smoke/summary.json`（390×844 / 412×915 / 360×780 均 `sceneName="lobby"` 且 `errorEvents=[]`；390×844 验证 `lobby → game → pause quit → lobby`）
- [x] 完成多局冒烟测试。← `test/selfplay/selfplay-long.test.ts`（seeds 1..50）
- [x] 本地设置和战绩可保存。← `test/data/settings-storage.test.ts`; `test/data/session.test.ts`; `test/data/session-atomicity.test.ts`; `assets/scripts/ui/components/game-scene-skeleton.ts`
