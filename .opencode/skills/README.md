# OpenCode Skills

本目錄包含 Lucky50 專案的 OpenCode Agent Skills。

## 目錄結構

```
.opencode/skills/
├── README.md
└── lucky50-dev/
    └── SKILL.md
```

## 可用的 Skills

### `lucky50-dev`

**描述**: Lucky50 專案開發規範與最佳實踐指南

**使用時機**:

- 新增或修改 Vue 3 組件
- 開發 Pinia Store 或 Composables
- 整合 Three.js 或 Chart.js 視覺化功能
- 處理 API 服務層開發
- 實作錯誤處理機制
- 確認代碼是否符合專案規範

**如何使用**:

在 OpenCode 中，AI 會自動看到可用的 skills 並在需要時載入。你也可以手動提示 AI：

```
請載入 lucky50-dev skill 並檢查我的組件是否符合規範
```

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

| 版本  | 日期       | 說明                  |
| ----- | ---------- | --------------------- |
| 2.0.0 | 2026-01-20 | 遷移到官方 skill 格式 |
| 1.0.0 | 2026-01-19 | 初始版本（舊格式）    |

## 參考資源

- [OpenCode Skills 文檔](https://opencode.ai/docs/skills/)
- [專案開發規範](.github/copilot-instructions.md)
- [錯誤處理文檔](docs/ERROR_HANDLING.md)
