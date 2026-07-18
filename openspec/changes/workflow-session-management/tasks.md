## 1. 核心腳本實作

- [x] 1.1 重寫 `scripts/ai-bridge.sh`：支援 `--session <name>` 參數（預設 ai-bridge），含 reuse/recovery 邏輯（檢查 3 pane、role prompts、supervisor PID/heartbeat），輸出 READY/RECOVERED/FAILED
- [x] 1.2 建立 `scripts/ai-workflow-status.sh`：顯示 session、三 pane、supervisor、heartbeat、mailbox 狀態，正確退出碼
- [x] 1.3 建立 `scripts/ai-workflow-switch.sh`：接受 session 名稱，整 session attach，非互動環境提示指令
- [x] 1.4 建立 `scripts/ai-workflow-kill.sh`：互動選單（無參數時列出手動可中止 sessions、編號選取、二次確認）、指定名稱時 dry-run/--force、安全停止 supervisor + 清理 runtime + kill-session

## 2. 整合

- [x] 2.1 更新 `package.json` 新增 `ai-workflow:status`、`ai-workflow:switch`、`ai-workflow:kill`
- [x] 2.2 更新 `AI_MULTI_AGENT_WORKFLOW.md` 文檔
- [x] 2.3 更新 `validate-communication.sh` 新增驗證

## 3. 驗證

- [x] 3.1 `bash -n` 檢查所有腳本
- [x] 3.2 lint + typecheck 確認無破壞
