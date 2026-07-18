# Change: Workflow Session 管理改進

## Why

目前 `ai-bridge.sh` 固定使用 `ai-bridge` session 名稱，無法同時管理多個 workflow session。
缺乏 session 狀態查詢、安全切換與安全清理機制。需要：

1. 多 session 支援（可命名）
2. 統一狀態查詢工具
3. 一鍵切換 session
4. 安全清理機制（含互動確認）
5. Supervisor 與 session 名稱綁定

## What Changes

### 修改

- `scripts/ai-bridge.sh` — 支援可指定 session 名稱，每次啟動時檢查 3 pane、role prompts、supervisor PID/heartbeat，正常復用、異常修復重建，輸出 READY/RECOVERED/FAILED

### 新增

- `scripts/ai-workflow-status.sh` — 顯示 session、三 pane、supervisor、heartbeat、mailbox 狀態與退出碼
- `scripts/ai-workflow-switch.sh` — 接受 session 名稱，一次 attach 整個 session；非互動環境提示 attach 指令
- `scripts/ai-workflow-kill.sh` — 安全清理指定 session（含互動選單、dry-run、--force）

### 文件更新

- `AI_MULTI_AGENT_WORKFLOW.md` — 多 session 命名、快速切換、重啟/復用判定、status/switch/kill 使用方式
- `validate-communication.sh` — 驗證新腳本存在性、語法、session health 行為
- `package.json` — 新增 pnpm scripts

## Impact

- 不影響現有應用程式（src/ 不改）
- 不影響現有測試
- Supervisor 需支援 session 名稱參數（已支援）
- 所有腳本需通過 `bash -n` 語法檢查
