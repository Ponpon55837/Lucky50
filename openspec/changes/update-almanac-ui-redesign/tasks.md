# 實作任務清單

> 驗證：`pnpm run lint`、`vue-tsc --noEmit`、`pnpm vitest run`、瀏覽器檢查（桌面／手機、深淺色）

## 1. 設計系統

- [x] 1.1 Tailwind 色彩改為 CSS 變數 tokens，重寫 `style.css` 元件類別
- [x] 1.2 字型：Noto Sans TC／Noto Serif TC／霞鶩文楷／IBM Plex Mono

## 2. 純函式與測試

- [x] 2.1 `utils/almanac.ts`：時辰輪、月令旺衰、交易日吉凶、籤詩、五行解讀
- [x] 2.2 `utils/chart.ts`：單趟 extent、比例尺、平滑路徑、扇形
- [x] 2.3 單元測試 `almanac.test.ts`、`chart.test.ts`

## 3. 儀表板與首頁

- [x] 3.1 今日籤、十二時辰輪、五行相生圖、走勢吉印、宜忌表
- [x] 3.2 三種命盤卡片共用 `EngineCard`
- [x] 3.3 首頁農民曆封面、直排導覽、頁尾與條款彈窗

## 4. 其他頁面

- [x] 4.1 運勢歷史、數據分析、個人設定、404、開發者頁面套用 tokens
