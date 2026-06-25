#!/usr/bin/env bash
# coordination/agentctl.sh —— 多 AI 协作便捷脚本（在仓库根运行）
# 用法：
#   ./coordination/agentctl.sh new  <ID>   # 架构：基于 main 建任务分支 task/<ID>
#   ./coordination/agentctl.sh work <ID>   # 实现方：为任务分支建独立 worktree
#   ./coordination/agentctl.sh status      # 列分支与 worktree
#   ./coordination/agentctl.sh done <ID>   # 架构：合并任务分支入 main 并清理
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WT_BASE="$(dirname "$ROOT")/$(basename "$ROOT").worktrees"
cmd="${1:-}"; id="${2:-}"
case "$cmd" in
  new)    git -C "$ROOT" branch "task/$id" main && echo "created branch task/$id" ;;
  work)   git -C "$ROOT" worktree add "$WT_BASE/$id" "task/$id" && echo "worktree: $WT_BASE/$id" ;;
  status) echo "== branches =="; git -C "$ROOT" branch; echo "== worktrees =="; git -C "$ROOT" worktree list ;;
  done)
    git -C "$ROOT" merge --no-ff "task/$id" -m "merge task/$id"
    git -C "$ROOT" worktree remove "$WT_BASE/$id" 2>/dev/null || true
    git -C "$ROOT" branch -d "task/$id" ;;
  *) echo "usage: agentctl.sh {new|work|status|done} <ID>"; exit 1 ;;
esac
