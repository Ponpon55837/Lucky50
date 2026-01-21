# GitHub Copilot Skills 配置

## 📋 技能配置

每個 `.github/skills/*.md` 檔案都是 GitHub Copilot 技能的入口點，包含：

- 技能描述和觸發關鍵詞
- 對應到 `.opencode/skills/` 的實作位置
- 功能說明和使用指引

## 🔗 技能對應關係

| GitHub 技能             | 實作位置                                   | 觸發關鍵詞           | 主要功能     |
| ----------------------- | ------------------------------------------ | -------------------- | ------------ |
| `agent.md`              | `.opencode/skills/agent.md`                | AI, 智慧助理         | AI 功能總覽  |
| `code-standards.md`     | `.opencode/skills/code-standards/SKILL.md` | code-standards, 規範 | 程式碼規範   |
| `git-workflow.md`       | `.opencode/skills/git-workflow/SKILL.md`   | git, commit          | Git 工作流程 |
| `vue.md`                | `.opencode/skills/vue/SKILL.md`            | vue, component       | Vue 3 開發   |
| `github-integration.md` | `.opencode/skills/github/SKILL.md`         | github, README       | GitHub 整合  |

## 🤖 GitHub Copilot 自動載入機制

GitHub Copilot 會自動：

1. 檢測 `.github/skills/` 目錄
2. 讀取所有 `.md` 技能檔案
3. 根據使用者請求匹配觸發關鍵詞
4. 載入對應的 `.opencode/skills/` 實作檔案

## 🎯 使用範例

### 範例 1：Vue 開發

```bash
使用者：「幫我建立一個使用者認證組件」

GitHub Copilot 載入：
1. `vue.md` - Vue 3 開發指南
2. `code-standards.md` - Lucky50 開發規範
```

### 範例 2：Git 操作

```bash
使用者：「提交這次變更」

GitHub Copilot 載入：
1. `git-workflow.md` - Git 工作流程規範
2. `github-integration.md` - README 維護機制
```

### 範例 3：AI 功能查詢

```bash
使用者：「GitHub Copilot 有哪些技能？」

GitHub Copilot 載入：
1. `agent.md` - AI 功能總覽
```

---

**這個配置確保 GitHub Copilot 能正確載入對應的技能實作，提供完整的開發支援。**
