# T-DOC 协作协议修订：执行者合并 + 脚本化 merge lane

- 状态：ready
- 文件域（**只允许改这些**）：
  - `coordination/PROTOCOL.md`
  - `coordination/BOARD.md`（仅本任务相关的协议说明段 + 本任务状态行；不碰历史批次区块）
  - `coordination/agentctl.sh`
  - `coordination/templates/task.md`
  - `coordination/templates/report.md`
- 依赖：无
- 分支：`task/T-DOC`
- **执行协议**：本任务在**旧协议**下进行（执行者提交分支后**由架构** `agentctl done T-DOC` 合并入 main）。T-DOC 入 main 后，后续 v1.1 任务才启用新合并流程。

## 背景（关联规划书 §2）

v1.1 用户指定一处协作修订：**审查通过后由执行者合并 main**（原 PROTOCOL 铁律#3 是「实现方不自行合并、由架构合并」）。此修订须正式编码进协议 + 脚本 + 模板，避免只停在规划草案（R2/R5）。同时脚本化 merge lane，避免并发踩踏与人工改 BOARD（R7）。

## 行为要求

### 1. `PROTOCOL.md`
- 修订**角色**与**铁律#3**：审查通过（架构在报告写 `approved`）后，**由执行者合并入 main**，架构不再执手动合并。
- 写入**双闸**：① 架构 `approved`；② 执行者合并前重跑 `npm --prefix test test` + `npm --prefix test run typecheck` 全绿。
- 写入 **BOARD 所有权**：架构维护 BOARD/TASKS 真相源与结构；执行者经脚本只动本任务状态行 + 自己的 report，不碰其他任务区块。
- 更新「架构评审 / 合并」小节：架构只评审给 `approved`/`changes-requested`，合并动作转执行者，架构在合并后核对 BOARD 结构。

### 2. `agentctl.sh` —— 脚本化 merge lane（新增/重定义命令）
新增三命令，逻辑内含并发与整洁校验：
- **`claim <ID>`**：前置——`task/<ID>` 存在、该任务已 `approved`；检查 main clean、且 BOARD 中**无其他行处于 `merge-claimed`**（单 lane）；满足则把该任务行改 `merge-claimed:<ID>` 并 `git commit`（`chore(<ID>): claim merge lane`）；否则报错退出（排队）。
- **`merge <ID>`**：前置——本任务处于 `merge-claimed:<ID>`；`git merge --no-ff task/<ID>`，merge message 含 `approved-by planner` + `test/typecheck 绿` 字样。
- **`release <ID>`（或复用 `done <ID>`）**：把该任务行置**终态 `done <commit>`**、释放 lane（清除 `merge-claimed`），`git worktree remove` + `git branch -d task/<ID>`（沿用现 `done` 的清理）。
- 现有 `new`/`work`/`status` 保留。若把合并职责从 `done` 拆到 `merge`+`release`，则 `done` 重定义为「执行者合并 + 清理」的组合别名，并在 `usage` 里说明。
- 保留现有 `ensure_clean_main` / `ensure_task_worktree_clean` 校验。

### 3. 状态词表对齐（R7 · 避免两套完成态）
- 沿用 BOARD 现有 `todo/ready/claimed/in-review/changes-requested/done`。
- 仅新增两枚**过渡态**：报告级 `approved`（架构给，落报告/BOARD 行）、锁级 `merge-claimed:<ID>`（transient，合并完清除）。
- **终态仍是 `done <commit>`**，**不**引入持久 `merged` 完成态。BOARD 顶部状态图例同步补这两枚过渡态说明。

### 4. 模板
- `templates/task.md`：文件域/依赖/分支保持；「验收」补一行——合并按新流程（`approved` 后执行者 `claim→merge→release`）。
- `templates/report.md`：补「合并证据」区（merge commit hash + 合并前 test/typecheck 结果），供执行者合并后回填。

## 验收（人工 · 无 vitest）
- `PROTOCOL.md` 明确「执行者合并 + 双闸 + BOARD 所有权」，铁律#3 已改写、无自相矛盾残留。
- `agentctl.sh claim/merge/release`（或 `done` 组合）可用：`bash -n coordination/agentctl.sh` 语法通过；`agentctl.sh`（无参）`usage` 列出新命令；单 lane 与 main-clean 校验在脚本中可见。
- BOARD 图例含 `approved`/`merge-claimed` 过渡态说明，终态仍 `done <commit>`，无持久 `merged`。
- 两模板与新流程一致。
- **不改任何 `assets/` 产品代码、不改 `test/`**；`npm --prefix test test` + `typecheck` 仍全绿（回归未破坏）。

## 交付物
- 分支 `task/T-DOC` 提交；`coordination/reports/T-DOC.report.md`（用 `templates/report.md`）。
- 通知架构评审；**本任务按旧协议由架构 `agentctl done T-DOC` 合并**。
