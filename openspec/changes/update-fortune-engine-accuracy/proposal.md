# 命理計算依傳統規則重寫

## Why

時辰吉凶只用出生年生肖查固定表，60 天內 45–55 天結果相同；四個命理引擎的分數不是寫死就是算錯（經典固定 50 分、紫微非真排盤、風水把流年生肖當成使用者生肖、中英文五行比對永遠不相等），同一人連續 14 天引擎加權總分固定為 57。使用者要求計算必須依對應的命理規則，不可自行編造或寫死。

## What Changes

**變更 ID**: `update-fortune-engine-accuracy`
**變更類型**: 計算邏輯修正 + 共用程式收斂

- **新增**: `src/utils/ganzhi.ts` 作為干支、五行、沖合害、藏干、納音、遁干的唯一來源（索引運算，O(1)）
- **新增**: `src/utils/ziwei.ts` 紫微斗數安星純函式（命宮、五行局、十四主星、輔星、四化）
- **修改**: 時辰吉凶改為「黃道黑道十二神 + 日破 + 本命沖合害」，每日隨日支變化
- **修改**: 經典命理改為擇日評分（值日天神、建除十二神、宜忌、日支與本命沖合、流年太歲）
- **修改**: 八字十神改以日主旺衰定喜忌，再看流日干支十神與日支沖合
- **修改**: 紫微斗數改為真實排盤，以本命與流日四化落入命財官遷評分
- **修改**: 風水方位改用當日財神／喜神／福神方位、三煞方與納音生剋
- **修改**: 命盤統一由 `buildBirthChart` 以節氣四柱建立；生肖與本命五行改以農曆年與年柱納音推算
- **修改**: 整合分數改為引擎加權結果，移除寫死的年運名單、失效的星座加成與重複的內部快取
- **修改**: 農民曆快取鍵改用本地日期（原為 UTC，凌晨 0–8 點會取到前一天）
- **移除**: `src/services/fortune.ts`（亂數挑時段的舊算法，已無引用）、`lunar.ts` 與 `taiwanStock.ts` 內重複的吉時表
- **BREAKING**: `MetaphysicsEngine.calculate` 改收單一 `EngineInput`；`IntegratedFortuneData` 移除未使用欄位
- **新增**: 姓名學筆畫改用康熙筆畫表（由 Unicode Unihan 產生，`src/data/kangxiStrokes.ts`），取代少量對照表加碼點估算
- **修改**: 數據分析的策略回測與相關性改為以實際收盤價逐日計算（`src/utils/backtest.ts`），移除固定倍率
- **修正**: 左側選單首次切頁時內容左右跳動；service worker 改版後立即套用
- **新增**: CI 加入格式檢查、警告視為失敗的 lint 與相依套件稽核

## Impact

- **影響規格**: fortune
- **影響程式碼**: `src/utils/{ganzhi,almanac,tenGods,ziwei,zodiac}.ts`, `src/services/engines/*`, `src/services/{integratedFortune,lunar,apiCache,taiwanStock}.ts`, 引擎卡片元件, `.github/workflows/ci.yml`
- **不影響**: IndexedDB 歷史記錄格式、查詢快取鍵結構、畫面版型
- **已知限制**: 康熙筆畫以 Unihan 的部首加部首外筆畫計算，少數字（如「蕭」「戴」）與部分姓名學書籍相差一畫；紫微斗數不含星曜亮度與雜曜；夜子時出生不提前換日
