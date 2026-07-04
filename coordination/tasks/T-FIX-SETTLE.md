# T-FIX-SETTLE — scoped-fix(V2-ISSUE-1)：结算面板内浮入底层 HUD 药丸

- 状态：ready（已派发 2026-07-04·V2 ✅`2f3dfa5` 发现·规划者亲验截图后仲裁定向修复）
- 任务模式：editor-evidence（无 vitest 种子，CDP 截图证据验收）
- 类型：编辑器/运行时 scoped-fix（P-G3 文件域续用）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `assets/scripts/ui/components/game-scene/*.ts`（四渲染器）
  - `coordination/reports/T-FIX-SETTLE.report.md`
- 依赖：V2 ✅`2f3dfa5`
- 分支：`task/T-FIX-SETTLE`
- worktree 缺 tsconfig 照例拷贝；CDP 截图由执行者代验取证。

## 缺陷（规划者亲验截图裁定）

结算（settled）相位下，playing 期 HUD 药丸**浮在结算面板之上**并与面板内容互叠：

- `/tmp/doudizhu-v2-e2e/844x390/V2-844x390-settlement.png`：statusLine「本局结算」与 last-action「右家 不要」两枚药丸叠进面板分数区（780×360 同类）。
- `/tmp/doudizhu-v2-playtest/V2-playtest-settlement-before-actions.png`：更重——多枚 last-action 药丸叠入面板，压住「失败」横幅与倍数/分数行。

根因方向：statusLine / per-seat last-action（或其它 playing 专属节点）在 settled 相位仍渲染，且 z 序高于 result overlay（dim+panel）。

## 口径（仲裁结论·验收边界）

- **面板外**：暗幕下透出牌桌（手牌/座位名牌/顶栏/落点牌经暗幕可见）= **预期行为，保留**——不得一刀切 setActive(false) 清场。
- **面板内**：结算面板边界内不得出现任何底层 HUD 文本/药丸。

## 行为要求

1. settled 相位**不渲染** statusLine 与 per-seat last-action（信息已过时）；aiThinking 等 playing 专属瞬时提示同理核查——主修。
2. 兜底：result overlay（dim+panel）置于渲染树最顶（sibling 序最后），防未来节点再浮入。
3. **重开回归**：结算后「再来一局」进入新局，statusLine/last-action 在叫抢/出牌相位恢复正常渲染（防 hide-and-forget）；「返回大厅」再进新局同验。
4. 不改布局坐标/文案/其它相位行为；纯层零改动。

## 验收

- 四横屏（844×390/812×375/915×412/780×360）结算截图：面板内无底层元素浮入 + 暗幕下牌桌仍可见（口径两条都拍进证据）。
- 连续两局证据链（结算 → 再来一局 → 出牌态 statusLine/last-action 正常 → 再结算）。
- `productErrors=[]`；全量 vitest + typecheck 不回归（预期基线 140/711）。
- 审查按 `tasks/R-WAVE3.md` R:T-FIX-SETTLE 检查单。

## 交付物

分支提交 + 报告 → 提审 → 审查者 approved 后合并（常规任务双闸）。
