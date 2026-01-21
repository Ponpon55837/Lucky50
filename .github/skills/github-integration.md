---
name: github-integration
description: GitHub Copilot 整合與 README 強制維護機制 - 載入自 .opencode/skills/github/
license: MIT
---

# GitHub Copilot 整合技能

## 📍 實作位置

**主要實作**：`../../../.opencode/skills/github/SKILL.md`  
**README 維護**：`../../../.opencode/skills/github/README.md`  
**軟路由機制**：`../../../.opencode/skills/github/soft-routing.md`

## 🎯 觸發關鍵詞

`github`, `copilot`, `skill`, `README`, `整合`, `維護`

## 📋 功能說明

### 🤖 GitHub Copilot 自動載入機制

- 支援的環境檢查
- 智慧技能選擇
- Cross-Platform 支援

### 📋 README.md 強制維護機制

- 🔥 四步驟執行流程
- 立即檢查 README 影響
- 強制文檔同步更新
- 完整驗證機制

### ⚡ 軟路由決策樹

- 智慧載入邏輯
- 情境感知載入
- 效能最佳化策略

### 🔄 Cross-Platform 支援

- GitHub Copilot CLI
- VS Code Insiders Agent Mode
- Copilot Coding Agent
- Visual Studio Code Stable

## 🔧 強制維護流程

### 1️⃣ 立即檢查 README 影響

- 專案根目錄 README.md
- `.opencode/skills/README.md`
- 各模組 README 檔案

### 2️⃣ 立即更新對應區段

- 變更類型映射
- 更新要求說明

### 3️⃣ 完整驗證更新內容

- 格式驗證
- 連結檢查
- 內容正確性

### 4️⃣ 提交包含 README 更新的 commit

- 絕不單獨提交 README
- 與程式碼變更同時提交

## 📊 自動化檢查機制

### Git Hooks 整合

- Pre-commit 檢查
- CI/CD 自動化驗證
- 持續整合支援

---

**這個技能確保所有文檔變更都與程式碼同步，維護專案的文檔完整性。**
