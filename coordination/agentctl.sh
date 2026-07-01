#!/usr/bin/env bash
# coordination/agentctl.sh —— 多 AI 协作便捷脚本（在仓库根运行）
# 用法：
#   ./coordination/agentctl.sh new     <ID>   # 架构：基于 main 建任务分支 task/<ID>
#   ./coordination/agentctl.sh work    <ID>   # 实现方：为任务分支建独立 worktree
#   ./coordination/agentctl.sh claim   <ID>   # 执行者：获批后抢占单一 merge lane
#   ./coordination/agentctl.sh merge   <ID>   # 执行者：合并已 claim 的 task/<ID>
#   ./coordination/agentctl.sh release <ID>   # 执行者：记录 done、移除 worktree、删除分支
#   ./coordination/agentctl.sh done    <ID>   # 执行者：claim -> merge -> release 组合别名
#   ./coordination/agentctl.sh status         # 列分支、worktree 与 merge lane
set -euo pipefail

die() {
  echo "agentctl: $*" >&2
  exit 1
}

usage() {
  cat >&2 <<'EOF'
usage:
  agentctl.sh new     <ID>   # create task/<ID> from main
  agentctl.sh work    <ID>   # create ../斗地主.worktrees/<ID>
  agentctl.sh claim   <ID>   # mark approved task as merge-claimed:<ID>
  agentctl.sh merge   <ID>   # merge claimed task/<ID> into main
  agentctl.sh release <ID>   # mark done <commit>, remove worktree and branch
  agentctl.sh done    <ID>   # claim -> merge -> release
  agentctl.sh status         # list branches, worktrees, and merge lane
EOF
}

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)" || die "cannot resolve script directory"
ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)" || die "cannot resolve repository root"
WT_BASE="$(dirname "$ROOT")/$(basename "$ROOT").worktrees"
BOARD_REL="coordination/BOARD.md"
BOARD="$ROOT/$BOARD_REL"
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
  [[ "$current" == "main" ]] || die "$cmd must run from main (current: ${current:-detached})"
  [[ -z "$(git -C "$ROOT" status --porcelain)" ]] || die "main worktree has uncommitted changes"
}

ensure_task_worktree_clean() {
  local path="$1"
  if worktree_registered "$path"; then
    [[ -z "$(git -C "$path" status --porcelain)" ]] || die "task worktree has uncommitted changes: $path"
  fi
}

board_task_line_count() {
  awk -F'|' -v task_id="$id" '
    NF > 2 {
      cell = $2
      gsub(/^[ \t]+|[ \t]+$/, "", cell)
      if (cell == task_id) count += 1
    }
    END { print count + 0 }
  ' "$BOARD"
}

ensure_single_board_task_line() {
  local count
  count="$(board_task_line_count)"
  [[ "$count" == "1" ]] || die "expected exactly one BOARD row for $id, found $count"
}

board_task_status() {
  awk -F'|' -v task_id="$id" '
    NF > 2 {
      cell = $2
      gsub(/^[ \t]+|[ \t]+$/, "", cell)
      if (cell == task_id) {
        status = $(NF - 1)
        gsub(/^[ \t]+|[ \t]+$/, "", status)
        print status
      }
    }
  ' "$BOARD"
}

ensure_task_approved() {
  local status
  status="$(board_task_status)"
  [[ "$status" == *approved* ]] || die "task $id is not approved in BOARD (current status: ${status:-missing})"
}

ensure_task_claimed() {
  local status
  status="$(board_task_status)"
  [[ "$status" == *"merge-claimed:$id"* ]] || die "task $id is not merge-claimed:$id in BOARD (current status: ${status:-missing})"
}

ensure_no_merge_lane_claimed() {
  local claimed
  claimed="$(awk -F'|' '
    NF > 2 {
      status = $(NF - 1)
      gsub(/^[ \t]+|[ \t]+$/, "", status)
      if (status ~ /merge-claimed:/) print $0
    }
  ' "$BOARD")"
  [[ -z "$claimed" ]] || die "merge lane is busy: $claimed"
}

set_board_task_status() {
  local new_status="$1"
  local tmp
  tmp="$(mktemp "$BOARD.tmp.XXXXXX")" || die "cannot create temp file for BOARD"
  awk -F'|' -v OFS='|' -v task_id="$id" -v new_status="$new_status" '
    NF > 2 {
      cell = $2
      gsub(/^[ \t]+|[ \t]+$/, "", cell)
      if (cell == task_id) {
        seen += 1
        $(NF - 1) = " " new_status " "
      }
    }
    { print }
    END {
      if (seen != 1) {
        exit 2
      }
    }
  ' "$BOARD" > "$tmp" || {
    rm -f "$tmp"
    die "failed to update BOARD status for $id"
  }
  mv "$tmp" "$BOARD"
}

commit_board_status() {
  local message="$1"
  git -C "$ROOT" add "$BOARD_REL"
  if git -C "$ROOT" diff --cached --quiet -- "$BOARD_REL"; then
    die "no BOARD status change to commit"
  fi
  git -C "$ROOT" commit -m "$message"
}

claim_task() {
  ensure_clean_main
  branch_exists "task/$id" || die "missing branch: task/$id"
  ensure_single_board_task_line
  ensure_task_approved
  ensure_no_merge_lane_claimed
  set_board_task_status "merge-claimed:$id"
  commit_board_status "chore($id): claim merge lane"
  echo "claimed merge lane: $id"
}

merge_task() {
  ensure_clean_main
  branch_exists "task/$id" || die "missing branch: task/$id"
  ensure_single_board_task_line
  ensure_task_claimed
  ensure_task_worktree_clean "$WT_BASE/$id"
  git -C "$ROOT" merge --no-ff "task/$id" \
    -m "merge task/$id" \
    -m "approved-by planner" \
    -m "test/typecheck 绿"
  echo "merged task/$id"
}

release_task() {
  local merged_commit
  ensure_clean_main
  branch_exists "task/$id" || die "missing branch: task/$id"
  ensure_single_board_task_line
  ensure_task_claimed
  ensure_task_worktree_clean "$WT_BASE/$id"
  git -C "$ROOT" merge-base --is-ancestor "task/$id" HEAD || die "task/$id is not merged into HEAD; run merge first"
  merged_commit="$(git -C "$ROOT" rev-parse --short HEAD)"
  set_board_task_status "**done \`$merged_commit\`**"
  commit_board_status "chore($id): record merge evidence"
  if worktree_registered "$WT_BASE/$id"; then
    git -C "$ROOT" worktree remove "$WT_BASE/$id"
  else
    echo "no registered worktree to remove: $WT_BASE/$id"
  fi
  git -C "$ROOT" branch -d "task/$id"
  echo "released merge lane: $id ($merged_commit)"
}

done_task() {
  local status
  ensure_single_board_task_line
  status="$(board_task_status)"
  if [[ "$status" == *"merge-claimed:$id"* ]]; then
    merge_task
    release_task
  elif [[ "$status" == *approved* ]]; then
    claim_task
    merge_task
    release_task
  elif [[ "$status" == *done* ]]; then
    echo "task already done: $id ($status)"
  else
    die "task $id must be approved or merge-claimed before done (current status: ${status:-missing})"
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
  claim)
    need_id
    claim_task
    ;;
  merge)
    need_id
    merge_task
    ;;
  release)
    need_id
    release_task
    ;;
  done)
    need_id
    done_task
    ;;
  status)
    total="$(worktree_count)"
    linked=$((total > 0 ? total - 1 : 0))
    echo "== branches =="
    git -C "$ROOT" branch
    echo "== worktrees (includes main; linked=$linked) =="
    git -C "$ROOT" worktree list
    echo "== merge lane =="
    awk -F'|' '
      NF > 2 {
        task = $2
        status = $(NF - 1)
        gsub(/^[ \t]+|[ \t]+$/, "", task)
        gsub(/^[ \t]+|[ \t]+$/, "", status)
        if (status ~ /approved/ || status ~ /merge-claimed:/) {
          print task ": " status
        }
      }
    ' "$BOARD"
    ;;
  *)
    usage
    exit 1
    ;;
esac
