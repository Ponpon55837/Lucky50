# presentation（表現層）

本層負責所有 UI 相關顯示與用戶互動。

依 Clean Architecture 與 DDD 原則，所有界面程式、頁面邏輯僅在本層實現，禁止商業邏輯、資料存取與外部依賴進入。

## 子目錄結構

- components/：封裝各種可複用的 Vue UI 組件（按原子/分子元件最佳實踐分拆）
- views/：頁面級 Vue 組件，通常對應路由與實際畫面
- stores/：專責狀態管理層（例如 Pinia），提供 UI 狀態存儲
- composables/：可全站共用的組合式函數（Vue 3 composables），集中管理跨元件邏輯
- router/：定義前端路由/導航配置檔，統一管理應用路由

本層僅能透過應用層/DTO 與外部互動，原則上所有 API 呼叫、資料處理、領域運算皆須往 application 或 domain 委派。
