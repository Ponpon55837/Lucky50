# OpenCode Skills

本目錄包含 Lucky50 專案的 OpenCode Agent Skills。

## 目錄結構

```
.opencode/skills/
├── README.md
├── lucky50-dev/
│   └── SKILL.md
└── git-workflow/
    └── SKILL.md
```

## 可用的 Skills

### `lucky50-dev`

**版本**: 1.1.0  
**更新日期**: 2026-01-20  
**描述**: Lucky50 專案開發規範與最佳實踐指南

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

- 🎯 核心原則（技術棧、中文優先、類型安全、代碼品質）
- 📁 Vue 組件開發規範（檔案結構順序）
- 🎨 Tailwind CSS 開發規範
- 🗂️ TypeScript 型別定義規範
- 🔄 Pinia 狀態管理規範
- 🛠️ Composables 開發規範
- 🌐 API 服務層開發規範
- ⚠️ 錯誤處理規範
- 🎭 Three.js 3D 開發規範
- 📊 Chart.js 圖表開發規範
- 🧪 **開發測試流程** ⭐ 新增
- 📝 Git Commit 規範
- 🚫 禁止事項清單
- ✅ 開發前/提交前檢查清單

**如何使用**:

```
請載入 lucky50-dev skill 並檢查我的組件是否符合規範
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
| 2.1.0 | 2026-01-20 | 新增 git-workflow skill，更新兩個 skills |
| 2.0.0 | 2026-01-20 | 遷移到官方 skill 格式                    |
| 1.0.0 | 2026-01-19 | 初始版本（舊格式）                       |

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
