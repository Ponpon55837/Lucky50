#!/usr/bin/env bash
# ai-workflow-kill.sh — 安全清理指定 workflow session
#
# 用法：
#   pnpm ai-workflow:kill                          # 互動選單：列出 sessions → 選取 → 確認
#   pnpm ai-workflow:kill -- <session>             # 指定 session（預設 dry-run）
#   pnpm ai-workflow:kill -- <session> --force     # 跳過確認直接中止
#   pnpm ai-workflow:kill -- <session> --dry-run   # 只顯示，不執行
#
# 安全規則：
#   - 禁止 wildcard、通配符、批次刪除
#   - 必須明確指定 session 名稱或透過互動選單選取
#   - 非互動環境 + 無 --force → 只 dry-run
#   - 只清理指定 session 的 runtime，不影響其它 session
#   - 中止前先停止 supervisor → 清理 PID/heartbeat → kill-session
#
# 退出碼：0 = 成功, 1 = 失敗/取消, 2 = 參數錯誤
set -euo pipefail

PROJECT_DIR="/Users/ponpon55837/program/Lucky50"

# === 參數解析 ===
SESSION_NAME=""
FORCE=false
DRY_RUN=false

# 偵測互動模式
IS_TTY=false
if [ -t 0 ] 2>/dev/null && [ -t 1 ] 2>/dev/null; then
  IS_TTY=true
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --force|-f)
      FORCE=true
      shift
      ;;
    --dry-run|-n)
      DRY_RUN=true
      shift
      ;;
    -*)
      echo "未知參數: $1"
      exit 2
      ;;
    *)
      if [ -z "$SESSION_NAME" ]; then
        SESSION_NAME="$1"
      else
        echo "錯誤: 多餘參數 '$1'"
        echo "用法: pnpm ai-workflow:kill [--force|--dry-run] <session-name>"
        exit 2
      fi
      shift
      ;;
  esac
done

# === 安全檢查：禁止 wildcard ===
if echo "$SESSION_NAME" | grep -qE '[\*\?\[\]]' 2>/dev/null; then
  echo "錯誤: session 名稱不允許使用 wildcard 或通配符"
  echo "請指定確切的 session 名稱"
  exit 2
fi

# === 工具函式 ===
is_workflow_session() {
  local sname="$1"
  local titles
  titles="$(tmux list-panes -t "$sname:0" -F '#{pane_title}' 2>/dev/null)" || return 1
  echo "$titles" | grep -qE 'codex|opencode-1|opencode-2'
}

get_supervisor_info() {
  local sname="$1"
  local pid_file="/tmp/ai-bridge-supervisor-${sname}.pid"
  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file")"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "PID=$pid 存活"
    else
      echo "PID=$pid 已死亡"
    fi
  else
    echo "無 supervisor"
  fi
}

get_heartbeat_info() {
  local hb_file="$PROJECT_DIR/.ai/status/mailbox/.supervisor-heartbeat"
  if [ -f "$hb_file" ]; then
    local hb_ts now_ts hb_age
    hb_ts="$(cat "$hb_file")"
    now_ts="$(date +%s)"
    hb_age=$(( now_ts - hb_ts ))
    echo "${hb_age}s 前"
  else
    echo "無心跳"
  fi
}

show_session_summary() {
  local sname="$1"
  echo "  Session:       $sname"
  # Pane 狀態
  if tmux has-session -t "$sname" 2>/dev/null; then
    local pane_info
    pane_info="$(tmux list-panes -t "$sname:0" -F '#{pane_title}' 2>/dev/null | tr '\n' ', ' | sed 's/,$//')"
    echo "  Panes:         $pane_info"
  else
    echo "  Panes:         session 不存在"
  fi
  echo "  Supervisor:    $(get_supervisor_info "$sname")"
  echo "  Heartbeat:     $(get_heartbeat_info)"
}

stop_supervisor() {
  local sname="$1"
  local pid_file="/tmp/ai-bridge-supervisor-${sname}.pid"
  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file")"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "  停止 supervisor (PID $pid)..."
      kill "$pid" 2>/dev/null || true
      sleep 1
      # 確認已停止
      if kill -0 "$pid" 2>/dev/null; then
        echo "  強制終止 supervisor..."
        kill -9 "$pid" 2>/dev/null || true
      fi
    fi
    rm -f "$pid_file"
    echo "  已清理 PID 檔: $pid_file"
  fi

  # 清理 heartbeat
  local hb_file="$PROJECT_DIR/.ai/status/mailbox/.supervisor-heartbeat"
  if [ -f "$hb_file" ]; then
    rm -f "$hb_file"
    echo "  已清理 heartbeat 檔"
  fi

  # 清理 supervisor log（該 session 的）
  local log_file="$PROJECT_DIR/.ai/status/supervisor.log"
  if [ -f "$log_file" ]; then
    rm -f "$log_file"
    echo "  已清理 supervisor.log"
  fi

  # 清理 nohup log
  local nohup_log="/tmp/ai-bridge-supervisor-${sname}.log"
  if [ -f "$nohup_log" ]; then
    rm -f "$nohup_log"
    echo "  已清理 nohup log: $nohup_log"
  fi
}

kill_session() {
  local sname="$1"
  echo "  停止 tmux session '$sname'..."
  tmux kill-session -t "$sname" 2>/dev/null || true
  echo "  session 已終止"
}

# === 互動選單模式（無 session 名稱時） ===
if [ -z "$SESSION_NAME" ]; then
  if [ "$IS_TTY" = false ]; then
    echo "錯誤: 非互動環境需要明確指定 session 名稱"
    echo ""
    echo "用法: pnpm ai-workflow:kill -- <session-name>"
    echo ""
    echo "可用 workflow sessions:"
    for sid in $(tmux list-sessions -F '#{session_name}' 2>/dev/null); do
      if is_workflow_session "$sid"; then
        echo "  - $sid  $(get_supervisor_info "$sid")"
      fi
    done
    exit 2
  fi

  # 收集 workflow sessions
  sessions=()
  for sid in $(tmux list-sessions -F '#{session_name}' 2>/dev/null); do
    if is_workflow_session "$sid"; then
      sessions+=("$sid")
    fi
  done

  if [ ${#sessions[@]} -eq 0 ]; then
    echo "目前沒有可中止的 workflow session"
    exit 0
  fi

  echo "=== 可中止的 Workflow Sessions ==="
  echo ""
  idx=1
  for s in "${sessions[@]}"; do
    echo "[$idx] $s"
    show_session_summary "$s"
    echo ""
    idx=$((idx + 1))
  done

  echo "取消: 輸入 q 或直接按 Enter"
  echo ""
  printf "請輸入編號: "
  read -r choice </dev/tty 2>/dev/null || read -r choice

  # 取消判定
  if [ -z "$choice" ] || [ "$choice" = "q" ] || [ "$choice" = "Q" ]; then
    echo "已取消"
    exit 0
  fi

  # 編號驗證
  if ! echo "$choice" | grep -qE '^[0-9]+$' 2>/dev/null; then
    echo "錯誤: 請輸入數字編號"
    exit 1
  fi

  if [ "$choice" -lt 1 ] || [ "$choice" -gt ${#sessions[@]} ]; then
    echo "錯誤: 編號 $choice 超出範圍 (1-${#sessions[@]})"
    exit 1
  fi

  SESSION_NAME="${sessions[$((choice - 1))]}"
fi

# === 指定 session 名稱模式 ===
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "錯誤: session '$SESSION_NAME' 不存在"
  exit 1
fi

if ! is_workflow_session "$SESSION_NAME"; then
  echo "錯誤: session '$SESSION_NAME' 不是 workflow session"
  echo "（pane 標題不含 codex/opencode-1/opencode-2）"
  exit 1
fi

echo ""
echo "=== 即將中止的 Session ==="
show_session_summary "$SESSION_NAME"
echo ""

# 非互動環境預設 dry-run
if [ "$IS_TTY" = false ] && [ "$FORCE" = false ]; then
  echo "非互動環境: 預設 dry-run 模式"
  echo "若要實際執行，請加 --force 參數或在互動終端中操作"
  echo ""
  echo "完整中止指令: pnpm ai-workflow:kill -- $SESSION_NAME --force"
  exit 0
fi

if [ "$DRY_RUN" = true ]; then
  echo "[DRY-RUN] 以下操作不會實際執行:"
  echo "  1. 停止 supervisor ($(get_supervisor_info "$SESSION_NAME"))"
  echo "  2. 清理 PID 檔、heartbeat、log"
  echo "  3. tmux kill-session -t $SESSION_NAME"
  exit 0
fi

# === 確認流程 ===
if [ "$FORCE" = false ] && [ "$IS_TTY" = true ]; then
  echo "⚠️  警告: 以下操作不可逆:"
  echo "  - 終止 session '$SESSION_NAME' 及其所有 pane"
  echo "  - 停止 supervisor 並清理相關 runtime 檔案"
  echo "  - 所有未完成的 agent 通知將遺失"
  echo ""
  printf "按 Enter 確認中止，輸入 q 取消: "
  read -r confirm </dev/tty 2>/dev/null || read -r confirm
  if [ "$confirm" = "q" ] || [ "$confirm" = "Q" ]; then
    echo "已取消"
    exit 0
  fi
fi

# === 執行中止 ===
echo ""
echo "=== 開始中止 session '$SESSION_NAME' ==="
stop_supervisor "$SESSION_NAME"
kill_session "$SESSION_NAME"
echo ""
echo "=== Session '$SESSION_NAME' 已完全中止 ==="
exit 0
