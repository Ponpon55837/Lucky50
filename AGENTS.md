<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Project State

## Completed

- **Step 1**: OpenCode config (opencode.json, tools)
- **Step 2**: Base optimizations (dashboard, apiCache, errorHandler, analytics)
- **Step 3**: IndexedDB history store (types, fortuneStore, 100-record in-memory cache, dedup by date+userProfileHash)
- **Step 4**: Auto-record fortune calculation results to IndexedDB
- **Step 5**: History page at `/history` using `FortuneLogViewer` component (filters, pagination 30/page, search hints, stats); removed inline toggle from Dashboard
- **Step 6**: Performance monitor page at `/dev/perf` (developer tool, not in NavBar)
- **Step 7**: API monitor page at `/dev/api` (developer tool, not in NavBar)
- **Step 8**: Final UI Polish & Consistency Pass — All 4 main pages unified layout (full-width cards, responsive spacing), 195 tests pass ✅
- **Step 9**: 命理引擎架構 (MetaphysicsEngine interface + registry, ClassicFortuneEngine, BaziTenGodsEngine, ZiWeiEngine, FengShuiEngine, EngineSettingsCard)
- **Step 10**: 引擎整合至核心 — registry 設定同步 localStorage，引擎加權分數融入 integratedFortune 投資/整體/財運分數，EngineSettingsCard 儲存觸發 Dashboard 即時重算，Profile 雙欄重構 ✅
- **Step 11**: 引擎結果寫入歷史 + 運勢記錄卡片重設計 + Bug Fixes — `recordFortuneHistory()` 保存 enginesResults + engineWeightedScore，FortuneLogViewer mobile/desktop 卡片佈局全面翻新，修復 classic.ts 缺少 engineId 導致 Analytics 權重 0%，EngineSettingsCard 新增權重加總指示器 ✅

- **Step 12**: 性能優化 — Pinia Colada 查詢快取（`src/queries/`），dashboard store 改用 query cache；`src/utils/indicators.ts` O(n) 技術指標（KD 單調佇列、Welford），修正 KD/MACD 計算、運勢快取鍵與 profileHash 碰撞、Dashboard listener 洩漏 ✅
- **Step 13**: 農民曆風格 UI 改版（`openspec/changes/update-almanac-ui-redesign`）— 設計 tokens（CSS 變數 + Tailwind 語意色，漲紅跌綠）、儀表板今日籤／十二時辰輪／五行相生圖／SVG 走勢吉印、直排書脊導覽、首頁農民曆封面；純函式 `src/utils/almanac.ts`、`src/utils/chart.ts` ✅

- **Step 14**: 命理計算依傳統規則重寫（`openspec/changes/update-fortune-engine-accuracy`）— `src/utils/ganzhi.ts` 為干支五行唯一來源；時辰改用黃道黑道十二神；四個引擎依擇日、日主喜忌、紫微安星與四化、納音生剋重寫並列出加減分由來；`buildBirthChart` 節氣四柱；康熙筆畫姓名學；`src/utils/backtest.ts` 真實回測（`src/utils/scheduling.ts` 分段計算不卡畫面）；CI 加格式檢查與相依稽核 ✅
- **Step 15**: 數據分析頁 3D 圖解改版（`openspec/changes/update-analytics-3d-scenes`）— 共用舞台 `SceneStage`（`src/utils/three-scene.ts`：token 色票、霧面打光、自動框景、HTML 標籤、hover／拖曳、按需重繪、捲出視窗暫停、完整釋放）＋ `useSceneStage`、`SceneCard`；四個場景改為 K 線、五行能量、二十四節氣輪、技術指標量規；節氣改用實際資料；純函式 `src/utils/sceneLayout.ts`、`src/utils/solarTerms.ts`；移除 `@tweenjs/tween.js` ✅

- **Step 16**: 技術指標依台灣券商慣例重寫（`openspec/changes/update-technical-indicators`）— `src/utils/indicators.ts` 改為回傳序列的純函式（暖機期為 null；KD(9,3,3)、MACD(12,26,9)、RSI(6,12) Wilder、布林、SAR、DMI／ADX、乖離率、威廉 %R、CCI、ATR、OBV、52 週區間、期間報酬）；`src/utils/priceAdjust.ts` 還原分割與除息（係數來自 FinMind 分割與除權息結果表）；`src/utils/technical.ts` 技術面快照、判讀與列出依據的綜合訊號；技術指標固定用約 800 天日 K、只收真實行情；`TechnicalPanel.vue` 取代技術指標摘要；休市日曆依證交所公告更新為 2024–2027 年，超出涵蓋年度會標示；數值與 toalpha.tw 對照一致 ✅

## Routes

| Path         | Name         | NavBar     |
| ------------ | ------------ | ---------- |
| `/`          | home         | 首頁       |
| `/dashboard` | dashboard    | 投資儀表板 |
| `/history`   | history      | 運勢歷史   |
| `/analytics` | analytics    | 數據分析   |
| `/profile`   | profile      | 個人設定   |
| `/dev/perf`  | perf-monitor | ❌ 隱藏    |
| `/dev/api`   | api-monitor  | ❌ 隱藏    |

## Dev Tools Access

- Performance monitor: `window.__perfMonitor.start(label)`, `window.__perfMonitor.end(label)` then navigate to `/dev/perf`
- API monitor: `window.__apiMonitor.record(endpoint, method, status, duration)` then navigate to `/dev/api`

## Tests

- 519 tests across 37 test files（`pnpm check` 一次跑完 lint、格式、型別、測試、建置）
- Key: `ganzhi.test.ts`、`almanac.test.ts`、`tenGods.test.ts`、`ziwei.test.ts`（以上與 lunar-javascript 交叉驗證）、`engines.test.ts`、`registry.test.ts`、`birthChart.test.ts`、`integratedFortune.test.ts`、`backtest.test.ts`、`nameStrokes.test.ts`、`sceneLayout.test.ts`、`solarTerms.test.ts`、`indicators.test.ts`（手算與暴力解對照）、`technical.test.ts`（0050 實際行情對照外部數值）、`priceAdjust.test.ts`、`taiwanStock.test.ts`

## Tech Stack

Vue 3.5 + TypeScript 5.9 + Vite 8.1 + Pinia 3.0 + Pinia Colada 1.4 + TailwindCSS 3.4 + Vitest 4.1
