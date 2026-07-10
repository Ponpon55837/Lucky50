# OpenCode Skills

本目錄包含 Lucky50 專案的 OpenCode Agent Skills。

## 目錄結構

```
.opencode/skills/
├── README.md
├── agent.md
├── code-standards/
│   └── SKILL.md
├── git-workflow/
│   └── SKILL.md
├── github/
│   ├── SKILL.md
│   ├── README.md
│   └── soft-routing.md
└── vue/
    ├── SKILL.md
    └── references/
        ├── components.md
        ├── composables.md
        ├── utils-client.md
        └── testing.md
```

## 可用的 Skills

### `agent` - AI 智慧助理功能說明

**版本**: 1.0.0  
**更新日期**: 2026-01-20  
**描述**: GitHub Copilot、OpenCode Agent 技能整合與使用指南

**使用時機**:

- 了解 AI 智慧助理的完整功能
- 學習技能觸發機制和載入邏輯
- 掌握軟路由和智慧化開發流程
- 配置自定義技能
- 整合外部技能資源

**主要內容**:

- 🤖 AI Agent 技能架構概覽
- 🎯 智慧化程式碼生成
- 🔴 強制性品質檢查
- ⚡ 軟路由載入機制
- 🔄 Cross-Platform 支援
- 🛠️ 進階設定與自定義技能
- 📚 參考資源與社群整合

---

### `code-standards` - 程式碼規範與開發最佳實踐

**版本**: 1.3.0  
**更新日期**: 2026-07-10  
**描述**: Vue 3、TypeScript、Git 工作流程、專案架構標準

**AI 觸發關鍵詞**: `code-standards`、`coding`、`development`、`規範`、`開發`、`最佳實踐`、`程式碼品質`

**使用時機**:

- 新增或修改 Vue 3 組件
- 開發 Pinia Store 或 Composables
- 整合 Three.js 或 Chart.js 視覺化功能
- 處理 API 服務層開發
- 實作錯誤處理機制
- 確認代碼是否符合專案規範
- **執行開發測試流程**
- **提交代碼前的檢查**

**主要內容**:

- 🎯 核心原則（技術棧、繁體中文語境、類型安全、代碼品質）
- 📁 Vue 組件開發規範（檔案結構順序）
- 🎨 Tailwind CSS 開發規範
- 🗂️ TypeScript 型別定義規範
- 🔄 Pinia 狀態管理規範
- 🛠️ Composables 開發規範
- 🌐 API 服務層開發規範
- ⚠️ 錯誤處理規範
- 🎭 Three.js 3D 開發規範
- 📊 Chart.js 圖表開發規範
- 🧪 **開發測試流程（含 git hooks 自動化檢查）**
- 📝 Git Commit 規範
- 🚫 禁止事項清單
- ✅ 開發前/提交前檢查清單

**如何使用**:

```
請載入 code-standards skill 並檢查我的組件是否符合規範
```

---

### `git-workflow`

**版本**: 1.1.0  
**更新日期**: 2026-01-20  
**描述**: Git 分支命名與工作流程規範

**使用時機**:

- 建立新的 Git 分支時
- 需要確認分支命名是否符合規範
- 撰寫 Commit 訊息
- **確認 Commit 訊息語言規範**
- 團隊協作需要統一的分支管理策略
- 進行 code review 時檢查分支命名

**主要內容**:

- 分支命名規範（`<type>/<developer-name>/<feature-description>`）
- 分支類型定義（feat, fix, refactor, docs, style, test, chore）
- Git 工作流程（建立、開發、合併、清理）
- **提交訊息規範（🔴 繁體中文優先）** ⭐ 新增
- **提交訊息最佳實踐** ⭐ 新增
- 注意事項與常見問題

**如何使用**:

```
請載入 git-workflow skill 並幫我建立符合規範的分支
```

```
請檢查我的 Commit 訊息是否符合 git-workflow 規範
```

---

### `vue`

**版本**: 1.0.0  
**來源**: [onmax/nuxt-skills](https://github.com/onmax/nuxt-skills)  
**更新日期**: 2026-01-20  
**描述**: Vue 3 Composition API 開發指南與最佳實踐

**使用時機**:

- 編輯 `.vue` 組件檔案
- 建立或修改 composables（`use*` 函數）
- 開發 client-side utilities
- 撰寫 Vue 組件/composables 測試
- 需要 Vue 3.5+ 新特性指引（reactive destructuring、useTemplateRef 等）
- 需要 TypeScript 型別安全的 props/emits 模式

**主要內容**:

- 🧩 Vue 3 組件開發模式（Composition API）
  - Props reactive destructuring (Vue 3.5+)
  - Type-safe emits 和 defineModel
  - Template refs 和 slots 最佳實踐
- 🔄 Composables 開發指引
  - VueUse 整合建議
  - Lifecycle hooks 和 async patterns
  - Singleton composables 和 cleanup patterns
- 🛠️ Client utilities 規範
  - Pure functions（formatters, validators, transformers）
  - 何時使用 utils vs composables
- 🧪 測試模式
  - Vitest + @vue/test-utils 測試範例
  - Component、composable、utils 測試策略
  - Mocking patterns

**與 `lucky50-dev` 的關係**:

- `vue` skill：提供**通用** Vue 3 開發模式和最佳實踐
- `lucky50-dev` skill：提供 **Lucky50 專案特定**的開發規範（Tailwind CSS、Pinia、Three.js 等）
- **建議**：兩個 skill 搭配使用以獲得最佳開發體驗

**如何使用**:

```
請載入 vue skill 幫我重構這個組件
```

```
載入 vue skill 的 references/components.md
```

**Modular Loading**:

vue skill 支援模組化載入，根據當前工作選擇性載入相關文件：

| 工作內容         | 載入檔案                     |
| ---------------- | ---------------------------- |
| 編輯 `.vue` 組件 | `references/components.md`   |
| 開發 composables | `references/composables.md`  |
| 開發 utils       | `references/utils-client.md` |
| 撰寫測試         | `references/testing.md`      |

**特色**:

- ✅ 基於 Vue 3.5+ 最新特性
- ✅ 模組化設計，節省 context tokens
- ✅ 來自 Nuxt 社群的最佳實踐
- ✅ 完整的 TypeScript 支援
- ✅ 包含測試指引

---

## 🎯 使用指南

### 自動載入

在 OpenCode 中，AI 會自動看到可用的 skills 並在需要時載入。

### 手動載入

你也可以手動提示 AI 載入特定的 skill：

```
請載入 lucky50-dev skill
```

```
請同時載入 lucky50-dev 和 git-workflow skills
```

### 檢查是否符合規範

```
請載入 lucky50-dev skill 並檢查這個組件是否符合規範
```

```
請載入 git-workflow skill 並檢查我的分支命名和 commit 訊息
```

---

## 遷移說明

**從舊格式遷移** (v1.0.0 → v2.0.0):

- **舊格式**: `.opencode/skills.md` (單一檔案)
- **新格式**: `.opencode/skills/<name>/SKILL.md` (符合官方規範)

新格式的優點：

1. ✅ 符合 OpenCode 官方 skill 規範
2. ✅ 支援 YAML frontmatter 元數據
3. ✅ 更好的組織結構（每個 skill 一個資料夾）
4. ✅ 可以為每個 skill 添加額外的相關檔案
5. ✅ 支援權限控制和配置

## 技術細節

根據 [OpenCode Skills 官方文件](https://opencode.ai/docs/skills/)：

- 每個 skill 必須放在獨立的目錄中
- 檔案名稱必須是大寫的 `SKILL.md`
- 必須包含 YAML frontmatter，至少包含 `name` 和 `description`
- skill 名稱必須符合格式：`^[a-z0-9]+(-[a-z0-9]+)*$`

## 版本歷史

| 版本  | 日期       | 說明                                     |
| ----- | ---------- | ---------------------------------------- |
| 2.2.0 | 2026-07-10 | 更新 code-standards skill（核心原則、git hooks） |
| 2.1.0 | 2026-01-20 | 新增 git-workflow skill，更新兩個 skills |
| 2.0.0 | 2026-01-20 | 遷移到官方 skill 格式                    |
| 1.0.0 | 2026-01-19 | 初始版本（舊格式）                       |

### 2.2.0 變更內容 (2026-07-10)

#### code-standards v1.3.0

- ✨ 新增「🎯 核心原則」章節（繁體中文語境、AI 溝通規範）
- ✨ 重構「程式碼品質檢查」章節，區分 git hooks 與手動/CI 指令
- 🔧 pre-commit 從 `vitest run --changed` 改為 `vitest run`（跑全部測試）
- 📝 版本從 1.2.0 更新到 1.3.0

### 2.1.0 變更內容 (2026-01-20)

#### lucky50-dev v1.1.0

- ✨ 新增「🧪 開發測試流程」完整章節
- ✨ 新增測試命令和檢查清單
- ✨ 更新提交前檢查清單（分類為 4 大項）
- 📝 版本從 1.0.0 更新到 1.1.0

#### git-workflow v1.1.0

- ✨ 新增「語言規範」章節，明確繁體中文優先
- ✨ 提供中文/英文 Commit 範例對比
- ✨ 新增「提交訊息最佳實踐」5 項指引
- 📝 新增版本號 1.1.0 和 metadata

## 參考資源

- [OpenCode Skills 文檔](https://opencode.ai/docs/skills/)
- [專案開發規範](.github/copilot-instructions.md)
- [錯誤處理文檔](docs/ERROR_HANDLING.md)
