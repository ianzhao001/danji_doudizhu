# T-DOCS-SYNC — 文档横屏化回填（v1.1/v1.2 事实同步）

- 状态：ready
- 任务模式：pure-spec（仅文档·零代码）
- 文件域（**只允许改这些**）：
  - `docs/KNOWN_LIMITATIONS.md`（横屏 844×390 四档口径；bidding resume 现状不变；**记牌深度条目在 T-MEMORY-REAL 落 main 后改写为已闭合**——本任务收尾时核对其状态）
  - `docs/GAME_DESIGN.md`（布局原则节：竖屏→横屏 844×390、三立绘围桌、逆时针出牌、v13 皮肤）
  - `docs/ROADMAP.md` + `docs/TASKS.md`（补 v1.1 横屏化 / v1.2 七波 / v1.3 本版条目·按 BOARD 事实、不虚标）
  - `CLAUDE.md`（「面向手机竖屏（390×844）」等过时行改横屏 844×390；协作段指向现行 PROTOCOL 三角色+双层视觉预审）
  - `docs/QA_CHECKLIST.md`（分辨率档与验收口径同步横屏）
  - `coordination/reports/T-DOCS-SYNC.report.md`
- 依赖：—（记牌条目一处等 T-MEMORY-REAL·可先占位后收尾）
- 分支：`task/T-DOCS-SYNC`

## 红线
**不虚标**（v1.1 M6-D1 纪律）：每处勾选/声明有 BOARD/report 依据；不改 `coordination/**`；不动代码。

## 验收
逐文件对照 BOARD 事实核对表（报告列 改动点→依据 映射）；审查按 R-WAVE8 R:T-DOCS-SYNC（常规·逐条核依据）。
