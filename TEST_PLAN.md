# Unit Test 規劃文件

## Git Hooks 策略

| Hook | 時機 | 執行內容 | 失敗時 |
|------|------|---------|--------|
| `pre-commit` | `git commit` | `vitest run` (全部單元測試) | 阻止提交 |
| `pre-push` | `git push` | `vue-tsc --noEmit` (TypeScript 類型檢查) | 阻止推送 |

## 測試優先級矩陣

### Priority 1: 高（核心商業邏輯 + 基礎設施）

| 測試檔案 | 測試對象 | 測試策略 |
|----------|---------|---------|
| `taiwanStock.test.ts` | `TaiwanStockService` | **純邏輯，不需 mock** — 交易日判斷、時段計算、狀態查詢 |
| `apiCache.test.ts` | `ApiCacheService` | **Fake timers** — TTL 過期、LRU 清理、快取穿透 |
| `integratedFortune.test.ts` | `IntegratedFortuneService` | **Mock lunar + 外部 service** — 八字、元素能量、投資建議 |
| `analyics.test.ts` | `useAnalyticsStore` | **純計算** — 統計指標、技術分析、回測結果 |
| `user.test.ts` | `useUserStore` | **Mock localStorage** — Profile 驗證、持久化、初始化 |
| `useErrorHandler.test.ts` | `useErrorHandler` | **Console spy** — 錯誤種類、重試邏輯、顯示控制 |
| `dashboard.test.ts` | `useDashboardStore` | **Mock 所有 service** — 資料協調、loading/error 狀態 |

### Priority 2: 中（工具與簡易 Composable）

| 測試檔案 | 測試對象 | 測試策略 |
|----------|---------|---------|
| `useToast.test.ts` | `useToast` | Fake timers — 新增/移除/自動消失 |
| `useTheme.test.ts` | `useTheme` | Mock localStorage + document — 切換主題、持久化 |
| `investment.test.ts` | `useInvestmentStore` | 純狀態 — CRUD operation |

### Priority 3: 低（工具函數，不易/不需單元測試）

| 測試檔案 | 測試對象 | 測試策略 |
|----------|---------|---------|
| `performance.test.ts` | `PerformanceMonitor` | Mock performance API |
| `error.test.ts` | `ApplicationError` | 類別繼承、預設值 |

## 現有測試補強

| 測試檔案 | 需補強的缺口 |
|----------|------------|
| `finmind.test.ts` | Mock data generator、cache integration、interceptor |
| `fortune.test.ts` | `calculateEnhancedFortune`、`calculateLuckyTime`、`seededRandom` |
| `lunar.test.ts` | 錯誤重試路徑、ganZhi scoring、簡繁轉換 |

## 測試目錄結構

```
src/tests/
├── setup.ts                   # 全域測試設定
├── finmind.test.ts            # 現有
├── fortune.test.ts            # 現有
├── lunar.test.ts              # 現有
├── taiwanStock.test.ts        # 新增 - 高優先
├── apiCache.test.ts           # 新增 - 高優先
├── integratedFortune.test.ts  # 新增 - 高優先
├── analyics.test.ts           # 新增 - 中優先
├── user.test.ts               # 新增 - 中優先
├── useErrorHandler.test.ts    # 新增 - 中優先
├── dashboard.test.ts          # 新增 - 中優先
├── useToast.test.ts           # 新增 - 中優先
├── useTheme.test.ts           # 新增 - 中優先
├── investment.test.ts         # 新增 - 中優先
├── performance.test.ts        # 新增 - 低優先
└── error.test.ts              # 新增 - 低優先
```

## 執行指令

```bash
# 安裝 hooks
.githooks/install.sh

# 執行所有測試
pnpm test:run

# 執行指定測試
npx vitest run src/tests/taiwanStock.test.ts

# 監聽模式
pnpm test

# 類型檢查
pnpm build:tsc
```
