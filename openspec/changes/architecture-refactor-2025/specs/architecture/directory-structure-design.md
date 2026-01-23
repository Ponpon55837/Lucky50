# 分層架構目錄結構設計

## 概述

本文檔定義 Lucky50 系統的新分層架構目錄結構，遵循 Clean Architecture 和 Domain-Driven Design (DDD) 原則。

## 設計原則

### 1. 依賴規則 (Dependency Rule)

- 依賴關係向內流動：表現層 → 應用層 → 領域層
- 內層不依賴外層：領域層完全獨立於框架和外部工具
- 基礎設施層實現應用層定義的接口

### 2. 關注點分離 (Separation of Concerns)

- 每一層有明確的職責邊界
- 業務邏輯與技術實現分離
- UI 與數據存取邏輯分離

### 3. 模組化設計 (Modular Design)

- 按業務領域組織代碼（user, fortune, investment, visualization）
- 每個模組包含完整的層級結構
- 模組間通過明確定義的接口通信

## 目錄結構設計

完整的目錄結構包含五個核心層級：

1. **domain/** - 領域層（核心業務邏輯）
2. **application/** - 應用層（用例協調）
3. **infrastructure/** - 基礎設施層（外部依賴實現）
4. **presentation/** - 表現層（UI 相關）
5. **shared/** - 共享層（跨模組共用）

詳細結構請參考附件：directory-structure-tree.txt

## 層級職責說明

### Domain Layer (領域層)

**職責**: 包含核心業務邏輯和規則，完全獨立於外部框架

**組成部分**:

- Entities (實體): 具有唯一標識的領域對象
- Value Objects (值對象): 不可變的、無標識的對象
- Domain Services (領域服務): 不適合放在實體中的業務邏輯
- Repositories (倉儲接口): 定義數據存取接口（不包含實現）
- Events (領域事件): 領域內發生的重要事件

**依賴規則**: 不依賴任何其他層

### Application Layer (應用層)

**職責**: 協調用例流程，連接領域層和外部世界

**組成部分**:

- Use Cases (用例): 實現具體的業務用例流程
- DTOs (數據傳輸對象): 跨層傳輸的數據結構
- Ports (端口接口): 定義應用層需要的外部服務接口
- Mappers (映射器): 轉換 DTO 和領域實體

**依賴規則**: 只依賴領域層

### Infrastructure Layer (基礎設施層)

**職責**: 實現技術細節和外部依賴

**組成部分**:

- DI (依賴注入): 管理對象創建和依賴關係
- Persistence (持久化): 實現倉儲接口，處理數據存儲
- External Services (外部服務): 整合第三方 API
- Caching (快取): 實現快取機制
- Logging (日誌): 實現日誌記錄
- Event Bus (事件總線): 實現事件發布訂閱
- Patterns (設計模式): 實現通用設計模式框架

**依賴規則**: 依賴應用層和領域層，實現它們定義的接口

### Presentation Layer (表現層)

**職責**: 處理 UI 邏輯和用戶交互

**組成部分**:

- Components (組件): Vue 組件實現
- Views (視圖): 頁面級組件
- Stores (狀態管理): Pinia 狀態管理
- Composables (組合式函數): Vue 3 可重用邏輯
- Router (路由): 路由配置

**依賴規則**: 依賴應用層（通過用例和 DTO）

### Shared Layer (共享層)

**職責**: 提供跨層共用的工具和類型

**組成部分**:

- Types (類型): 共享的 TypeScript 類型
- Constants (常量): 全局常量定義
- Utils (工具): 通用工具函數
- Validators (驗證器): 通用驗證邏輯
- Exceptions (異常): 標準異常類
- Interfaces (接口): 通用接口定義

**依賴規則**: 不依賴其他層，被所有層使用

## 模組劃分原則

### 1. User Module (用戶模組)

**核心職責**: 用戶管理、認證、個人資料、偏好設置

**包含功能**:

- 用戶註冊、登入、登出
- 個人資料管理（姓名、生日、生肖等）
- 用戶偏好設置（主題、語言等）
- 用戶驗證和授權

### 2. Fortune Module (運勢模組)

**核心職責**: 農民曆計算、運勢分析、五行理論

**包含功能**:

- 農民曆日期計算
- 生肖、天干地支計算
- 五行分析
- 每日運勢計算
- 投資吉時推薦

### 3. Investment Module (投資模組)

**核心職責**: 股市數據、技術分析、投資推薦

**包含功能**:

- 股票行情查詢
- 技術指標計算
- 投資組合管理
- 基於運勢的投資建議
- 市場數據分析

### 4. Visualization Module (可視化模組)

**核心職責**: 數據視覺化、圖表展示、3D 渲染

**包含功能**:

- 2D 圖表渲染（Chart.js）
- 3D 場景渲染（Three.js）
- 數據視覺化效果
- 互動式圖表

## 命名規範

### 檔案命名

- 實體: `User.ts`, `Fortune.ts`
- 用例: `CreateUserUseCase.ts`
- 倉儲: `UserRepository.ts`
- DTO: `CreateUserDto.ts`
- 服務: `UserDomainService.ts`

### 目錄命名

- 使用小寫連字符: `external-services/`, `event-bus/`
- 複數形式用於集合: `entities/`, `use-cases/`

### 類型命名

- 接口以 `I` 開頭: `IUserRepository`, `IUseCase`
- DTO 以 `Dto` 結尾: `CreateUserDto`
- 事件以 `Event` 結尾: `UserCreatedEvent`

## 遷移策略

### 階段性遷移

1. **建立新目錄結構** - 不影響現有代碼
2. **實現基礎設施** - 建立 DI 容器、錯誤處理等
3. **逐模組遷移** - 一次遷移一個模組
4. **更新表現層** - 更新組件使用新架構
5. **清理舊代碼** - 移除已遷移的舊代碼

### 向後兼容

- 在遷移期間保持舊 API 可用
- 建立 Adapter 層連接新舊架構
- 使用 Feature Flag 控制新功能啟用

## 效益預期

### 代碼品質

- ✅ 職責清晰，易於理解
- ✅ 圈複雜度降低 50%+
- ✅ 代碼重複率降低 80%+

### 可維護性

- ✅ 新功能開發時間減少 50%
- ✅ Bug 定位時間減少 60%
- ✅ 模組可獨立開發和測試

### 可擴展性

- ✅ 易於添加新模組
- ✅ 支持技術棧替換
- ✅ 易於實現微前端架構

## 下一步

完成此設計後，接下來的任務：

1. ✅ **1.1.1 設計新的分層架構目錄結構** (本文檔)
2. ⏭️ **1.1.2 建立 src/domain/ 目錄（領域層）**
3. ⏭️ **1.1.3 建立 src/application/ 目錄（應用層）**
4. ⏭️ **1.1.4 建立 src/infrastructure/ 目錄（基礎設施層）**
5. ⏭️ **1.1.5 建立 src/shared/ 目錄（共享層）**
6. ⏭️ **1.1.6 重組現有 src/presentation/ 目錄（表現層）**

---

**文檔版本**: 1.0  
**最後更新**: 2026-01-23  
**作者**: Architecture Team  
**狀態**: ✅ 完成設計，待審核
