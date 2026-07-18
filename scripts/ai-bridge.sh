#!/usr/bin/env bash
# ai-bridge.sh — 多代理開發協作啟動腳本（支援多 session）
#
# 用法：
#   pnpm ai-workflow                  # 預設 session 名稱 ai-bridge
#   pnpm ai-workflow -- <name>        # 指定 session 名稱
#   pnpm ai-workflow -- --session my-task  # 或用 --session 參數
#
# MCP 隔離機制：
#   一般開 opencode/Codex 時不載入 tmux-bridge（無 .mcp.json）
#   pnpm ai-workflow 時動態建立 .mcp.json symlink，讓 workflow 內的
#   opencode agent 可使用 tmux-bridge MCP；standalone opencode 不受影響。
#
# 建立三個 tmux pane：總控 (Codex/opencode)、opencode-1、opencode-2
# 啟動監督器 (supervisor) 負責事件輪詢與派工
# 設定 role prompts，明確規範雙通道通訊協定
#
# Session 適用/復用邏輯：
#   1. Session 不存在 → 建立新 session + 3 pane + supervisor → READY
#   2. Session 存在 → 檢查 3 pane + role prompts + supervisor → 全 OK 則復用 → READY
#   3. Session 存在但有異常 → 修復/重建 → RECOVERED
#   4. 無法恢復 → FAILED
set -euo pipefail

# === 參數解析 ===
SESSION_NAME="ai-bridge"
while [ $# -gt 0 ]; do
  case "$1" in
    --)
      shift
      SESSION_NAME="${1:?需要 session 名稱}"
      shift
      ;;
    --session)
      shift
      SESSION_NAME="${1:?--session 需要名稱參數}"
      shift
      ;;
    --session=*)
      SESSION_NAME="${1#--session=}"
      shift
      ;;
    -*)
      echo "未知參數: $1"
      exit 1
      ;;
    *)
      SESSION_NAME="$1"
      shift
      ;;
  esac
done

PROJECT_DIR="/Users/ponpon55837/program/Lucky50"
SUPERVISOR_SCRIPT="$PROJECT_DIR/scripts/ai-bridge-supervisor.sh"
SUPERVISOR_PID_FILE="/tmp/ai-bridge-supervisor-${SESSION_NAME}.pid"
WORKFLOW_MCP_TEMPLATE=".mcp-workflow.json"
MCP_ACTIVE=".mcp.json"

# === 狀態輸出 ===
status_ready()    { echo "[STATUS] READY — session '$SESSION_NAME' 已就緒"; }
status_recovered(){ echo "[STATUS] RECOVERED — session '$SESSION_NAME' 已修復重建"; }
status_failed()   { echo "[STATUS] FAILED — session '$SESSION_NAME' 無法啟動"; }

# === Supervisor 狀態檢查 ===
check_supervisor_health() {
  if [ ! -f "$SUPERVISOR_PID_FILE" ]; then
    return 1
  fi
  local pid
  pid="$(cat "$SUPERVISOR_PID_FILE")"
  if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
    return 1
  fi
  local heartbeat_file="$PROJECT_DIR/.ai/status/mailbox/.supervisor-heartbeat"
  if [ -f "$heartbeat_file" ]; then
    local hb_age
    hb_age=$(( $(date +%s) - $(cat "$heartbeat_file") ))
    if [ "$hb_age" -gt 30 ]; then
      echo "supervisor 心跳過舊 (${hb_age}s)，判定為死亡"
      rm -f "$SUPERVISOR_PID_FILE"
      return 1
    fi
  fi
  return 0
}

# === Supervisor 健康檢查 ===
ensure_supervisor() {
  if check_supervisor_health; then
    local pid
    pid="$(cat "$SUPERVISOR_PID_FILE")"
    echo "supervisor 已在背景運行 (PID $pid)"
    return 0
  fi

  if [ -f "$SUPERVISOR_PID_FILE" ]; then
    echo "supervisor PID 檔案存在但行程已死，將重新啟動"
    rm -f "$SUPERVISOR_PID_FILE"
  fi

  if [ ! -x "$SUPERVISOR_SCRIPT" ]; then
    echo "WARNING: $SUPERVISOR_SCRIPT 不可執行，無法啟動 supervisor"
    return 1
  fi

  nohup "$SUPERVISOR_SCRIPT" "$SESSION_NAME" "$PROJECT_DIR" >/tmp/ai-bridge-supervisor-${SESSION_NAME}.log 2>&1 &
  local pid=$!
  echo "$pid" > "$SUPERVISOR_PID_FILE"

  sleep 1
  if kill -0 "$pid" 2>/dev/null; then
    echo "supervisor 已啟動 (PID $pid, session=$SESSION_NAME)"
  else
    echo "ERROR: supervisor 啟動失敗（請檢查 /tmp/ai-bridge-supervisor-${SESSION_NAME}.log）"
    rm -f "$SUPERVISOR_PID_FILE"
    return 1
  fi
}

# === MCP 隔離注入 ===
ensure_mcp() {
  if [ -f "$PROJECT_DIR/$WORKFLOW_MCP_TEMPLATE" ]; then
    ln -sf "$WORKFLOW_MCP_TEMPLATE" "$PROJECT_DIR/$MCP_ACTIVE"
    echo "MCP injected: $MCP_ACTIVE → $WORKFLOW_MCP_TEMPLATE"
  else
    echo "WARNING: $WORKFLOW_MCP_TEMPLATE not found — tmux-bridge MCP not available"
  fi
}

cleanup_mcp() {
  if [ -L "$PROJECT_DIR/$MCP_ACTIVE" ]; then
    rm -f "$PROJECT_DIR/$MCP_ACTIVE"
    echo "cleanup: removed $MCP_ACTIVE symlink"
  fi
}
trap cleanup_mcp EXIT

# === Session 健康檢查 ===
check_session_health() {
  if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    return 1
  fi

  local pane_count
  pane_count="$(tmux list-panes -t "$SESSION_NAME:0" -F '#{pane_index}' 2>/dev/null | wc -l | tr -d ' ')"
  if [ "$pane_count" -lt 3 ]; then
    echo "pane 數量不足: $pane_count (需要 3)"
    return 1
  fi

  local pane_names
  pane_names="$(tmux list-panes -t "$SESSION_NAME:0" -F '#{pane_title}' 2>/dev/null)"

  if ! echo "$pane_names" | grep -q 'codex\|opencode-1\|opencode-2'; then
    echo "pane 標題不符合預期: $pane_names"
    return 1
  fi

  return 0
}

# === Session 修復 ===
repair_session() {
  echo "嘗試修復 session '$SESSION_NAME'..."

  if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "session 不存在，需建立全新 session"
    return 1
  fi

  local pane_count
  pane_count="$(tmux list-panes -t "$SESSION_NAME:0" -F '#{pane_index}' 2>/dev/null | wc -l | tr -d ' ')"
  if [ "$pane_count" -lt 3 ]; then
    echo "pane 數量異常 ($pane_count)，殺掉重建"
    tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
    return 1
  fi

  echo "pane 結構正常，嘗試補發 role prompts + 重啟 supervisor"
  inject_role_prompts
  ensure_supervisor || true
  return 0
}

# === Role Prompts 注入 ===
inject_role_prompts() {
  # 總控 (pane 0) role prompt
  tmux send-keys -t "$SESSION_NAME:0.0" "你是總控與驗證者。執行固定協作迴圈：接收需求→拆解→派 opencode-1 實作→收到完成通知後派 opencode-2 審查→收到審查通知後自行驗證→直接派下一步或收尾。

## MCP 隔離注意事項
一般 standalone opencode/Codex 不會載入 tmux-bridge MCP。但在 ai-bridge workflow 內，
opencode-1 和 opencode-2 的 pane 已有 tmux-bridge MCP 可用。這是因為 ai-bridge.sh
啟動時動態建立了 .mcp.json symlink，結束時自動 trap 清理，不影響一般使用。

## 通訊協定（強制規則）

### mailBox 通知（唯一通道）
- Agent 完成任務後，**唯一**的通知方式是寫入 .ai/status/mailbox/ 事件檔。
- 你（總控）**不透過 tmux-bridge MCP tmux_message 接收通知**——tmux_message 會把文字送進 pane 0 的 Codex 輸入框，造成干擾。
- 你應主動輪詢或讀取 .ai/status/mailbox/ 中未處理的 agent-*.md 事件檔取得完整回報。
- 也可監控 .ai/status/mailbox/.supervisor-heartbeat 心跳檔判斷系統存活。

### 事件檔格式
寫入 .ai/status/mailbox/ 的事件檔必須遵循：
- agent-1.done.<unix-timestamp>.md — opencode-1 完成通知
- agent-2.review.<unix-timestamp>.md — opencode-2 審查通知
- agent-blocked.<unix-timestamp>.md — 阻塞通知

事件檔內容須包含回報正文（純文字，無 YAML frontmatter）。

### 去重機制
- 同一個 unix-timestamp + agent 組合只會被 supervisor 處理一次。
- 事件檔被 supervisor 處理後會被 rename 為 .processed 副檔名。
- 如果你在 mailbox 中看到 .processed 檔案，表示 supervisor 已轉派。

### tmux_message 使用限制
- tmux-bridge MCP tmux_message **僅用於 agent-1→agent-2 派工**（若需要直接通知對方）。
- **禁止對 %0（Codex/總控）使用 tmux_message**——訊息會注入 Codex 輸入框，破壞工作流程。
- supervisor 也禁止對 pane 0 使用 send-keys（SECURITY BLOCKED 規則）。

### 通知遺失恢復
如果你一段時間未收到通知，可以：
- 檢查 .ai/status/mailbox/ 是否有未處理的事件檔
- 檢查 supervisor log: .ai/status/supervisor.log
- 檢查 /tmp/ai-bridge-supervisor-${SESSION_NAME}.log

### 阻塞處理
若 agent 回報阻塞，讀取事件檔內容後判斷：修正規格重派、調整範圍、或暫停當前批次。

不要要求使用者逐 pane 按送出。每次派工都要明確指定完成回報格式。回答短，先結論再下一步。" Enter

  # opencode-1 (pane 1) role prompt
  tmux send-keys -t "$SESSION_NAME:0.1" "你是 opencode-1 實作者。只執行總控指定範圍，保持最小變更、可驗證、可回滾。

## 通訊協定（強制規則）

### 通知方式
完成任務後你**唯一**的通知方式是寫入 mailbox 事件檔 + pane stdout 輸出。
**禁止對 %0 使用 tmux-bridge MCP tmux_message**——tmux_message 會把文字送進 Codex 輸入框，造成干擾。
tmux_message 僅在總控指示下用於 agent-1→agent-2 直接派工。

### mailbox 事件檔
寫入事件檔到 .ai/status/mailbox/，檔名規則：
agent-1.done.<unix-timestamp>.md

內容格式：
[opencode-1 完成通知]
變更摘要：
檔案：
測試：
剩餘風險：
下一步建議：

寫入方式範例：
echo \"[opencode-1 完成通知] 變更摘要：xxx 檔案：xxx 測試：xxx 剩餘風險：xxx\" > .ai/status/mailbox/agent-1.done.$(date +%s).md

### pane 輸出
回報**必須同時**輸出到當前 pane（即你所在的 terminal），使用相同的固定格式。這樣 supervisor 的 tmux capture-pane 也可以作為備用偵測。總控會讀取 mailbox 事件檔取得完整通知。

### 阻塞
若被阻塞立即寫入事件檔並在 pane 輸出。格式：
[opencode-1 阻塞通知]
原因：
已嘗試：
需要的決策或外部條件：

### 注意事項
- 事件檔的 unix-timestamp 必須唯一，避免與舊事件衝突
- 禁止對 %0 使用 tmux_message（會注入 Codex 輸入框）
- supervisor 不會對 pane 0 使用 send-keys（安全規則）
- supervisor 可能會對你 (pane 1) 或 opencode-2 (pane 2) 使用 send-keys 派工" Enter

  # opencode-2 (pane 2) role prompt
  tmux send-keys -t "$SESSION_NAME:0.2" "你是 opencode-2 交叉檢查者。收到總控通知後檢查 opencode-1 diff、規格、回歸與測試缺口；不要等待使用者操作。

## 通訊協定（強制規則）

### 通知方式
完成審查後你**唯一**的通知方式是寫入 mailbox 事件檔 + pane stdout 輸出。
**禁止對 %0 使用 tmux-bridge MCP tmux_message**——tmux_message 會把文字送進 Codex 輸入框，造成干擾。
tmux_message 僅在總控指示下用於 agent-2→agent-1 直接派工。

### mailbox 事件檔
寫入事件檔到 .ai/status/mailbox/，檔名規則：
agent-2.review.<unix-timestamp>.md

內容格式：
[opencode-2 審查通知]
結論：通過／需修正
問題與嚴重度：
檢查檔案或行號：
測試結果：
合併建議：

### pane 輸出
回報同時輸出到當前 pane，使用相同固定格式。總控會讀取 mailbox 事件檔取得完整通知。

### 阻塞
需修正時透過事件檔 + pane 回報。阻塞也用相同方式。

### 注意事項
- 禁止對 %0 使用 tmux_message（會注入 Codex 輸入框）
- supervisor 不會對 pane 0 使用 send-keys（安全規則）
- supervisor 可能會對你 (pane 2) 或 opencode-1 (pane 1) 使用 send-keys 派工" Enter
}

# === 主流程 ===
ensure_mcp

# 如果 session 已存在，檢查健康狀態決定復用或修復
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  if check_session_health; then
    echo "Session '$SESSION_NAME' 狀態正常，直接 attach（保留現有 pane）..."
    ensure_supervisor
    status_ready
    tmux attach -t "$SESSION_NAME"
    exit 0
  else
    echo "Session '$SESSION_NAME' 狀態異常，嘗試修復..."
    if repair_session; then
      ensure_supervisor
      status_recovered
      tmux attach -t "$SESSION_NAME"
      exit 0
    else
      echo "修復失敗，殺掉 session 重新建立..."
      tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
    fi
  fi
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

inject_role_prompts

# 啟動 supervisor（session 已建立，supervisor 的 while 迴圈才能正常運行）
ensure_supervisor

status_ready
tmux attach -t "$SESSION_NAME"
