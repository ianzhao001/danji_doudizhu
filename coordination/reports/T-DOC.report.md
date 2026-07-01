# T-DOC 实现报告

- 实现方标识：Codex
- 分支：`task/T-DOC`
- 状态：in-review

## 改了哪些文件
- `coordination/PROTOCOL.md`
- `coordination/BOARD.md`
- `coordination/agentctl.sh`
- `coordination/templates/task.md`
- `coordination/templates/report.md`

## 测试与类型检查输出
```
bash -n coordination/agentctl.sh
# 通过

./coordination/agentctl.sh
# usage 中列出 new / work / claim / merge / release / done / status

git diff --check
# 通过

npm --prefix test test
# Test Files  133 passed (133)
# Tests       654 passed (654)

npm --prefix test run typecheck
# tsc --noEmit
# 通过
```

## 合并证据（approved 后由执行者回填）
- T-DOC 本身仍按旧协议执行：本分支不自行合并 main，由架构评审后合并。
- 合并前回归：
  - `npm --prefix test test`：已在提交前通过，133 files / 654 tests
  - `npm --prefix test run typecheck`：已在提交前通过
- merge commit：N/A（旧协议，由架构合并后产生）
- BOARD 状态：`T-DOC` 已置 `in-review`（旧协议·架构合并）

## 与 spec 的偏差 / 关键决策
- `done <ID>` 保留为新流程组合别名：若状态为 `approved`，顺序执行 `claim -> merge -> release`；若已处于 `merge-claimed:<ID>`，继续 `merge -> release`，便于中途失败后恢复。
- `claim/merge/release` 均要求从 main 工作树运行；实现阶段仍在任务 worktree，不允许绕过脚本。
- `release` 记录终态为 `**done \`<commit>\`**`，与现有 BOARD 的 Markdown 表达保持一致，语义仍是 `done <commit>`。
- `release` 增加 `merge-base --is-ancestor task/<ID> HEAD` 防线，避免只 claim 未 merge 就误置 `done`。
- `agentctl.sh status` 增加 merge lane 可视化，仅展示 `approved` / `merge-claimed` 行，不改变状态。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] `PROTOCOL.md` 明确执行者合并、双闸、BOARD 所有权与架构批准职责
- [x] `agentctl.sh` 新增 `claim/merge/release`，`done` 重定义为组合别名
- [x] `bash -n coordination/agentctl.sh` 通过
- [x] usage 列出新命令
- [x] BOARD 图例含 `approved` / `merge-claimed:<ID>`，终态仍 `done <commit>`，无新增持久 `merged`
- [x] 两个模板与新流程一致
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域 + 本任务报告
- [x] 未改 `assets/` / `test/`，未碰 main / 他人模块
- [x] 未 import cc
