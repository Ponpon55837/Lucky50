# GitHub Copilot Skills for Lucky50

本目錄包含 Lucky50 專案的 GitHub Copilot Agent Skills 配置檔案。

## 📋 Skills 列表

| Skill                     | 描述                              | 主要功能                      | 實作位置                                   |
| ------------------------- | --------------------------------- | ----------------------------- | ------------------------------------------ |
| **agent.md**              | Lucky50 AI 助手指南               | 業務定位、架構邊界、協作指引  | `.opencode/skills/AGENT.md`                |
| **code-standards.md**     | 程式碼規範與開發最佳實踐          | Vue 3、TypeScript、技術棧標準 | `.opencode/skills/code-standards/SKILL.md` |
| **git-workflow.md**       | Git 分支命名與工作流程規範        | Git 管理、Commit 規範         | `.opencode/skills/git-workflow/SKILL.md`   |
| **vue.md**                | Vue 3 Composition API 開發指南    | Vue 開發模式、測試實踐        | `.opencode/skills/vue/SKILL.md`            |
| **github-integration.md** | GitHub Copilot 整合與 README 維護 | GitHub 整合、文檔維護機制     | `.opencode/skills/github/`                 |
| **CONFIG.md**             | 技能配置說明                      | GitHub ↔ OpenCode 對應關係    | 本檔案                                     |
| **soft-routing.md**       | 詳細軟路由機制                    | 智慧載入決策樹、效能最佳化    | `.opencode/skills/github/soft-routing.md`  |

## 🔧 配置方式

### 1. 自動載入

GitHub Copilot 會自動檢測並載入 `.github/skills/` 目錄中的技能配置。

### 2. 技能觸發

當使用者在 GitHub Copilot 中輸入包含特定關鍵詞的請求時，對應的技能會自動載入：

```bash
# 範例請求
"幫我建立一個使用者認證組件，並更新相關文檔"

# 自動載入的技能：
1. .opencode/skills/code-standards/SKILL.md (專案規範)
2. .opencode/skills/vue/SKILL.md (Vue 開發模式)
3. .github/skills/soft-routing.md (路由決策)
4. .opencode/skills/github/README.md (文檔維護機制)
```

## 🚀 快速開始

### 開發者設定

1. **確保 GitHub Copilot 啟用**

   ```bash
   # 在 VS Code 中啟用
   # Settings > Extensions > GitHub Copilot
   ```

2. **測試技能載入**

   ```bash
   # 在 GitHub Copilot Chat 中測試
   "展示 Lucky50 專案的程式碼規範"
   # 應該自動載入 code-standards 技能
   ```

3. **驗證路由機制**
   ```bash
   # 測試複雜請求
   "幫我重構 Pinia Store，建立新的 composable，並更新文檔"
   # 應該自動載入多個技能組合
   ```

## 📊 技能統計

- **總技能數量**: 4 個主要技能 + 1 個整合路由 skill
- **觸發關鍵詞**: 25+ 個
- **支援平台**: GitHub Copilot CLI、VS Code、GitHub Web
- **載入時間**: < 500ms
- **Context 使用**: < 2000 tokens

## 🔄 更新機制

當專案結構或開發規範更新時：

1. **更新對應的技能檔案**
2. **測試觸發關鍵詞**
3. **驗證載入邏輯**
4. **提交變更到專案**

## 🛠️ 故障排除

### 技能未載入

**可能原因**：

- 技能檔案格式錯誤
- 觸發關鍵詞未匹配
- GitHub Copilot 版本過舊

**解決方案**：

```bash
# 檢查檔案格式
npx markdownlint .github/skills/*.md

# 重啟 GitHub Copilot
# VS Code: Command Palette > "GitHub Copilot: Restart"
```

### 路由異常

**症狀**：載入了錯誤的技能組合

**調試方法**：

```bash
# 查看載入日誌
GitHub Copilot > Settings > Debug > Show skill loading logs

# 測試關鍵詞匹配
# 在 .github/skills/soft-routing.md 中檢查對應表
```

## 📚 參考資源

- [GitHub Copilot Skills 文檔](https://docs.github.com/copilot/agent-skills)
- [OpenCode Skills 指南](https://opencode.ai/docs/skills/)
- [Lucky50 專案開發規範](../../.opencode/skills/code-standards/SKILL.md)

---

**最後更新**: 2026-07-18
**維護者**: Lucky50 開發團隊
