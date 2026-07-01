# M6-D1 发布/QA 文档收尾（架构·非 worktree·最终范围已重写）

- 状态：blocked（**待发布 gate 全绿**——见下「最终依赖」；架构亲自收尾·非派发）
- 派发模式：架构（本窗口）·文档收尾·非 worktree·非执行者
- 文件域（**只允许改这些**）：`docs/ROADMAP.md`、`docs/TASKS.md`、`docs/QA_CHECKLIST.md`、`coordination/BOARD.md`（发布收尾段）
- **最终依赖（采纳建议#7·重写）**——以下全部闭合后才执行（✅=已闭合·2026-07-01 复核）：
  1. ✅ **C2** 经 Creator 验证并入 main（动效·截图齐）
  2. ✅ **C3a + C3b** 入 main（SafeArea/多分辨率截图 + 相对布局/render 差分·C3b `b51dce5`）
  3. ✅ **C4** 构建验证通过（web-mobile 构建产物 + 平台/Creator 版本记录·`4c314b9`）
  4. ✅ **M3 编辑器屏**主体（M3-45/46a/46b + M3-55/56/57/59/63/64 收口 `a817c98`·CDP `[]`）
  5. ⬜ **美术导入** ART-IMPORT-02/03/04 入 main 或明确以占位发布——**待用户视觉终审**（唯一外部 gate）
  6. ✅ **M6-D5** 手动冒烟脚本执行并落截图/勾选
  7. ✅ **M6-D4** 架构决策 + 已知限制归档（第十六批 deferred refactors 已补登 `docs/KNOWN_LIMITATIONS.md`）
  8. ✅ **M4-42** 困难 AI 中盘纵深——审查通过并入 main `641b6a8`（2026-07-01·133/652 绿·selfplay Hard>Normal）
- **收口剩余**：仅 #5（**ART-IMPORT 用户视觉终审**）一 gate 未闭合；其余全绿。该 gate 闭合（导入或明确以占位发布）后架构即执行本任务、不虚标（见「行为要求 5」）。

## 目标
首版发布验收记录收尾：把 ROADMAP/TASKS/QA_CHECKLIST/BOARD 的 M6 与发布项收口到「首版可发布」一致状态，证据可追溯到 commit/截图/构建产物。

## 行为要求
1. `ROADMAP.md`：M6 节各项勾选；状态段更新「M6 发布前打磨完成·首版可发布」（仅在 gate 真全绿时）。
2. `TASKS.md`：M6 剩余项（C2-C4、编辑器屏、美术导入、D5）按实际勾选；当前阶段行收口。
3. `QA_CHECKLIST.md`：UI/发布前段按 C3a 截图 + C4 构建 + D5 冒烟结果闭合（无证据不勾·延续 D2 纪律）。
4. `BOARD.md`：发布收尾段——列最终 commit、构建产物路径/平台、截图清单、已知限制（引 M6-D4）。
5. **不虚标**：任一 gate 未闭合则对应项保持未勾 + 标注阻塞来源。

## 验收
- 四文档收口一致、证据可追溯；`npm --prefix test test` 全绿（文档不改测试）。

## 测试命令
`npm --prefix test test`
