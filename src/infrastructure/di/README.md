# di 依賴注入（Dependency Injection）

集中管理全專案依賴與實體創建，保障模組鬆耦合、易於擴充及測試。

- 維護 service registry、factory provider
- 支援動態依賴綁定、mock 注入（測試用）
- 不存放業務邏輯，只定義/維護註冊規則

常見框架實例：inversify、typedi 等，但實際實現細節與應用層無關，由基礎設施層處理。
