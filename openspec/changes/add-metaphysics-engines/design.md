# 技術設計文件

## Context

Lucky50 目前的運勢計算集中在 `IntegratedFortuneService` 的靜態方法中，所有命理邏輯硬編碼。需要擴展為插件式架構以支持多個獨立命理引擎，同時保持向後兼容。

## Goals / Non-Goals

### Goals

- 建立可擴展的 `MetaphysicsEngine` 介面
- 支持多個命理引擎同時運行
- 使用者可獨立開關/調整各引擎
- 所有命理計算從現有 UserProfile 推算（不需額外輸入）
- 維持現有 198+ 測試通過

### Non-Goals

- 不實作完整的紫微斗數排盤（太複雜）
- 不整合第三方命理 API
- 不改變現有的農民曆計算邏輯
- 不改變 Dashboard 的整體佈局

---

## 決策

### 決策 1：引擎介面設計

```typescript
interface MetaphysicsEngine {
  readonly name: string
  readonly description: string
  calculate(profile: UserProfile, date: Date, lunarData: LunarData): MetaphysicsResult
  getWeight(): number
  isEnabled(): boolean
  setEnabled(enabled: boolean): void
  setWeight(weight: number): void
}

interface MetaphysicsResult {
  engineName: string
  score: number // 0-100 分數貢獻
  direction?: string // 方位建議
  luckyElements?: string[] // 幸運元素
  avoidElements?: string[] // 避開元素
  advice?: string[] // 具體建議
  personality?: string // 性格描述（十神/紫微用）
  warnings?: string[] // 特殊警示
}
```

**理由**：標準化介面讓新引擎可以即插即用，不需要修改聚合器。

### 決策 2：納入順序

1. **Phase 1**：啟用現有 + 建立架構（低風險，立即價值）
2. **Phase 2**：八字十神（投資性格，高價值）
3. **Phase 3**：紫微斗數（人格分析，中等價值）
4. **Phase 4**：風水方位增強（方位精確化）
5. **Phase 5**：插件架構 + UI（整合階段）

**理由**：先啟用已有資產建立信心，再逐步新增複雜系統。

### 決策 3：紫微斗數簡化策略

- 只使用已有出生日期+時間，不需額外輸入
- 用農曆生日推算命宮位置
- 只排14主星，不排四化飛星
- 三宮分析（命宮/財帛/事業）而非完整命盤

**理由**：完整紫微排盤需要大量額外計算和驗證，簡化版已能提供有意義的投資傾向分析。

### 決策 4：權重系統

```typescript
interface MetaphysicsSettings {
  engines: {
    [engineName: string]: {
      enabled: boolean
      weight: number // 0-100，預設 50
    }
  }
}
```

預設權重分配（調整前）：

| 引擎                 | 預設權重 |
| -------------------- | -------- |
| Classic Fortune      | 30       |
| BaZi Ten Gods        | 25       |
| ZiWei                | 20       |
| Feng Shui            | 15       |
| Others (納音/星座等) | 10       |

**理由**：投資性格（十神）直接影響決策，權重最高；方位和性格分析次之。

### 決策 5：不使用第三方庫

所有命理計算自行實作，不引入如 `lunisolar` 等第三方農曆/命理庫。

**理由**：

- 現有 `lunar.ts` 已提供農曆基礎
- 自行實作便於理解和維護
- 避免引入不必要的依賴
- 已有測試覆蓋

---

## 風險 / Trade-offs

| 風險                   | 緩解                                      |
| ---------------------- | ----------------------------------------- |
| 紫微排盤演算法正確性   | 簡化版 + 與線上工具交叉驗證               |
| 多引擎效能影響         | 引擎可獨立執行，可 lazy 計算              |
| 權重調整導致結果不穩定 | 限制權重範圍 0-100，提供重設預設功能      |
| 現有測試兼容性         | 每個 Phase 確保所有測試通過再進入下一階段 |

---

## 開放問題

1. 紫微斗數簡化版的精確度是否足夠？需要多少測試案例驗證？
2. 是否需要在 Dashboard 加入「命理系統總覽」區塊，還是各系統獨立展示？
3. 權重調整是否需要即時生效，還是需要點擊「套用」按鈕？
