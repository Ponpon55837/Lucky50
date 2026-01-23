# Domain Layer (領域層)

## 概述

領域層是系統的核心，包含所有業務邏輯和規則。此層完全獨立於外部框架、UI 和基礎設施，確保業務邏輯的純粹性和可測試性。

## 設計原則

### 1. 框架獨立性

- 領域層不依賴任何外部框架（Vue、React、Express 等）
- 僅使用純 TypeScript 實現業務邏輯
- 可在任何環境中運行和測試

### 2. 依賴反轉

- 領域層定義接口（如倉儲接口）
- 外層（基礎設施層）實現這些接口
- 領域層不依賴具體實現

### 3. 業務規則優先

- 所有業務規則和邏輯都在此層實現
- 確保業務邏輯的完整性和一致性
- 使用領域語言命名

## 目錄結構

```
domain/
├── user/                    # 用戶領域模組
├── fortune/                 # 運勢領域模組
├── investment/              # 投資領域模組
└── visualization/           # 可視化領域模組
```

每個模組包含以下子目錄：

- **entities/** - 實體（具有唯一標識的領域對象）
- **value-objects/** - 值對象（不可變的領域對象）
- **repositories/** - 倉儲接口（數據存取抽象）
- **services/** - 領域服務（業務邏輯協調）
- **events/** - 領域事件（業務事實記錄）

## 模組說明

### 🧑 User Module

**職責**: 用戶管理、認證、個人資料、偏好設置

### 🔮 Fortune Module

**職責**: 農民曆計算、運勢分析、五行理論

### 📈 Investment Module

**職責**: 股市數據、技術分析、投資推薦

### 📊 Visualization Module

**職責**: 數據視覺化、圖表展示、3D 渲染

## 參考資源

- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**建立日期**: 2026-01-23  
**版本**: 1.0  
**狀態**: ✅ 已建立
