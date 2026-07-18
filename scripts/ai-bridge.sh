#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="ai-bridge"
PROJECT_DIR="/Users/ponpon55837/program/Lucky50"
SUPERVISOR_SCRIPT="$PROJECT_DIR/scripts/ai-bridge-supervisor.sh"

# 如果 session 已存在，直接 attach，不重建
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "Session '$SESSION_NAME' 已存在，直接 attach..."
  tmux attach -t "$SESSION_NAME"
  exit 0
fi

# 建立新 session
tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_DIR"
tmux split-window -h -t "$SESSION_NAME:0" -c "$PROJECT_DIR"
tmux split-window -v -t "$SESSION_NAME:0.0" -c "$PROJECT_DIR"
tmux select-layout -t "$SESSION_NAME:0" tiled

tmux select-pane -t "$SESSION_NAME:0.0" -T "codex"
tmux select-pane -t "$SESSION_NAME:0.1" -T "opencode-1"
tmux select-pane -t "$SESSION_NAME:0.2" -T "opencode-2"

tmux send-keys -t "$SESSION_NAME:0.0" "codex" Enter
tmux send-keys -t "$SESSION_NAME:0.1" "opencode" Enter
tmux send-keys -t "$SESSION_NAME:0.2" "opencode" Enter

sleep 1

tmux send-keys -t "$SESSION_NAME:0.0" "你是總控與驗證者。執行固定協作迴圈：接收需求→拆解→派 opencode-1 實作→收到完成通知後派 opencode-2 審查→收到審查通知後自行驗證→直接派下一步或收尾。不要要求使用者逐 pane 按送出。每次派工都要明確指定完成回報格式與 tmux-bridge MCP 通知。回答短，先結論再下一步。" Enter
tmux send-keys -t "$SESSION_NAME:0.1" "你是 opencode-1 實作者。只執行總控指定範圍，保持最小變更、可驗證、可回滾。完成後不可只停在畫面：必須先執行測試，再透過 tmux-bridge MCP 通知總控與 opencode-2，格式固定為：[opencode-1 完成通知] 變更摘要／檔案／測試結果／剩餘風險。若被阻塞也要立即通知。" Enter
tmux send-keys -t "$SESSION_NAME:0.2" "你是 opencode-2 交叉檢查者。收到總控通知後檢查 opencode-1 diff、規格、回歸與測試缺口；不要等待使用者操作。完成後透過 tmux-bridge MCP 通知總控，格式固定為：[opencode-2 審查通知] 問題與嚴重度／檢查檔案／測試結果／合併建議。若有阻塞立即通知。" Enter

# 背景監督器會監聽完成／阻塞標記，將回報自動轉送到下一個 pane。
if [[ -x "$SUPERVISOR_SCRIPT" ]]; then
  "$SUPERVISOR_SCRIPT" "$SESSION_NAME" "$PROJECT_DIR" >/tmp/ai-bridge-supervisor.log 2>&1 &
  echo $! >/tmp/ai-bridge-supervisor.pid
fi

tmux attach -t "$SESSION_NAME"
