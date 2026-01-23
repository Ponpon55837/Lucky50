# components

全站通用或跨頁面可重用的 Vue 3 單文件組件（最小粒度小型元件、按鈕、表單元素等）。

- 僅允許 props 收外部狀態與 callback，不可有內部狀態流與自定義業務邏輯。
- 嚴禁資料請求、API 呼叫、依賴資料庫、呼叫 application/domain 函數。
- 被呼叫頁面（views）或父元件驅動。
