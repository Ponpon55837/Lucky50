# 多代理開發協作流程

> 可移植至其他專案與 HackMD 的最小作業規範。

## 角色

| 角色            | 職責                                          |
| --------------- | --------------------------------------------- |
| 總控／驗證者    | 接收需求、拆解任務、派工、驗證、決定下一步    |
| Agent 1／實作者 | 只修改指定範圍，完成實作與測試                |
| Agent 2／審查者 | 檢查 diff、規格、回歸、測試缺口；原則上不改檔 |

## 固定迴圈

```text
需求 → 總控拆解與定義驗收條件 → Agent 1 實作 → 雙通道通知
      → Agent 2 交叉檢查 → 雙通道回報 → 總控驗證
      → 通過：派下一批／收尾；不通過：退回 Agent 1 修正
```

總控必須主動推進流程，不要求使用者逐一操作 terminal 或 pane。

## 通訊協定（強制規則）

### 概觀

Agent 完成任務後，使用以下兩個通道通知：

| 通道            | 機制                                     | 用途                |
| --------------- | ---------------------------------------- | ------------------- |
| A — Event File  | 寫入 `.ai/status/mailbox/`               | 唯一通知通道        |
| B — Pane stdout | 輸出到當前 pane terminal（固定格式標記） | 備用偵測 + 即時可讀 |

**重要：禁止對 %0（Codex pane）使用 tmux-bridge MCP tmux_message** — tmux_message 會把文字送進 Codex 的輸入框，
造成訊息注入干擾。所有對總控的通知必須透過 mailbox 事件檔完成。tmux_message 僅在總控明確指示下用於 agent↔agent 直接派工。

### 事件檔格式

寫入 `.ai/status/mailbox/` 的事件檔：

**檔名規則：**

| 事件類型     | 檔名格式                             |
| ------------ | ------------------------------------ |
| Agent 1 完成 | `agent-1.done.<unix-timestamp>.md`   |
| Agent 2 審查 | `agent-2.review.<unix-timestamp>.md` |
| 阻塞通知     | `agent-blocked.<unix-timestamp>.md`  |

**內容格式：** 純文字，無 YAML frontmatter，直接包含回報正文。

**注意事項：**

- `unix-timestamp` 必須使用 `$(date +%s)`，確保唯一性
- 事件檔被 supervisor 處理後會被 rename 為 `.processed` 副檔名
- supervisor 每 3 秒掃描一次 mailbox 目錄
- 24 小時前的 `.processed` 檔案會自動清理

### 標準回報格式

### Agent 1

```text
[opencode-1 完成通知]
變更摘要：
檔案：
測試：
剩餘風險：
下一步建議：
```

### Agent 2

```text
[opencode-2 審查通知]
結論：通過／需修正
問題與嚴重度：
檢查檔案或行號：
測試結果：
合併建議：
```

### 阻塞

```text
[opencode-1 阻塞通知] 或 [opencode-2 阻塞通知]
原因：
已嘗試：
需要的決策或外部條件：
```

### 去重機制

1. supervisor 掃描 mailbox 中所有 `agent-*.md` 檔案
2. 符合檔名規則的事件檔被處理後 → rename 為 `*.processed`
3. supervisor 不再讀取 `.processed` 檔案
4. 若同一 timestamp 的 agent 事件重複寫入，後者覆蓋前者（因檔名相同）
5. Agent 應使用 `$(date +%s)` 確保每個事件檔的 timestamp 不同

### 安全規則

1. **supervisor 永遠不對 pane 0（總控/Codex）使用 `tmux send-keys`**
2. supervisor **可以**對 pane 1（opencode-1）和 pane 2（opencode-2）使用 `send-keys` 派工
3. 違反規則 1 時，supervisor 會記錄 `[SECURITY BLOCKED]` 到 log 並拒絕執行
4. **禁止任何 agent 對 %0 使用 tmux-bridge MCP tmux_message** — 訊息會注入 Codex 輸入框，破壞工作流程
5. tmux_message 僅在總控明確指示下用於 agent↔agent 直接派工（如 agent-1→agent-2）

### 通知遺失恢復

若總控一段時間未收到通知：

1. 檢查 `.ai/status/mailbox/` 是否有未處理的 `agent-*.md` 事件檔
2. 檢查 supervisor log：`.ai/status/supervisor.log`
3. 檢查 supervisor 背景行程 log：`/tmp/ai-bridge-supervisor.log`
4. 確認 tmux session `ai-bridge` 仍存在：`tmux has-session -t ai-bridge && echo ok`
5. 檢查 `tmux list-panes -t ai-bridge:0` 確認三個 pane 仍在

### 重複通知排查

若 supervisor 重複派工：

1. 檢查 `mailbox/` 是否有未處理的事件檔（檔名不含 `.processed`）
2. 檢查 `supervisor.log` 中同一事件是否被處理多次
3. 檢查是否有多個 supervisor 行程在背景執行：`cat /tmp/ai-bridge-supervisor.pid`

## Supervisor 生命週期管理

### 啟動

`ai-bridge.sh` 使用 `nohup` 啟動 supervisor，不受父 shell SIGHUP 影響：

```bash
nohup scripts/ai-bridge-supervisor.sh ai-bridge /path/to/project > /tmp/ai-bridge-supervisor.log 2>&1 &
```

### 健康檢查

- **Heartbeat 檔**：`.ai/status/mailbox/.supervisor-heartbeat` — 每 3 秒寫入一次 Unix timestamp
- **PID 檔**：`/tmp/ai-bridge-supervisor-<session>.pid` — supervisor 啟動時寫入，ai-bridge.sh 透過 `kill -0` 驗證存活
- 驗證指令：`cat /tmp/ai-bridge-supervisor-ai-bridge.pid && kill -0 $(cat /tmp/ai-bridge-supervisor-ai-bridge.pid) && echo alive`

### 防止重複

- supervisor 在啟動時檢查 PID 檔，若已有存活行程則 `exit 0`
- ai-bridge.sh 在啟動 supervisor 前先 `kill -0` 檢查，存活則跳過

### 優雅退出

- supervisor 註冊 `trap SIGTERM/SIGINT` 處理器，收到訊號後將 `SHUTDOWN_REQUESTED=true`，在下次迴圈判斷後退出
- 當 `ai-bridge` tmux session 不存在時，supervisor 正常結束主迴圈

### 重啟流程

當 supervisor 需要重新啟動（如升級腳本）：

1. 終止舊行程：`kill $(cat /tmp/ai-bridge-supervisor-<session>.pid)`
2. 清理 PID 檔：`rm -f /tmp/ai-bridge-supervisor-<session>.pid`
3. 重新 attach session 或執行 `pnpm ai-workflow` 重新啟動：

```
# 如果有 session，attach 即可自動確保 supervisor
tmux attach -t ai-bridge

# 或直接重啟 supervisor
rm -f /tmp/ai-bridge-supervisor-ai-bridge.pid
nohup bash scripts/ai-bridge-supervisor.sh ai-bridge /path/to/project > /tmp/ai-bridge-supervisor-ai-bridge.log 2>&1 &
```

### 故障排查

| 症狀                | 檢查點                                           | 解決方式                           |
| ------------------- | ------------------------------------------------ | ---------------------------------- |
| supervisor 無回應   | `cat /tmp/ai-bridge-supervisor-<session>.pid`    | 若 pid 不存在，啟動新 supervisor   |
| supervisor 啟動失敗 | `cat /tmp/ai-bridge-supervisor-<session>.log`    | 確認 tmux session 存在             |
| 事件檔未被處理      | `ls .ai/status/mailbox/*.md`                     | 確認 supervisor 存活、檔名格式正確 |
| 重複派工            | `cat .ai/status/supervisor.log \| grep dispatch` | 停掉多餘 supervisor 行程           |

### 阻塞恢復

當 agent 回報阻塞：

1. 總控讀取事件檔內容了解阻塞原因
2. 判斷需調整的方向：修正規格重派、縮小範圍、或暫停當前批次
3. 總控透過 `tmux-bridge MCP tmux_message` 或 supervisor 的 send-keys 給出指示

## 派工規則

每次派工都要寫清楚：

- 目標與非目標
- 指定檔案或範圍
- 驗收條件與測試指令
- 完成或阻塞時的回報要求（mailbox event-file + pane stdout；禁止對 %0 使用 tmux_message）

Agent 不得擴大範圍；發現阻塞時立即回報，不可靜默停留。

## 總控驗證清單

- `git diff --check`
- 相關測試與全量測試
- TypeScript／build／lint（依專案工具鏈）
- 確認變更只在需求範圍
- UI 變更檢查 light/dark mode、響應式與無障礙
- 確認沒有未回報的風險或未完成任務
- ✅ Agent 使用 event-file + pane 回報（禁止對 %0 使用 tmux_message）
- ✅ supervisor log 無 SECURITY BLOCKED 記錄
- ✅ mailbox 中無殘留未處理的事件檔（所有事件已被 `.processed`）

## MCP 隔離機制

### 問題

`.mcp.json` 和 `opencode.json` 的 `mcp` 區塊會被 OpenCode/Codex 自動載入。
若在 repo 內保留 tmux-bridge MCP 設定，**每次** standalone opencode/Codex 啟動都會啟用 tmux-bridge，
即使不在 ai-bridge workflow 中。

### 解法

採用 **symlink injection + trap cleanup** 實作 workflow-specific MCP 載入：

| 情境                      | .mcp.json 狀態                                   | tmux-bridge MCP |
| ------------------------- | ------------------------------------------------ | --------------- |
| standalone opencode/Codex | 不存在                                           | ❌ 不載入       |
| `pnpm ai-workflow`        | ai-bridge.sh 建立 symlink → `.mcp-workflow.json` | ✅ 載入         |
| workflow 結束             | trap EXIT 刪除 symlink                           | ❌ 恢復         |

### 檔案

| 檔案                 | 用途                                                    |
| -------------------- | ------------------------------------------------------- |
| `.mcp-workflow.json` | 實際的 MCP 設定（已提交到 git）                         |
| `.mcp.json`          | 動態 symlink，由 ai-bridge.sh 管理，已加入 `.gitignore` |
| `opencode.json`      | 已移除 `mcp` 區塊，standalone 不會載入 bridge           |

### 安全

- `.mcp.json` 不列入 git 追蹤（`.gitignore` 中）
- ai-bridge.sh 使用 `trap cleanup_mcp EXIT` 確保結束時清除 symlink
- 不存在 race condition：bash 單線程執行

## 多 Session 管理

### Session 命名

每個 workflow 任務可有獨立的 tmux session 名稱。預設名稱為 `ai-bridge`。

```bash
# 預設 session
pnpm ai-workflow

# 指定 session 名稱
pnpm ai-workflow -- my-feature-task

# 或使用 --session 參數
pnpm ai-workflow -- --session another-task
```

每個 session 擁有獨立的：

- 三個 pane（codex、opencode-1、opencode-2）
- Supervisor 行程（PID 檔案：`/tmp/ai-bridge-supervisor-<session>.pid`）
- Heartbeat 檔案（共用 `.ai/status/mailbox/.supervisor-heartbeat`）
- Nohup log（`/tmp/ai-bridge-supervisor-<session>.log`）

### 啟動時健康檢查與復用

`ai-bridge.sh` 啟動時會自動檢查 session 狀態：

| 情況                       | 處理方式                             | 輸出        |
| -------------------------- | ------------------------------------ | ----------- |
| Session 不存在             | 建立新 session + 3 pane + supervisor | `READY`     |
| Session 存在且 3 pane 正常 | 直接 attach（復用）                  | `READY`     |
| Session 存在但 pane 異常   | 修復/重建                            | `RECOVERED` |
| 無法恢復                   | 殺掉重建新 session                   | `RECOVERED` |

### 快速切換

使用 `ai-workflow-switch.sh` 在終端間切換 workflow session：

```bash
# 切換到指定 session（整 session attach）
pnpm ai-workflow:switch -- my-feature-task
```

**注意：** 只能 attach 整個 session，禁止逐 pane 操作。非互動環境（如 CI）會輸出 `tmux attach` 指令而不卡住。

### 查看狀態

```bash
# 顯示所有 workflow sessions 狀態
pnpm ai-workflow:status

# 顯示指定 session
pnpm ai-workflow:status -- my-feature-task
```

輸出包含：pane 狀態、supervisor PID/heartbeat、mailbox 待處理/已處理事件數。

### 安全中止

```bash
# 互動選單：列出 sessions → 選取 → 確認
pnpm ai-workflow:kill

# 指定 session（預設 dry-run）
pnpm ai-workflow:kill -- my-feature-task

# 確認中止
pnpm ai-workflow:kill -- my-feature-task --force

# 只預覽不執行
pnpm ai-workflow:kill -- my-feature-task --dry-run
```

安全規則：

- 禁止 wildcard、通配符、批次刪除
- 無參數時列出可中止 sessions，輸入編號選取，二次 Enter 確認
- 非互動環境 + 無 --force → 只 dry-run
- 中止時只清理指定 session 的 supervisor/PID/heartbeat/runtime，不影響其它 session

### 重啟流程

當 supervisor 需要重新啟動：

```bash
# 方法 1：重新 attach session（自動確保 supervisor）
pnpm ai-workflow:switch -- ai-bridge

# 方法 2：重新啟動整個 session
pnpm ai-workflow:kill -- ai-bridge --force
pnpm ai-workflow -- ai-bridge
```

## 啟動範例

```bash
# 專案根目錄
pnpm ai-workflow

# 指定 session
pnpm ai-workflow -- my-task
```

建立三個 pane：總控、Agent 1、Agent 2。啟動提示應明確要求 Agent 1／2 使用 mailbox event-file + pane stdout 回報（**禁止對 %0 使用 tmux_message**），總控透過讀取 mailbox 取得完整通知後自動派發下一步。

## 檔案結構

```
.ai/status/
├── mailbox/
│   ├── agent-1.done.<timestamp>.md         # Agent 1 完成事件
│   ├── agent-1.done.<timestamp>.md.processed # 已處理
│   ├── agent-2.review.<timestamp>.md       # Agent 2 審查事件
│   ├── agent-2.review.<timestamp>.md.processed # 已處理
│   ├── agent-blocked.<timestamp>.md        # 阻塞事件
│   └── agent-blocked.<timestamp>.md.processed # 已處理
└── supervisor.log  # supervisor 事件紀錄
```

## 收尾格式

```text
結論：完成／部分完成／阻塞
變更：
驗證：
未處理項目：
下一步：
```

## 可驗收 Checklist

- [ ] Agent 1 完成後，`.ai/status/mailbox/` 中存在 `agent-1.done.*.md` 事件檔
- [ ] Agent 2 審查完成後，`.ai/status/mailbox/` 中存在 `agent-2.review.*.md` 事件檔
- [ ] supervisor 處理事件後，檔案被 rename 為 `.processed`
- [ ] supervisor.log 無 `SECURITY BLOCKED` 記錄
- [ ] supervisor.log 包含 `dispatch → pane N` 記錄
- [ ] Agent 回報出現在 mailbox event-file + pane stdout（禁止對 %0 使用 tmux_message）
- [ ] 阻塞事件使用 `agent-blocked.*.md` 格式
- [ ] Supervisor 心跳檔存在：`.ai/status/mailbox/.supervisor-heartbeat` （只在 session 活著時存在）
- [ ] `kill -0 $(cat /tmp/ai-bridge-supervisor.pid)` 回傳 alive
- [ ] 重新 attach 已存在的 session 時 supervisor 不被重複啟動
- [ ] 無 SIGHUP 造成的 supervisor 意外終止（使用 nohup 啟動）
