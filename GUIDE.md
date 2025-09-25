# 農民曆智慧投資系統 - 快速開始指南

## 🚀 快速啟動

### 環境要求

- Node.js 18+
- pnpm 包管理器

### 安裝依賴

```bash
pnpm install
```

### 啟動開發伺服器

```bash
pnpm dev
```

應用程式將在 `http://localhost:3000` 啟動

## 📁 專案結構

```
src/
├── assets/          # 靜態資源和全域樣式
├── components/      # Vue 元件
│   ├── layout/     # 佈局元件 (NavBar, Footer)
│   └── FortuneOrb.vue # 3D 運勢球體元件
├── services/       # API 服務
│   ├── finmind.ts  # FinMind 金融數據 API
│   └── fortune.ts  # 農民曆運勢計算服務
├── stores/         # Pinia 狀態管理
│   ├── user.ts     # 用戶資料狀態
│   └── investment.ts # 投資數據狀態
├── types/          # TypeScript 類型定義
├── views/          # 頁面元件
│   ├── Home.vue       # 首頁
│   ├── Dashboard.vue  # 投資儀表板
│   ├── Profile.vue    # 個人設定
│   └── Analytics.vue  # 數據分析
└── router/         # Vue Router 配置
```

## 🎯 主要功能

### 1. 個人化設定

- 前往 `/profile` 頁面
- 輸入個人資料（姓名、出生日期、時間、生肖）
- 系統自動計算五行屬性和幸運顏色

### 2. 投資儀表板

- 前往 `/dashboard` 頁面
- 查看今日投資運勢
- 監控 0050 ETF 即時價格
- 獲取時辰投資建議

### 3. 數據分析

- 前往 `/analytics` 頁面
- 查看歷史績效回測
- 分析運勢與投資相關性
- 技術指標展示

## 🛠 技術架構

- **前端框架**: Vue 3 + TypeScript
- **狀態管理**: Pinia
- **路由管理**: Vue Router
- **樣式框架**: TailwindCSS
- **3D 視覺化**: Three.js
- **圖表庫**: Chart.js
- **HTTP 客戶端**: Axios
- **農民曆**: lunar-javascript

## 📊 數據來源

- **FinMind API**: 台灣股市數據
- **農民曆計算**: 基於傳統曆法和五行理論

## 🎨 自訂主題

專案使用客製化的 Tailwind 配色方案：

- `gold-*`: 金色系列
- `jade-*`: 翡翠色系列
- 傳統中式色彩搭配

## 📝 開發指令

```bash
# 開發模式
pnpm dev

# 建置專案
pnpm build

# 預覽建置結果
pnpm preview

# 程式碼檢查
pnpm lint

# 程式碼格式化
pnpm format
```

## ⚠️ 注意事項

1. 本系統僅供參考，不構成投資建議
2. 投資有風險，請謹慎評估自身財務狀況
3. FinMind API 可能需要註冊和 API Key
4. 建議在實際投資前諮詢專業理財顧問

## 🔧 環境變數

創建 `.env.local` 文件並設定：

```env
VITE_FINMIND_API_URL=https://api.finmindtrade.com/api/v4
VITE_FINMIND_API_TOKEN=your_api_token_here
```

## 🚀 部署

建議使用以下平台部署：

- Vercel
- Netlify
- GitHub Pages

建置指令：`pnpm build`

---

**開發團隊**: 農民曆智慧投資系統
**版本**: 1.0.0
**最後更新**: 2024年9月
