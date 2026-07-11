# 農民曆智慧投資 - 0050 ETF 投資建議系統

![GitHub license](https://img.shields.io/github/license/Ponpon55837/Lucky50)
![Vue Version](https://img.shields.io/badge/vue-3.x-green)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)

> 結合傳統農民曆智慧與現代金融科技，為您的 0050 ETF 投資提供個人化建議的可視化平台

## 📋 專案概述

**農民曆智慧投資** 是一個結合傳統智慧與現代金融的投資決策平台，它將農民曆、八字命理與生肖運勢等中華文化元素，整合現代金融數據分析技術，為投資者提供個人化的元大台灣 50(0050) ETF 投資參考。

### 🎯 專案特色

- **個人化運勢分析** - 根據出生年月日、時辰與生肖計算每日投資運勢
- **姓名學五行分析** - 根據姓名筆劃自動計算五行屬性，結合八字命理
- **自動生肖推算** - 輸入生日自動計算生肖與五行屬性
- **農民曆整合** - 結合傳統農民曆的吉凶宜忌判斷
- **命理引擎插件系統** - 可擴展的命理引擎架構，支援多種命理系統
- **實時數據視覺化** - 使用 Three.js 打造沉浸式 3D 投資運勢球體
- **0050 ETF 專注** - 專門針對台灣最具代表性的 ETF 提供分析
- **現代化界面** - 響應式設計，支援多裝置使用
- **統一錯誤處理** - 完整的錯誤處理系統，提供友善的錯誤提示與恢復機制

## 🔮 命理引擎系統

本專案實作了插件式的命理引擎架構，可擴展多種命理系統進行綜合分析。

### 引擎列表

| 引擎        | 權重 | 說明                                           |
| ----------- | ---- | ---------------------------------------------- |
| 🏮 經典命理 | 30%  | 傳統五行、生肖、星座綜合運勢                   |
| 🔮 八字十神 | 25%  | 基於四柱的十神投資性格分析                     |
| ⭐ 紫微斗數 | 20%  | 十四主星的簡化投資分析（命宮、財帛宮、事業宮） |
| 🧭 風水方位 | 15%  | 五行方位與流日吉凶分析                         |

### 引擎架構

```typescript
// 引擎介面
interface MetaphysicsEngine {
  readonly name: string
  readonly description: string
  readonly version: string
  calculate(profile, date, lunarData, personalBaZi, elements): MetaphysicsResult
  getWeight(): number
  isEnabled(): boolean
}

// 引擎註冊
const registry = new MetaphysicsEngineRegistry()
registry.register(new ClassicFortuneEngine())
registry.register(new BaziTenGodsEngine())
registry.register(new ZiWeiEngine())
registry.register(new FengShuiEngine())
```

### 使用者可調整

- 啟用/停用各引擎
- 調整各引擎權重（0-100%）
- 設定儲存至 localStorage

## � 快速開始

### 環境要求

- Node.js 18+
- pnpm 包管理器

### 安裝與啟動

```bash
# 複製專案
git clone https://github.com/Ponpon55837/Lucky50.git

# 進入專案目錄
cd Lucky50

# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev
```

應用程式將在 http://localhost:3000 啟動

### 建置部署

```bash
# 建置生產版本
pnpm build

# 預覽建置結果
pnpm preview
```

## �🛠 技術架構

### 前端技術棧

- **Vue.js 3** + **TypeScript** - 現代化前端框架
- **Pinia** - Vue 3 官方推薦的狀態管理
- **Vue Router** - 單頁應用路由管理
- **TailwindCSS** - 快速響應式設計
- **Three.js** - 3D 可視化效果
- **Chart.js** - 圖表展示
- **Axios** - HTTP 請求處理

### 開發工具

- **Vite** - 快速構建工具
- **ESLint** - 程式碼品質檢查
- **Prettier** - 程式碼格式化
- **TypeScript** - 類型安全

## ⚠️ 錯誤處理系統

本專案實作了完整的統一錯誤處理系統，提供友善的錯誤提示與恢復機制。

### 核心組件

- **錯誤類型定義** (`src/types/error.ts`) - 完整的錯誤分類、嚴重程度與錯誤代碼
- **錯誤處理 Composable** (`src/composables/useErrorHandler.ts`) - 統一的錯誤處理邏輯
- **Error Boundary** (`src/components/ErrorBoundary.vue`) - 捕獲組件錯誤的邊界組件
- **Error Modal** (`src/components/ErrorModal.vue`) - 錯誤提示彈窗組件

### 使用範例

```typescript
import { useErrorHandler } from '@/composables/useErrorHandler'

// 在 Store 或組件中使用
const { handleAsyncError, withErrorHandler } = useErrorHandler()

// 方法 1: 使用 withErrorHandler 包裝
const loadData = withErrorHandler(async () => {
  const data = await fetchData()
  return data
})

// 方法 2: 手動處理錯誤
try {
  await fetchData()
} catch (error) {
  handleAsyncError(error)
}
```

詳細使用說明請參閱 [錯誤處理文檔](docs/ERROR_HANDLING.md)。

## 📊 資料來源

### FinMind API

我們使用 **FinMind** 作為主要的金融資料來源，這是一個提供超過 50 種台灣金融開源數據的平台，每天更新資料。

#### 0050 ETF 資料獲取示例

```typescript
import { FinMindService } from '@/services/finmind'

// 取得 0050 ETF 歷史資料
const etfData = await FinMindService.getETFData(
  '2024-01-01', // 開始日期
  '2024-12-31' // 結束日期
)
```

### 農民曆計算

```typescript
import { FortuneService } from '@/services/fortune'

// 計算個人每日運勢
const fortune = FortuneService.calculateDailyFortune(
  userProfile, // 個人資料
  new Date() // 指定日期
)
```

## 🏗 專案結構

```
Lucky50/
├── .opencode/              # OpenCode 配置與 Skills
│   └── skills/            # AI 開發技能指引
│       ├── README.md       # Skills 總覽
│       ├── code-standards/  # 程式碼規範與開發最佳實踐
│       ├── git-workflow/   # Git 工作流程規範
│       ├── vue/           # Vue 3 開發指南
│       └── github/        # GitHub Copilot 整合指南
├── docs/                  # 文檔
│   └── ERROR_HANDLING.md  # 錯誤處理系統文檔
├── openspec/              # OpenSpec 變更提案
│   └── changes/           # 變更提案與規格
├── public/                # 靜態資源
├── src/
│   ├── assets/           # 樣式和靜態資源
│   ├── components/       # Vue 組件
│   │   ├── charts/      # 圖表組件
│   │   │   ├── PriceChart.vue          # 價格走勢圖
│   │   │   ├── VolumeChart.vue         # 成交量圖
│   │   │   ├── ElementRadarChart.vue   # 五行雷達圖
│   │   │   └── EngineScoresChart.vue   # 引擎分數橫條圖
│   │   ├── three/       # Three.js 3D 組件
│   │   │   ├── Stock3DVisualization.vue
│   │   │   ├── Fortune3DVisualization.vue
│   │   │   ├── Lunar3DVisualization.vue
│   │   │   └── Technical3DVisualization.vue
│   │   ├── layout/      # 佈局組件
│   │   │   ├── NavBar.vue
│   │   │   └── Footer.vue
│   │   ├── ui/          # UI 組件
│   │   │   ├── Toast.vue
│   │   │   ├── ToastContainer.vue
│   │   │   └── LazyImage.vue
│   │   ├── EngineSettingsCard.vue  # 命理引擎設定
│   │   ├── TenGodsCard.vue         # 八字十神卡片
│   │   ├── ZiWeiCard.vue           # 紫微斗數卡片
│   │   ├── FengShuiCard.vue        # 風水方位卡片
│   │   ├── ErrorBoundary.vue       # 錯誤邊界
│   │   ├── ErrorModal.vue          # 錯誤彈窗
│   │   ├── FortuneCard.vue         # 運勢卡片
│   │   ├── FortuneLogViewer.vue    # 運勢歷史記錄
│   │   ├── FortuneOrb.vue          # 3D 運勢球體
│   │   ├── LunarCalendarCard.vue   # 農民曆卡片
│   │   └── ThemeToggle.vue         # 主題切換
│   ├── composables/     # Composables
│   │   ├── useTheme.ts         # 主題切換
│   │   ├── useToast.ts         # Toast 通知
│   │   └── useErrorHandler.ts  # 錯誤處理
│   ├── services/        # 服務層
│   │   ├── engines/            # 命理引擎系統
│   │   │   ├── types.ts        # 引擎介面定義
│   │   │   ├── registry.ts     # 引擎註冊中心
│   │   │   ├── classic.ts      # 經典命理引擎
│   │   │   ├── baziTenGods.ts  # 八字十神引擎
│   │   │   ├── ziWei.ts        # 紫微斗數引擎
│   │   │   ├── fengShui.ts     # 風水方位引擎
│   │   │   └── index.ts        # 統一匯出
│   │   ├── integratedFortune.ts  # 整合運勢計算（含引擎加權）
│   │   ├── fortune.ts            # 基礎運勢計算
│   │   ├── lunar.ts              # 農曆服務
│   │   ├── finmind.ts            # FinMind 金融數據
│   │   ├── taiwanStock.ts        # 台股交易服務
│   │   ├── fortuneStore.ts       # IndexedDB 運勢歷史
│   │   └── apiCache.ts           # API 快取
│   ├── stores/          # Pinia 狀態管理
│   │   ├── user.ts              # 用戶狀態
│   │   ├── dashboard.ts         # 儀表板狀態
│   │   ├── analytics.ts         # 數據分析狀態
│   │   └── investment.ts        # 投資數據狀態
│   ├── utils/           # 工具函數
│   │   ├── tenGods.ts           # 十神計算工具
│   │   ├── zodiac.ts            # 生肖/五行計算
│   │   └── date.ts              # 日期工具
│   ├── types/           # TypeScript 類型定義
│   │   ├── index.ts             # 主要類型定義
│   │   └── error.ts             # 錯誤類型定義
│   ├── views/           # 頁面組件
│   │   ├── Home.vue             # 首頁
│   │   ├── Dashboard.vue        # 投資儀表板
│   │   ├── Analytics.vue        # 數據分析
│   │   ├── History.vue          # 運勢歷史
│   │   ├── Profile.vue          # 個人設定
│   │   └── dev/                 # 開發工具頁面
│   │       ├── PerformanceMonitor.vue
│   │       └── ApiMonitor.vue
│   ├── tests/           # 單元測試（23 個測試檔，324 個測試）
│   └── router/          # 路由配置
├── .github/
│   └── copilot-instructions.md # GitHub Copilot 指引
├── tailwind.config.js   # TailwindCSS 配置
├── vite.config.ts       # Vite 配置
└── package.json
```

## 🔧 開發設置

### 🤖 GitHub Copilot Skills 整合

本專案支援 **GitHub Copilot 自動技能載入**，提供智慧化開發輔助：

#### 自動載入的 Skills

| Skill            | 觸發關鍵詞                                                | 功能說明                                                  |
| ---------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `agent`          | agent, AI, 智慧助理, 功能說明                             | AI 智慧助理功能說明與技能整合指南                         |
| `code-standards` | code-standards, coding, development, 規範, 開發, 最佳實踐 | 程式碼規範與開發最佳實踐（Vue 3、TypeScript、技術棧標準） |
| `git-workflow`   | git, commit, branch, pr, 工作流程                         | Git 分支管理與工作流程規範                                |
| `vue`            | vue, component, composable, 響應式                        | Vue 3 Composition API 開發指南                            |
| `github`         | github, copilot, skill, README, 整合                      | GitHub Copilot 整合與 README 強制維護                     |

#### 使用方式

**在 GitHub Copilot 中，AI 會自動根據您的請求載入對應技能：**

```bash
# 範例 1：建立組件
「幫我建立一個使用者認證組件」
# 自動載入：code-standards + vue

# 範例 2：提交代碼
「幫我提交這次的變更」
# 自動載入：git-workflow + github/README.md

# 範例 3：更新文檔
「更新 README.md 說明」
# 自動載入：github/README.md 強制維護機制
```

**詳細說明請參考：[`.opencode/skills/`](.opencode/skills/) 目錄**

### Git Hooks 安裝

本專案使用 Git Hooks來確保代碼品質和工作流程規範。在開始開發前，請先安裝 Git hooks：

```bash
# 安裝 Git hooks
./.githooks/install.sh
```

### Git Hooks 說明

本專案包含以下 Git hooks：

#### 1. Pre-commit Hook

- **功能**：防止在受保護分支（main, master, develop等）直接提交
- **功能**：驗證分支命名規範（警告模式）
- **格式**：`<type>/<developer-name>/<feature-description>`
- **範例**：
  - ✅ `feat/lip/add-user-auth`
  - ✅ `fix/lip/resolve-bug-123`
  - ❌ `my-feature`（格式不正確）

#### 2. Commit-msg Hook

- **功能**：驗證提交訊息格式是否符合 Conventional Commits 規範
- **模式**：警告模式（不會阻止提交，但會顯示建議）
- **格式**：`<type>: <description>` 或 `<type>(scope): <description>`
- **範例**：
  - ✅ `feat: 新增使用者登入功能`
  - ✅ `fix: 修復登入頁面顯示錯誤`
  - ✅ `docs: 更新 README 安裝說明`
  - ✅ `feat(api): 新增使用者 API 端點`
  - ❌ `Add login feature`（缺少類型）

#### 允許的提交類型

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
- `revert` - 回退變更

### 測試 Git Hooks

安裝完成後，可以運行自動化測試來驗證：

```bash
# 運行 Git hooks 測試腳本
./.githooks/test-hooks.sh
```

### 開發工作流程

1. **檢查當前分支**：

   ```bash
   git status
   ```

2. **建立功能分支**（如果在 main）：

   ```bash
   git checkout -b <type>/<your-name>/<feature-description>
   # 例如：git checkout -b feat/lip/add-new-feature
   ```

3. **進行開發並測試**：

   ```bash
   pnpm dev  # 啟動開發伺服器
   # 進行代碼修改...
   ```

4. **提交變更**：

   ```bash
   git add .
   git commit -m "feat: 你的提交訊息"
   ```

5. **推送到遠端**：

   ```bash
   git push -u origin <your-branch-name>
   ```

6. **建立 Pull Request** 在 GitHub 上

### 相關文檔

- **開發規範**：`.opencode/skills/lucky50-dev/SKILL.md`
- **Git 工作流程**：`.opencode/skills/git-workflow/SKILL.md`
- **AI 助手規則**：`AGENTS.md`
- **Git Hooks 詳細說明**：`.githooks/README.md`

## ⚠️ 免責聲明

- 本系統僅供參考，不構成投資建議
- 投資有風險，請謹慎評估自身財務狀況
- 運勢分析基於傳統文化，僅供娛樂參考
- 建議投資前諮詢專業理財顧問

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！在開始貢獻前，請詳細閱讀我們的 [貢獻指南](CONTRIBUTING.md)。

### 快速開始

1. Fork 本專案
2. 安裝 Git hooks: `./.githooks/install.sh`
3. 建立功能分支: `git checkout -b <type>/<your-name>/<feature-description>`
4. 提交變更: `git commit -m '<type>: <description>'`
5. 推送到分支: `git push origin <your-branch>`
6. 提交 Pull Request

詳細步驟請參閱 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 📄 授權條款

本專案使用 [MIT License](LICENSE) 授權

## 📞 聯絡資訊

- **開發者**: Ponpon55837
- **專案連結**: https://github.com/Ponpon55837/Lucky50
- **問題回報**: [GitHub Issues](https://github.com/Ponpon55837/Lucky50/issues)

---

⭐ 如果這個專案對您有幫助，歡迎給個 Star！
