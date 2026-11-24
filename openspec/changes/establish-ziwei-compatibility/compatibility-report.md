# 紫微斗數命盤相容性報告

| 項目 | 固定版本 |
| --- | --- |
| Lucky50 基準 | [`8e523fb09380f55f6683bcf5c85b33e135ec2c55`](https://github.com/Ponpon55837/Lucky50/tree/8e523fb09380f55f6683bcf5c85b33e135ec2c55) |
| Lucky50 工具與曆法 | Node.js 24.22.3、pnpm 11.16.0、lunar-javascript 1.7.8、iztro 2.6.5（測試用） |
| ziwei-doushu | [`39c0abd3b8dac609975dddfadd4d4e1d3a978deb`](https://github.com/Renhuai123/ziwei-doushu/tree/39c0abd3b8dac609975dddfadd4d4e1d3a978deb) |
| ziwei-doushu 依賴 | 依上游鎖定檔安裝，含 iztro 2.6.1、lunar-javascript 1.7.7、tsx 4.23.15 |

## 口徑與結果

比對使用合成出生時間、上游 `generateChart` 和明確指定的 `split` 閏月策略。上游 `hour` 接受 0–11 的時辰支索引，測試先轉換鐘點。性別是上游 API 必填的合成測試參數，僅比對 Lucky50 已支援且與性別無關的欄位。

| 組別 | 盤數 | 安星差異盤數 | 亮度差異盤數 |
| --- | ---: | ---: | ---: |
| 一般日期與十二時辰 | 156 | 24 | 156 |
| 農曆年與立春交界 | 30 | 3 | 30 |
| 六個閏月的第 15／16 日 | 24 | 4 | 24 |
| 三天的子時與相鄰邊界 | 18 | 0 | 18 |

228 組比對的命宮、身宮、五行局數、十二宮宮名與宮干、空宮借星、本命四化星名與落宮及生年干一致。60 顆共用星曜全部有對照。截空、副截是此版本上游另有的星曜，在共通範圍之外。

- **命名**對照採地支鍵，將「仆役」對應「交友宮」，「咸池」保留星名用字。比對先檢查兩邊地支與天干序列、每盤的十二宮及共用星曜唯一性。
- **安星派別**共有 31 張盤出現辛年天魁、天鉞落宮差異。例如 1981-02-08 00:00。上游以 `applySchoolKuiyue` 套用 KY1 表，Lucky50 採 iztro 既有口徑。其餘共用星曜落宮一致。[上游排盤規則](https://github.com/Renhuai123/ziwei-doushu/blob/39c0abd3b8dac609975dddfadd4d4e1d3a978deb/lib/ziwei/algorithm.ts)
- **亮度派別與缺值**上游預設全書派 QS，為較多輔曜與雜曜提供亮度。Lucky50 沿用 iztro 的亮度表，缺值保留 `null`。例如 1980-01-01 00:00 的右弼、天魁與咸池。兩表有值的星曜也可能因流派而異。同地支星曜的亮度差異逐筆保存在測試可輸出的 JSON，逐組盤數與 SHA-256 記錄在 [Vitest 固定結果](../../../src/tests/ziwei-enrichment/__snapshots__/upstream.test.ts.snap)。
- **日期規則**兩邊直接排盤時，生年以農曆正月初一為界。本次晚子時比較明確把鐘點映射到同日的子時支。上游真太陽時表單入口另有預設換日政策，未納入比對。1900–2100 年內，現有曆法套件未提供閏十二月樣本。[上游表單排盤入口](https://github.com/Renhuai123/ziwei-doushu/blob/39c0abd3b8dac609975dddfadd4d4e1d3a978deb/lib/ziwei/chart-entry.ts)

固定快照另外鎖定一張有借星的命盤。1,728 個固定合成盤涵蓋十干、十二個生月及十二時辰，用來驗證星曜唯一性、借星來源、四化落宮和輸出確定性。出生日期錯誤和時間缺漏的測試沿用既有 `buildBirthChart` 行為。

## 重現方式

從 Lucky50 專案根目錄執行：

```bash
pnpm install --frozen-lockfile
pnpm check

git clone https://github.com/Renhuai123/ziwei-doushu.git /tmp/ziwei-reference
git -C /tmp/ziwei-reference checkout --detach 39c0abd3b8dac609975dddfadd4d4e1d3a978deb
(cd /tmp/ziwei-reference && npm ci --ignore-scripts --no-audit --no-fund)
LUCKY50_ZIWEI_REFERENCE=/tmp/ziwei-reference pnpm test:run src/tests/ziwei-enrichment
```

相容性測試檢查上游 commit，再啟動獨立程序執行參考排盤，以隔離 iztro 的全域設定。日常 `pnpm check` 可離線執行本地固定盤例，設定上述路徑才執行上游比較。如需取得逐筆盤例、欄位與兩邊的差異值，執行上述比對時另外設定 `LUCKY50_ZIWEI_DIFF=/tmp/ziwei-diff.json`，並指定尚未存在的檔案。

## 基準與授權

Lucky50 基準 `pnpm check` 通過 lint、格式、型別、38 個測試檔的 533 項測試及 Vite／PWA 建置。
本次在鎖定的上游環境中執行 `pnpm check`，40 個測試檔、569 項測試全數通過。建置前後的 50 個 `dist/` 檔案逐一比對 SHA-256，內容及路徑完全相同。

## 下一階段

本次比較範圍內沒有原因未明的排盤差異，命盤快照可供下一階段使用。格局與運限仍需各自驗證。

| 上游候選 | 可參考部分 | 採用條件 |
| --- | --- | --- |
| [`patterns.ts`](https://github.com/Renhuai123/ziwei-doushu/blob/39c0abd3b8dac609975dddfadd4d4e1d3a978deb/lib/ziwei/patterns.ts) | 必要、強化及破格條件的結構 | 逐條確認來源與邊界盤例。含辛年魁鉞或亮度的條件需按 Lucky50 口徑重新驗證。 |
| [`sihua.ts`](https://github.com/Renhuai123/ziwei-doushu/blob/39c0abd3b8dac609975dddfadd4d4e1d3a978deb/lib/ziwei/sihua.ts) | 以天干查四化與按時間層輸出的模型 | 涵蓋跨農曆年、立春、流月閏月與跨年案例。流月規則需獨立確認。 |

本命盤快照沿用 Lucky50 的辛年魁鉞、亮度、農曆年界、分半閏月及同日晚子時口徑。格局規則若要採用其他派別的條件，須先釐清相容的星曜資料。

上游程式碼在測試環境依 MIT 授權另行取得。兩邊以合成輸入各自運算，提交內容只有 Lucky50 自行實作的快照、測試、合成盤及差異摘要。上游 Releases 的 CC BY 4.0 資料集與另列授權的授課文字皆未取用。[程式碼授權](https://github.com/Renhuai123/ziwei-doushu/blob/39c0abd3b8dac609975dddfadd4d4e1d3a978deb/LICENSE) [資料集授權](https://github.com/Renhuai123/ziwei-doushu/blob/39c0abd3b8dac609975dddfadd4d4e1d3a978deb/DATASET-LICENSE)
