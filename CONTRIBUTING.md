# 貢獻指南 (Contributing Guide)

感謝您對 Lucky50 專案的興趣！我們歡迎所有形式的貢獻，包括但不限於：

- 🐛 回報錯誤 (Bug Reports)
- 💡 提出新功能建議 (Feature Requests)
- 📝 改進文檔 (Documentation Improvements)
- 🔧 提交代碼修復或新功能 (Code Contributions)

## 📋 目錄

- [開始之前](#開始之前)
- [開發環境設置](#開發環境設置)
- [工作流程](#工作流程)
- [代碼規範](#代碼規範)
- [提交訊息規範](#提交訊息規範)
- [Pull Request 流程](#pull-request-流程)
- [代碼審查](#代碼審查)
- [常見問題](#常見問題)

---

## 開始之前

### 行為準則

請確保您的行為符合以下原則：

- ✅ 尊重所有貢獻者
- ✅ 保持建設性的討論
- ✅ 接受建設性的批評
- ✅ 專注於對專案最有利的事情

### 熟悉專案

在開始貢獻前，請：

1. 閱讀 [README.md](README.md) 了解專案概況
2. 瀏覽 [Issues](https://github.com/Ponpon55837/Lucky50/issues) 了解當前需求
3. 閱讀 [AGENTS.md](AGENTS.md) 了解專案規則
4. 查看 `.opencode/skills/` 目錄下的開發規範

---

## 開發環境設置

### 1. Fork 並 Clone 專案

```bash
# Fork 專案到您的 GitHub 帳號
# 然後 clone 到本地

git clone https://github.com/YOUR_USERNAME/Lucky50.git
cd Lucky50
```

### 2. 安裝依賴

```bash
# 使用 pnpm 安裝依賴（必須使用 pnpm，不要使用 npm 或 yarn）
pnpm install
```

### 3. 安裝 Git Hooks

**⚠️ 非常重要**：請務必安裝 Git hooks 以確保代碼品質

```bash
# 安裝 Git hooks
./.githooks/install.sh

# 驗證安裝
ls -la .git/hooks/pre-commit
ls -la .git/hooks/commit-msg
```

### 4. 配置開發環境

```bash
# 複製環境變數檔案（如果需要）
cp .env.example .env

# 編輯 .env 填入您的配置
```

### 5. 啟動開發伺服器

```bash
# 啟動 Vite 開發伺服器（port 5173）
pnpm dev
```

瀏覽器訪問：http://localhost:5173

---

## 工作流程

### 1. 建立功能分支

**⚠️ 絕對不要直接在 main 分支上開發！**

```bash
# 確保在 main 分支並更新到最新
git checkout main
git pull origin main

# 建立功能分支（必須遵循命名規範）
git checkout -b <type>/<your-name>/<feature-description>
```

**分支命名格式**：`<type>/<developer-name>/<feature-description>`

**允許的類型**：

- `feat` - 新功能
- `fix` - 錯誤修復
- `docs` - 文件更新
- `style` - 代碼格式（不影響功能）
- `refactor` - 代碼重構
- `perf` - 性能優化
- `test` - 測試相關
- `chore` - 雜項任務
- `ci` - CI/CD 相關
- `build` - 建置系統

**範例**：

```bash
git checkout -b feat/alice/add-dark-mode
git checkout -b fix/bob/fix-login-bug
git checkout -b docs/charlie/update-api-docs
```

### 2. 進行開發

```bash
# 進行代碼修改
# ...

# 隨時測試您的變更
pnpm dev
```

### 3. 編寫測試

如果您新增或修改了功能，請確保：

- ✅ 現有測試仍然通過
- ✅ 為新功能編寫測試（如適用）

```bash
# 運行測試
pnpm test
```

### 4. 提交變更

```bash
# 查看變更
git status
git diff

# 添加變更
git add .

# 提交（必須遵循提交訊息規範）
git commit -m "feat: 新增深色模式功能"
```

**提交訊息會自動驗證**：

- Pre-commit hook 會檢查您是否在受保護分支
- Commit-msg hook 會驗證訊息格式

### 5. 推送到您的 Fork

```bash
# 推送到您的遠端分支
git push -u origin feat/alice/add-dark-mode
```

### 6. 建立 Pull Request

1. 前往 GitHub 上您 fork 的倉庫
2. 點擊 "Compare & pull request"
3. 填寫 PR 描述（參考下方模板）
4. 提交 PR

---

## 代碼規範

### TypeScript 規範

```typescript
// ✅ 好的做法：使用明確的類型定義
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ 避免：使用 any
function getUser(id: any): any {
  // ...
}
```

### Vue 3 組件規範

```vue
<!-- ✅ 好的做法：使用 Composition API + TypeScript -->
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
})

const doubled = computed(() => props.count * 2)
</script>

<template>
  <div class="component">
    <h1>{{ props.title }}</h1>
    <p>Count: {{ props.count }}, Doubled: {{ doubled }}</p>
  </div>
</template>
```

### 命名規範

- **組件名稱**：使用 PascalCase
  - ✅ `UserProfile.vue`
  - ❌ `userProfile.vue`, `user-profile.vue`

- **檔案名稱**：
  - 組件：PascalCase (`UserProfile.vue`)
  - 工具函數：camelCase (`formatDate.ts`)
  - 類型定義：PascalCase (`User.ts`)

- **變數/函數**：camelCase
  - ✅ `getUserData()`, `isLoading`
  - ❌ `GetUserData()`, `is_loading`

- **常數**：UPPER_SNAKE_CASE
  - ✅ `API_BASE_URL`, `MAX_RETRY_COUNT`

### 程式碼風格

本專案使用 ESLint 和 Prettier：

```bash
# 檢查程式碼風格
pnpm lint

# 自動修復
pnpm lint:fix

# 格式化
pnpm format
```

---

## 提交訊息規範

我們遵循 [Conventional Commits](https://www.conventionalcommits.org/) 規範。

### 基本格式

```
<type>: <description>

[optional body]

[optional footer]
```

### 完整格式

```
<type>(scope): <description>

[optional body]

[optional footer]
```

### 範例

```bash
# 基本格式
feat: 新增使用者登入功能
fix: 修復登入頁面顯示錯誤
docs: 更新 README 安裝說明

# 帶 scope
feat(api): 新增使用者 API 端點
fix(auth): 修正 JWT 驗證邏輯
docs(readme): 更新安裝步驟

# 破壞性變更
feat!: 重構 API 接口
feat(api)!: 變更使用者資料結構

# 多行訊息
feat: 新增深色模式功能

新增了完整的深色模式支援，包括：
- 主題切換開關
- 顏色配置
- 本地儲存偏好

Closes #123
```

### 類型說明

| 類型       | 說明                   | 範例                       |
| ---------- | ---------------------- | -------------------------- |
| `feat`     | 新功能                 | `feat: 新增深色模式`       |
| `fix`      | 錯誤修復               | `fix: 修正登入錯誤`        |
| `docs`     | 文件變更               | `docs: 更新 API 文檔`      |
| `style`    | 代碼格式（不影響功能） | `style: 格式化代碼`        |
| `refactor` | 代碼重構               | `refactor: 重構使用者模組` |
| `perf`     | 性能優化               | `perf: 優化圖表渲染`       |
| `test`     | 測試相關               | `test: 新增單元測試`       |
| `chore`    | 雜項任務               | `chore: 更新依賴`          |
| `ci`       | CI/CD                  | `ci: 更新 GitHub Actions`  |
| `build`    | 建置系統               | `build: 更新 Vite 配置`    |
| `revert`   | 回退變更               | `revert: 回退功能 X`       |

### 訊息撰寫建議

✅ **好的提交訊息**：

- 描述「做了什麼」而不是「怎麼做」
- 使用現在式：「新增」而非「新增了」
- 首字母小寫（繁體中文）
- 簡潔明確（5-100 字元）
- 不以句號結尾

❌ **不好的提交訊息**：

```bash
# 太模糊
git commit -m "fix: 修復問題"

# 使用過去式
git commit -m "feat: 新增了功能"

# 太長
git commit -m "feat: 新增了使用者登入功能包括密碼加密、JWT 驗證、記住我選項、忘記密碼連結等等..."

# 首字母大寫（中文）
git commit -m "feat: 新增功能"

# 以句號結尾
git commit -m "feat: 新增功能。"
```

✅ **好的提交訊息**：

```bash
git commit -m "feat: 新增使用者登入功能"
git commit -m "fix: 修復登入頁面空白問題"
git commit -m "docs: 更新 API 使用說明"
git commit -m "refactor: 優化錯誤處理邏輯"
```

---

## Pull Request 流程

### PR 標題

PR 標題應該簡潔明確，格式類似提交訊息：

```
feat: 新增深色模式功能
fix: 修復登入頁面錯誤
docs: 更新貢獻指南
```

### PR 描述模板

```markdown
## 📋 Summary

簡要描述這個 PR 做了什麼（1-3 句話）

## 🎯 Related Issues

Closes #123
Related to #456

## 🔄 Changes Made

- [ ] 新增深色模式切換功能
- [ ] 更新主題配置
- [ ] 新增相關測試
- [ ] 更新文檔

## 🧪 Testing

**測試步驟**：

1. 啟動開發伺服器
2. 進入設定頁面
3. 切換深色模式
4. 確認所有頁面顯示正常

**測試環境**：

- Browser: Chrome 120
- Node.js: 18.x
- OS: macOS 14

## 📸 Screenshots (if applicable)

![before](url)
![after](url)

## 📝 Additional Notes

其他需要審查者注意的事項

## ✅ Checklist

- [ ] 代碼遵循專案規範
- [ ] 已進行自我審查
- [ ] 代碼有適當的註釋
- [ ] 文檔已更新（如需要）
- [ ] 沒有產生新的警告
- [ ] 已新增測試證明修復有效或功能正常運作
- [ ] 新舊測試都在本地通過
- [ ] 已在本地測試所有變更
```

### PR 大小建議

- ✅ **小型 PR**（建議）：變更少於 400 行
- ⚠️ **中型 PR**：400-1000 行（需要充分理由）
- ❌ **大型 PR**：超過 1000 行（應拆分）

如果 PR 太大，請考慮拆分成多個小 PR。

---

## 代碼審查

### 審查時間

- 通常會在 1-3 個工作日內進行審查
- 如果急需審查，可以在 PR 中標註 `urgent`

### 審查標準

審查者會檢查：

- ✅ 代碼品質與可讀性
- ✅ 是否符合專案規範
- ✅ 測試覆蓋率
- ✅ 性能影響
- ✅ 安全性考量
- ✅ 向後兼容性

### 回應審查意見

- 請友善且建設性地回應審查意見
- 如果不同意某個意見，請說明理由
- 完成修改後，請回覆審查者
- 所有對話應該在解決後才關閉

---

## 常見問題

### Q: 我應該從哪裡開始？

**A**:

1. 查看標記為 `good first issue` 的 Issues
2. 查看標記為 `help wanted` 的 Issues
3. 改進文檔永遠是好的起點

### Q: 我發現了一個 Bug，應該怎麼做？

**A**:

1. 先搜尋 Issues 確認是否已有人回報
2. 如果沒有，建立新的 Issue 並詳細描述：
   - 重現步驟
   - 預期行為
   - 實際行為
   - 環境資訊（瀏覽器、作業系統等）
   - 截圖或錯誤訊息

### Q: 我可以直接在 main 分支開發嗎？

**A**: **絕對不行！** 這是專案的強制規則。所有開發都必須在功能分支上進行。Git hooks 會阻止您在 main 分支提交。

### Q: 我的提交訊息不符合格式怎麼辦？

**A**:

```bash
# 修改最後一次提交訊息
git commit --amend -m "feat: 正確的訊息格式"

# 如果已推送，需要強制推送（僅限自己的分支）
git push --force
```

### Q: 我應該使用 npm 還是 yarn？

**A**: **必須使用 pnpm**。這是專案的標準包管理器。

```bash
# ✅ 正確
pnpm install
pnpm dev

# ❌ 錯誤
npm install
yarn install
```

### Q: 我可以跳過 Git hooks 嗎？

**A**: 技術上可以（使用 `--no-verify`），但**強烈不建議**。Git hooks 存在是為了保護專案品質。如果您認為需要跳過，請先與維護者討論。

### Q: Pull Request 被拒絕了怎麼辦？

**A**:

1. 仔細閱讀審查意見
2. 根據意見進行修改
3. 在同一個 PR 中推送新的提交
4. 回覆審查者表示已完成修改

### Q: 我想貢獻新功能，應該先做什麼？

**A**:

1. 先建立一個 Feature Request Issue
2. 在 Issue 中詳細描述您的想法
3. 等待維護者確認這個功能符合專案方向
4. 獲得批准後再開始開發

---

## 獲取幫助

如果您有任何問題：

1. **查看文檔**：
   - [README.md](README.md)
   - [AGENTS.md](AGENTS.md)
   - `.opencode/skills/` 目錄

2. **搜尋 Issues**：
   - 可能已有人問過相同問題

3. **提出 Issue**：
   - 標記為 `question`

4. **聯絡維護者**：
   - GitHub: [@Ponpon55837](https://github.com/Ponpon55837)
   - Issues: [GitHub Issues](https://github.com/Ponpon55837/Lucky50/issues)

---

## 致謝

感謝所有為 Lucky50 專案做出貢獻的人！

您的貢獻讓這個專案變得更好 🎉

---

**祝您貢獻愉快！** 🚀
