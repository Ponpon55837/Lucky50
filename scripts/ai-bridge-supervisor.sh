#!/usr/bin/env bash
# ai-bridge-supervisor.sh — 多代理協作監督器
#
# 雙通道通知設計：
#   通道 A — 事件檔（.ai/status/mailbox/）：agent 寫入固定格式事件檔，
#             supervisor 輪詢偵測、去重、轉派。
#   通道 B — tmux-bridge MCP tmux_message：agent 直接通知總控 pane。
#
# 安全規則：
#   1. supervisor 永遠不對 pane 0（總控）使用 tmux send-keys。
#   2. supervisor 可對 pane 1 (opencode-1) 和 pane 2 (opencode-2) send-keys 派工。
#   3. 所有事件檔須使用固定檔名格式，supervisor 處理後 rename → .processed。
#   4. 去重：處理過的事件檔副檔名為 .processed，不再重複讀取。
#   5. 逾時：事件檔若超過 5 分鐘未被處理，supervisor 記錄 warning 但仍處理。
#
# 生命週期：
#   - 由 ai-bridge.sh 透過 nohup 啟動，不受父 shell SIGHUP 影響
#   - 當 tmux session 不存在時自動退出
#   - PID 檔案：/tmp/ai-bridge-supervisor-<session>.pid（per-session）
#   - SIGNAL 處理：SIGTERM/SIGINT → 優雅退出
set -euo pipefail

SESSION_NAME="${1:-ai-bridge}"
PROJECT_DIR="${2:-$(pwd)}"

# per-session PID 檔案
SELF_PID_FILE="/tmp/ai-bridge-supervisor-${SESSION_NAME}.pid"

# 防止重複啟動
if [ -f "$SELF_PID_FILE" ]; then
  existing_pid="$(cat "$SELF_PID_FILE")"
  if [ -n "$existing_pid" ] && [ "$existing_pid" != "$$" ] && kill -0 "$existing_pid" 2>/dev/null; then
    echo "supervisor 已在背景運行 (PID $existing_pid, session=$SESSION_NAME)，跳過重複啟動" >&2
    exit 0
  fi
fi
echo "$$" > "$SELF_PID_FILE"

MAILBOX_DIR="${PROJECT_DIR}/.ai/status/mailbox"
LOG_FILE="${PROJECT_DIR}/.ai/status/supervisor.log"
mkdir -p "$MAILBOX_DIR"

send() {
  # 安全：禁止對 pane 0 send-keys
  if [[ "$1" == "0" ]]; then
    printf '[SECURITY BLOCKED] supervisor 不允許對 pane 0 使用 send-keys\n' >> "$LOG_FILE"
    return 1
  fi
  tmux send-keys -t "$SESSION_NAME:0.$1" "$2" Enter
}

log() {
  local ts
  ts="$(date '+%Y-%m-%dT%H:%M:%S%z')"
  printf '[%s] %s\n' "$ts" "$1" >> "$LOG_FILE"
}

# event → $1=pane_number, $2=text
dispatch_task() {
  local pane="$1" text="$2"
  log "dispatch → pane $pane: $text"
  send "$pane" "$text"
}

handle_agent1_event() {
  local file="$1"
  log "detected agent-1 event: $file"
  dispatch_task 2 '監督器：opencode-1 已完成任務，請立即執行交叉檢查。完成後以 [opencode-2 審查通知] 並寫入 .ai/status/mailbox/agent-2.review.<timestamp>.md（timestamp 為 date +%s）。'
}

handle_agent2_event() {
  local file="$1"
  log "detected agent-2 review event: $file"
  log "supervisor: 審查回報已送達。等待總控讀取完整回報後自行決定下一步。"
}

handle_blocked_event() {
  local file="$1"
  log "detected blocked event: $file"
  log "supervisor: 代理阻塞。請總控讀取回報後決策。"
}

# 優雅退出處理
SHUTDOWN_REQUESTED=false
trap 'SHUTDOWN_REQUESTED=true; log "supervisor shutdown requested (SIGTERM)"' TERM
trap 'SHUTDOWN_REQUESTED=true; log "supervisor shutdown requested (SIGINT)"' INT

REFRESH_FILE="${MAILBOX_DIR}/.supervisor-heartbeat"
log "supervisor started (session=$SESSION_NAME)"
log "mailbox=$MAILBOX_DIR (double-channel: file + tmux-message)"
log "rule: supervisor never sends keys to pane 0"

while tmux has-session -t "$SESSION_NAME" 2>/dev/null && [ "$SHUTDOWN_REQUESTED" = false ]; do
  # 每輪寫入心跳檔，供外部腳本驗證 supervisor 存活
  date '+%s' > "$REFRESH_FILE"
  # 掃描 mailbox 中所有未處理的 .md 事件檔
  for event_file in "$MAILBOX_DIR"/agent-*.md; do
    [[ -f "$event_file" ]] || continue

    base="$(basename "$event_file")"

    case "$base" in
      agent-1.done.*.md)
        handle_agent1_event "$event_file"
        mv "$event_file" "${event_file}.processed"
        log "processed: $base"
        ;;
      agent-2.review.*.md)
        handle_agent2_event "$event_file"
        mv "$event_file" "${event_file}.processed"
        log "processed: $base"
        ;;
      agent-blocked.*.md)
        handle_blocked_event "$event_file"
        mv "$event_file" "${event_file}.processed"
        log "processed: $base"
        ;;
    esac
  done

  # 清理 24 小時前的已處理事件檔
  find "$MAILBOX_DIR" -name '*.processed' -mtime +1 -delete 2>/dev/null || true

  sleep 3
done

if [ "$SHUTDOWN_REQUESTED" = true ]; then
  log "supervisor stopped (signal)"
else
  log "supervisor stopped (session $SESSION_NAME ended)"
fi
rm -f "$REFRESH_FILE"
rm -f "$SELF_PID_FILE"
