# Git Hooks

本目錄包含 Lucky50 專案的 Git hooks，用於強制執行專案規範。

## 📦 可用的 Hooks

### `pre-commit`

**功能**：防止在 `main` 分支直接提交代碼

**規則**：

- 🚫 如果在 `main` 分支，阻止提交並顯示錯誤訊息
- ✅ 如果在功能分支，允許正常提交

**錯誤訊息範例**：

```
🚫 =============================================
🚫  錯誤：禁止在 main 分支直接提交代碼！
🚫 =============================================

根據專案規範，所有代碼修改必須在功能分支上進行。

請執行以下步驟：

  1. 建立新的功能分支：
     git checkout -b <type>/<developer-name>/<feature-description>

  範例：
     git checkout -b feat/lip/add-new-feature
     git checkout -b fix/lip/fix-bug

  2. 重新提交：
     git add .
     git commit -m "你的提交訊息"
```

---

## 🚀 安裝方式

### 方法 1：執行安裝腳本（推薦）

```bash
# 在專案根目錄執行
./.githooks/install.sh
```

### 方法 2：手動複製

```bash
# 複製 pre-commit hook
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### 方法 3：配置 Git hooks 路徑（全域生效）

```bash
# 設定 Git 使用 .githooks 目錄
git config core.hooksPath .githooks
```

---

## 🧪 測試 Hooks

### 測試 pre-commit

```bash
# 1. 切換到 main 分支
git checkout main

# 2. 嘗試提交（應該會被阻止）
git commit --allow-empty -m "test"

# 3. 建立功能分支
git checkout -b feat/lip/test-hook

# 4. 再次嘗試提交（應該會成功）
git commit --allow-empty -m "test"
```

---

## ⚠️ 注意事項

### 跳過 Hook（不建議）

如果確實需要跳過 hook（例如緊急修復），可以使用：

```bash
git commit --no-verify -m "緊急修復"
```

**⚠️ 警告**：跳過 hook 違反專案規範，只在極特殊情況下使用！

### Hook 不生效？

如果 hook 沒有生效，檢查：

1. **是否已安裝**：

   ```bash
   ls -l .git/hooks/pre-commit
   ```

2. **是否有執行權限**：

   ```bash
   chmod +x .git/hooks/pre-commit
   ```

3. **是否使用正確的 Git 版本**：
   ```bash
   git --version  # 建議 2.9.0 以上
   ```

---

## 🔄 更新 Hooks

當 `.githooks/` 目錄中的 hooks 更新時：

```bash
# 重新執行安裝腳本
./.githooks/install.sh
```

---

## 📚 相關文檔

- [AGENTS.md](../AGENTS.md) - 專案規則
- [.opencode/skills/git-workflow/SKILL.md](../.opencode/skills/git-workflow/SKILL.md) - Git 工作流程規範
- [Git Hooks 官方文檔](https://git-scm.com/docs/githooks)

---

## 🤝 團隊協作

### 新成員加入專案

新成員 clone 專案後，需要執行：

```bash
# 安裝 Git hooks
./.githooks/install.sh
```

### CI/CD 整合

這些 hooks 只在本地生效。如需在 CI/CD 中強制執行，需要：

1. **GitHub Branch Protection**：在 GitHub 設定 main 分支保護
2. **Pre-receive Hook**：在 Git 伺服器端設定 hook（如果是自架）

---

## 🛡️ 多層防護

Lucky50 專案使用多層防護機制：

| 層級 | 機制                  | 類型     | 阻止時機      |
| ---- | --------------------- | -------- | ------------- |
| 1    | **AGENTS.md**         | AI 規則  | AI 操作前     |
| 2    | **Skills**            | AI 規範  | AI 操作前     |
| 3    | **Git Hooks**         | 本地強制 | Git 提交時    |
| 4    | **Branch Protection** | 遠端強制 | Push 到遠端時 |

建議啟用所有層級以獲得最佳保護。

---

**最後更新**：2026-01-20
