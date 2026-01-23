# application 應用層

本層負責協調領域邏輯的具體執行與流程，對接外部請求與內部領域核心，並根據業務需求撰寫不同的用例協作流程。各模組彼此間僅通過明確定義的接口 (ports) 做資料交流與依賴。

## 子目錄說明

- user/ 用戶模組應用邏輯
- fortune/ 運勢模組應用邏輯
- investment/ 投資模組應用邏輯
- visualization/ 視覺化模組應用邏輯

> 詳見各 module/README.md。

### 各模組標準結構

- use-cases/ 實際用例流程協調
- dto/ 跨層數據傳輸物件
- ports/ 應用層技能接口
- mappers/ DTO 與 Entity 映射函式
