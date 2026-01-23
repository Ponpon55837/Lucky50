# caching 快取機制

實作各類快取 solution，支援資料壽命管理與效能優化。

- 記憶體快取、分散式快取（如 Redis）等 provider
- 僅負責技術層快取/釋放，不參與業務流程
- adapter 需維持與應用層 port 相容
