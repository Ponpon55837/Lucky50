/** 引擎設定在 localStorage 的鍵；設定卡片、註冊表與查詢鍵指紋共用 */
export const ENGINE_SETTINGS_STORAGE_KEY = 'lucky50-engine-settings'

export interface EngineMeta {
  id: string
  name: string
  description: string
  version: string
  /** 預設權重 (0-100) */
  defaultWeight: number
}

/**
 * 內建引擎的名稱、說明與預設權重。
 * 引擎本身、設定卡片與數據分析頁都從這裡取，不各自維護一份。
 * 這個檔案不引入任何計算程式，可安全地放進主要 chunk。
 */
export const ENGINE_CATALOG = {
  classic: {
    id: 'classic',
    name: '經典命理',
    description: '農民曆擇日：值日天神、建除十二神、宜忌，以及日支與太歲對本命的沖合',
    version: '2.0.0',
    defaultWeight: 30,
  },
  baziTenGods: {
    id: 'bazi-ten-gods',
    name: '八字十神',
    description: '以日主旺衰定喜忌，再看流日干支的十神與日支沖合',
    version: '2.0.0',
    defaultWeight: 25,
  },
  ziWei: {
    id: 'zi-wei',
    name: '紫微斗數',
    description: '依農曆生辰排十四主星，以本命與流日四化落入命財官遷評分',
    version: '2.0.0',
    defaultWeight: 20,
  },
  fengShui: {
    id: 'feng-shui',
    name: '風水方位',
    description: '當日財神、喜神、福神方位與三煞方，並以納音五行看流日對本命的生剋',
    version: '2.0.0',
    defaultWeight: 15,
  },
} as const satisfies Record<string, EngineMeta>

export const ENGINE_LIST: readonly EngineMeta[] = Object.values(ENGINE_CATALOG)
