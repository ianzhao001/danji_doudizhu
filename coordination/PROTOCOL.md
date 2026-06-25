# 多 AI 协作协议（PROTOCOL）

本仓库采用「**架构** + 多**实现方**」的跨对话窗口协作。通用仓库规则见 [../AGENTS.md](../AGENTS.md)；本文件只讲**多 AI 任务协作工作流**。窗口之间不共享记忆，**一切状态都在仓库文件里**。

## 角色
- **架构（Architect，单一窗口）**：拆任务、定公共 API 契约、写**失败的 vitest 测试**作验收、建任务分支、评审实现分支并合并入 `main`、保持 main 常绿、维护 [BOARD.md](BOARD.md) 与文档。
- **实现方（Implementer，多个独立 AI 窗口）**：认领一个任务，在**独立 git worktree** 内只实现该任务声明的文件，使其测试转绿，落盘报告，提交分支等待评审。

## 铁律
1. **测试是契约，不可改**。`test/**` 由架构维护；测试存疑 → 在报告里提问，**绝不**修改/削弱测试。
2. **只动自己任务声明的文件域**；不碰他人模块、不碰 `main`、不碰根 `package.json`/`tsconfig.json`/`cocos.config.json`。
3. **不自行合并 main**、不 `git checkout main`、不删他人分支/worktree。
4. 共享契约文件（如 `assets/scripts/game/types.ts`、各 `index.ts` 桶）由架构维护；实现方只在自有文件内写。
5. 纯逻辑层（`rules`/`game`/`ai`/`flow`/`data`）**不得 import `cc`**。

## 实现方工作流
1. 读本协议 + 你的任务 spec `tasks/<ID>.md` + [../AGENTS.md](../AGENTS.md)。
2. 在 [BOARD.md](BOARD.md) 确认该任务为 `ready` 且未被认领。
3. 建独立 worktree 切到任务分支（分支已由架构创建，含 spec 与失败测试）：
   ```
   git worktree add ../斗地主.worktrees/<ID> task/<ID>
   cd ../斗地主.worktrees/<ID>
   npm --prefix test install   # 新 worktree 不含 node_modules，先装依赖
   ```
4. **只**在任务声明的文件域内实现，使测试转绿。可新增测试，不可改既有测试。
5. 自检：`npm --prefix test test` 与 `npm --prefix test run typecheck` 全绿。
6. 落盘报告 `coordination/reports/<ID>.report.md`（用 [templates/report.md](templates/report.md)）。
7. 提交分支（**勿合并 main**）：`git add -A && git commit -m "feat(<ID>): ..."`，通知架构评审。

## 架构评审 / 合并
- 读报告 → `git diff main..task/<ID>` 审范围与实现 → 跑 test/typecheck → 通过则 `git merge --no-ff task/<ID>` 入 main、更新 BOARD/docs、`git worktree remove` + 删分支；否则把意见追加进报告并置 `changes-requested`。

## 落盘约定（供架构查看）
- 任务状态真相源：[BOARD.md](BOARD.md)（架构维护）。
- 实现进展/结果/疑问：`reports/<ID>.report.md`（实现方维护）。
- 代码：各自任务分支的提交。

## 新窗口 bootstrap 提示词（用户粘贴到每个实现方窗口，把 `<ID>` 换成任务号）
> 你是本仓库 `斗地主`（Cocos Creator 3.8.8 单机斗地主）的**实现型 AI**。先读 `coordination/PROTOCOL.md` 与 `coordination/tasks/<ID>.md`。用 `git worktree add ../斗地主.worktrees/<ID> task/<ID>` 建独立工作树并进入，先 `npm --prefix test install` 装依赖（新 worktree 无 node_modules）；**只**在该任务声明的文件域内实现，使其测试转绿；**不得**修改测试、不得碰他人模块或 `main`、不得 import `cc`。完成后跑 `npm --prefix test test` 与 `npm --prefix test run typecheck`，把结果与说明写入 `coordination/reports/<ID>.report.md`，提交分支但**不要合并 main**。测试存疑就在报告里提问，不要改测试。
