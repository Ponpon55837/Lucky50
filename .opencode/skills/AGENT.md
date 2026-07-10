# Lucky50 專案 - AI 助手開發指南 (Agent Instructions)

## 🎯 專案核心定位

這是一個結合「傳統農民曆 (Lunar Calendar)」與「現代 ETF 0050 投資策略」的智慧系統。
請在提供建議或撰寫邏輯時，隨時牢記這個核心精神：**以天干地支、五行、節氣等命理元素，輔助股市交易時段的判斷。**

## 🛠 技術棧與開發規範 (Tech Stack & Standards)

- **核心框架**: Vue 3 (Composition API, `<script setup>`) + Vite
- **型別系統**: TypeScript (強型別，盡量避免使用 `any`)
- **狀態管理**: Pinia (`src/stores`)
- **樣式與 UI**: TailwindCSS + 響應式設計
- **圖表與 3D**: Chart.js / Vue-chartjs + Three.js

## 📁 架構與模組職責 (Architecture Rules)

當你被要求新增或修改功能時，請嚴格遵守以下目錄職責：

1. **`/src/services` (核心業務邏輯)**:
   - 所有與外部 API 的互動 (如 `finmind.ts`) 或複雜的運勢計算 (如 `integratedFortune.ts`, `lunar.ts`) 都必須封裝在這裡。
   - **禁止**在 Vue 組件內直接寫原生的 API 請求 (fetch/axios)，必須透過 Service 呼叫。
2. **`/src/components` (共用組件)**:
   - 保持組件單一職責。
   - 3D 視覺化相關組件統一放在 `/src/components/three/`。
   - 圖表相關組件統一放在 `/src/components/charts/`。
3. **`/src/composables` (共用邏輯)**:
   - 錯誤處理請統一呼叫 `useErrorHandler.ts`。
   - 提示訊息請統一呼叫 `useToast.ts`。

## ⚠️ 開發地雷區 (Strict Constraints)

1. **環境變數**: 絕對不要在程式碼中硬編碼 (hardcode) API Keys。
2. **免責聲明**: 如果修改到涉及投資建議的 UI 或邏輯，必須確保系統有帶入「農民曆僅供趣味參考，投資盈虧自負」的相關提示 (參考 `DisclaimerLevel` 型別)。
3. **效能考量**: 在處理 Three.js 或頻繁的 Chart 更新時，注意記憶體洩漏 (Memory Leak)，組件銷毀時必須清理事件監聽與 RequestAnimationFrame。
4. **命名慣例**:
   - Component 檔案使用 `PascalCase` (例: `FortuneCard.vue`)。
   - Composables 使用 `camelCase` 並以 `use` 開頭 (例: `useTheme.ts`)。

## 🤖 給 AI 的對話指引

- 回答請保持簡潔專業，直接提供程式碼實作，減少不必要的寒暄。
- 若程式碼過長，請優先提供「修改的核心片段」而非重印整份文件。
- 如果使用者的需求違反上述架構設計（例如想把 API 寫在組件裡），請主動提醒並提供重構為 Service 的寫法。
