# 農民曆智慧投資 - 0050 ETF 投資建議系統

![GitHub license](https://img.shields.io/github/license/Ponpon55837/Lucky50)
![Vue Version](https://img.shields.io/badge/vue-3.x-green)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)

> 結合傳統農民曆智慧與現代金融科技，為您的 0050 ETF 投資提供個人化建議的可視化平台

## 📋 專案概述

**農民曆智慧投資** 是一個創新的投資決策輔助平台，它將傳統中華文化中的農民曆、八字命理與生肖運勢，結合現代金融數據分析，為投資者提供個人化的元大台灣 50(0050) ETF 投資建議。

### 🎯 專案特色

- **個人化運勢分析** - 根據出生年月日、時辰與生肖計算每日投資運勢
- **農民曆整合** - 結合傳統農民曆的吉凶宜忌判斷
- **實時數據視覺化** - 使用 Three.js 打造沉浸式 3D 投資運勢球體
- **0050 ETF 專注** - 專門針對台灣最具代表性的 ETF 提供分析
- **現代化界面** - 響應式設計，支援多裝置使用
- **統一錯誤處理** - 完整的錯誤處理系統，提供友善的錯誤提示與恢復機制

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
├── .opencode/              # OpenCode 配置
│   └── skills.md          # 專案開發規範與技能指南
├── docs/                  # 文檔
│   └── ERROR_HANDLING.md  # 錯誤處理系統文檔
├── public/                # 靜態資源
├── src/
│   ├── assets/           # 樣式和靜態資源
│   ├── components/       # Vue 組件
│   │   ├── layout/      # 佈局組件
│   │   ├── charts/      # 圖表組件
│   │   ├── three/       # Three.js 3D 組件
│   │   ├── ui/          # UI 組件
│   │   ├── ErrorBoundary.vue # 錯誤邊界組件
│   │   ├── ErrorModal.vue    # 錯誤彈窗組件
│   │   └── FortuneOrb.vue    # 3D 運勢球體
│   ├── composables/     # Composables
│   │   ├── useTheme.ts         # 主題切換
│   │   ├── useToast.ts         # Toast 通知
│   │   └── useErrorHandler.ts  # 錯誤處理
│   ├── services/        # API 服務層
│   │   ├── finmind.ts   # 金融數據服務
│   │   ├── fortune.ts   # 運勢計算服務
│   │   └── lunar.ts     # 農曆服務
│   ├── stores/          # Pinia 狀態管理
│   │   ├── user.ts      # 用戶狀態
│   │   └── investment.ts # 投資數據狀態
│   ├── types/           # TypeScript 類型定義
│   │   ├── error.ts     # 錯誤類型定義
│   │   └── index.ts     # 主要類型定義
│   ├── views/           # 頁面組件
│   │   ├── Home.vue     # 首頁
│   │   ├── Dashboard.vue # 投資儀表板
│   │   ├── Profile.vue   # 個人設定
│   │   └── Analytics.vue # 數據分析
│   └── router/          # 路由配置
├── .github/
│   └── copilot-instructions.md # GitHub Copilot 指引
├── tailwind.config.js   # TailwindCSS 配置
├── vite.config.ts      # Vite 配置
└── package.json
```

## ⚠️ 免責聲明

- 本系統僅供參考，不構成投資建議
- 投資有風險，請謹慎評估自身財務狀況
- 運勢分析基於傳統文化，僅供娛樂參考
- 建議投資前諮詢專業理財顧問

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 本專案
2. 創建功能分支: `git checkout -b feature/AmazingFeature`
3. 提交變更: `git commit -m 'Add some AmazingFeature'`
4. 推送到分支: `git push origin feature/AmazingFeature`
5. 提交 Pull Request

## 📄 授權條款

本專案使用 [MIT License](LICENSE) 授權

## 📞 聯絡資訊

- **開發者**: Ponpon55837
- **專案連結**: https://github.com/Ponpon55837/Lucky50
- **問題回報**: [GitHub Issues](https://github.com/Ponpon55837/Lucky50/issues)

---

⭐ 如果這個專案對您有幫助，歡迎給個 Star！
