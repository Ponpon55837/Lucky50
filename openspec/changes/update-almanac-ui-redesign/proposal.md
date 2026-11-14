# 農民曆風格 UI/UX 改版

## Why

原介面以藍紫漸層、玻璃卡片、emoji 標題與大量 0–100 分數為主，看起來像套版報表，與「用農民曆看 0050」的產品定位脫節。使用者確認預覽稿（搖籤、十二時辰輪、五行相生圖、農民曆封面）後，要求依此改版，並維持 clean code、一致的程式風格與可測試的純函式。

## What Changes

**變更 ID**: `update-almanac-ui-redesign`
**變更類型**: UI/UX 改版 + 小幅資料擴充

- **新增**: 設計 tokens（紙／墨中性色、農民曆紅黃亮點色、漲紅跌綠語意色），Tailwind 色彩改綁 CSS 變數，深淺色主題自動切換
- **新增**: `src/utils/almanac.ts`（時辰吉凶、月令旺衰、交易日吉凶、籤詩）與 `src/utils/chart.ts`（O(n) SVG 繪圖）純函式
- **新增**: 儀表板元件 `FortuneLot`、`HourWheel`、`FiveElementsCycle`、`InkPriceChart`、`AlmanacYiJi`
- **修改**: 儀表板以「今日籤」取代分數卡；交易時段改為十二時辰輪；雷達圖改為五行相生圖；Chart.js 價格圖改為輕量 SVG 並標示吉日
- **修改**: 導覽改為桌面直排書脊、手機頂部選單；首頁以農民曆封面取代 3D 運勢球
- **修改**: `LunarData` 增加沖煞、煞方、財神、喜神、值日天神欄位；`lunar.ts` 去除重複的建構與重試邏輯
- **修改**: 十神／紫微／風水卡片共用 `EngineCard` 與 `buildBirthChart`，分數改以「強／中／弱」呈現
- **移除**: `FortuneCard`、`LunarCalendarCard`、`ElementRadarChart`、`FortuneOrb`、`critical.css`（已無引用）

## Impact

- **影響規格**: ui
- **影響程式碼**: `src/views/*`, `src/components/*`, `src/assets/style.css`, `tailwind.config.js`, `src/services/lunar.ts`, `src/services/integratedFortune.ts`, `src/stores/dashboard.ts`
- **不影響**: 運勢計算邏輯、IndexedDB 歷史記錄格式、查詢快取鍵
