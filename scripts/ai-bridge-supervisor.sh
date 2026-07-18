#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="${1:-ai-bridge}"
PROJECT_DIR="${2:-$(pwd)}"
STATE_DIR="${PROJECT_DIR}/.ai/status"
mkdir -p "$STATE_DIR"

send() {
  tmux send-keys -t "$SESSION_NAME:0.$1" "$2" Enter
}

record_supervisor_event() {
  printf '%s\n' "$1" >> "${STATE_DIR}/supervisor-events.log"
}

last_agent1=""
last_agent2=""

while tmux has-session -t "$SESSION_NAME" 2>/dev/null; do
  agent1="$(tmux capture-pane -t "$SESSION_NAME:0.1" -p -S -80 2>/dev/null || true)"
  agent2="$(tmux capture-pane -t "$SESSION_NAME:0.2" -p -S -80 2>/dev/null || true)"
  hash1="$(printf '%s' "$agent1" | shasum | cut -d' ' -f1)"
  hash2="$(printf '%s' "$agent2" | shasum | cut -d' ' -f1)"

  if [[ "$hash1" != "$last_agent1" ]] && grep -q '\[opencode-1 完成通知\]\|\[agent-1 完成通知\]' <<<"$agent1"; then
    send 2 '總控監督器偵測到 opencode-1 完成通知。請立即執行交叉檢查，完成後以 [opencode-2 審查通知] 回報總控。'
    record_supervisor_event '監督器：已偵測 opencode-1 完成，已自動通知 opencode-2。等待審查回報。'
  fi

  if [[ "$hash2" != "$last_agent2" ]] && grep -q '\[opencode-2 審查通知\]\|\[agent-2 審查通知\]' <<<"$agent2"; then
    record_supervisor_event '監督器：已偵測 opencode-2 審查通知。請讀取完整回報，執行最終驗證並直接派發下一步或向使用者收尾。'
  fi

  last_agent1="$hash1"
  last_agent2="$hash2"
  sleep 3
done
