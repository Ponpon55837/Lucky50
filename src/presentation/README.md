# presentation（表現層）

本層僅負責「前端顯示與渲染」。所有組件（components, views）必須被動接收 props 或外部狀態，不允許模組內自定義任何 controller、業務邏輯、資料轉換、事件中樞。僅允許展示型 Vue 3 單文件組件。

## 各子目錄用途

- components/：跨頁共用的基礎或複合組件，僅允許 props 驅動
- views/：頁面級組件（通常對應路由畫面），維持無邏輯，被動展示
- stores/、composables/、router/：暫未啟用，僅預留標準專案分層結構，如需擴充會另行說明

本層任何商業規則、流程、API 呼叫、user context 操作等皆須交由 application/infrastructure 處理。
