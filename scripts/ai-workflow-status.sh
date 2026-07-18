#!/usr/bin/env bash
# ai-workflow-status.sh — 顯示 workflow session 狀態
#
# 用法：
#   pnpm ai-workflow:status                  # 顯示所有 workflow sessions
#   pnpm ai-workflow:status -- <session>     # 顯示指定 session 狀態
#
# 退出碼：0 = 全部正常, 1 = 有異常, 2 = 參數錯誤
set -euo pipefail

PROJECT_DIR="/Users/ponpon55837/program/Lucky50"
SESSION_NAME="${1:-}"

# 偵測是否為互動終端
IS_TTY=false
if [ -t 1 ] 2>/dev/null; then
  IS_TTY=true
fi

# === 工具函式 ===
is_workflow_session() {
  local sname="$1"
  # workflow session 的 pane 標題含 codex/opencode-1/opencode-2
  local titles
  titles="$(tmux list-panes -t "$sname:0" -F '#{pane_title}' 2>/dev/null)" || return 1
  echo "$titles" | grep -qE 'codex|opencode-1|opencode-2'
}

show_session_status() {
  local sname="$1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Session: $sname"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Pane 狀態
  echo ""
  echo "[Panes]"
  if tmux has-session -t "$sname" 2>/dev/null; then
    tmux list-panes -t "$sname:0" -F '  pane #{pane_index}: #{pane_title} (pid=#{pane_pid})' 2>/dev/null || echo "  (無法取得 pane 資訊)"
    local pane_count
    pane_count="$(tmux list-panes -t "$sname:0" -F '#{pane_index}' 2>/dev/null | wc -l | tr -d ' ')"
    echo "  pane 數量: $pane_count"
  else
    echo "  session 不存在"
  fi

  # Supervisor 狀態
  echo ""
  echo "[Supervisor]"
  local pid_file="/tmp/ai-bridge-supervisor-${sname}.pid"
  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file")"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "  PID: $pid — 存活"
    else
      echo "  PID: $pid — 已死亡（僵屍 PID 檔）"
    fi
  else
    echo "  無 PID 檔（supervisor 未運行）"
  fi

  # Heartbeat
  echo ""
  echo "[Heartbeat]"
  local hb_file="$PROJECT_DIR/.ai/status/mailbox/.supervisor-heartbeat"
  if [ -f "$hb_file" ]; then
    local hb_ts now_ts hb_age
    hb_ts="$(cat "$hb_file")"
    now_ts="$(date +%s)"
    hb_age=$(( now_ts - hb_ts ))
    if [ "$hb_age" -lt 10 ]; then
      echo "  心跳: ${hb_age}s 前 — 正常"
    elif [ "$hb_age" -lt 30 ]; then
      echo "  心跳: ${hb_age}s 前 — 偏慢"
    else
      echo "  心跳: ${hb_age}s 前 — 可能已死亡"
    fi
  else
    echo "  無心跳檔"
  fi

  # Mailbox 狀態
  echo ""
  echo "[Mailbox]"
  local mailbox="$PROJECT_DIR/.ai/status/mailbox"
  if [ -d "$mailbox" ]; then
    local pending processed
    pending="$(find "$mailbox" -maxdepth 1 -name 'agent-*.md' ! -name '*.processed' 2>/dev/null | wc -l | tr -d ' ')"
    processed="$(find "$mailbox" -maxdepth 1 -name '*.processed' 2>/dev/null | wc -l | tr -d ' ')"
    echo "  待處理事件: $pending"
    echo "  已處理事件: $processed"
  else
    echo "  mailbox 目錄不存在"
  fi
  echo ""
}

# === 主流程 ===
if [ -n "$SESSION_NAME" ]; then
  # 指定 session
  if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Session '$SESSION_NAME' 不存在"
    exit 1
  fi
  show_session_status "$SESSION_NAME"
  exit 0
fi

# 列出所有 sessions
echo "=== Workflow Sessions 狀態 ==="
echo ""

found_any=false
for sid in $(tmux list-sessions -F '#{session_name}' 2>/dev/null); do
  if is_workflow_session "$sid"; then
    found_any=true
    show_session_status "$sid"
  fi
done

if [ "$found_any" = false ]; then
  echo "目前沒有執行中的 workflow session"
fi

exit 0
