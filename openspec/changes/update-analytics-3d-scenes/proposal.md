# 數據分析頁 3D 圖解改版

## Why

數據分析頁的四個 three.js 場景（股價、生肖運勢、農民曆、技術指標）由紅球、灰環、隨機粒子與碎石組成，與 Step 13 的農民曆紙墨風格不一致：沒有座標軸與資料標籤、文字疊在 3D 物件上、指標柱被裁切、場景常駐 60fps 空轉，節氣在沒有資料時還寫死成「秋分」。使用者反映「3D 畫面好醜、顯示效果很差」。

## What Changes

**變更 ID**: `update-analytics-3d-scenes`
**變更類型**: UI 改版 + 效能

- **新增**: `SceneStage`（`src/utils/three-scene.ts`）—四個場景共用的舞台：設計 token 色票、半球光＋主光霧面打光、紙面台座、依包圍盒自動框景、HTML 標籤層、滑鼠／觸控提示、拖曳旋轉；只在內容、尺寸、互動或動畫變動時重繪，捲出視窗或分頁隱藏時暫停，裝置像素比上限 2，卸載時完整釋放
- **新增**: `useSceneStage` composable 與 `SceneCard` 元件，收斂延遲初始化、主題重建、WebGL 不可用時的文字摘要
- **新增**: 純函式 `src/utils/sceneLayout.ts`（框景距離、刻度、K 線版面、五行柱、技術指標判讀）與 `src/utils/solarTerms.ts`（所在節氣與進度），附單元測試
- **修改**: 四個場景改為有意義的圖：K 線＋成交量＋20 日均線、五行能量柱＋相生相剋圖＋投資分數弧、二十四節氣輪＋今日位置、技術指標量規；每個都有標題、圖例、資料標籤與數值提示
- **修改**: 節氣改用實際資料，取不到就不顯示
- **修正**: 數據分析與個人設定頁的 `loadingComponent` 傳入 Promise 而顯示「[object Promise]」
- **移除**: `@tweenjs/tween.js`（已無使用）

## Impact

- **影響規格**: ui
- **影響程式碼**: `src/components/three/*`, `src/utils/three-scene.ts`, `src/composables/useSceneStage.ts`, `src/views/Analytics.vue`, `src/views/Profile.vue`, `vite.config.ts`, `package.json`
- **不影響**: 命理計算、技術指標計算（`src/utils/indicators.ts`、`src/stores/analytics.ts`）、回測
