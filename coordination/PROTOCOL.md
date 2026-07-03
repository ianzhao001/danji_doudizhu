# 多 AI 协作协议（PROTOCOL）

本仓库采用「**规划者 + 多执行者 + 审查者**」的跨对话窗口协作（v1.2 修订·用户指定）。通用仓库规则见 [../AGENTS.md](../AGENTS.md)；本文件只讲**多 AI 任务协作工作流**。窗口之间不共享记忆，**一切状态都在仓库文件里**。

## 角色（v1.2 三角色制）
- **规划者（Planner，单一窗口·原“架构”）**：只做方案规划与测试方案制定——拆任务、定公共 API 契约、写**失败的 vitest 测试**作验收、建任务分支；**给执行者与审查者分别派发任务书**（`tasks/<ID>.md` 与 `tasks/R-*.md`）；维护 BOARD 与文档真相源。**不逐任务评审代码、不合并**；每轮由审查者验收回复后，基于披露的全过程做**最终定夺**（BOARD 记裁定；发现问题可责令重开）。
- **执行者（Implementer，多个独立窗口）**：按执行任务书在**独立 git worktree** 内只实现声明文件域，使种子测试转绿并**执行测试用例**，落盘报告，提交分支后**通知审查者**（不再自行合并）。若任务涉及审查者不具备能力的验收面（图像/音频/视频等非文字模态，或 Cocos Creator / IDE / 浏览器调试等实操），由执行者代为执行验收、保存原始证据（截图/录屏/音频样本/日志/操作步骤/环境信息）并写入报告。被审查者打回（`changes-requested`）时修复或补证再提审。若遇到任务范围内实在无法解决的问题（如 spec/测试矛盾、文件域不足、外部环境不可达、连续修复仍无法满足契约），不得越域硬解或削弱测试，应在报告列证据并转交规划者裁定。
- **审查者（Reviewer，独立窗口）**：基于**审查任务书 + 自主判断**评审实现分支（范围/契约/红线/证据）。审查者亲自复核文字/代码/命令行测试与报告证据；对图像/音频/视频等非文字模态和 IDE 实操，不要求亲自操作或感知原始模态，而是审计执行者提交的证据完整性、操作步骤、环境、日志与用户终审记录；证据不足或流程不可复现时可直接打回执行者补证。不通过 → 在报告追加意见并置 `changes-requested` **直接打回执行者**（规划者不参与该循环）。若审查者判断问题无法通过执行者在原任务范围内修复，或打回循环无法收敛，应停止循环并把阻塞证据转交规划者裁定。通过 → 在报告与 BOARD 本任务行写 `approved`，随后**由审查者本人**跑双闸 + `claim/merge/release` 合并入 main，并**验收回复规划者**（报告含全过程披露：评审结论、打回轮次、合并证据）。

## 铁律
1. **测试是契约，不可改**。`test/**` 由规划者维护；执行者/审查者存疑 → 在报告里提问，**绝不**修改/削弱测试。
2. **只动自己任务声明的文件域**；实现阶段不碰他人模块、不碰 `main`、不碰根 `package.json`/`tsconfig.json`/`cocos.config.json`。
3. **合并权在审查者**：未经审查者在报告/BOARD 写明 `approved`，任何人不得合并 `main`；合并只能由**审查者**用 `./coordination/agentctl.sh claim <ID>` → `merge <ID>` → `release <ID>` 执行（合并前重跑 test/typecheck 全绿），不得手工改 main、不得删他人分支/worktree。执行者**不再**执行合并。
4. 共享契约文件（如 `assets/scripts/game/types.ts`、各 `index.ts` 桶）由规划者维护；执行者只在自有文件域内写。
5. 纯逻辑层（`rules`/`game`/`ai`/`flow`/`data`）**不得 import `cc`**。
6. **能力边界不转移责任**：非文字模态与 IDE 实操由执行者代验取证，但审查者仍负责判断证据是否足以支撑 `approved`；不足则打回补证，不能因为无法亲验就放行。
7. **阻塞升级给规划者**：执行者或审查者确认问题无法在当前任务文件域、当前测试契约、当前能力/环境下解决时，必须停止越权尝试，在报告写明 `blocked`、已尝试路径、失败证据、建议选项与需要规划者裁定的问题；由规划者决定改 spec、补测试、拆新任务、调整文件域或暂缓。

## 执行者工作流
1. 读本协议 + 你的任务 spec `tasks/<ID>.md` + [../AGENTS.md](../AGENTS.md)。
2. 在 [BOARD.md](BOARD.md) 确认该任务为 `ready` 且未被认领。
3. 建独立 worktree 切到任务分支（分支已由规划者创建，含 spec 与失败测试）：
   ```
   ./coordination/agentctl.sh work <ID>
   cd ../斗地主.worktrees/<ID>
   npm --prefix test install   # 新 worktree 不含 node_modules，先装依赖
   ```
4. **只**在任务声明的文件域内实现，使测试转绿。可新增测试，不可改既有测试。
5. 自检：`npm --prefix test test` 与 `npm --prefix test run typecheck` 全绿。
6. 若任务涉及图像/音频/视频等非文字模态，或 Cocos Creator / IDE / 浏览器调试等实操验收：执行者必须代审查者完成实操，保留可审计证据（原始文件路径、截图/录屏、Console/日志、操作步骤、环境版本、失败重试记录）。需要用户视觉/听觉终审的，报告必须明确等待用户终审或记录用户终审结论。
7. 落盘报告 `coordination/reports/<ID>.report.md`（用 [templates/report.md](templates/report.md)）。
8. 提交分支：`git add -A && git commit -m "feat(<ID>): ..."`，**通知审查者评审**（不合并、不 claim lane）。
9. 若被置 `changes-requested`：按报告中审查意见在原分支修复、重跑自检、更新报告，再次提审。
10. 若执行者已确认无法在任务文件域内继续推进：将报告状态置 `blocked`，补「需规划者裁定」段，列出复现命令/证据/可选方案，通知规划者；此时不提交规避性实现、不修改测试、不合并。

## 审查者工作流
1. 读本协议 + 执行任务书 `tasks/<ID>.md` + **审查任务书**（`tasks/R-*.md` 中本任务的检查单）+ 执行者报告。
2. 评审：`git diff main..task/<ID>` 审文件域与实现；核对种子测试未被改动（`git diff main..task/<ID> -- test/` 应只含规划者种子提交）；跑 `npm --prefix test test` + `run typecheck`；按检查单逐项核销。涉及图像/音频/视频等非文字模态或 IDE 实操时，审查者不亲自操作，改为核验执行者报告中的原始证据、步骤、环境、日志、用户终审记录与可复现性；证据缺失或不足即打回补证。**鼓励超出检查单的自主判断**——发现检查单外的问题同样可打回。
3. 结论三选一：
   - `changes-requested`：普通可修复问题的意见追加进 `reports/<ID>.report.md`，更新 BOARD 本任务行状态，打回执行者（无须知会规划者）。
   - `blocked`：若问题不是执行者在原文件域内可修复，或多轮打回仍无法收敛，审查者在报告追加阻塞证据和裁定请求，BOARD 本任务行置 `blocked`，转交规划者；不合并、不继续空转。
   - `approved`：在报告写明评审证据，BOARD 本任务行置 `approved`，然后**本人**在 main 工作树重跑 test/typecheck 全绿后：
     ```
     ./coordination/agentctl.sh claim <ID> && ./coordination/agentctl.sh merge <ID> && ./coordination/agentctl.sh release <ID>
     ```
4. **验收回复规划者**：合并后在报告补「验收披露」段（评审结论、打回轮次与原因、合并 commit、最终测试基线），并通知规划者。
5. 规划者做最终定夺；若裁定重开，按新任务书走 scoped-fix。

## 规划者职责边界
- 产出：方案/拆解/spec/失败测试/审查检查单/BOARD 真相源；**不写产品代码、不逐任务评审、不合并**。
- 每轮验收披露后做终局裁定（BOARD 记 `裁定：确认 done` 或责令重开）；收到执行者/审查者转来的 `blocked` 后，规划者负责裁定：改 spec、补/改测试、拆新任务、调整文件域、补能力/环境前置，或暂缓；跨任务结构性问题由规划者出新任务书。

## merge lane（机制不变，执行人改为审查者）
- **双闸**：审查者写明 `approved` + 合并前重跑 test/typecheck 全绿。
- **单 lane**：`claim <ID>` 提交 `merge-claimed:<ID>`；已有他行 claim 则排队。
- **合并**：`merge <ID>` 用 `--no-ff`；message 记录 approved 证据（历史字符串 `approved-by planner` 兼容保留，语义=已获审查者 approved）。
- **释放**：`release <ID>` 置终态 `done <commit>`，清 worktree 与分支。`done <ID>` 为组合别名。

## 落盘约定
- 任务状态真相源：[BOARD.md](BOARD.md)（规划者维护结构；**BOARD 状态列禁用字面竖线 `|`**，会切坏 agentctl 的 awk 解析）。
- 执行者/审查者经 `agentctl.sh` 只改 BOARD **本任务状态行** + `reports/<ID>.report.md`（执行者写实现段，审查者追加评审段与验收披露段）。
- 代码：各自任务分支的提交；合并由审查者执行。

## 新窗口 bootstrap 提示词
**执行者**（把 `<ID>` 换成任务号）：
> 你是本仓库 `斗地主`（Cocos Creator 3.8.8 单机斗地主）的**执行型 AI**。先读 `coordination/PROTOCOL.md` 与 `coordination/tasks/<ID>.md`。用 `./coordination/agentctl.sh work <ID>` 建独立工作树并进入，先 `npm --prefix test install`；**只**在该任务声明的文件域内实现，使种子测试转绿；**不得**修改测试、不得碰他人模块、纯层不得 import `cc`。完成后跑 `npm --prefix test test` 与 `npm --prefix test run typecheck`。若任务涉及图像/音频/视频等非文字模态，或 Cocos Creator / IDE / 浏览器调试等实操验收，由你代审查者完成验收并保存截图/录屏/原始样本/日志/操作步骤/环境信息；需要用户终审的，在报告里明确记录等待或结论。把全部结果写入 `coordination/reports/<ID>.report.md`，提交分支并**通知审查者**评审。**你不执行合并**；被打回（changes-requested）就按报告意见修复重提。若实在无法在任务文件域内解决，报告置 `blocked`，写清证据、已尝试路径、可选方案和需规划者裁定的问题，然后转规划者。存疑在报告里提问，不要改测试、不要绕过脚本。

**审查者**（把 `<ID>` 换成任务号）：
> 你是本仓库 `斗地主` 的**审查型 AI**。先读 `coordination/PROTOCOL.md`、执行任务书 `coordination/tasks/<ID>.md`、审查任务书（`coordination/tasks/R-*.md` 内本任务检查单）与执行者报告 `coordination/reports/<ID>.report.md`。评审 `git diff main..task/<ID>`：文件域、契约、红线、种子测试未被改动、test/typecheck 全绿，按检查单逐项核销并做自主判断（可超出检查单打回）。若任务涉及图像/音频/视频等非文字模态或 Cocos Creator / IDE / 浏览器调试等实操，你不亲自操作或感知原始模态，只审计执行者提交的证据、操作步骤、环境、日志、用户终审记录与可复现性；证据不足就打回执行者补证。不通过 → 意见写进报告、状态置 `changes-requested` 打回执行者。若判断问题无法在原任务范围内修复，或打回循环无法收敛，报告置 `blocked` 并转规划者裁定。通过 → 报告写评审证据、BOARD 本行置 `approved`，然后你本人在 main 工作树重跑 test/typecheck 全绿后 `./coordination/agentctl.sh claim <ID>` → `merge <ID>` → `release <ID>` 合并，并在报告补「验收披露」段（结论/打回轮次/合并 commit/测试基线）回复规划者。**不得改测试与产品代码**（发现实现问题打回执行者改）。
