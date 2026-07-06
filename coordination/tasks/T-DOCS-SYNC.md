# T-DOCS-SYNC — 文档横屏化回填（v1.1/v1.2 事实同步）

- 状态：ready
- 任务模式：pure-spec（仅文档·零代码）
- 文件域（**只允许改这些**）：
  - `docs/KNOWN_LIMITATIONS.md`（横屏 844×390 四档口径；bidding resume 现状不变；**记牌深度条目在 T-MEMORY-REAL 落 main 后改写为已闭合**——本任务收尾时核对其状态。**2026-07-07 已解锁**：T-MEMORY-REAL `done 408a2ea`——改写口径=「困难档已消费真历史：flow 传累积 `GameEvent`，`estimateMemoryPressure(hand, history)` 真记牌 + 绝对最大单接管；simple/normal 仍不记牌」；依据引 BOARD 三闸把关记录与 `coordination/reports/T-MEMORY-REAL.report.md`；**量化强度主张待 V7 真历史基线——只写机制闭合，不虚标"AI 变强"数值**）
  - `docs/GAME_DESIGN.md`（布局原则节：竖屏→横屏 844×390、三立绘围桌、逆时针出牌、v13 皮肤）
  - `docs/ROADMAP.md` + `docs/TASKS.md`（补 v1.1 横屏化 / v1.2 七波 / v1.3 本版条目·按 BOARD 事实、不虚标）
  - `CLAUDE.md`（「面向手机竖屏（390×844）」等过时行改横屏 844×390；协作段指向现行 PROTOCOL 三角色+双层视觉预审）
  - `docs/QA_CHECKLIST.md`（分辨率档与验收口径同步横屏）
  - `coordination/reports/T-DOCS-SYNC.report.md`
- 依赖：—（记牌条目 2026-07-07 已解锁：T-MEMORY-REAL `done 408a2ea`·见上方口径）
- 分支：`task/T-DOCS-SYNC`

## 红线
**不虚标**（v1.1 M6-D1 纪律）：每处勾选/声明有 BOARD/report 依据；不改 `coordination/**`；不动代码。

## 验收
逐文件对照 BOARD 事实核对表（报告列 改动点→依据 映射）；审查按 R-WAVE8 R:T-DOCS-SYNC（常规·逐条核依据）。
