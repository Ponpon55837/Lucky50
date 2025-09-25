# Lucky50 🌙 農民曆智慧投資

> 結合傳統中華文化智慧與現代金融科技的創新投資決策輔助平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Ponpon55837/Lucky50)

## 🎯 專案特色

**農民曆智慧投資** 是一個創新的投資決策輔助平台，它將傳統中華文化中的農民曆、八字命理與生肖運勢，結合現代金融數據分析，為投資者提供個人化的元大台灣50(0050) ETF投資建議。

### ✨ 核心功能

- **🔮 個人化運勢分析** - 根據出生年月日、時辰與生肖計算每日投資運勢
- **📅 農民曆整合** - 結合傳統農民曆的吉凶宜忌判斷
- **🌐 實時數據視覺化** - 使用 Three.js 打造沉浸式 3D 投資運勢球體
- **📈 0050 ETF 專注** - 專門針對台灣最具代表性的ETF提供分析
- **📱 響應式設計** - 現代化界面，支援多裝置使用

## 🚀 快速開始

### 本地運行

1. **克隆專案**
   ```bash
   git clone https://github.com/Ponpon55837/Lucky50.git
   cd Lucky50
   ```

2. **啟動本地伺服器**
   ```bash
   # 使用 Python (推薦)
   python -m http.server 8000
   
   # 或使用 Node.js
   npx serve .
   
   # 或使用其他任何靜態伺服器
   ```

3. **開啟瀏覽器**
   ```
   http://localhost:8000
   ```

### 線上體驗

直接開啟 `index.html` 文件即可在任何現代瀏覽器中使用。

## 🏗️ 技術架構

### 前端技術棧
- **HTML5** - 語義化標記與現代Web標準
- **CSS3** - 響應式設計與動畫效果
- **JavaScript ES6+** - 模組化程式設計
- **Three.js** - 3D圖形渲染與動畫
- **Chart.js** - 數據圖表視覺化

### 核心模組

```
js/
├── app.js                 # 主應用控制器
├── lunar-calendar.js      # 農民曆計算系統
├── fortune-calculator.js  # 運勢計算引擎
├── investment-analyzer.js # 投資分析器
└── three-sphere.js       # 3D運勢球體
```

## 📊 功能詳解

### 1. 農民曆系統 (`lunar-calendar.js`)
- 干支計算與五行分析
- 八字排盤與命理分析
- 生肖相配性計算
- 每日宜忌事項判斷

### 2. 運勢計算引擎 (`fortune-calculator.js`)
- 綜合運勢評分算法
- 五行平衡度分析
- 個人化投資建議生成
- 風險等級評估

### 3. 投資分析器 (`investment-analyzer.js`)
- 0050 ETF 數據模擬
- 技術指標計算 (RSI, MACD, 布林通道)
- 市場情緒分析
- 投資建議報告生成

### 4. 3D 視覺化 (`three-sphere.js`)
- 運勢球體動態渲染
- 粒子系統效果
- 基於運勢分數的色彩變化
- 沉浸式互動體驗

## 🎨 使用說明

### 步驟 1: 輸入個人資料
- 選擇出生日期
- 選擇出生時辰 (十二時辰)
- 選擇生肖

### 步驟 2: 運勢分析
- 點擊「🔮 開始分析運勢」按鈕
- 系統將計算個人化運勢指數

### 步驟 3: 查看結果
- **3D 運勢球** - 視覺化呈現當日運勢
- **運勢概況** - 詳細的吉凶分析
- **投資建議** - 基於運勢的 0050 ETF 操作建議
- **數據圖表** - 價格走勢與技術分析

## 🔮 算法說明

### 運勢計算公式
```
整體運勢 = 今日運勢(40%) + 生肖相配(30%) + 五行平衡(30%)
```

### 投資建議等級
- **80分以上**: 積極買進 🟢
- **65-79分**: 適度買進 🟡  
- **50-64分**: 謹慎觀察 🟠
- **35-49分**: 小幅減碼 🔴
- **35分以下**: 暫停投資 ⚫

## 📈 範例分析報告

```
📅 2025年1月15日 (週三)
🌟 整體運勢: 大吉 (85分)
🐲 生肖相配: 90分
⚖️ 五行平衡: 78分

💰 0050 ETF 投資建議:
操作建議: 積極買進
建議部位: 大幅加碼 (80-100% 資金投入)
風險等級: 低風險期

📝 今日特別適合投資決策，運勢與技術面皆呈現正面信號
```

## 🛠️ 開發指南

### 專案結構
```
Lucky50/
├── index.html          # 主頁面
├── package.json        # 專案配置
├── css/
│   └── style.css      # 主樣式表
├── js/
│   ├── app.js         # 主程式邏輯
│   ├── lunar-calendar.js    # 農民曆模組
│   ├── fortune-calculator.js # 運勢計算
│   ├── investment-analyzer.js # 投資分析
│   └── three-sphere.js      # 3D視覺化
├── README.md          # 專案說明
└── LICENSE           # MIT 授權
```

### 擴展開發

#### 添加新的運勢計算方法
```javascript
// 在 fortune-calculator.js 中擴展
class FortuneCalculator {
    // 添加新的分析方法
    calculateCustomFortune(params) {
        // 自定義計算邏輯
    }
}
```

#### 整合真實股價API
```javascript
// 在 investment-analyzer.js 中
class InvestmentAnalyzer {
    async fetchRealETFData() {
        // 整合真實的股價API
        const response = await fetch('https://api.example.com/0050');
        return await response.json();
    }
}
```

## 📝 免責聲明

> ⚠️ **重要提醒**: 本平台僅供參考娛樂使用，不構成投資建議。投資有風險，決策需謹慎。任何投資決定應基於個人財務狀況和專業建議。

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 授權條款

本專案使用 [MIT License](LICENSE) 授權 - 詳見 LICENSE 文件

## 📞 聯絡資訊

- **專案維護者**: Lucky50 Team
- **Email**: contact@lucky50.com (範例)
- **GitHub**: [@Ponpon55837](https://github.com/Ponpon55837)

---

<div align="center">
  <p>🌟 如果這個專案對您有幫助，請給我們一個 Star！ 🌟</p>
  <p>Made with ❤️ by Lucky50 Team</p>
</div>