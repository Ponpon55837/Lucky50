---
name: agent
description: AI 智慧助理功能說明 - GitHub Copilot、OpenCode Agent 技能整合與使用指南
license: MIT
---

# AI 智慧助理功能說明

本專案整合了 **GitHub Copilot** 和 **OpenCode Agent** 的先進 AI 輔助開發功能，提供智慧化、自動化的程式碼開發與維護支援。

## 🤖 AI Agent 技能架構

### 技能系統概覽

```
.opencode/skills/
├── agent.md              # AI 功能總覽（本檔案）
├── README.md             # Skills 總目錄
├── code-standard/        # 🏗️ 程式碼規範與最佳實踐
├── git-workflow/         # 🔄 Git 工作流程規範
├── vue/                 # 🎨 Vue 3 開發指南
└── github/              # 🚀 GitHub Copilot 整合指南
```

### 技能觸發機制

**GitHub Copilot 自動載入**：根據使用者 prompt 內容智能選擇技能

| 使用者請求類型     | AI 自動載入技能           | 主要功能                    |
| ------------------ | ------------------------- | --------------------------- |
| 「幫我寫個組件」   | `code-standard` + `vue`   | Lucky50 規範 + Vue 開發模式 |
| 「提交這次變更」   | `git-workflow` + `github` | Git 流程 + README 強制維護  |
| 「更新文檔」       | `github/README.md`        | README 強制維護機制         |
| 「重構這個函數」   | `code-standard` + `vue`   | 重構規範 + 最佳實踐         |
| 「建立新的 Store」 | `code-standard`           | Pinia Store 開發規範        |
| 「測試這個組件」   | `vue/testing`             | Vue 測試最佳實踐            |

## 🎯 核心功能特色

### 1. 智慧化程式碼生成

**基於專案規範的程式碼生成**：

- ✅ 自動遵循 Lucky50 技術棧規範
- ✅ 使用繁體中文語境撰寫註解和變數說明
- ✅ 符合 TypeScript 嚴格模式要求
- ✅ 整合 Tailwind CSS 設計規範
- ✅ 遵循 Vue 3 Composition API 最佳實踐

### 2. 強制性品質檢查

**AI 自動執行的檢查項目**：

- 🔴 Git 分支檢查（禁止在 main 分支直接修改）
- 🔴 README.md 強制維護機制
- 🔴 繁體中文語境檢查
- 🔴 技術棧規範檢查
- 🔴 程式碼品質檢查

### 3. 軟路由載入機制

**智慧技能載入邏輯**：

```
使用者 Prompt
    ↓
AI 語意分析
    ↓
識別觸發關鍵詞
    ↓
載入對應技能組合
    ↓
執行專案規範化開發
```

## 📋 技能詳細說明

### code-standard - 程式碼規範技能

**觸發關鍵詞**：

- `code-standard`、`coding`、`development`
- `規範`、`開發`、`最佳實踐`、`程式碼品質`
- `Vue 3`、`TypeScript`、`Pinia`、`Three.js`、`Chart.js`

**核心功能**：

- 🏗️ Vue 3 組件開發規範
- 🗂️ TypeScript 型別定義標準
- 🎨 Tailwind CSS 設計規範
- 🔄 Pinia 狀態管理規範
- 🌐 API 服務層開發規範
- 🎭 Three.js 3D 開發規範
- 📊 Chart.js 圖表開發規範
- ⚠️ 錯誤處理規範
- 🧪 開發測試流程
- 📝 Git Commit 規範
- 🚫 禁止事項清單

### git-workflow - Git 工作流程技能

**觸發關鍵詞**：

- `git`、`commit`、`branch`、`pr`
- `工作流程`、`分支管理`、`提交`

**核心功能**：

- 🔄 分支命名規範（`<type>/<developer-name>/<feature-description>`）
- 📝 Git 提交訊息規範（繁體中文優先）
- 🌿 Git 工作流程最佳實踐
- 🚫 禁止直接在 main 分支修改
- 🔍 Code Review 檢查清單

### vue - Vue 3 開發技能

**觸發關鍵詞**：

- `vue`、`component`、`composable`、`reactive`
- `組件`、`響應式`、`Vue 3`、`Composition API`

**核心功能**：

- 🧩 Vue 3 組件開發模式
- 🔄 Composables 開發指引
- 🛠️ Client utilities 規範
- 🧪 測試最佳實踐
- ✅ Vue 3.5+ 最新特性支援
- 📚 模組化載入機制

### github - GitHub Copilot 整合技能

**觸發關鍵詞**：

- `github`、`copilot`、`skill`、`README`
- `AI`、`助理`、`整合`、`自動化`

**核心功能**：

- 🤖 GitHub Copilot 自動載入機制
- 📋 README.md 強制維護流程
- 🔄 Cross-Platform 支援
- ⚡ 軟路由機制
- 🛠️ 最佳實踐指南

## 🔄 Cross-Platform 支援

### 支援的開發環境

| 環境                          | 支援狀態      | 特色功能       |
| ----------------------------- | ------------- | -------------- |
| **GitHub Copilot CLI**        | ✅ 完全支援   | 命令列智慧輔助 |
| **VS Code Insiders**          | ✅ Agent Mode | 整合開發環境   |
| **Copilot Coding Agent**      | ✅ Web 界面   | 瀏覽器端開發   |
| **Visual Studio Code Stable** | 🔄 2026年1月  | 穩定版支援     |
| **OpenCode Agent**            | ✅ 完全支援   | 專案本地化 AI  |

### 相容性保證

**雙重格式支援**：

- ✅ 同時符合 OpenCode skill 格式
- ✅ 同時符合 GitHub Copilot skill 格式
- ✅ 保持現有功能完整性
- ✅ 自動支援智慧載入

## 🎯 使用最佳實踐

### 開發流程整合

**完整的 AI 輔助開發流程**：

```mermaid
graph LR
    A[使用者請求] --> B[AI 語意分析]
    B --> C[載入相關技能]
    C --> D[執行規範化開發]
    D --> E[自動品質檢查]
    E --> F[強制 README 更新]
    F --> G[生成符合規範代碼]
    G --> H[提供測試指引]
```

### 效能最佳化

**AI 載入最佳化**：

- 🎯 按需載入技能模組（節省 context）
- 📊 基礎檔案 ~250 tokens
- 📚 子檔案 ~500-1500 tokens
- 🔄 智慧技能組合載入
- ⚡ 避免重複載入

## 🛠️ 進階設定

### 自定義技能

**建立專案特定技能**：

1. 在 `.opencode/skills/` 建立新目錄
2. 建立 `SKILL.md` 檔案
3. 定義觸發關鍵詞
4. 更新 `README.md` 目錄

**技能範本結構**：

```yaml
---
name: your-skill-name
description: 技能描述，包含觸發關鍵詞
license: MIT
---
# 技能標題

## 使用時機
## 核心功能
## 最佳實踐
```

### 整合外部技能

**社群技能整合**：

- 🌟 [anthropics/skills](https://github.com/anthropics/skills) - 官方技能範例
- 🚀 [github/awesome-copilot](https://github.com/github/awesome-copilot) - 精選技能收集
- 📚 [OpenCode Skills Hub](https://opencode.ai/skills/) - 技能生態系統

## 📚 參考資源

### 官方文檔

- [GitHub Copilot Skills 官方文件](https://docs.github.com/copilot)
- [GitHub Skills 支援公告](https://github.blog/changelog/2025-12-18-github-copilot-now-supports-agent-skills/)
- [OpenCode Skills 文檔](https://opencode.ai/docs/skills/)

### 專案特定資源

- 📋 [程式碼規範](code-standard/) - Lucky50 專案開發標準
- 🔄 [Git 工作流程](git-workflow/) - 分支管理與提交規範
- 🎨 [Vue 開發指南](vue/) - Vue 3 最佳實踐
- 🚀 [GitHub 整合](github/) - Copilot 與 GitHub 功能整合

---

**🚀 讓 AI 成為您的開發超級助理，實現智慧化、規範化的程式碼開發！**
