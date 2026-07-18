#!/usr/bin/env bash
# ai-workflow-switch.sh — 切換到指定 workflow session
#
# 用法：
#   pnpm ai-workflow:switch -- <session>     # 切換到指定 session
#
# 規則：
#   - 只能 attach 整個 session，禁止逐 pane 操作
#   - 非互動環境（如 CI）提示 attach 指令而不卡住
#   - session 不存在時明確報錯
set -euo pipefail

SESSION_NAME="${1:-}"

# 偵測互動模式
IS_TTY=false
if [ -t 0 ] 2>/dev/null && [ -t 1 ] 2>/dev/null; then
  IS_TTY=true
fi

# === 參數檢查 ===
if [ -z "$SESSION_NAME" ]; then
  echo "用法: pnpm ai-workflow:switch -- <session-name>"
  echo ""
  echo "可用 workflow sessions:"
  for sid in $(tmux list-sessions -F '#{session_name}' 2>/dev/null); do
    local_titles="$(tmux list-panes -t "$sid:0" -F '#{pane_title}' 2>/dev/null)" || continue
    if echo "$local_titles" | grep -qE 'codex|opencode-1|opencode-2'; then
      echo "  - $sid"
    fi
  done
  exit 2
fi

# === Session 存在檢查 ===
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "錯誤: session '$SESSION_NAME' 不存在"
  exit 1
fi

# === Workflow session 驗證 ===
pane_titles="$(tmux list-panes -t "$SESSION_NAME:0" -F '#{pane_title}' 2>/dev/null)"
if ! echo "$pane_titles" | grep -qE 'codex|opencode-1|opencode-2'; then
  echo "警告: session '$SESSION_NAME' 可能不是 workflow session（pane 標題不符）"
fi

# === Attach ===
if [ "$IS_TTY" = true ]; then
  echo "切換到 session '$SESSION_NAME'..."
  echo "（使用 Ctrl+B D 可 detach 回到主終端）"
  tmux attach -t "$SESSION_NAME"
else
  echo "非互動環境，無法直接 attach。請手動執行："
  echo ""
  echo "  tmux attach -t $SESSION_NAME"
  echo ""
  exit 0
fi
