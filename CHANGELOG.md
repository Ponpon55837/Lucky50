# Changelog

## [2026-07-11] 運勢歷史頁面 RWD 優化 + 日期時區修正

### FortuneLogViewer 重構 (`src/components/FortuneLogViewer.vue`)

- 手機版記錄從水平列表改為**獨立卡片佈局**，垂直堆疊更易閱讀
- 篩選面板手機版**預設收合**，點擊展開完整篩選工具
- 手機版篩選摘要行顯示 active filter tags
- `<select>` 下拉框改為 **filter chips**（買入/持有/賣出），toggle 切換
- 新增**清除確認對話框**（Teleport + 遮罩），防止誤觸清除全部記錄
- 載入中從「載入中...」文字改為 **skeleton pulse 動畫**（手機/桌面雙版本）
- `clearFilters()` 恢復預設日期範圍（6 個月）而非空字串
- 五行能量條在手機版改為水平排列 + 中文標籤（金木水火土）

### 日期時區 Bug 修正

- **根本原因**：`date.toISOString().split('T')[0]` 在 UTC+8 時區下將本地時間轉成 UTC，導致日期偏移一天
- 新增 `src/utils/date.ts` — `toLocalDateString()` 使用 `getFullYear/getMonth/getDate` 取得本地日期
- 修復 `fortune.ts`、`integratedFortune.ts`、`finmind.ts`、`dashboard.ts`、`Analytics.vue` 中所有 `toISOString().split('T')[0]` 呼叫
- FortuneLogViewer 篩選器初始值改用 `toLocalDateString()`

### 測試更新 (`src/tests/fortuneLogViewer.test.ts`)

- 從 5 個測試擴充為 **8 個測試**
- 新增：確認對話框顯示、確認後 emit、取消關閉對話框、skeleton 載入狀態
- 選擇器從 `<select>` 改為 chip button 測試
- 使用 `document.body` 存取 Teleport 渲染的對話框內容

## [2026-07-10] Vue 生態系大規模升級 (Phase 1-3)

### Phase 1: Core Vue

| Package                     | Before | After  |
| --------------------------- | ------ | ------ |
| vue                         | 3.5.22 | 3.5.39 |
| vue-router                  | 4.5.1  | 5.1.0  |
| pinia                       | 3.0.3  | 3.0.4  |
| pinia-plugin-persistedstate | 4.5.0  | 4.7.1  |
| vue-chartjs                 | 5.3.2  | 5.3.4  |
| vue-tsc                     | 3.2.2  | 3.3.7  |
| @vue/test-utils             | 2.4.6  | 2.4.11 |

**Vue Router 5 upgrade** (`src/router/index.ts`):

- `beforeEach` guard 移除已棄用的 `next()` callback，改為直接 return

### Phase 2: Vite + Build Tools

| Package             | Before  | After  |
| ------------------- | ------- | ------ |
| vite                | 4.5.14  | 8.1.4  |
| @vitejs/plugin-vue  | 4.6.2   | 6.0.7  |
| vitest              | 4.0.17  | 4.1.10 |
| @vitest/coverage-v8 | 4.0.17  | 4.1.10 |
| @vitest/ui          | 4.0.17  | 4.1.10 |
| vite-plugin-pwa     | 1.0.3   | 1.3.0  |
| workbox-build       | 7.3.0   | 7.4.1  |
| workbox-window      | 7.3.0   | 7.4.1  |
| autoprefixer        | 10.4.21 | 10.5.2 |
| postcss             | 8.5.6   | 8.5.16 |
| terser              | 5.44.0  | 5.49.0 |

**Vite 8 breaking change** (`vite.config.ts`):

- `rollupOptions.output.manualChunks` 從物件格式改為函數格式（rolldown 相容）

### Phase 3: ESLint 生態系

| Package                          | Before | After  |
| -------------------------------- | ------ | ------ |
| eslint                           | 9.39.2 | 10.6.0 |
| eslint-plugin-vue                | 9.33.0 | 10.9.2 |
| @typescript-eslint/eslint-plugin | 8.53.0 | 8.63.0 |
| @typescript-eslint/parser        | 8.53.0 | 8.63.0 |
| @vue/eslint-config-typescript    | 14.6.0 | 14.9.0 |
| @eslint/js (new)                 | —      | 10.0.1 |
| vue-eslint-parser (new)          | —      | 10.4.1 |

**eslint-plugin-vue v10 新增規則** (`src/components/ErrorModal.vue`):

- `vue/no-required-prop-with-default`: `modelValue` 和 `message` 改為 optional interface

### 其他修復

**`index.html`**:

- 加入 `meta[name="mobile-web-app-capable"]`（`apple-mobile-web-app-capable` 已棄用的替代）
- 移除重複的 Google Fonts preload

### 驗證結果

- `vue-tsc --noEmit`: ✅ 零錯誤
- `vite build`: ✅ Build 成功 (35 entries, ~21s)
- `eslint .`: ✅ 僅 4 個預先存在的舊錯誤
- `vitest run`: ✅ 46 tests passed

## [2026-07-10] Step 5-7: History page + Dev tools

### Step 5 — History page

- Created `src/views/History.vue` as a dedicated page wrapping `FortuneLogViewer`
- Added `/history` route in `src/router/index.ts`
- Added "運勢歷史" link to NavBar (desktop + mobile)
- Removed inline `FortuneLogViewer` toggle from `Dashboard.vue`

### Step 6 — Performance monitor

- Created `src/views/dev/PerformanceMonitor.vue` with record/stop/clear controls
- Route at `/dev/perf` (name: `perf-monitor`), not in NavBar

### Step 7 — API monitor

- Created `src/views/dev/ApiMonitor.vue` with status/endpoint/duration display
- Exposes `window.__apiMonitor.record()` for use anywhere in the app
- Route at `/dev/api` (name: `api-monitor`), not in NavBar

### API 監控注入

- `finmind.ts`: axios 攔截器自動記錄每次請求 (URL, method, status, duration)
- `apiCache.ts`: cache HIT/MISS 記錄到 `__apiMonitor`
- `PerformanceMonitor.vue`: 掛載 `window.__perfMonitor` API

### Style 優化

- FortuneLogViewer 全面改版：使用 `card` 類別與全站一致
- 改用 ambert 主題色 (按鈕/焦點 ring)
- 日期格式改為 `MM/DD 週W` 更簡潔
- 記錄列表改為單一容器 + 分割線，取代每個記錄獨立 card
- 完全響應式：手機版更緊湊、桌面版更舒適
- 改良統計列佈局、篩選控制項排列

### 強制自我檢查機制

- `code-standards/SKILL.md` 新增 Step 0 強制檢查區塊 (單元測試→文件更新→Skill同步)

### 驗證結果

- `vitest run`: ✅ 195 tests passed across 13 test files

## [2026-07-10] Step 8: Final UI Polish & Consistency Pass

### 頁面佈局完全統一

- **所有主頁面外層**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` 整頁寬度
- **所有頁面頂部 padding**: `py-6 sm:py-8 lg:py-12` 響應式垂直間距
- **所有頁面標題 (h1)**: `text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2`
- **所有頁面描述文字**: `text-xs sm:text-sm lg:text-base text-gray-400`
- **所有頁面頭部區塊**: `mb-6 sm:mb-8` 統一間距
- **所有頁面卡片**: 整頁寬度，無 max-w 限制（與 Dashboard、Analytics 一致）

### Dashboard.vue 更新

- 頁面標題統一為響應式大小
- 頂部 padding 統一為 `py-6 sm:py-8 lg:py-12`
- 副標題顏色改為 `text-gray-400`（統一標準）

### Analytics.vue 更新

- 頁面標題統一為響應式大小
- 頂部 padding 統一為 `py-6 sm:py-8 lg:py-12`
- 副標題顏色改為 `text-secondary`（保持一致）
- 頭部間距改為 `mb-6 sm:mb-8`

### History.vue 優化

- 移除外層 `space-y` wrapper div
- 內容與外層同級（與 Dashboard、Analytics 保持一致）
- FortuneLogViewer 組件直接放在 header 下方，整頁寬度

### Profile.vue 完全重新設計

- 移除所有 `max-w-3xl mx-auto` 寬度限制
- 卡片整頁寬度（與其他頁面一致）
- 當前設定預覽卡片：`!py-3 !px-3 sm:!py-4 sm:!px-6 mb-5 sm:mb-6`
- 編輯表單卡片：`!py-4 !px-3 sm:!py-6 sm:!px-6`
- 表單欄位：`px-2.5 sm:px-3 py-1.5 sm:py-2` 最優化的 mobile 和 desktop 平衡
- 生肖按鈕：`p-1.5 sm:p-2 text-xs` 提升 mobile 觸控效果
- 幸運顏色預覽：`w-6 h-6 sm:w-8 sm:h-8` mobile 友善尺寸
- 按鈕佈局：mobile `flex-col-reverse`（清除 → 保存），desktop `flex-row`（保存 → 清除）
- 表單分隔線：`border-t border-white/10` 視覺分隔
- Date/time 圖標：`w-4 h-4` 緊湊外觀
- Select 欄位：`focus:ring-1 focus:ring-amber-500/50` 統一焦點樣式

### FortuneLogViewer.vue 驗證

- 完全功能性和響應式確認
- 日期格式：`MM/DD 週W` desktop 和 mobile 一致，mobile 使用 `text-[11px]`
- 統計卡片：`!py-2.5 !px-3 sm:!py-3 sm:!px-6` 緊湊樣式
- 篩選卡片：響應式網格佈局，mobile/desktop 清除按鈕隱顯
- 記錄列表：clean `divide-y` 設計，hover 狀態，mobile 緊湊間距
- 分頁按鈕：mobile 全寬，desktop 內聯

### 統一的響應式系統

- **頁面級**: `py-6 sm:py-8 lg:py-12` 垂直 padding，整頁寬度卡片
- **卡片級**: `!py-3 !px-3 sm:!py-4 sm:!px-6` 或 `!py-4 !px-3 sm:!py-6 sm:!px-6` 根據內容
- **表單級**: `space-y-4 sm:space-y-5` 元素間距，`px-2.5 sm:px-3 py-1.5 sm:py-2` 輸入框
- **文字級**: `text-xs sm:text-sm lg:text-base` 標準漸進式調整

### 色彩系統統一

- 主按鈕：`bg-amber-600 hover:bg-amber-500`
- 焦點環：`focus:ring-1 focus:ring-amber-500/50`
- 次級按鈕：`bg-white/10 hover:bg-white/20`
- 徽章顏色：success emerald、warning amber、error rose

### 驗證結果

- `npm run test`: ✅ 195/195 tests passed（100% 通過）
- `npm run build`: ✅ Build 成功（11.68s）
- `vue-tsc`: ✅ TypeScript 檢查通過（除了預存的舊錯誤）
- 視覺檢查：✅ 所有四個主頁面寬度、間距、排版完全統一
  - Dashboard.vue: 全寬動態內容，無寬度限制
  - Analytics.vue: 全寬圖表和數據，無寬度限制
  - History.vue: 全寬運勢歷史列表，FortuneLogViewer 整頁寬度
  - Profile.vue: 全寬卡片容器，表單和預覽卡片整頁寬度
