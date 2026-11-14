# 實作任務清單

> 驗證：`pnpm check`、瀏覽器檢查（桌面／手機、深淺色、hover 提示、console）

## 1. 共用舞台

- [x] 1.1 `SceneStage`：色票、燈光、台座、框景、標籤層、hover／拖曳、按需重繪、暫停與釋放
- [x] 1.2 `useSceneStage`、`SceneCard`：延遲初始化、主題重建、WebGL 替代內容、減少動態偏好

## 2. 純函式與測試

- [x] 2.1 `sceneLayout.ts`、`solarTerms.ts`
- [x] 2.2 `sceneLayout.test.ts`、`solarTerms.test.ts`

## 3. 四個場景

- [x] 3.1 股價：K 線、成交量、均線、價格與日期軸
- [x] 3.2 五行：能量柱、相生相剋、投資分數弧
- [x] 3.3 節氣：二十四節氣輪、今日位置、宜忌（節氣不再寫死）
- [x] 3.4 技術指標：RSI、KD、MACD、布林量規

## 4. 收尾

- [x] 4.1 數據分析頁版面與說明文字；修正 `[object Promise]` 載入元件
- [x] 4.2 移除 `@tweenjs/tween.js`；更新 README、CHANGELOG、AGENTS.md
