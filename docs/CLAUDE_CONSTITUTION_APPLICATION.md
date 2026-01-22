# Claude 憲法在 Lucky50 專案中的應用指南

## 📋 總覽

本文檔定義了 Lucky50 專案如何應用 Anthropic Claude 憲法的核心原則，確保系統在提供個人化運勢分析的同時，遵循安全性、道德性、透明度和幫助性的最高標準。

## 🎯 核心原則

### 1. **安全性第一** (Safety First)

#### 1.1 數據保護

- 使用者個人資料（生日、時辰、姓名）必須加密存儲
- 不得將個人資料用於運勢計算之外的任何目的
- 提供「忘記我」功能，徹底清除用戶數據

#### 1.2 免責聲明強化

```typescript
// 免責聲明必須根據投資建議強度動態調整
const disclaimer = DisclaimerService.createDisclaimer(investmentScore, recommendation)
```

#### 1.3 風險提示

- 在任何投資建議旁邊必須顯示對應風險級別
- 高風險建議需要用戶明確確認免責聲明
- 所有頁面底部必須包含統一免責聲明

### 2. **道德透明度** (Ethical Transparency)

#### 2.1 演算法透明

- 所有運勢計算邏輯必須在 `FortuneService.getAlgorithmExplanation()` 中詳細說明
- 每個計算步驟都要有對應的中文解釋
- 開源所有非敏感的演算法實現

#### 2.2 數據來源揭露

```typescript
// 必須明確標示所有數據來源
const transparency: EthicsTransparency = {
  dataSourceDisclosure: [
    'FinMind API - 台灣金融數據開源平台',
    'lunar-javascript - 農民曆計算函式庫',
    '傳統八字五行理論',
    '生肖運勢對照表',
  ],
}
```

#### 2.3 限制說明

- 誠實告知系統的技術限制和理論限制
- 明確區分文化娛樂功能和實用金融工具
- 不誇大運勢分析的可信度

### 3. **幫助性優化** (Enhanced Helpfulness)

#### 3.1 個人化體驗

- 根據使用者背景提供客製化解釋
- 結合現代生活場景詮釋傳統概念
- 提供可調整的計算權重選項

#### 3.2 教育價值

- 每個運勢結果都必須包含相關教育內容
- 解釋農民曆、五行、生肖等文化概念
- 提供基礎的金融知識教育

#### 3.3 實用工具

- 提供真正有用的投資追蹤功能
- 整合專業的市場數據分析
- 建立科學的風險評估工具

### 4. **用戶賦權** (User Empowerment)

#### 4.1 可調整權重

```typescript
// 用戶可以自訂計算權重
const userSettings: UserEmpowerment = {
  adjustableWeights: {
    zodiacWeight: 0.3, // 生肖影響權重
    lunarWeight: 0.5, // 農民曆影響權重
    marketWeight: 0.2, // 市場數據影響權重
  },
  riskTolerance: 'moderate', // 風險承受度
}
```

#### 4.2 選擇權保障

- 用戶可以選擇是否使用運勢分析功能
- 提供純數據模式（無運勢分析）
- 支持自訂通知設置

## 🔧 技術實現規範

### 1. 組件開發規範

#### 1.1 免責聲明組件

所有顯示投資建議的組件都必須包含 `DisclaimerNotice.vue`：

```vue
<template>
  <div class="investment-advice">
    <div class="recommendation">
      {{ fortune.recommendation }}
    </div>

    <!-- Claude 憲法要求：必須顯示免責聲明 -->
    <DisclaimerNotice :disclaimer="fortune.disclaimer" @acknowledged="handleAcknowledgment" />
  </div>
</template>
```

#### 1.2 教育內容組件

運勢結果頁面必須包含教育內容區塊：

```vue
<EducationalContent
  :content="fortune.educationalContent"
  :difficulty="userSettings.educationLevel"
/>
```

### 2. 服務層規範

#### 2.1 運勢計算服務

所有運勢計算必須使用 `FortuneService.calculateEnhancedFortune()` 而非基礎版本：

```typescript
// ✅ 正確：使用增強版
const fortune = FortuneService.calculateEnhancedFortune(profile, date)

// ❌ 錯誤：使用基礎版（不符合 Claude 憲法）
const fortune = FortuneService.calculateDailyFortune(profile, date)
```

#### 2.2 免責聲明服務

使用 `DisclaimerService` 進行所有免責聲明相關操作：

```typescript
// 檢查是否需要強制顯示
const shouldShow = DisclaimerService.shouldForceDisplay(disclaimer, lastAcknowledgment)

// 儲存用戶確認
DisclaimerService.saveUserAcknowledgment(userId, disclaimer.level)
```

### 3. 資料儲存規範

#### 3.1 隱私保護

- 個人資料必須使用 `localStorage` 加密存儲
- 設定自動過期機制（預設 30 天）
- 提供手動清除功能

#### 3.2 回饋數據

- 用戶回饋必須匿名化處理
- 只儲存必要的統計數據
- 定期清理舊數據（保留 6 個月）

## 📝 開發檢查清單

### 功能開發前

- [ ] 此功能是否涉及個人資料處理？
- [ ] 是否需要顯示投資相關建議？
- [ ] 是否包含教育內容？
- [ ] 是否需要用戶確認機制？

### 組件開發時

- [ ] 已包含 `DisclaimerNotice` 組件（如需要）
- [ ] 已整合教育內容（如適用）
- [ ] 已實作用戶賦權功能
- [ ] 已添加透明度資訊

### 服務層開發

- [ ] 使用增強版運勢計算方法
- [ ] 已實作演算法透明度說明
- [ ] 已更新數據來源揭露
- [ ] 已添加限制說明

### 測試階段

- [ ] 免責聲明在不同情境下正確顯示
- [ ] 用戶確認機制正常運作
- [ ] 教育內容內容準確且有幫助
- [ ] 透明度資訊完整且易於理解

## 🔄 持續改進機制

### 1. 用戶回饋系統

建立完整的回饋收集機制：

```typescript
interface UserFeedback {
  predictionAccuracy: number // 預測準確性評分
  adviceHelpfulness: number // 建議有幫助程度
  educationalValue: number // 教育價值評分
  ethicalConcerns: string // 道德考量
}
```

### 2. 定期審查

- **每季**：審查免責聲明是否足夠明確
- **每半年**：評估演算法透明度是否充分
- **每年**：全面檢視系統是否符合 Claude 憲法原則

### 3. 專家諮詢

- **金融專家**：定期諮詢投資建議的適當性
- **文化專家**：確保農民曆和傳統文化應用的尊重性
- **法律專家**：確認免責聲明的法律效力
- **倫理專家**：評估系統的道德影響

## 📚 相關文檔

- [免責聲明詳細說明](./DISCLAIMER.md)
- [教育內容開發指南](./EDUCATIONAL_CONTENT.md)
- [用戶賦權功能實現](./USER_EMPOWERMENT.md)
- [隱私保護政策](./PRIVACY_POLICY.md)

## 🎖 Claude 憲法承諾

本專案承諾：

1. **永遠將用戶安全置於首位**
2. **保持演算法透明度和誠實性**
3. **提供真正有價值的教育和工具**
4. **尊重用戶選擇權和隱私**
5. **持續改進以符合最高標準**

---

**最後更新**：2026-01-22  
**版本**：1.0.0  
**維護者**：Lucky50 開發團隊
