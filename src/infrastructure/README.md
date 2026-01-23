# infrastructure 基礎設施層

本層負責整合所有外部技術依賴與系統介面，包括：資料持久化、第三方 API、快取、日誌、事件流、常用設計模式與服務註冊注入機制。
依據 Clean Architecture，實現 application 層定義的 port、repository 與外部服務依賴。

## 主要子目錄（技術元件）

- di/ 依賴注入容器及服務註冊/解耦工具
- persistence/ 資料庫、檔案等持久化 adapter 與 repository provider
- external-services/ 第三方平台、API 統一介接模組
- caching/ 快取與記憶體管理 adapter/provider
- logging/ 日誌記錄、追蹤、系統稽核
- event-bus/ 事件流與總線、訊息隊列管理
- patterns/ 共用設計模式範本實作

每個子目錄均需有對應 README.md，詳細記載實踐規則、典型依賴與示例。
