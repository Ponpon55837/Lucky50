# shared 共享層

本層提供全專案可複用、可全域存取的型別、常數、工具、驗證器、例外類與介面。

- 嚴格遵循 Clean Architecture，只能被其他所有層引用，
- 內容僅限技術與結構性共用，不涉及業務邏輯
- 命名規範、可擴展與測試性為最高優先

## 子目錄一覽

- types/ TypeScript 共用型別、interface、enum
- constants/ 全域常量定義
- utils/ 通用工具與 helper function
- validators/ 共用驗證器與資料校驗邏輯
- exceptions/ 共通異常類型與標準異常介面
- interfaces/ 可於基礎設施/應用交換的 interface 標準
