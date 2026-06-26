#!/usr/bin/env bash
# coordination/agentctl.sh —— 多 AI 协作便捷脚本（在仓库根运行）
# 用法：
#   ./coordination/agentctl.sh new  <ID>   # 架构：基于 main 建任务分支 task/<ID>
#   ./coordination/agentctl.sh work <ID>   # 实现方：为任务分支建独立 worktree
#   ./coordination/agentctl.sh status      # 列分支与 worktree
#   ./coordination/agentctl.sh done <ID>   # 架构：合并任务分支入 main 并清理
set -euo pipefail

die() {
  echo "agentctl: $*" >&2
  exit 1
}

usage() {
  cat >&2 <<'EOF'
usage:
  agentctl.sh new    <ID>   # create task/<ID> from main
  agentctl.sh work   <ID>   # create ../斗地主.worktrees/<ID>
  agentctl.sh done   <ID>   # merge task/<ID> into main, then remove worktree and branch
  agentctl.sh status        # list branches and worktrees
EOF
}

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)" || die "cannot resolve script directory"
ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)" || die "cannot resolve repository root"
WT_BASE="$(dirname "$ROOT")/$(basename "$ROOT").worktrees"
cmd="${1:-}"; id="${2:-}"

need_id() {
  if [[ -z "$id" ]]; then
    usage
    die "$cmd requires <ID>"
  fi
  if [[ ! "$id" =~ ^[A-Za-z0-9._-]+$ ]]; then
    die "invalid ID '$id' (allowed: letters, numbers, dot, underscore, hyphen)"
  fi
}

branch_exists() {
  git -C "$ROOT" show-ref --verify --quiet "refs/heads/$1"
}

worktree_registered() {
  local path="$1"
  local line
  while IFS= read -r line; do
    [[ "$line" == "worktree $path" ]] && return 0
  done < <(git -C "$ROOT" worktree list --porcelain)
  return 1
}

worktree_count() {
  local count=0
  local line
  while IFS= read -r line; do
    [[ "$line" == worktree\ * ]] && ((count += 1))
  done < <(git -C "$ROOT" worktree list --porcelain)
  echo "$count"
}

ensure_clean_main() {
  local current
  current="$(git -C "$ROOT" branch --show-current)"
  [[ "$current" == "main" ]] || die "done must run from main (current: ${current:-detached})"
  [[ -z "$(git -C "$ROOT" status --porcelain)" ]] || die "main worktree has uncommitted changes"
}

ensure_task_worktree_clean() {
  local path="$1"
  if worktree_registered "$path"; then
    [[ -z "$(git -C "$path" status --porcelain)" ]] || die "task worktree has uncommitted changes: $path"
  fi
}

case "$cmd" in
  new)
    need_id
    branch_exists "task/$id" && die "branch already exists: task/$id"
    git -C "$ROOT" branch "task/$id" main
    echo "created branch task/$id"
    ;;
  work)
    need_id
    branch_exists "task/$id" || die "missing branch: task/$id"
    mkdir -p "$WT_BASE"
    if worktree_registered "$WT_BASE/$id"; then
      echo "worktree already exists: $WT_BASE/$id"
      exit 0
    fi
    [[ ! -e "$WT_BASE/$id" ]] || die "path exists but is not a registered worktree: $WT_BASE/$id"
    git -C "$ROOT" worktree add "$WT_BASE/$id" "task/$id"
    echo "worktree: $WT_BASE/$id"
    ;;
  status)
    total="$(worktree_count)"
    linked=$((total > 0 ? total - 1 : 0))
    echo "== branches =="
    git -C "$ROOT" branch
    echo "== worktrees (includes main; linked=$linked) =="
    git -C "$ROOT" worktree list
    ;;
  done)
    need_id
    ensure_clean_main
    branch_exists "task/$id" || die "missing branch: task/$id"
    ensure_task_worktree_clean "$WT_BASE/$id"
    git -C "$ROOT" merge --no-ff "task/$id" -m "merge task/$id"
    if worktree_registered "$WT_BASE/$id"; then
      git -C "$ROOT" worktree remove "$WT_BASE/$id"
    else
      echo "no registered worktree to remove: $WT_BASE/$id"
    fi
    git -C "$ROOT" branch -d "task/$id"
    ;;
  *)
    usage
    exit 1
    ;;
esac
