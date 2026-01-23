# persistence 持久化儲存

管理數據庫、檔案與各式持久化技術實現，提供 repository 與 application 層接口綁定。

- 資料庫 adapter（SQL、NoSQL、file-based...）
- 實作所有 domain/repository contract
- 不處理業務層邏輯，只供資料 CRUD 技術實現
- 測試用 memory/fake persistence 亦放此
