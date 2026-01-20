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
- Git Hooks: `.githooks/`
  - `pre-commit` - 本地分支保護
  - `commit-msg` - 提交訊息驗證
  - `README.md` - Hooks 使用說明
- README: `README.md` - 專案說明
- 開發規範: `.github/copilot-instructions.md`

---

## 🎓 實際案例分析

### 案例 1: 正確的功能開發流程

**情境**：使用者要求「新增一個使用者設定頁面」

**AI 正確做法**：

```bash
# 步驟 1: 先檢查當前分支
$ git status
On branch main
Your branch is up to date with 'origin/main'.

# 步驟 2: AI 發現在 main 分支，立即警告
⚠️ 檢測到當前在 main 分支！
根據專案規範，必須在功能分支上進行開發。

# 步驟 3: AI 詢問使用者
是否要建立新分支進行開發？
建議分支名稱：feat/lip/user-settings-page

# 步驟 4: 使用者確認後，建立分支
$ git checkout -b feat/lip/user-settings-page

# 步驟 5: 開始開發
[AI 使用 write 工具建立新檔案]
[AI 使用 edit 工具修改相關檔案]

# 步驟 6: 測試
$ pnpm dev

# 步驟 7: 提交（使用者確認後）
$ git add .
$ git commit -m "feat: 新增使用者設定頁面"

# 步驟 8: 推送（詢問使用者）
要推送到遠端嗎？這會建立新的遠端分支。
$ git push -u origin feat/lip/user-settings-page
```

### 案例 2: 錯誤流程 - 直接在 main 修改

**情境**：使用者說「幫我修正 README 的錯字」

**❌ AI 錯誤做法**：

```bash
# 未檢查分支，直接修改
[AI 直接使用 edit 工具修改 README.md]
[AI 直接執行 git commit]

❌ 違規！沒有先檢查分支就修改檔案
```

**✅ AI 正確做法**：

```bash
# 步驟 1: 先檢查分支
$ git status
On branch main

# 步驟 2: 發現在 main，立即警告
⚠️ 目前在 main 分支，無法直接修改！

# 步驟 3: 建議操作
建議建立新分支：docs/lip/fix-readme-typo

# 步驟 4: 詢問使用者
是否要建立新分支來修正錯字？
```

### 案例 3: 已在功能分支上的情況

**情境**：使用者說「繼續完成登入功能」

**AI 正確做法**：

```bash
# 步驟 1: 檢查當前分支
$ git status
On branch feat/lip/user-login

# 步驟 2: 確認在功能分支，可以繼續
✅ 當前在功能分支 'feat/lip/user-login'
✅ 分支名稱符合規範
可以繼續開發。

# 步驟 3: 繼續開發工作
[AI 正常使用 edit/write 工具]
```

### 案例 4: 分支命名不規範

**情境**：使用者自己建立了分支 `my-feature`

**AI 正確做法**：

```bash
# 步驟 1: 檢查分支
$ git status
On branch my-feature

# 步驟 2: AI 發現命名不規範
⚠️ 注意：當前分支名稱 'my-feature' 不符合專案規範

專案要求格式：<type>/<developer-name>/<feature-description>
範例：feat/lip/add-new-feature

# 步驟 3: 提供建議
建議重新命名分支：
$ git branch -m feat/lip/my-feature

或建立新的規範分支：
$ git checkout -b feat/lip/my-feature

是否要重新命名分支？
```

### 案例 5: 提交訊息格式錯誤

**情境**：使用者要求提交代碼

**AI 正確做法**：

```bash
# 步驟 1: 檢查分支（必須先做）
$ git status
On branch feat/lip/add-api

# 步驟 2: 檢查要提交的內容
$ git diff

# 步驟 3: 使用正確格式提交
$ git commit -m "feat: 新增使用者 API 端點"

# 如果使用者提供的訊息格式不對，AI 應該修正：
使用者：「幫我提交，訊息是 Add user API」
AI：「我會使用符合規範的格式提交：
     feat: 新增使用者 API 端點
     這樣符合專案的 Conventional Commits 規範。」
```

---

## ❓ 常見問題 (FAQ)

### Q1: 為什麼不能在 main 分支直接修改？

**A**: 這是為了：

- ✅ 確保所有變更都經過代碼審查（Pull Request）
- ✅ 保持 main 分支的穩定性
- ✅ 方便追蹤和回溯變更歷史
- ✅ 避免不同開發者之間的衝突
- ✅ 符合團隊協作的最佳實踐

### Q2: 什麼情況下可以跳過 git hook？

**A**: 幾乎沒有！但以下極少數情況可以考慮：

- 🔧 修復損壞的 Git 倉庫
- 🚨 緊急熱修復（但仍應盡快補 PR）
- 🧪 測試 Git hooks 本身

使用方式：`git commit --no-verify`

⚠️ **警告**：跳過 hook 違反專案規範，應該要有充分理由並記錄。

### Q3: AI 什麼時候應該自動建立分支？

**A**: **絕對不應該**自動建立！AI 應該：

1. 檢測到在 main 分支
2. 警告使用者
3. **詢問**使用者是否要建立新分支
4. 等待使用者**明確確認**
5. 才執行 `git checkout -b` 命令

### Q4: 如果使用者堅持要在 main 分支修改怎麼辦？

**A**: AI 應該：

1. 明確拒絕執行修改操作
2. 解釋為什麼不能這樣做
3. 提供正確的替代方案
4. 如果使用者仍然堅持，重複說明規則

**示例回應**：

```
抱歉，根據專案規則（AGENTS.md），我無法在 main 分支上執行代碼修改。
這是保護專案穩定性的強制性規則。

建議的做法：
1. 建立功能分支：git checkout -b feat/lip/your-feature
2. 在新分支上進行修改
3. 完成後建立 Pull Request 合併到 main

這樣可以確保：
- 代碼經過審查
- 保持提交歷史清晰
- 避免影響其他開發者

是否要建立新分支？
```

### Q5: 分支命名有什麼具體要求？

**A**: 格式：`<type>/<developer-name>/<feature-description>`

**允許的類型**：

- `feat` - 新功能
- `fix` - 錯誤修復
- `docs` - 文件更新
- `style` - 代碼格式調整
- `refactor` - 代碼重構
- `perf` - 性能優化
- `test` - 測試相關
- `chore` - 雜項工作
- `ci` - CI/CD 相關
- `build` - 建置系統變更

**範例**：

- ✅ `feat/lip/user-authentication`
- ✅ `fix/lip/login-error`
- ✅ `docs/lip/api-documentation`
- ❌ `my-feature` （缺少類型和開發者名稱）
- ❌ `Feature/Login` （首字母不應大寫）

### Q6: AI 如何處理已經在功能分支上的情況？

**A**: AI 應該：

1. 執行 `git status` 確認當前分支
2. 驗證分支名稱是否符合規範
3. 如果符合規範，繼續執行操作
4. 如果不符合規範，警告使用者但仍可繼續（取決於嚴格程度）

### Q7: 提交訊息有什麼格式要求？

**A**: 遵循 Conventional Commits 規範：

**基本格式**：

```
<type>: <description>
```

**完整格式**：

```
<type>(scope): <description>

[optional body]

[optional footer]
```

**範例**：

- ✅ `feat: 新增使用者登入功能`
- ✅ `fix: 修復登入頁面顯示錯誤`
- ✅ `docs: 更新 README 安裝說明`
- ✅ `feat(api): 新增使用者 API 端點`
- ❌ `Add login feature` （缺少類型）
- ❌ `feat:新增功能` （缺少空格）

**注意**：

- 描述優先使用繁體中文
- 描述首字母小寫
- 描述不要以句號結尾
- 長度：5-100 字元

### Q8: 本地 Git hooks 和 GitHub Branch Protection 有什麼區別？

**A**:

| 特性     | Git Hooks (本地)                 | Branch Protection (遠端) |
| -------- | -------------------------------- | ------------------------ |
| 位置     | 開發者本機                       | GitHub 伺服器            |
| 觸發時機 | `git commit` / `git push` (本機) | `git push` (遠端)        |
| 可繞過   | 可以（`--no-verify`）            | 需要管理員權限           |
| 防護強度 | ⭐⭐⭐⭐                         | ⭐⭐⭐⭐⭐               |
| 適用範圍 | 單一開發者                       | 所有團隊成員             |

**最佳做法**：兩者都啟用，提供雙重保護！

### Q9: 如果 Git hooks 沒有安裝會怎樣？

**A**:

- ❌ 無法阻止在 main 分支提交
- ❌ 無法驗證提交訊息格式
- ⚠️ 但 AI 的 AGENTS.md 規則仍然有效
- ⚠️ GitHub Branch Protection（如已設定）仍會保護

**解決方法**：

```bash
# 安裝 Git hooks
./.githooks/install.sh

# 驗證安裝
ls -la .git/hooks/
```

### Q10: AI 應該何時推送到遠端？

**A**: AI **不應該自動推送**，而應該：

1. 完成本地提交
2. **詢問使用者**：「是否要推送到遠端？」
3. 等待使用者明確確認
4. 解釋推送的後果（建立遠端分支、其他人可見等）
5. 使用者確認後才執行 `git push`

**示例對話**：

```
AI: 已成功提交到本地分支 feat/lip/new-feature
    是否要推送到遠端倉庫？

    這會：
    - 建立遠端分支 origin/feat/lip/new-feature
    - 讓其他團隊成員可以看到您的變更
    - 可以在 GitHub 建立 Pull Request

使用者: 好，推送吧
AI: [執行 git push -u origin feat/lip/new-feature]
```

---

## 🔒 多層防護機制說明

本專案採用**防禦深度**（Defense in Depth）策略：

### Layer 1: AGENTS.md (AI 系統規則)

- **觸發時機**: AI 助手啟動時自動載入
- **防護對象**: AI 助手的行為
- **強度**: ⭐⭐⭐
- **繞過方式**: AI 忽略規則（應該不會發生）

### Layer 2: Skills (開發規範)

- **觸發時機**: AI 載入 skills 時
- **防護對象**: AI 助手的決策
- **強度**: ⭐⭐⭐
- **繞過方式**: AI 未載入 skills

### Layer 3: Git Pre-commit Hook (本地強制)

- **觸發時機**: 執行 `git commit` 時
- **防護對象**: 所有本地提交（包括 AI 和人類）
- **強度**: ⭐⭐⭐⭐
- **繞過方式**: `git commit --no-verify`

### Layer 4: Git Commit-msg Hook (本地驗證)

- **觸發時機**: 執行 `git commit` 時
- **防護對象**: 提交訊息格式
- **強度**: ⭐⭐⭐ (目前為警告模式)
- **繞過方式**: `git commit --no-verify`

### Layer 5: GitHub Branch Protection (遠端強制)

- **觸發時機**: 執行 `git push` 時
- **防護對象**: 遠端分支保護
- **強度**: ⭐⭐⭐⭐⭐
- **繞過方式**: 需要管理員權限

**即使某一層被繞過，其他層仍會提供保護！**

---

## 🚨 違規處理流程

### 如果 AI 不小心違規了怎麼辦？

1. **立即停止**當前操作
2. **回滾**已經做的修改（如果可能）
3. **報告**給使用者發生了什麼
4. **解釋**為什麼這是違規
5. **提供**正確的修復方案

**示例**：

```
⚠️ 抱歉，我發現自己剛才違反了專案規則！

違規操作：在未檢查分支的情況下修改了 src/App.vue
當前分支：main (受保護分支)
規則違反：規則 1 - Git 分支檢查

建議修復：
1. 撤銷剛才的修改：
   git checkout src/App.vue

2. 建立功能分支：
   git checkout -b feat/lip/update-app

3. 重新應用修改（我會幫您重做）

是否要執行修復流程？
```

---

## 📝 檢查清單模板

AI 在執行操作前應該使用這個內部檢查清單：

```
□ 已執行 git status 或 git branch？
□ 確認當前不在 main/master/develop 等受保護分支？
□ 如果在受保護分支，是否已警告使用者並建議建立新分支？
□ 如果在功能分支，分支名稱是否符合規範？
□ 如果分支名稱不規範，是否已提醒使用者？
□ 使用者是否明確確認要進行此操作？
□ 如果要提交代碼，提交訊息是否符合格式？
□ 如果要推送，是否已詢問使用者確認？
```

**只有全部打勾，才能繼續操作！**

---

**最後提醒**：本規則檔案的目的是確保代碼品質和團隊協作順暢。遵守這些規則不是負擔，而是保護專案穩定性的必要措施。

**記住**：防止錯誤比修復錯誤容易得多！
