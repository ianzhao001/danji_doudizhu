# M6-G12 AI 不卡死/不违法 对抗护栏（第十一批·核心质量）

- 状态：**ready**（依赖三档 AI + selfplay runner 已在 main）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 绿护栏
- 分支：`task/M6-G12-ai-no-starve`（`git worktree add ../斗地主.worktrees/M6-G12 -b task/M6-G12-ai-no-starve main`）
- 文件域：`test/selfplay/ai-no-starve.test.ts`（新）、report；可复用 `test/selfplay/runner.ts`/`difficulty.ts` helper（**不改** 既有断言测试）
- **不改产品码**

## 目标
补强 QA「AI 只输出合法动作 / 可过牌 / 不造成无限等待」：在更广难度组合 + 种子上跑自对弈，断言每步动作合法、必有进展、必终止。

## 行为要求（测试钉死）
- 对全部难度排列（simple/normal/hard 的多种三座位组合）跑各若干种子：每局到达 `settled`、`turns` 有上界（<300）、零和、`landlord/winner` 合法。
- 断言「不卡死」：单局步数严格有界；同 levels+seeds 跑两次结果深相等（确定性）。
- 复用 runner 收集的 summary 字段；不深挖隐藏状态（AI 不得改隐藏态——由既有 legality-matrix 覆盖，此处补难度组合广度）。
- 耗时较长 → 适当设 `it` timeout；零 `cc`。

## 验收
- 全绿、typecheck 净、零 cc、report 落盘（列难度组合 × 种子矩阵与耗时）。
