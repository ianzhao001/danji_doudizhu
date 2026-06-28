# M6-D1 发布/QA 文档收尾（架构·非 worktree）

- 状态：blocked（待第九批所有轨 merge 入 main；架构亲自收尾·非派发）
- 派发模式：架构（本窗口）·文档收尾·非 worktree·非执行者
- 文件域（**只允许改这些**）：
  - `docs/ROADMAP.md`（M6 项勾选 + 状态段更新）
  - `docs/TASKS.md`（M5/M6 剩余项勾选 + 当前阶段行）
  - `docs/QA_CHECKLIST.md`（验收项闭合）
  - `coordination/BOARD.md`（第九批验收记录段）
- 依赖：**第九批所有轨**（Track A ART-02/03/04 + Track B L1-L5 + C1-C4）全 merge 入 main

## 目标
发布验收记录收尾：勾选 ROADMAP/TASKS/BOARD 的 M6 项，闭合 QA_CHECKLIST 验收项，写第九批验收记录段。

## 行为要求
1. `docs/ROADMAP.md`：M6 节（`:119-127`）各项勾选完成；状态段（`:7`）更新为「M6 发布前打磨完成·首版可发布」。
2. `docs/TASKS.md`：M5 剩余（音效开关/基础动画 `:118-119`）+ M6 剩余（移动端/性能/异常/构建/发布 `:122-127`）勾选；当前阶段行更新第九批并入记录。
3. `docs/QA_CHECKLIST.md`：规则/流程/AI/UI 验收项（`:61-63` selfplay、`:76-82` UI）闭合。
4. `coordination/BOARD.md`：第九批验收记录段（Track A 串行 02/03/04 状态 + Track B L1-L5/C1-C4 merge commit + 文件域零碰撞确认 + 门控全绿 437→新数）。

## 验收
- 四文档 M6 项全勾选、状态段一致。
- BOARD 第九批验收记录段含 merge commit + 门控结果。
- `npm --prefix test test` 全绿（文档不改测试）。

## 测试命令
`npm --prefix test test`
