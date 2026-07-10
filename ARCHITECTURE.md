# 專案架構 (Vue 3 + TypeScript)

- `/src/components/common`：共用的無狀態 UI 元件。
- `/src/stores`：Pinia 狀態管理，負責與 API 溝通。
- `/src/views`：頁面級別的視圖，不可在此直接呼叫 API，需透過 store。
- **核心規範**：所有 API 請求必須透過 `/src/utils/api.ts` 的 axios 封裝。
