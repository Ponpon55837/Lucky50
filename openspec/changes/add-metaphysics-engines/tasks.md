# 實作任務清單

> **每次完成 Phase 後必須執行的驗證步驟：**
>
> ```bash
> pnpm run lint         # ESLint 0 errors
> vue-tsc --noEmit      # TypeScript 型別檢查通過
> pnpm vitest run       # 所有測試通過
> ```

## Phase 1：啟用現有 + 插件架構基礎

### 1.1 建立 MetaphysicsEngine 插件架構

- [ ] 1.1.1 定義 `MetaphysicsEngine` 介面 (`src/services/engines/types.ts`)
- [ ] 1.1.2 定義 `MetaphysicsResult` 標準化輸出類型
- [ ] 1.1.3 實作 `MetaphysicsEngineRegistry` 引擎註冊/管理 (`src/services/engines/registry.ts`)
- [ ] 1.1.4 單元測試 (`src/tests/metaphysicsEngine.test.ts`)：引擎註冊、啟用/停用、結果聚合、權重計算

### 1.2 啟用納音五行

- [ ] 1.2.1 在 `integratedFortune.ts` 的 `calculateElementEnergy()` 中加入納音五行權重 (+10)
- [ ] 1.2.2 更新 `src/tests/fortune.test.ts`：納音五行對五行能量分佈的影響

### 1.3 啟用五行相生相剋

- [ ] 1.3.1 移除 `ELEMENT_RELATIONS` 的 eslint-disable，修正 unused var
- [ ] 1.3.2 在 `calculateFortuneScores()` 中使用相生相剋調整分數
- [ ] 1.3.3 更新 `src/tests/fortune.test.ts`：相生加分、相剋減分

### 1.4 啟用星座

- [ ] 1.4.1 將 `lunar.getConstellation()` 結果加入 fortune 分析
- [ ] 1.4.2 更新 `src/tests/fortune.test.ts`：星座微調

### 1.5 重構 IntegratedFortuneService

- [ ] 1.5.1 將現有計算邏輯封裝為 `ClassicFortuneEngine`（實現 MetaphysicsEngine）
- [ ] 1.5.2 改用 `MetaphysicsEngineRegistry` 聚合各引擎結果
- [ ] 1.5.3 確保所有現有 198+ 測試通過

### Phase 1 驗證

- [ ] `pnpm run lint` — 0 errors
- [ ] `vue-tsc --noEmit` — 通過
- [ ] `pnpm vitest run` — 所有測試通過
- [ ] 新增測試 30+，覆蓋引擎架構 + 啟用功能
- [ ] 測試包含：引擎註冊、啟用/停用、結果聚合、權重計算、納音五行、五行相剋、星座
- [ ] **整合驗證**：`IntegratedFortuneService.calculateIntegratedFortune()` 回傳結果包含各引擎貢獻
- [ ] **整合驗證**：Dashboard 五行能量雷達圖反映納音五行權重變化
- [ ] **整合驗證**：FortuneLogViewer 歷史記錄包含完整運勢數據

---

## Phase 2：八字十神引擎

### 2.1 十神計算核心

- [ ] 2.1.1 實作 `calculateDayMaster(baZi)` — 取得日主天干
- [ ] 2.1.2 實作 `calculateTenGods(baZi)` — 計算四柱十神
- [ ] 2.1.3 實作 `mapTenGodsToInvestmentStyle(tenGods)` — 投資性格映射
- [ ] 2.1.4 單元測試 (`src/tests/baziTenGods.test.ts`)：每種十神計算 + 投資性格映射

### 2.2 BaZiTenGodsEngine 實作

- [ ] 2.2.1 建立 `src/services/engines/baziTenGods.ts`
- [ ] 2.2.2 實作 `MetaphysicsEngine` 介面
- [ ] 2.2.3 註冊到 `MetaphysicsEngineRegistry`
- [ ] 2.2.4 單元測試：引擎完整流程

### 2.3 Ten Gods Utility

- [ ] 2.3.1 實作 `src/utils/tenGods.ts` — 十神天干對照表 + 計算函數
- [ ] 2.3.2 單元測試 (`src/tests/tenGods.test.ts`)：天干五合、十神判定、投資性格映射

### 2.4 Dashboard 展示

- [ ] 2.4.1 新增 `src/components/TenGodsCard.vue` 元件
- [ ] 2.4.2 展示十神分佈 + 投資性格描述
- [ ] 2.4.3 整合到 `Dashboard.vue`
- [ ] 2.4.4 元件測試 (`src/tests/tenGodsCard.test.ts`)：渲染、數據展示、互動

### Phase 2 驗證

- [ ] `pnpm run lint` — 0 errors
- [ ] `vue-tsc --noEmit` — 通過
- [ ] `pnpm vitest run` — 所有測試通過
- [ ] 新增測試 20+，覆蓋十神計算 + 投資性格 + 元件
- [ ] 測試包含：每種十神判定、投資性格映射、元件渲染、數據展示
- [ ] **整合驗證**：`IntegratedFortuneData` 包含 `tenGodsProfile` 欄位
- [ ] **整合驗證**：Dashboard 展示 TenGodsCard，顯示十神分佈 + 投資性格
- [ ] **整合驗證**：投資建議（BUY/SELL/HOLD）考慮十神性格因素
- [ ] **整合驗證**：FortuneLogViewer 歷史記錄可查詢十神分析結果

---

## Phase 3：紫微斗數簡化版

### 3.1 紫微排盤核心

- [ ] 3.1.1 實作 `getLunarBirthDate(profile)` — 農曆生日轉換
- [ ] 3.1.2 實作 `calculateMingGong(lunarMonth, lunarHour)` — 定命宮
- [ ] 3.1.3 實作 `calculateWuXingJu(mingGongStem, mingGongBranch)` — 定五行局
- [ ] 3.1.4 實作 `calculateZiWeiStar(mingGong, wuXingJu, lunarDay)` — 定紫微星
- [ ] 3.1.5 實作 `calculateMainStars(ziWeiStar)` — 安14主星
- [ ] 3.1.6 單元測試 (`src/tests/ziWei.test.ts`)：命宮定位、五行局、主星計算、三宮分析

### 3.2 ZiWeiEngine 實作

- [ ] 3.2.1 建立 `src/services/engines/ziWei.ts`
- [ ] 3.2.2 實作 `MetaphysicsEngine` 介面
- [ ] 3.2.3 計算命宮/財帛宮/事業宮主星
- [ ] 3.2.4 映射到投資傾向
- [ ] 3.2.5 註冊到 `MetaphysicsEngineRegistry`
- [ ] 3.2.6 單元測試：引擎完整流程

### 3.3 ZiWei Utility

- [ ] 3.3.1 實作 `src/utils/ziWeiStars.ts` — 14主星數據 + 定星規則
- [ ] 3.3.2 單元測試 (`src/tests/ziWeiStars.test.ts`)：星曜定義、對照表驗證

### 3.4 Dashboard 展示

- [ ] 3.4.1 新增 `src/components/ZiWeiCard.vue` 元件（可收合）
- [ ] 3.4.2 展示三宮主星 + 投資傾向
- [ ] 3.4.3 整合到 `Dashboard.vue`
- [ ] 3.4.4 元件測試 (`src/tests/ziWeiCard.test.ts`)：渲染、收合互動、數據展示

### Phase 3 驗證

- [ ] `pnpm run lint` — 0 errors
- [ ] `vue-tsc --noEmit` — 通過
- [ ] `pnpm vitest run` — 所有測試通過
- [ ] 新增測試 25+，覆蓋紫微排盤 + 元件
- [ ] 測試包含：命宮定位、五行局、主星計算、三宮分析、元件渲染、收合互動
- [ ] 抽樣 3 個出生日期，與線上排盤工具交叉驗證
- [ ] **整合驗證**：`IntegratedFortuneData` 包含 `ziWeiProfile` 欄位
- [ ] **整合驗證**：Dashboard 展示 ZiWeiCard（可收合），顯示三宮主星 + 投資傾向
- [ ] **整合驗證**：紫微分析影響 `investmentScore` 和 `recommendation`
- [ ] **整合驗證**：FortuneLogViewer 歷史記錄包含紫微分析摘要

---

## Phase 4：風水方位增強 + 流日吉凶

### 4.1 方位增強

- [ ] 4.1.1 結合月柱天干 + 個人元素 + 當日地支計算方位
- [ ] 4.1.2 加入流日相沖方位警示
- [ ] 4.1.3 單元測試 (`src/tests/fengShui.test.ts`)：方位計算、相沖警示

### 4.2 流日吉凶

- [ ] 4.2.1 實作 `calculateDailyClash(dayPillar, personalBaZi)` — 流日相沖
- [ ] 4.2.2 實作 `calculateDailySupport(dayPillar, personalBaZi)` — 流日相生
- [ ] 4.2.3 標記「大凶日」「大吉日」
- [ ] 4.2.4 單元測試：相沖、相生、吉凶判定

### 4.3 納財吉日

- [ ] 4.3.1 定義納財吉日的干支組合規則
- [ ] 4.3.2 在 fortune 結果中標記
- [ ] 4.3.3 單元測試 (`src/tests/wealthDay.test.ts`)：吉日判定

### 4.4 FengShuiEngine 實作

- [ ] 4.4.1 建立 `src/services/engines/fengShui.ts`
- [ ] 4.4.2 註冊到 `MetaphysicsEngineRegistry`
- [ ] 4.4.3 單元測試：引擎完整流程

### 4.5 Dashboard 展示更新

- [ ] 4.5.1 更新 `Dashboard.vue` 方位區塊
- [ ] 4.5.2 新增流日吉凶指示器
- [ ] 4.5.3 元件測試

### Phase 4 驗證

- [ ] `pnpm run lint` — 0 errors
- [ ] `vue-tsc --noEmit` — 通過
- [ ] `pnpm vitest run` — 所有測試通過
- [ ] 新增測試 20+，覆蓋方位 + 流日 + 吉日
- [ ] 測試包含：方位計算、相沖、相生、吉日判定、元件渲染
- [ ] **整合驗證**：`IntegratedFortuneData` 的 `luckyDirection`/`avoidDirection` 反映增強後的方位計算
- [ ] **整合驗證**：`IntegratedFortuneData` 包含 `dailyAnalysis` 欄位（流日吉凶）
- [ ] **整合驗證**：`IntegratedFortuneData` 包含 `wealthDay` 標記（納財吉日）
- [ ] **整合驗證**：Dashboard 方位區塊顯示增強後的方位建議
- [ ] **整合驗證**：Dashboard 流日吉凶指示器正常運作
- [ ] **整合驗證**：FortuneLogViewer 歷史記錄包含方位和流日數據

---

## Phase 5：插件架構 UI + 使用者設定

### 5.1 使用者設定

- [ ] 5.1.1 在 `UserProfile` 加入 `metaphysicsSettings` 欄位
- [ ] 5.1.2 定義各引擎的開關和權重設定類型
- [ ] 5.1.3 在 `Profile.vue` 頁面加入命理系統設定區
- [ ] 5.1.4 單元測試：設定讀寫、預設值

### 5.2 權重調整系統

- [ ] 5.2.1 實作 `UserEmpowerment.adjustableWeights`
- [ ] 5.2.2 在設定頁面加入權重滑桿
- [ ] 5.2.3 權重變更即時反映到運勢計算
- [ ] 5.2.4 單元測試：權重調整、即時反映

### 5.3 Dashboard 最終整合

- [ ] 5.3.1 整合所有命理系統區塊
- [ ] 5.3.2 根據啟用狀態動態顯示/隱藏
- [ ] 5.3.3 響應式佈局優化
- [ ] 5.3.4 元件測試

### 5.4 Profile 頁面更新

- [ ] 5.4.1 加入命理系統設定入口
- [ ] 5.4.2 展示個人命理摘要
- [ ] 5.4.3 元件測試

### Phase 5 驗證

- [ ] `pnpm run lint` — 0 errors
- [ ] `vue-tsc --noEmit` — 通過
- [ ] `pnpm vitest run` — 所有測試通過
- [ ] 新增測試 15+，覆蓋設定 + 權重 + 元件
- [ ] 總測試數 300+
- [ ] **整合驗證**：Profile 頁面可啟用/停用各命理引擎
- [ ] **整合驗證**：Profile 頁面可調整各引擎權重
- [ ] **整合驗證**：權重變更後，Dashboard 運勢分數即時更新
- [ ] **整合驗證**：停用某引擎後，Dashboard 不再顯示該引擎區塊
- [ ] **整合驗證**：FortuneLogViewer 歷史記錄反映不同設定下的運勢變化
- [ ] **整合驗證**：`metaphysicsSettings` 持久化到 localStorage，重新整理後保持

---

## 最終驗證

### 基本檢查

- [ ] `pnpm run lint` — 0 errors
- [ ] `vue-tsc --noEmit` — 通過
- [ ] `pnpm vitest run` — 所有測試通過 (300+)
- [ ] `pnpm vitest run --coverage` — 覆蓋率 85%+

### 整合驗證

- [ ] 使用者設定 Profile（姓名+生日+時間）後，Dashboard 完整顯示所有命理分析
- [ ] 切換命理引擎開關，Dashboard 對應區塊動態顯示/隱藏
- [ ] 調整引擎權重，運勢分數即時變化
- [ ] FortuneLogViewer 可查詢歷史運勢記錄，包含所有命理引擎結果
- [ ] Analytics 頁面的運勢與績效相關性分析正常運作
- [ ] 所有命理引擎從現有 UserProfile 推算，不需額外輸入
- [ ] 效能無明顯影響（<50ms 額外計算時間）

### 端對端驗證

- [ ] 首次使用：設定 Profile → Dashboard 自動計算運勢 → 歷史記錄自動儲存
- [ ] 修改設定：調整引擎權重 → 重新計算運勢 → 歷史記錄反映新設定
- [ ] 匯流排程：每日自動計算 → 歷史記錄累積 → Analytics 統計分析

---

## Phase 6：README 全面更新

> 完成所有命理引擎後，需全面檢視專案並更新 README.md

### 6.1 專案全貌檢視

- [ ] 6.1.1 檢視所有 `src/` 目錄結構，確認最終檔案組織
- [ ] 6.1.2 檢視所有路由 (`src/router/index.ts`)，確認頁面清單
- [ ] 6.1.3 檢視所有元件 (`src/components/`)，確認元件清單
- [ ] 6.1.4 檢視所有服務 (`src/services/`)，確認服務清單
- [ ] 6.1.5 檢視所有工具 (`src/utils/`)，確認工具清單
- [ ] 6.1.6 檢視所有 store (`src/stores/`)，確認 store 清單
- [ ] 6.1.7 檢視所有測試 (`src/tests/`)，確認測試檔案清單與數量
- [ ] 6.1.8 確認技術棧版本（Vue、TypeScript、Vite、Pinia、TailwindCSS、Vitest）

### 6.2 README.md 重寫

- [ ] 6.2.1 專案介紹 — Lucky50 是什麼、核心理念
- [ ] 6.2.2 功能特色 — 完整功能列表（農民曆、投資分析、命理引擎等）
- [ ] 6.2.3 技術棧 — 前端框架、狀態管理、樣式、測試、建構工具
- [ ] 6.2.4 專案結構 — 目錄樹 + 各目錄用途說明
- [ ] 6.2.5 命理引擎系統 — 插件架構說明、各引擎介紹、啟用/停用設定
- [ ] 6.2.6 頁面路由 — 完整路由表（含隱藏開發工具）
- [ ] 6.2.7 開發指南 — 環境設定、開發指令、測試指令、lint 指令
- [ ] 6.2.8 測試覆蓋 — 測試數量、測試檔案清單、如何執行測試
- [ ] 6.2.9 部署說明 — 建構、部署方式
- [ ] 6.2.10 授權與貢獻 — License、貢獻指南

### Phase 6 驗證

- [ ] README.md 內容與專案實際狀態完全一致
- [ ] 所有指令可正常執行
- [ ] 所有頁面路由正確
- [ ] 命理引擎系統完整描述
- [ ] 无過期或錯誤的資訊
