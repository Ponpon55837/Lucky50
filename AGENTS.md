# Lucky50 專案 - OpenCode 規則

> 本檔案包含 AI 助手在協助開發 Lucky50 專案時必須遵守的強制性規則

---

## 🔴 最高優先級規則

### 規則 1: Git 分支檢查（絕對強制）

**在執行任何程式碼修改操作之前，必須先執行以下檢查：**

```bash
# 步驟 1: 檢查當前分支
git branch
# 或
git status
```

**檢查結果處理：**

1. **如果當前在 `main` 分支**：
   - 🛑 **立即停止所有操作**
   - ❌ **絕對禁止**使用 `edit`、`write` 工具
   - ❌ **絕對禁止**執行 `git add` 或 `git commit`
   - ⚠️ **警告使用者**：「目前在 main 分支，無法進行修改」
   - ✅ **建議操作**：
     ```bash
     git checkout -b <type>/lip/<description>
     ```
   - 💬 **詢問使用者**：「是否要建立新分支？」

2. **如果當前在功能分支**：
   - ✅ 可以繼續操作
   - 📝 確認分支名稱符合規範：`<type>/<developer-name>/<feature-description>`

**絕無例外**：任何程式碼修改都必須在功能分支上進行。

---

## 📋 操作前檢查清單

在執行以下任何工具前，必須先完成「規則 1: Git 分支檢查」：

- [ ] `edit` - 編輯檔案
- [ ] `write` - 建立新檔案
- [ ] `bash` (當執行 git add/commit/push 時)
- [ ] 任何會修改專案檔案的操作

**正確流程**：

```
1. 執行 git branch 或 git status
   ↓
2. 確認當前分支
   ↓
3. 如果在 main → 建立新分支
   ↓
4. 如果在功能分支 → 繼續操作
```

---

## 🎯 專案資訊

- **專案名稱**: Lucky50 農民曆智慧投資系統
- **技術棧**: Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS
- **開發工具**: pnpm
- **開發伺服器**: Vite (port 5173)

---

## 📚 必讀規範

在開始任何開發工作前，必須載入並理解以下 skills：

1. **git-workflow** - Git 分支命名和工作流程規範
2. **lucky50-dev** - Lucky50 專案開發規範與最佳實踐

載入方式：

```
請載入 git-workflow 和 lucky50-dev skills
```

---

## ⚠️ 提醒機制

### 當檢測到可能違規時

如果 AI 助手發現自己即將在 main 分支上修改代碼，必須：

1. **暫停操作**
2. **顯示警告訊息**：

   ```
   ⚠️ 檢測到違規操作

   當前狀態：main 分支
   嘗試操作：[具體操作]
   規則限制：禁止在 main 分支直接修改

   建議動作：
   1. 建立新分支：git checkout -b <type>/lip/<description>
   2. 在新分支上進行修改

   是否要建立新分支？
   ```

3. **等待使用者確認**

---

## 🔄 工作流程範例

### ✅ 正確流程

```bash
# 1. 檢查當前狀態
git status

# 2. 確認在 main，建立新分支
git checkout -b feat/lip/add-new-feature

# 3. 進行開發
# 使用 edit/write 工具修改代碼

# 4. 測試
pnpm dev

# 5. 提交
git add .
git commit -m "feat: 新增某功能"

# 6. 推送（詢問使用者後）
git push -u origin feat/lip/add-new-feature
```

### ❌ 錯誤流程

```bash
# ❌ 直接在 main 分支修改
git status  # 顯示：On branch main
# 然後直接使用 edit 工具 → 這是違規！
```

---

## 💡 自我檢查提示

在每次執行 `edit` 或 `write` 工具前，AI 助手應該自問：

1. ✅ 我是否已經檢查過當前分支？
2. ✅ 當前是否在功能分支上？
3. ✅ 分支名稱是否符合規範？
4. ✅ 使用者是否已確認要進行此修改？

如果任何一項答案是「否」，則不應繼續操作。

---

## 📖 參考資源

- Skills: `.opencode/skills/`
  - `git-workflow/SKILL.md` - Git 工作流程規範
  - `lucky50-dev/SKILL.md` - 開發規範
- README: `README.md` - 專案說明
- 開發規範: `.github/copilot-instructions.md`

---

**最後提醒**：本規則檔案的目的是確保代碼品質和團隊協作順暢。遵守這些規則不是負擔，而是保護專案穩定性的必要措施。
