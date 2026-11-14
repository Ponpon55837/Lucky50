# 實作任務清單

> 驗證：`pnpm check`、瀏覽器檢查（桌面／手機、深淺色、console）、與 toalpha.tw 同一天的數值對照

## 1. 指標計算

- [x] 1.1 `indicators.ts` 重寫：序列輸出、暖機期為 null、Wilder 平滑、MACD 三值
- [x] 1.2 新增 SMA／EMA、SAR、DMI／ADX、乖離率、威廉 %R、CCI、ATR、OBV、區間位置、期間報酬
- [x] 1.3 移除沒有呼叫端的函式
- [x] 1.4 `indicators.test.ts`：手算、暴力解對照、邊界（資料不足、持平、缺值）

## 2. 還原股價

- [x] 2.1 `priceAdjust.ts`：分割與除息向前還原
- [x] 2.2 `FinMindService.getPriceAdjustments`、`getDailyBars`；查詢定義
- [x] 2.3 `analytics` store 改用還原後的價格，除息資料抓不到時標示

## 3. 技術面快照與呈現

- [x] 3.1 `technical.ts`：快照、判讀、綜合訊號與測試
- [x] 3.2 `TechnicalPanel.vue` 取代技術指標摘要
- [x] 3.3 `Technical3DVisualization.vue` 改讀快照
- [x] 3.4 以 0050 實際行情對照外部數值（KD、MACD、均線）

## 4. 休市日曆

- [x] 4.1 依證交所公告更新 2024–2027 年
- [x] 4.2 超出涵蓋年度時只判斷週末並標示

## 5. 文件

- [x] 5.1 README、CHANGELOG、AGENTS
