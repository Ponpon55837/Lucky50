# 技術指標依台灣券商慣例重寫，補上除息還原與休市日曆

## Why

數據分析頁的技術指標算在「目前選取的分析區間」上：選 1 個月只有約 21 根日 K，MACD(26)、60 日均線根本不夠算，卻仍顯示數字。RSI 用簡單平均與 14 日，不是台灣券商慣用的 Wilder 平滑與 6／12 日；MACD 只有 DIF，沒有訊號線與柱；資料不足時回傳 50、0、「中軌」這類假值；畫面把 K 大於 D 一律標成「黃金交叉」。行情只還原了 1 拆 4，沒有還原每年兩次的除息，長天期均線與報酬因此偏低。FinMind 失敗時還會默默改用隨機模擬資料來算指標。台股休市日曆只到 2025 年，而且連 2024、2025 年都漏了春節前的結算交割日與數個補假。

## What Changes

**變更 ID**: `update-technical-indicators`
**變更類型**: 計算修正 + 新功能 + UI

- **修改**: `src/utils/indicators.ts` 全部重寫為回傳序列的純函式，暖機期一律為 null；RSI 改 Wilder 平滑，MACD 補齊 DIF／訊號線／柱，EMA 改以前 N 日平均為起點
- **新增**: 均線與 EMA、均量、SAR、DMI／ADX、乖離率、威廉 %R、CCI、ATR、OBV、52 週區間位置、1／3／6 個月與 1 年報酬；參數採台灣券商慣例
- **新增**: `src/utils/priceAdjust.ts` 向前還原分割與除息；還原係數取自 FinMind 的 `TaiwanStockSplitPrice` 與 `TaiwanStockDividendResult`（免費資料集），取不到時只還原已知的分割並在畫面標示「未還原除息」
- **新增**: `src/utils/technical.ts`：最新交易日的技術面快照、各指標的狀態與白話定義、綜合訊號（七項逐一列出依據）
- **修改**: 技術指標固定以最近約 800 天的日 K 計算，不隨分析區間改變；只收真實行情，抓不到就顯示「–」
- **修改**: 數據分析頁以新的「技術指標」面板取代「技術指標摘要」；3D 技術指標場景改讀新的快照
- **修改**: 綜合訊號由「買入／賣出／持有」改為「偏多／偏空／中性／資料不足」，判讀只順著趨勢看，過熱與超賣不計票
- **修改**: `src/services/taiwanStock.ts` 休市日依證交所公告更新為 2024–2027 年，超出涵蓋年度時只判斷週末並在狀態與訊息中標示
- **修正**: 行情的漲跌欄位改用對前一交易日收盤的漲跌（FinMind `spread`），原本是收盤減開盤
- **移除**: 沒有呼叫端的 `dailyReturns`、`meanAndVariance`、`maxDrawdown`、回傳寫死假數值的 `FinMindService.getTechnicalIndicators`、與 `sma` 重複的 `sceneLayout.movingAverage`

## Impact

- **影響規格**: analytics
- **影響程式碼**: `src/utils/indicators.ts`, `src/utils/priceAdjust.ts`, `src/utils/technical.ts`, `src/utils/sceneLayout.ts`, `src/services/finmind.ts`, `src/services/taiwanStock.ts`, `src/queries/index.ts`, `src/stores/analytics.ts`, `src/components/analytics/TechnicalPanel.vue`, `src/components/three/Technical3DVisualization.vue`, `src/components/three/Stock3DVisualization.vue`, `src/views/Analytics.vue`
- **連帶影響**: 回測與價格圖改用含除息還原的價格，除息日不再被算成下跌，累積報酬會略高於改版前
- **不影響**: 命理計算、3D 共用舞台、儀表板行情（仍為原始價）
- **未納入**: 法人買賣超、融資融券（FinMind 免費額度足夠，但不在這次範圍）
