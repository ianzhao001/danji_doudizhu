# P-THEME-APPLY — 主题令牌全面接线（统一 UI 风格的落地）

- **批次**：v1.4 第一波 W-UNIFY·UI 批第 1 棒（前置：纯逻辑批 3 任务已并 main；分支届时由规划者自最新 main 建）
- **类型**：UI/场景（`P-*`·双层视觉预审关适用）
- **执行者**：Cursor　**审查者**：Codex（代码 diff + 证据链）+ 规划者（视觉审②）

## 背景与动机
v1.4 目标「统一 UI 风格」：视觉常量已收敛进 `ui/theme.ts`（T-THEME-TOKENS），本任务让 **cc 层全部改经令牌取值**，消灭大厅/牌桌/弹层之间的字号漂移、近似色并存、按钮/面板各自为政。

## 文件域
- `assets/scripts/ui/components/ui-helpers.ts`（增 `toColor(token: ThemeColor): Color` 唯一转换点 + 既有内联 Color 全部改经 THEME）
- `assets/scripts/ui/components/lobby-scene.ts`
- `assets/scripts/ui/components/game-scene-skeleton.ts`
- `assets/scripts/ui/components/game-scene/**`（各 renderer 的内联色值/字号）
- `coordination/reports/P-THEME-APPLY.report.md`（+截图证据）

## 要求
1. **单一转换点**：cc `Color` 只在 `toColor`（或等价的 2–3 个 helper 重载）里 new；组件层不得再出现裸 `new Color(r,g,b,a)` 魔法值。语义特例（如卡牌红黑花色、特效渐变）可豁免，但须在报告列豁免清单+理由。
2. **字号走 typography 阶梯**：现存字号归并到 xs/sm/md/lg/xl/display 最近档；归并前后对照表进报告。
3. **间距/圆角/透明度**同理归并（重排布局坐标**不属**本任务——只换常量来源，不动几何布局）。
4. **视觉基调不变**：粉色方向、既有布局、交互全部保持；本任务的正确结果是「更整齐的同一张脸」，不是新皮肤。

## 验收与证据
- 全量 test + typecheck 绿（本任务不应破任何测试）。
- **四横屏截图**（844×390 / 812×375 / 915×412 / 780×360）× 关键相位：lobby-home、lobby 子屏一张、game-bidding、game-playing、game-settled、pause。逐屏与改前对照，**变化点逐条说明**（预期为字号/色值微调级差异）。
- CDP `productErrors=[]`；视觉自审①四类硬伤勾销表 → 规划者视觉审② → （并入波末用户签收）。
- 报告含：`grep -rn "new Color" assets/scripts/ui/components/` 残留清单（应只剩转换点+豁免项）。

## 红线
- 不改纯岛（`ui/*.ts` 顶层视图模型）与 `theme.ts` 本体（令牌值不对 → 打回 T-THEME-TOKENS 责任链，报告提出、不得私调）。
- 不动布局几何、交互逻辑、场景/预制体结构；不改测试。
- v1.2/v1.3 既定成果零回归：settled 门控、相位互斥、逆时针映射、暂停冻结、termination 面板等。
