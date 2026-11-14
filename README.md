<p align="center">
  <img src="docs/readme/banner.svg" alt="Lucky50 農民曆智慧投資：今天，宜買 0050 嗎？" width="100%" />
</p>

<p align="center">
  <img alt="Vue" src="https://img.shields.io/badge/Vue-3.5-c0282d?style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-c0282d?style=flat-square" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-c0282d?style=flat-square" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-415%20passed-b8901f?style=flat-square" />
  <img alt="License" src="https://img.shields.io/github/license/Ponpon55837/Lucky50?style=flat-square&color=5a5750" />
</p>

<p align="center">
  把傳統農民曆、八字與紫微，翻譯成一支看得懂的<b>每日投資籤</b>。<br />
  專為元大台灣 50（0050）設計，每天告訴你：哪個時辰下單最順、今天宜什麼、忌什麼。
</p>

<p align="center">
  <img src="docs/readme/dashboard-light.png" alt="儀表板：今日籤、0050 走勢吉印、十二時辰輪、宜忌與五行" width="100%" />
</p>

---

## 壹・今日籤上寫了什麼

| 版面             | 內容                                                                |
| ---------------- | ------------------------------------------------------------------- |
| 🎋 **今日籤**    | 搖一搖籤筒抽出籤詩與吉凶等第，附一句白話建議與「宜／忌／財位」      |
| 🕰 **十二時辰輪** | 依生肖三合與沖害推算每個時辰吉凶，金色弧線標出 09:00–13:30 開盤時段 |
| 📜 **今日宜忌**  | 農民曆宜忌（交易相關項目優先列出）、沖煞、財神、喜神、納音          |
| ☯ **五行生剋**   | 月令旺相休囚死，對照你的本命與姓名五行，說明今天該補什麼            |
| 🖌 **走勢吉印**   | 0050 近 20 個交易日水墨走勢，紅印標出你的吉日，看吉日與漲跌是否同步 |
| 🧭 **命理引擎**  | 八字十神、紫微斗數、風水方位三張卡片，與經典命理一起加權成綜合分數  |

<table>
  <tr>
    <td width="50%"><img src="docs/readme/home-light.png" alt="首頁：農民曆封面" /></td>
    <td width="50%"><img src="docs/readme/dashboard-dark.png" alt="儀表板暗色模式" /></td>
  </tr>
  <tr>
    <td align="center"><sub>首頁・農民曆封面</sub></td>
    <td align="center"><sub>暗色模式・夜讀版</sub></td>
  </tr>
</table>

<table>
  <tr>
    <td width="33%"><img src="docs/readme/mobile-light.png" alt="手機版儀表板" /></td>
    <td width="33%"><img src="docs/readme/mobile-menu.png" alt="手機版覆蓋式選單" /></td>
    <td>
      <b>手機也好翻</b><br /><br />
      桌面是直排書脊導覽；手機改成頂部列，選單以捲軸展開的方式<b>覆蓋</b>在頁面上，不推擠內容。<br /><br />
      所有頁面在 375px 寬度下沒有水平捲動。
    </td>
  </tr>
</table>

## 貳・設計語彙

介面以「一本翻開的農民曆」為主題，所有顏色都定義成 CSS 變數，亮暗兩套共用同一份 Tailwind 語意色。

| Token                     | 用途                   | 亮色      |
| ------------------------- | ---------------------- | --------- |
| `paper` / `surface`       | 宣紙底色／卡片         | `#f3f2ee` |
| `ink` / `ink-2` / `ink-3` | 墨色三階文字           | `#1b1a18` |
| `seal`                    | 朱紅印章、吉、強調     | `#c0282d` |
| `gold`                    | 籤筒、金字、開盤時段   | `#f0c43c` |
| `rise` / `fall`           | 台股慣例：**漲紅跌綠** | 紅／綠    |

- **字體**：Noto Serif TC（標題）、Noto Sans TC（內文）、霞鶩文楷 TC（印章與籤詩）、IBM Plex Mono（數字）
- **動態**：搖籤、時辰輪與選單展開都使用同一條 `--ease-out`，並尊重 `prefers-reduced-motion`
- **無障礙**：時辰輪支援方向鍵／Home／End，彈窗可用 Esc 關閉並歸還焦點

## 參・命理引擎

插件式架構，每個引擎實作同一個介面，由 registry 統一加權。權重可在「個人設定」調整並存在 localStorage。

| 引擎     | 預設權重 | 依據                                                                 |
| -------- | -------- | -------------------------------------------------------------------- |
| 經典命理 | 30%      | 擇日：值日天神黃黑道、建除十二神、宜忌，日支與太歲對本命的沖合害     |
| 八字十神 | 25%      | 以得令、得地、得勢定日主強弱與喜忌，再看流日干支十神與日支沖合       |
| 紫微斗數 | 20%      | 依農曆生辰排命宮、五行局、十四主星，以本命與流日四化落入命財官遷評分 |
| 風水方位 | 15%      | 當日財神、喜神、福神方位與三煞方，日納音對本命納音的生剋             |

每個引擎都從 50 分出發，把每一項加減分列在 `factors`，畫面上看得到分數的由來。
時辰吉凶則依「黃道黑道十二神 + 日破 + 本命沖合害」推算，會隨日支每天變化。
干支、五行、藏干、納音與安星都以 `lunar-javascript` 交叉測試（六十甲子、連續六十天的十二時辰、四柱十神）。

```typescript
interface EngineInput {
  profile: UserProfileCompat
  date: Date
  today: LunarData // 當日農民曆
  chart: BirthChart // 節氣四柱、農曆生辰、生肖、本命納音
}

interface MetaphysicsEngine {
  readonly engineId: string
  readonly name: string
  calculate(input: EngineInput): MetaphysicsResult
  getWeight(): number
  isEnabled(): boolean
}

// 內建四個引擎的註冊表；名稱、說明與預設權重集中在 engines/settings.ts
const registry = createDefaultRegistry()
```

已知範圍：紫微斗數只安十四主星與左輔、右弼、文昌、文曲，不含星曜亮度與雜曜；
姓名學採康熙筆畫（Unicode Unihan），少數字與部分姓名學書籍相差一畫。

## 肆・技術指標

數據分析頁的「技術指標」面板固定以最近約 800 天（五百多根）的日 K 計算，不隨頁面上的分析區間改變，並標示資料日期。

| 指標       | 參數                    | 指標     | 參數      |
| ---------- | ----------------------- | -------- | --------- |
| 均線 MA    | 5／10／20／60／120／200 | EMA      | 12／26    |
| KD         | 9, 3, 3                 | MACD     | 12, 26, 9 |
| RSI        | 6, 12（Wilder 平滑）    | 布林通道 | 20, 2     |
| SAR        | 0.02, 0.2               | DMI／ADX | 14        |
| 乖離率     | 20, 60                  | 威廉 %R  | 14        |
| CCI        | 20                      | ATR      | 14        |
| 成交量均量 | 5, 20                   | OBV      | －        |

- **參數採台灣券商軟體慣例**，同一檔在不同軟體上的數字才對得起來。以 0050 在 2026-11-13 的行情對照 [toalpha.tw](https://toalpha.tw/stock/0050/technical)，KD、MACD（DIF／MACD／柱）、MA5／20／60 到顯示的小數位都一致，這組數值寫成了測試。
- **價格已還原**：分割與除息都向前還原（最新價不動，往前的價格乘上「參考價 ÷ 前一日收盤價」），係數取自 FinMind 的分割與除權息結果表。除權息資料抓不到時只還原 1 拆 4，畫面會標示「未還原除息」。回測與價格圖用的也是還原後的價格。
- **算不出來就顯示「–」**：資料還在暖機期的指標是 null，不用 50 或 0 充數；行情抓不到時不會拿模擬資料來算。
- **相對位置**：52 週區間條（目前收盤在一年高低點之間的百分比）與 1／3／6 個月、1 年報酬。
- **綜合訊號說得出依據**：七項各看一件事（收盤與月線、月線與季線、MACD 柱正負、K 與 D、12 日 RSI 與 50、ADX 20 以上時的 ±DI、SAR 方向），偏多與偏空的項數相減達 3 才稱偏多或偏空，畫面逐項列出數值與判讀。過熱、超賣不計票，另外寫在各指標的狀態裡。
- 每個指標附一句白話定義。這些只是把價量換一種方式呈現，不是買賣建議。
- 成交量來自 FinMind，含盤後與零股，會比券商軟體的一般交易量略高。

## 伍・效能與演算法

### 資料層：Pinia Colada 查詢快取

| 查詢                     | Key                                          | staleTime | 說明                                        |
| ------------------------ | -------------------------------------------- | --------- | ------------------------------------------- |
| `etfRangeQuery`          | `['etf', '0050', start, end]`                | 10 分鐘   | FinMind 行情；儀表板與數據分析共用          |
| `technicalBarsQuery`     | `['etf', '0050', 'technical', start, end]`   | 10 分鐘   | 技術指標用的日 K（約 800 天），只收真實行情 |
| `priceAdjustmentsQuery`  | `['etf', '0050', 'adjustments']`             | 12 小時   | 分割與除息還原係數                          |
| `lunarDayQuery`          | `['lunar', 'YYYY-MM-DD']`                    | ∞         | 同一天結果固定，永不過期                    |
| `integratedFortuneQuery` | `['fortune', profileHash, day, enginesHash]` | 30 分鐘   | 個人資料或引擎設定變動 → 鍵改變 → 自動重算  |

同 key 並發請求只執行一次；快速切換日期時以請求序號丟棄過期回應。

### 演算法

| 計算           | 做法                                                                             |
| -------------- | -------------------------------------------------------------------------------- |
| KD、威廉 %R    | 單調雙端佇列求滑動極值，O(n)（LeetCode 239）                                     |
| 均線、布林     | 視窗累加和與平方和，O(n)，不逐視窗重算                                           |
| RSI、ATR、DMI  | Wilder 遞迴平滑，O(n)                                                            |
| CCI            | 樹狀陣列維護視窗內「小於等於平均」的個數與總和，求平均絕對差，O(n log n)         |
| 還原股價       | 由最新一筆往回掃，還原係數隨經過的除息／分割日累乘，O(n + m)                     |
| 走勢圖範圍     | 單次掃描同時求最大／最小值（`utils/chart.ts`）                                   |
| 宜忌排序       | 穩定 O(n) 分割，交易相關項目排前                                                 |
| 沖合害、生剋   | 地支與五行環上的索引運算，O(1)，不逐對列表                                       |
| 值時十二神     | 由日支算出青龍起點後取餘數，O(1)                                                 |
| 策略回測       | 逐日單趟掃描同時算報酬、回撤、波動與勝率，O(n)                                   |
| 逐日評分       | 以時間配額分段執行並讓出主執行緒，五年回測不卡畫面（`utils/scheduling.ts`）      |
| 本命盤         | 與日期無關的十神、紫微命盤以命盤為鍵快取（WeakMap），逐日只算流日                |
| 康熙筆畫       | 兩萬字壓成一個字串，以碼點位移查表，O(1)                                         |
| 個人資料快取鍵 | FNV-1a 32-bit 雜湊，避免同長度姓名碰撞                                           |
| 3D 圖解        | 按需重繪（閒置不跑 render loop）、InstancedMesh 一次繪製同類物件、捲出視窗即暫停 |

儀表板改用自繪 SVG 走勢圖取代 Chart.js，頁面 chunk 約 31 KB；Chart.js 只留在數據分析頁。

## 陸・快速開始

需要 Node.js 18+ 與 pnpm。

```bash
git clone https://github.com/Ponpon55837/Lucky50.git
```

```bash
cd Lucky50 && pnpm install
```

```bash
pnpm dev
```

開發伺服器預設在 http://localhost:3000。

| 指令                 | 用途           |
| -------------------- | -------------- |
| `pnpm build`         | 建置生產版本   |
| `pnpm preview`       | 預覽建置結果   |
| `pnpm test:run`      | 執行所有測試   |
| `pnpm test:coverage` | 產生覆蓋率報告 |

## 柒・專案結構

```
src/
├── assets/style.css          # 設計 tokens 與共用元件樣式（.card、.btn-*、.seal-stamp）
├── components/
│   ├── almanac/              # 農民曆版面元件
│   │   ├── FortuneLot.vue        # 今日籤（籤筒、籤詩、等第）
│   │   ├── HourWheel.vue         # 十二時辰輪
│   │   ├── AlmanacYiJi.vue       # 宜忌與沖煞財神
│   │   ├── FiveElementsCycle.vue # 五行相生相剋圖
│   │   └── InkPriceChart.vue     # SVG 水墨走勢與吉印
│   ├── engines/EngineCard.vue    # 命理引擎卡片外框
│   ├── TenGodsCard.vue · ZiWeiCard.vue · FengShuiCard.vue
│   ├── EngineSettingsCard.vue    # 引擎啟用與權重設定
│   ├── FortuneLogViewer.vue      # 運勢歷史列表
│   ├── charts/                   # Chart.js 圖表（數據分析頁）
│   ├── analytics/TechnicalPanel.vue # 技術指標面板（綜合訊號、相對位置、均線、各指標）
│   ├── three/                    # 數據分析頁 3D 圖解（SceneCard 外框 + 股價／五行／節氣／技術指標）
│   ├── layout/                   # NavBar（直排書脊／手機覆蓋選單）、Footer、LegalModal
│   └── ui/                       # Toast、Loading、LazyImage
├── composables/              # useDashboardAlmanac、useSceneStage、useTheme、useEscapeKey、useElementWidth…
├── queries/                  # Pinia Colada 查詢定義
├── services/
│   ├── engines/              # 命理引擎（classic、baziTenGods、ziWei、fengShui）、birthChart、registry
│   ├── lunar.ts              # 農民曆資料
│   ├── finmind.ts            # FinMind 行情
│   ├── taiwanStock.ts        # 台股交易日判斷（證交所 2024–2027 休市日）
│   ├── integratedFortune.ts  # 整合運勢（含引擎加權）
│   └── fortuneStore.ts       # IndexedDB 運勢歷史
├── stores/                   # Pinia：user、dashboard、analytics、investment
├── utils/
│   ├── ganzhi.ts             # 干支、五行、沖合害、藏干、納音（唯一來源）
│   ├── almanac.ts            # 時辰十二神、擇日評分、五行旺衰、抽籤（純函式）
│   ├── tenGods.ts · ziwei.ts # 十神與日主旺衰、紫微斗數安星
│   ├── backtest.ts           # 策略回測與分數相關性
│   ├── scheduling.ts         # 長計算分段執行（讓出主執行緒）
│   ├── nameStrokes.ts        # 康熙筆畫與姓名學五行
│   ├── chart.ts              # SVG 比例尺、平滑曲線、扇形
│   ├── three-scene.ts        # 3D 共用舞台（色票、打光、框景、標籤、按需重繪）
│   ├── sceneLayout.ts        # 3D 版面換算：刻度、K 線、五行柱、指標判讀
│   ├── solarTerms.ts         # 二十四節氣與所在節氣進度
│   ├── indicators.ts         # 技術指標序列（KD、MACD、RSI、布林、SAR、DMI、CCI、ATR…）
│   ├── technical.ts          # 技術面快照、各指標判讀、綜合訊號
│   ├── priceAdjust.ts        # 分割與除息的向前還原
│   └── hash.ts · date.ts · zodiac.ts
├── views/                    # Home、Dashboard、History、Analytics、Profile、dev/*
└── tests/                    # 37 個測試檔，519 個測試
```

| 路徑         | 頁面             |
| ------------ | ---------------- |
| `/`          | 首頁             |
| `/dashboard` | 投資儀表板       |
| `/history`   | 運勢歷史         |
| `/analytics` | 數據分析         |
| `/profile`   | 個人設定         |
| `/dev/perf`  | 效能監控（隱藏） |
| `/dev/api`   | API 監控（隱藏） |

## 捌・開發流程

先安裝 Git hooks：

```bash
./.githooks/install.sh
```

- **分支命名**：`<type>/<developer>/<description>`，例如 `feat/lip/add-user-auth`；不能直接提交到 `main`
- **提交訊息**：Conventional Commits，例如 `feat: 新增時辰輪鍵盤操作`
- **推送前**：自動執行 `vue-tsc --noEmit`
- **規格變更**：較大的功能先在 `openspec/changes/` 建立提案，詳見 [`openspec/AGENTS.md`](openspec/AGENTS.md)

允許的提交類型：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`、`ci`、`build`、`revert`。

## 玖・資料來源

- **行情**：[FinMind](https://finmindtrade.com/) 台灣金融開源資料（日 K、分割、除權息結果）。API 失敗時走勢圖改用模擬資料，技術指標則不計算
- **休市日**：[臺灣證券交易所](https://www.twse.com.tw/zh/trading/holiday.html)市場開休市日期公告（2024–2027 年）；超出這些年度只判斷週末，並在交易狀態訊息中標示
- **農民曆**：[lunar-javascript](https://github.com/6tail/lunar-javascript) 計算干支、宜忌、神煞，並轉為繁體

## 宜忌

| 宜                       | 忌                     |
| ------------------------ | ---------------------- |
| 當作每天開盤前的趣味參考 | 當作投資建議           |
| 搭配自己的財務規劃一起看 | 因為抽到上吉就加碼梭哈 |

本系統僅供娛樂與文化參考，不構成任何投資建議。投資有風險，請依自身財務狀況判斷。

---

<p align="center">
  <sub>MIT License · <a href="https://github.com/Ponpon55837/Lucky50/issues">回報問題</a> · 覺得有趣的話，歡迎點個 ⭐</sub>
</p>
