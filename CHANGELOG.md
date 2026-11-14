# Changelog

## [1.1.0] - 2026-11-14 命理計算依傳統規則重寫

### 修正：時段建議每天都一樣

- 時辰吉凶原本只用出生年生肖查固定表，60 天內 45–55 天結果相同。改為「黃道黑道十二神 + 日破 + 本命沖合害」，隨日支每天變化（`src/utils/almanac.ts`）
- 農民曆快取鍵原本用 UTC 日期，台灣凌晨 0–8 點會取到前一天的資料，改用本地日期
- 節氣、彭祖百忌、九星原本因呼叫不存在的方法而永遠是空字串，已修正

### 命理引擎重寫

- 經典命理：原本固定回傳 50 分。改為擇日評分（值日天神、建除十二神、宜忌、日支與太歲對本命的沖合害）
- 八字十神：原本只數天干、分數一輩子不變。改以藏干定日主強弱與喜忌，再看流日干支十神
- 紫微斗數：原本以「月 × 2 + 日 ÷ 15」湊位置、十四主星平均分三宮，且誤用當天日期。改為真實安星（命宮、五行局、十四主星、輔星），以本命與流日四化評分
- 風水方位：原本把流年生肖當成使用者生肖、中英文五行比對永遠不相等。改用當日神位、三煞方與納音生剋
- 整合分數：移除寫死的「好生肖年」名單與失效的星座加成；投資分數為引擎加權後還原起伏尺度的結果
- 命盤：四柱改用節氣與實際時辰；生肖改以農曆年為界（原以西元年估算），本命五行改為年柱納音（原對照表十項錯八項）
- 姓名學：筆畫改用康熙筆畫表（Unicode Unihan 18.0，20,992 字），取代 90 字對照表加碼點估算

### 數據分析

- 策略回測原本是把買入持有的數字乘上固定倍率（農民曆策略直接多 15–25%）。改為以實際收盤價逐日模擬，如實呈現優於或落後買入持有
- 「運勢與績效相關性」改為各分數區間當日的實際平均漲跌與收紅比例
- 逐日評分改為分段在背景計算（`src/utils/scheduling.ts`），切到五年區間不再凍結畫面；計算失敗只影響回測區塊並顯示提示
- 收盤價為 0 或缺漏的資料列略過，不再出現 `NaN%`

### 其他修正

- 左側選單在首次進入某頁時內容左右跳動：改以 `overflow-y: scroll` 固定保留捲軸
- Service worker 改用 `virtual:pwa-register`，改版後立即套用，不再先看到一次舊版；移除被建置覆蓋的手寫 `public/sw.js`
- 風水卡片同一方位同時列在吉方與凶方；財神落在凶方時，儀表板的財位也不再與凶方相同
- 引擎設定殘缺（例如 localStorage 被手動改過）時略過缺漏欄位，分數不會變成 NaN
- 不存在的出生日期（如 2 月 31 日）直接拒絕，不再被當成另一天排盤
- 紫微斗數：財帛宮無主星時，借來的對宮財星不再計為「坐財帛宮」

### 程式碼

- 新增 `src/utils/ganzhi.ts` 作為干支五行的唯一來源，移除散落五個檔案的重複對照表
- 引擎共用 `BaseEngine`、`ENGINE_CATALOG`、`useEngineResult`；移除無引用的 `fortune.ts` 與三套互不一致的吉時表
- 基準分與分數上下限收斂到 `almanac.ts` 的 `BASE_SCORE`、`clampScore`；擇日加減項收斂到 `assessDay`
- 八字與紫微引擎把與日期無關的本命盤計算以命盤為鍵快取（WeakMap），逐日評分只算流日部分
- 移除服務與元件中的除錯輸出（含印出姓名與生日的 log）
- CI 新增格式檢查、警告視為失敗的 lint、相依套件稽核；新增 `pnpm check`
- 測試 416 → 415 個（汰換舊測試並新增），新增與 lunar-javascript 的交叉驗證

### 已知限制

- 紫微斗數不含星曜亮度與雜曜；康熙筆畫少數字（如「蕭」「戴」）與部分姓名學書籍相差一畫
- 台股休市日曆只到 2025 年
- 夜子時（23 點後）出生者，日柱與紫微的農曆月日都算當日，不提前換日（流派差異）

## [1.0.2] - 2026-11-14 選單跳動修正與相依套件資安更新

### 修正

- 桌面版左側書脊選單切換頁面時畫面左右跳動：短頁（無捲軸）與長頁切換造成內容寬度變化 15px，`html` 加上 `scrollbar-gutter: stable` 固定預留捲軸寬度
- 手機選單改為覆蓋式並加入捲軸展開動畫、宣紙霧面遮罩
- chart.js 4.6 型別中 `parsed.y` 可能為 `null`，tooltip 改以 `?? 0` 防護

### 資安與相依套件

- `pnpm audit` 由 109 項（54 high、47 moderate、8 low）降為 1 項 low
- 同主版本內更新全部套件，重點：axios 1.12 → 1.21、vue 3.5.45、vue-router 5.5、vite 8.3.8、postcss 8.5.32、chart.js 4.6.1
- happy-dom 20 → 21（僅測試環境，修補兩項 high）
- `pnpm-workspace.yaml` 以 overrides 將間接相依 glob 升至 ^14.0.2、minimatch 升至 ^11.0.1
- 剩餘：`deepmerge` 4.3.1（low，原型汙染）上游尚無修補版本，僅存在於 workbox-build 建置流程，不進入前端 bundle

### 文件

- README 改為農民曆風格，附亮暗色與手機版截圖

## [1.0.1] - 2026-11-14 農民曆風格 UI/UX 改版

### 設計系統 (`tailwind.config.js`, `src/assets/style.css`)

- Tailwind 色彩改綁 CSS 變數 tokens（紙／墨中性色、朱紅與金黃亮點色），深淺色主題自動切換，移除 `:root.light` 覆寫與 `isDark` class 三元式
- 語意色依台股慣例：漲／吉為紅、跌／凶為綠
- 字型：Noto Sans TC、Noto Serif TC、霞鶩文楷、IBM Plex Mono

### 儀表板與首頁

- 今日籤（籤等由投資分數決定、可再搖一次）、十二時辰吉凶輪（休市改看下一個交易日）、五行相生圖（月令旺衰）、SVG 走勢圖標示吉日、宜忌表與沖煞／財神／喜神
- 桌面直排書脊導覽、手機下拉選單；首頁以農民曆封面取代 3D 運勢球
- 新 favicon 與 PWA 圖示（朱紅印章「福」）

### 程式碼

- 純函式 `src/utils/almanac.ts`、`src/utils/chart.ts`（單趟 O(n) 計算、Set／Map 查表）
- `LunarData` 新增沖煞、煞方、財神、喜神、值日天神；`lunar.ts` 合併重複的建構與重試邏輯，生肖轉繁體
- 十神／紫微／風水卡片共用 `EngineCard` 與 `buildBirthChart`，並跟隨儀表板日期
- 移除未使用的 `FortuneCard`、`LunarCalendarCard`、`ElementRadarChart`、`FortuneOrb`、`critical.css`、`preloader.ts`

### Bug Fix

- 生肖為簡體字導致風水六合／三合查表失效
- `ErrorBoundary` 全域監聽未移除；月亮 3D 星星閃爍原地相乘逐漸變暗
- `index.html` 與 `preloader.ts` 錯誤的 preload 造成 console 警告
- 條款彈窗、手機選單、時辰輪的鍵盤與 Esc 操作

### Tests

- 新增 `almanac.test.ts`、`chart.test.ts`；29 個測試檔、416 個測試全數通過

## [2026-09-27] 性能優化：Pinia Colada 查詢快取 + O(n) 演算法

### Pinia Colada (`src/queries/index.ts`, `src/stores/dashboard.ts`, `src/main.ts`)

- 新增 `@pinia/colada`，ETF 行情 / 農民曆 / 整合運勢改由 query cache 管理
- 查詢鍵：`['etf','0050',start,end]`、`['lunar',day]`、`['fortune',profileHash,day,enginesHash]`
- Dashboard ↔ Analytics 切換命中快取；同 key 並發請求去重；`force` 參數強制重抓
- 新增 `loadETFRange()`、`invalidateFortune()`；Analytics 不再直接呼叫 FinMindService
- 以請求序號避免舊回應覆蓋新資料；移除多餘的 `checkAPIStatus()` 探測請求

### 演算法 (`src/utils/indicators.ts`, `src/stores/analytics.ts`)

- KD 指標改為正確的 9-3-3 計算（原 D 值誤用收盤均價），單調佇列 O(n) 求滑動極值
- MACD 改用真正 EMA；波動率改 Welford 單次掃描；分佈/RSI/布林/回撤皆單次掃描
- 排序前先 O(n) 檢查；分拆日期改 ISO 字串比較

### Bug Fix

- `IntegratedFortuneService` 快取鍵只含出生日期 → 改為完整個人資料雜湊
- 歷史記錄 `userProfileHash` 誤用字串長度 → 改 FNV-1a (`src/utils/hash.ts`)
- Dashboard `engine-settings-changed` 監聽未移除造成累積
- FinMind 模擬資料反序導致最新價格取錯；`getRealTimePrice()` 取最新一筆
- `apiCache.cached()` 加入 single-flight

### Tests

- 新增 `indicators.test.ts`（含 KD 暴力解對照）、`hash.test.ts`、Colada 快取與 single-flight 測試
- 27 個測試檔、378 個測試全數通過

## [2026-07-11] 引擎結果寫入歷史 + 運勢記錄卡片重設計 + 修復

### Bug Fix: classic.ts 缺少 engineId

- `ClassicFortuneEngine.calculate()` 回傳值補上 `engineId: 'classic'`
- 修復 Analytics 頁面經典命理權重顯示為 0% 的問題

### Bug Fix: Analytics 頁面 hardcoded 權重

- `ENGINE_WEIGHTS` 改為從 `metaphysicsRegistry` 動態讀取，反映使用者即時調整

### EngineSettingsCard 權重加總指示器

- 新增權重加總條圖 + 狀態文字（100% 完美 / 接近 / 偏差）
- 條圖 0-150% 範圍，超過 150% 截斷顯示
- 顏色：綠色 100%、琥珀色 80-120%、紅色超出範圍

### 歷史記錄引擎資料 (`src/services/integratedFortune.ts`, `src/types/history.ts`)

- `EngineResultSummary` 型別：engineId、engineName、score、weight
- `FortuneRecord` 新增 `enginesResults` 與 `engineWeightedScore` 欄位
- `recordFortuneHistory()` 計算時從 registry 取得各引擎權重，一併寫入歷史

### FortuneLogViewer 卡片佈局重設計 (`src/components/FortuneLogViewer.vue`)

**Mobile：**

- 分數圓形放大至 11×11，日期/時間/建議徽章左側排列
- 五行能量條改為垂直長條 + 底部標籤（scale 0.28）
- 引擎分數改為個別 chips（圖標 + 分數 + 權重%），加權分數獨立 badge
- 農曆摘要行數從 1 行改為 2 行

**Desktop：**

- 三欄佈局：左側分數圓形 + 建議徽章 | 中間日期/五行/摘要 | 右側引擎分數
- 五行能量條加高（scale 0.3），底部標籤
- 引擎分數 chips + 加權分數置於右側
- 農曆摘要置於中欄底部

---

## [2026-07-11] 命理引擎整合至核心運勢計算 + Profile 雙欄重構

### 命理引擎整合 (`src/services/engines/`)

- `MetaphysicsEngine` 介面新增 `engineId` 屬性，用於 localStorage 設定對照
- 4 個引擎（classic, bazi-ten-gods, zi-wei, feng-shui）皆加入 `engineId`
- `MetaphysicsEngineRegistry` 改用 `engineId` 查詢（`getEngineById`），新增 `loadFromStorage()` 從 localStorage 載入設定
- `IntegratedFortuneService` 首次計算時自動註冊所有引擎，每次計算前從 localStorage 載入最新設定
- `calculateFortuneScores()` 新增 `engineWeightedScore` 參數，引擎加權分數轉換為 -25～+25 調整值融入 overallScore、investmentScore、wealthScore
- `IntegratedFortuneData` 新增 `enginesResults` 與 `engineWeightedScore` 欄位
- 聚合引擎的 warnings、opportunities、luckyDirection、avoidDirection 至主運勢資料

### EngineSettingsCard 聯動 (`src/components/EngineSettingsCard.vue`)

- 儲存設定後呼叫 `IntegratedFortuneService.clearCache()` 清除快取
- dispatch `engine-settings-changed` 自定義事件通知其他元件

### Dashboard 即時更新 (`src/views/Dashboard.vue`)

- 監聽 `engine-settings-changed` 事件，設定變更後自動重新載入運勢資料

### Profile 頁面雙欄重構 (`src/views/Profile.vue`)

- 左側：個人資料表單（姓氏、名字、生日、生肖、五行等）
- 右側：EngineSettingsCard（命理引擎開關與權重調整）
- RWD：`lg:grid-cols-2` 桌面左右並排，手機垂直堆疊

### 測試更新 (`src/tests/metaphysicsEngine.test.ts`)

- MockEngine 加入 `engineId` 屬性
- 新增 `loadFromStorage` 測試（2 個）
- 新增 `aggregateAdvice` 測試
- 所有 `setEngineEnabled`/`setEngineWeight` 改用 engineId
- ClassicFortuneEngine 測試更新（名稱從 'classic' 改為 '經典命理'）
- 324 tests 全部通過 ✅

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
