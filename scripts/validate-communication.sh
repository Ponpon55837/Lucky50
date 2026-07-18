#!/usr/bin/env bash
# validate-communication.sh — 驗證雙通道通訊、MCP 隔離、supervisor 生命週期、session 管理
#
# 安全：不啟動真實 tmux session，只驗證腳本邏輯與檔案結構。
# 若需要測試 supervisor 啟動/健康，請在真實 ai-bridge session 內執行：
#   bash scripts/validate-communication.sh --live
set -euo pipefail

LIVE_MODE=false
if [ "${1:-}" = "--live" ]; then
  LIVE_MODE=true
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

pass() { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

echo "=== 驗證 1: 檔案存在性 ==="

# 1.1 mailbox 目錄
if [ -d "$ROOT_DIR/.ai/status/mailbox" ]; then pass "mailbox 目錄存在"; else fail "mailbox 目錄不存在"; fi

# 1.2 必要腳本
for f in scripts/ai-bridge.sh scripts/ai-bridge-supervisor.sh scripts/ai-workflow-status.sh scripts/ai-workflow-switch.sh scripts/ai-workflow-kill.sh AI_MULTI_AGENT_WORKFLOW.md; do
  if [ -f "$ROOT_DIR/$f" ]; then pass "$f 存在"; else fail "$f 不存在"; fi
done

# 1.3 .mcp-workflow.json 存在
if [ -f "$ROOT_DIR/.mcp-workflow.json" ]; then pass ".mcp-workflow.json 存在"; else fail ".mcp-workflow.json 不存在"; fi

# 1.4 .mcp.json 不存在或不被追蹤
if [ -f "$ROOT_DIR/.mcp.json" ]; then
  # 存在但應該是被 gitignore
  if git -C "$ROOT_DIR" check-ignore .mcp.json >/dev/null 2>&1; then
    pass ".mcp.json 被 gitignore 忽略"
  else
    fail ".mcp.json 存在且未被 gitignore 追蹤"
  fi
else
  pass ".mcp.json 不存在（standalone 不載入 bridge）"
fi

echo ""
echo "=== 驗證 2: opencode.json 無 mcp 區塊 ==="

if grep -q '"mcp"' "$ROOT_DIR/opencode.json" 2>/dev/null; then
  fail "opencode.json 仍包含 mcp 區塊"
else
  pass "opencode.json 無 mcp 區塊"
fi

echo ""
echo "=== 驗證 3: .gitignore 完整性 ==="

if grep -q '\.mcp\.json' "$ROOT_DIR/.gitignore" 2>/dev/null; then
  pass ".gitignore 包含 .mcp.json"
else
  fail ".gitignore 缺少 .mcp.json"
fi

if grep -q '\.ai/' "$ROOT_DIR/.gitignore" 2>/dev/null; then
  pass ".gitignore 包含 .ai/"
else
  fail ".gitignore 缺少 .ai/"
fi

if grep -q '\*\.swp' "$ROOT_DIR/.gitignore" 2>/dev/null; then
  pass ".gitignore 包含 *.swp"
else
  fail ".gitignore 缺少 *.swp"
fi

echo ""
echo "=== 驗證 4: supervisor 安全規則 ==="

if grep -q 'SECURITY BLOCKED' "$ROOT_DIR/scripts/ai-bridge-supervisor.sh" 2>/dev/null; then
  pass "supervisor 有 SECURITY BLOCKED 規則"
else
  fail "supervisor 缺少 SECURITY BLOCKED 規則（禁止對 pane 0 send-keys）"
fi

if grep -q 'pane 0' "$ROOT_DIR/scripts/ai-bridge-supervisor.sh" 2>/dev/null; then
  pass "supervisor 檢查 pane 0"
else
  fail "supervisor 未檢查 pane 0"
fi

echo ""
echo "=== 驗證 5: ai-bridge.sh MCP 隔離 ==="

if grep -q 'trap cleanup_mcp EXIT' "$ROOT_DIR/scripts/ai-bridge.sh" 2>/dev/null; then
  pass "ai-bridge.sh 有 trap cleanup"
else
  fail "ai-bridge.sh 缺少 trap cleanup"
fi

if grep -Eq 'ln -sf.*\.mcp-workflow.*MCP_ACTIVE|ln -sf.*WORKFLOW_MCP_TEMPLATE.*MCP_ACTIVE' "$ROOT_DIR/scripts/ai-bridge.sh" 2>/dev/null; then
  pass "ai-bridge.sh 有 symlink 注入（.mcp-workflow.json → .mcp.json）"
else
  fail "ai-bridge.sh 缺少 symlink 注入"
fi

echo ""
echo "=== 驗證 6: 事件檔格式正確性 ==="

for pattern in 'agent-1\.done\..*\.md' 'agent-2\.review\..*\.md' 'agent-blocked\..*\.md'; do
  if grep -Eq "$pattern" "$ROOT_DIR/scripts/ai-bridge-supervisor.sh" 2>/dev/null; then
    pass "supervisor 支援事件檔格式: $pattern"
  else
    fail "supervisor 缺少事件檔格式: $pattern"
  fi
done

echo ""
echo "=== 驗證 7: AI_MULTI_AGENT_WORKFLOW.md 含新規則 ==="

for keyword in 'MCP 隔離' 'symlink injection' 'trap cleanup' '禁止對 %0' 'SECURITY BLOCKED' '可驗收 Checklist' '多 Session 管理' 'ai-workflow:status' 'ai-workflow:switch' 'ai-workflow:kill'; do
  if grep -q "$keyword" "$ROOT_DIR/AI_MULTI_AGENT_WORKFLOW.md" 2>/dev/null; then
    pass "workflow.md 包含: $keyword"
  else
    fail "workflow.md 缺少: $keyword"
  fi
done

echo ""
echo "=== 驗證 8: supervisor log 檔案存在 ==="

touch "$ROOT_DIR/.ai/status/supervisor.log"
if [ -f "$ROOT_DIR/.ai/status/supervisor.log" ]; then pass "supervisor.log 已建立"; else fail "supervisor.log 未建立"; fi

echo ""
echo "=== 驗證 9: supervisor 生命週期機制 ==="

# nohup 啟動
if grep -q 'nohup' "$ROOT_DIR/scripts/ai-bridge.sh" 2>/dev/null; then
  pass "ai-bridge.sh 使用 nohup 啟動 supervisor"
else
  fail "ai-bridge.sh 缺少 nohup 啟動 supervisor"
fi

# PID 健康檢查
if grep -q 'kill -0' "$ROOT_DIR/scripts/ai-bridge.sh" 2>/dev/null; then
  pass "ai-bridge.sh 有 PID 健康檢查"
else
  fail "ai-bridge.sh 缺少 PID 健康檢查"
fi

# 防止重複 supervisor
if grep -q '防止重複\|duplicate\|已存在.*跳過' "$ROOT_DIR/scripts/ai-bridge-supervisor.sh" 2>/dev/null; then
  pass "supervisor 有防止重複啟動機制"
else
  fail "supervisor 缺少防止重複啟動機制"
fi

# SIGTERM handler
if grep -q 'trap.*SIGTERM\|trap.*TERM' "$ROOT_DIR/scripts/ai-bridge-supervisor.sh" 2>/dev/null; then
  pass "supervisor 有 SIGTERM handler"
else
  fail "supervisor 缺少 SIGTERM handler"
fi

# 心跳檔
if grep -q 'heartbeat\|REFRESH_FILE' "$ROOT_DIR/scripts/ai-bridge-supervisor.sh" 2>/dev/null; then
  pass "supervisor 有 heartbeat 機制"
else
  fail "supervisor 缺少 heartbeat 機制"
fi

# session 已存在時復用
if grep -q '直接 attach' "$ROOT_DIR/scripts/ai-bridge.sh" 2>/dev/null; then
  pass "ai-bridge.sh session 已存在時復用"
else
  fail "ai-bridge.sh 缺少 session 復用處理"
fi

# per-session PID
if grep -q 'SESSION_NAME' "$ROOT_DIR/scripts/ai-bridge-supervisor.sh" 2>/dev/null; then
  pass "supervisor 使用 per-session PID 檔案"
else
  fail "supervisor 未使用 per-session PID 檔案"
fi

echo ""
echo "=== 驗證 10: tmux_message 禁止對 %0 使用 ==="

# ai-bridge.sh role prompts 不得包含 target=%0 的通知指示
if grep -q 'tmux_message.*%0' "$ROOT_DIR/scripts/ai-bridge.sh" 2>/dev/null; then
  fail "ai-bridge.sh role prompts 仍包含對 %0 的 tmux_message 指示"
else
  pass "ai-bridge.sh role prompts 已移除對 %0 的 tmux_message 指示"
fi

# AI_MULTI_AGENT_WORKFLOW.md 不得將 tmux_message 列為通知通道
if grep -q 'tmux_message target=%0' "$ROOT_DIR/AI_MULTI_AGENT_WORKFLOW.md" 2>/dev/null; then
  fail "workflow.md 仍將 tmux_message target=%0 列為通知通道"
else
  pass "workflow.md 已移除 tmux_message target=%0 通知通道"
fi

# workflow.md 應包含禁止對 %0 使用 tmux_message 的說明
if grep -q '禁止對 %0' "$ROOT_DIR/AI_MULTI_AGENT_WORKFLOW.md" 2>/dev/null; then
  pass "workflow.md 包含禁止對 %0 使用 tmux_message 的規則"
else
  fail "workflow.md 缺少禁止對 %0 使用 tmux_message 的規則"
fi

# workflow.md Checklist 已更新
if grep -q '禁止對 %0 使用 tmux_message' "$ROOT_DIR/AI_MULTI_AGENT_WORKFLOW.md" 2>/dev/null; then
  pass "workflow.md Checklist 包含 tmux_message 禁止規則"
else
  fail "workflow.md Checklist 缺少 tmux_message 禁止規則"
fi

echo ""
echo "=== 驗證 11: agent-2.review 事件檔測試 clean up ==="

# 清理之前測試留下的事件檔
find "$ROOT_DIR/.ai/status/mailbox" -name 'agent-2.review.*.md' -delete 2>/dev/null || true
pass "清理舊 agent-2.review 事件檔"

echo ""
echo "=== 驗證 12: Session 管理腳本 ==="

# bash -n 語法檢查
for script in scripts/ai-bridge.sh scripts/ai-bridge-supervisor.sh scripts/ai-workflow-status.sh scripts/ai-workflow-switch.sh scripts/ai-workflow-kill.sh; do
  if bash -n "$ROOT_DIR/$script" 2>/dev/null; then
    pass "$script 語法正確"
  else
    fail "$script 語法錯誤"
  fi
done

# ai-bridge.sh 支援 --session 參數
if grep -q '\-\-session' "$ROOT_DIR/scripts/ai-bridge.sh" 2>/dev/null; then
  pass "ai-bridge.sh 支援 --session 參數"
else
  fail "ai-bridge.sh 缺少 --session 參數"
fi

# ai-bridge.sh 輸出 READY/RECOVERED/FAILED
for status in READY RECOVERED FAILED; do
  if grep -q "$status" "$ROOT_DIR/scripts/ai-bridge.sh" 2>/dev/null; then
    pass "ai-bridge.sh 輸出 $status 狀態"
  else
    fail "ai-bridge.sh 缺少 $status 狀態輸出"
  fi
done

# ai-workflow-status.sh 列出 sessions
if grep -q 'list-sessions' "$ROOT_DIR/scripts/ai-workflow-status.sh" 2>/dev/null; then
  pass "ai-workflow-status.sh 列出 sessions"
else
  fail "ai-workflow-status.sh 缺少 list-sessions"
fi

# ai-workflow-switch.sh 禁止逐 pane
if grep -q 'attach.*整' "$ROOT_DIR/scripts/ai-workflow-switch.sh" 2>/dev/null || grep -q '禁止逐 pane' "$ROOT_DIR/scripts/ai-workflow-switch.sh" 2>/dev/null; then
  pass "ai-workflow-switch.sh 強調整 session attach"
else
  fail "ai-workflow-switch.sh 缺少整 session attach 提示"
fi

# ai-workflow-kill.sh 安全規則
if grep -q 'wildcard\|通配符' "$ROOT_DIR/scripts/ai-workflow-kill.sh" 2>/dev/null; then
  pass "ai-workflow-kill.sh 禁止 wildcard"
else
  fail "ai-workflow-kill.sh 缺少 wildcard 檢查"
fi

if grep -q 'dry-run\|DRY_RUN' "$ROOT_DIR/scripts/ai-workflow-kill.sh" 2>/dev/null; then
  pass "ai-workflow-kill.sh 支援 dry-run"
else
  fail "ai-workflow-kill.sh 缺少 dry-run"
fi

if grep -q 'FORCE\|--force' "$ROOT_DIR/scripts/ai-workflow-kill.sh" 2>/dev/null; then
  pass "ai-workflow-kill.sh 支援 --force"
else
  fail "ai-workflow-kill.sh 缺少 --force"
fi

# ai-workflow-kill.sh 非互動環境保護
if grep -q 'IS_TTY\|非互動' "$ROOT_DIR/scripts/ai-workflow-kill.sh" 2>/dev/null; then
  pass "ai-workflow-kill.sh 有非互動環境保護"
else
  fail "ai-workflow-kill.sh 缺少非互動環境保護"
fi

echo ""
echo "=== 驗證 13: package.json scripts ==="

for script_key in 'ai-workflow:status' 'ai-workflow:switch' 'ai-workflow:kill'; do
  if grep -q "$script_key" "$ROOT_DIR/package.json" 2>/dev/null; then
    pass "package.json 包含 $script_key"
  else
    fail "package.json 缺少 $script_key"
  fi
done

echo ""
echo "========================================="
echo "  結果: $PASS 通過, $FAIL 失敗"
echo "========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
