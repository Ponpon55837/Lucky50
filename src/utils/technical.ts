/**
 * 技術面快照與判讀（純函數）
 *
 * buildTechnicalSnapshot 把 indicators.ts 的各條序列收斂成「最新一個交易日」的數值；
 * technicalReadings 把數值配上參數、狀態與一句白話定義；
 * compositeSignal 逐項列出哪個指標給了什麼判讀，再加總成綜合訊號。
 *
 * 算不出來的值一律是 null，畫面顯示「–」。說明文字只講定義，不是買賣建議。
 */
import type { ETFData } from '@/types'
import {
  atr,
  bias,
  bollinger,
  cci,
  dmi,
  ema,
  isValidBar,
  macd,
  obv,
  parabolicSar,
  periodReturn,
  rangePosition,
  rsi,
  sma,
  stochasticKD,
  williamsR,
  type RangePosition,
} from '@/utils/indicators'

/** 台灣券商軟體慣用參數 */
export const TECHNICAL_PARAMS = {
  ma: [5, 10, 20, 60, 120, 200],
  ema: [12, 26],
  volumeMa: [5, 20],
  kd: { period: 9, smoothK: 3, smoothD: 3 },
  macd: { fast: 12, slow: 26, signal: 9 },
  rsi: [6, 12],
  bollinger: { period: 20, width: 2 },
  sar: { step: 0.02, max: 0.2 },
  dmi: 14,
  bias: [20, 60],
  williams: 14,
  cci: 20,
  atr: 14,
} as const

/** 各期間報酬（月數） */
const RETURN_PERIODS = [
  { months: 1, label: '1 個月' },
  { months: 3, label: '3 個月' },
  { months: 6, label: '6 個月' },
  { months: 12, label: '1 年' },
] as const

/** 過熱／超賣的常用參考線 */
export const KD_LIMITS = { low: 20, high: 80 } as const
export const RSI_LIMITS = { low: 30, high: 70 } as const
/** ADX 低於此值通常視為沒有明顯趨勢 */
const ADX_TREND = 20

type Maybe = number | null

export interface MovingAverage {
  period: number
  value: Maybe
}

export interface TechnicalSnapshot {
  /** 最新一根 K 棒的日期；沒有資料時為 null */
  date: string | null
  /** 參與計算的 K 棒數 */
  bars: number
  close: Maybe
  ma: MovingAverage[]
  ema: MovingAverage[]
  /** 成交量與均量，單位為股 */
  volume: { latest: Maybe; ma5: Maybe; ma20: Maybe }
  kd: { k: Maybe; d: Maybe; previousK: Maybe; previousD: Maybe }
  macd: { dif: Maybe; signal: Maybe; histogram: Maybe; previousHistogram: Maybe }
  rsi: { short: Maybe; long: Maybe }
  bollinger: { upper: Maybe; middle: Maybe; lower: Maybe }
  sar: { value: Maybe; rising: boolean | null }
  dmi: { plusDi: Maybe; minusDi: Maybe; adx: Maybe }
  bias: { short: Maybe; long: Maybe }
  williamsR: Maybe
  cci: Maybe
  atr: Maybe
  obv: { value: Maybe; ma20: Maybe }
  /** 52 週區間；資料不滿一年時為 null */
  range52w: RangePosition | null
  returns: { months: number; label: string; value: Maybe }[]
}

const last = <T>(series: readonly T[]): T | null => series.at(-1) ?? null
const secondLast = <T>(series: readonly T[]): T | null => series.at(-2) ?? null

/**
 * 由已還原、依日期遞增的日 K 算出最新一日的技術面快照。
 * 開高低收有缺的 K 棒先剔除；資料太短算不出來的指標留 null。
 */
export function buildTechnicalSnapshot(source: readonly ETFData[]): TechnicalSnapshot {
  const bars = source.filter(isValidBar)
  const closes = bars.map(bar => bar.close)
  const volumes = bars.map(bar => bar.volume)
  const params = TECHNICAL_PARAMS

  const kd = stochasticKD(bars, params.kd.period, params.kd.smoothK, params.kd.smoothD)
  const macdLines = macd(closes, params.macd.fast, params.macd.slow, params.macd.signal)
  const bands = bollinger(closes, params.bollinger.period, params.bollinger.width)
  const sar = parabolicSar(bars, params.sar.step, params.sar.max)
  const dmiLines = dmi(bars, params.dmi)
  const balance = obv(bars)

  return {
    date: bars.at(-1)?.date ?? null,
    bars: bars.length,
    close: last(closes),
    ma: params.ma.map(period => ({ period, value: last(sma(closes, period)) })),
    ema: params.ema.map(period => ({ period, value: last(ema(closes, period)) })),
    volume: {
      latest: last(volumes),
      ma5: last(sma(volumes, params.volumeMa[0])),
      ma20: last(sma(volumes, params.volumeMa[1])),
    },
    kd: {
      k: last(kd.k),
      d: last(kd.d),
      previousK: secondLast(kd.k),
      previousD: secondLast(kd.d),
    },
    macd: {
      dif: last(macdLines.dif),
      signal: last(macdLines.signal),
      histogram: last(macdLines.histogram),
      previousHistogram: secondLast(macdLines.histogram),
    },
    rsi: { short: last(rsi(closes, params.rsi[0])), long: last(rsi(closes, params.rsi[1])) },
    bollinger: { upper: last(bands.upper), middle: last(bands.middle), lower: last(bands.lower) },
    sar: { value: last(sar.value), rising: last(sar.rising) },
    dmi: {
      plusDi: last(dmiLines.plusDi),
      minusDi: last(dmiLines.minusDi),
      adx: last(dmiLines.adx),
    },
    bias: {
      short: last(bias(closes, params.bias[0])),
      long: last(bias(closes, params.bias[1])),
    },
    williamsR: last(williamsR(bars, params.williams)),
    cci: last(cci(bars, params.cci)),
    atr: last(atr(bars, params.atr)),
    obv: { value: last(balance), ma20: last(sma(balance, 20)) },
    range52w: rangePosition(bars),
    returns: RETURN_PERIODS.map(period => ({
      ...period,
      value: periodReturn(bars, period.months),
    })),
  }
}

/** 快照中某一天期的均線值 */
export function movingAverage(snapshot: TechnicalSnapshot, period: number): Maybe {
  return snapshot.ma.find(item => item.period === period)?.value ?? null
}

// ── 顯示格式 ──

/** 缺值的顯示字元 */
export const MISSING = '–'

/** 固定小數位；缺值顯示「–」 */
export function formatValue(value: Maybe, digits = 2): string {
  return value === null ? MISSING : value.toFixed(digits)
}

/** 帶正負號的固定小數位；缺值顯示「–」 */
export function formatSigned(value: Maybe, digits = 2, suffix = ''): string {
  if (value === null) return MISSING
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}${suffix}`
}

/** 成交量（股）換成張：一萬張以上以「萬張」表示 */
export function formatLots(shares: Maybe): string {
  if (shares === null) return MISSING
  const lots = shares / 1000
  if (Math.abs(lots) >= 10000) return `${(lots / 10000).toFixed(1)} 萬張`
  return `${Math.round(lots).toLocaleString('en-US')} 張`
}

// ── 判讀 ──

/** rise：偏多或偏熱（紅）；fall：偏空或偏冷（綠）；ink：中性 */
export type Tone = 'rise' | 'fall' | 'ink'

const toneOf = (value: number): Tone => (value > 0 ? 'rise' : value < 0 ? 'fall' : 'ink')

export type BollingerZone = 'upper' | 'middle' | 'lower'

/** 收盤價相對布林通道的位置；通道還算不出來時為 null */
export function bollingerZone(snapshot: TechnicalSnapshot): BollingerZone | null {
  const { close, bollinger: bands } = snapshot
  if (close === null || bands.upper === null || bands.lower === null) return null
  if (close > bands.upper) return 'upper'
  if (close < bands.lower) return 'lower'
  return 'middle'
}

/** %b：收盤價在通道內的位置，0 為下軌、100 為上軌；通道沒有寬度時為 null */
export function bollingerPercent(snapshot: TechnicalSnapshot): Maybe {
  const { close, bollinger: bands } = snapshot
  if (close === null || bands.upper === null || bands.lower === null) return null
  const width = bands.upper - bands.lower
  return width > 0 ? ((close - bands.lower) / width) * 100 : null
}

/** K 與 D 今天是否剛交叉：golden 為 K 由下往上穿過 D，death 相反 */
export function kdCross(kd: TechnicalSnapshot['kd']): 'golden' | 'death' | null {
  const { k, d, previousK, previousD } = kd
  if (k === null || d === null || previousK === null || previousD === null) return null
  if (previousK <= previousD && k > d) return 'golden'
  if (previousK >= previousD && k < d) return 'death'
  return null
}

export interface ReadingValue {
  label: string
  text: string
  tone?: Tone
}

export interface IndicatorReading {
  key: string
  name: string
  /** 參數，例如「9, 3, 3」；沒有參數的指標為空字串 */
  params: string
  values: ReadingValue[]
  /** 目前狀態的一句話；算不出來時為「資料不足」 */
  state: string
  tone: Tone
  /** 白話定義 */
  description: string
}

const INSUFFICIENT = '資料不足'

function kdReading(snapshot: TechnicalSnapshot): IndicatorReading {
  const { k, d } = snapshot.kd
  const { period, smoothK, smoothD } = TECHNICAL_PARAMS.kd
  let state = INSUFFICIENT
  let tone: Tone = 'ink'
  if (k !== null && d !== null) {
    const cross = kdCross(snapshot.kd)
    const side =
      cross === 'golden'
        ? 'K 今日向上穿過 D（黃金交叉）'
        : cross === 'death'
          ? 'K 今日向下穿過 D（死亡交叉）'
          : k > d
            ? 'K 在 D 之上'
            : k < d
              ? 'K 在 D 之下'
              : 'K 與 D 相等'
    const zone =
      k > KD_LIMITS.high
        ? `，位於 ${KD_LIMITS.high} 以上高檔`
        : k < KD_LIMITS.low
          ? `，位於 ${KD_LIMITS.low} 以下低檔`
          : ''
    state = side + zone
    tone = toneOf(k - d)
  }
  return {
    key: 'kd',
    name: 'KD 隨機指標',
    params: `${period}, ${smoothK}, ${smoothD}`,
    values: [
      { label: 'K', text: formatValue(k, 1) },
      { label: 'D', text: formatValue(d, 1) },
    ],
    state,
    tone,
    description: `收盤價落在最近 ${period} 日高低區間的哪個位置，0 到 100。${KD_LIMITS.high} 以上常稱過熱、${KD_LIMITS.low} 以下常稱超賣。`,
  }
}

function macdReading(snapshot: TechnicalSnapshot): IndicatorReading {
  const { dif, signal, histogram, previousHistogram } = snapshot.macd
  const { fast, slow, signal: signalPeriod } = TECHNICAL_PARAMS.macd
  let state = INSUFFICIENT
  if (histogram !== null) {
    const side = histogram > 0 ? '柱為正，DIF 在 MACD 線之上' : '柱為負，DIF 在 MACD 線之下'
    const momentum =
      previousHistogram === null || histogram === previousHistogram
        ? ''
        : histogram > previousHistogram
          ? '，比前一日走強'
          : '，比前一日走弱'
    state = histogram === 0 ? '柱為 0，DIF 與 MACD 線重合' : side + momentum
  }
  return {
    key: 'macd',
    name: 'MACD',
    params: `${fast}, ${slow}, ${signalPeriod}`,
    values: [
      { label: '柱', text: formatSigned(histogram), tone: toneOf(histogram ?? 0) },
      { label: 'DIF', text: formatSigned(dif) },
      { label: 'MACD', text: formatSigned(signal) },
    ],
    state,
    tone: toneOf(histogram ?? 0),
    description: `DIF 是 ${fast} 日與 ${slow} 日指數均線的差距，MACD 線是 DIF 的 ${signalPeriod} 日平均，柱是兩者相減。柱由負轉正代表短期均價相對長期正在走強。`,
  }
}

function rsiReading(snapshot: TechnicalSnapshot): IndicatorReading {
  const { short, long } = snapshot.rsi
  const [shortPeriod, longPeriod] = TECHNICAL_PARAMS.rsi
  let state = INSUFFICIENT
  let tone: Tone = 'ink'
  if (long !== null) {
    if (long > RSI_LIMITS.high) {
      state = `${longPeriod} 日 RSI 高於 ${RSI_LIMITS.high}，短線偏熱`
      tone = 'rise'
    } else if (long < RSI_LIMITS.low) {
      state = `${longPeriod} 日 RSI 低於 ${RSI_LIMITS.low}，短線偏冷`
      tone = 'fall'
    } else {
      state = `${longPeriod} 日 RSI 在 50 ${long >= 50 ? '以上，漲勢略占上風' : '以下，跌勢略占上風'}`
    }
  }
  return {
    key: 'rsi',
    name: 'RSI 相對強弱',
    params: `${shortPeriod}, ${longPeriod}`,
    values: [
      { label: `${shortPeriod} 日`, text: formatValue(short, 1) },
      { label: `${longPeriod} 日`, text: formatValue(long, 1) },
    ],
    state,
    tone,
    description: `N 日內平均漲幅占平均漲跌幅的比例，0 到 100。${RSI_LIMITS.high} 以上常稱過熱、${RSI_LIMITS.low} 以下常稱超賣；兩個天期一起看短、中期強弱是否一致。`,
  }
}

function bollingerReading(snapshot: TechnicalSnapshot): IndicatorReading {
  const { upper, middle, lower } = snapshot.bollinger
  const { period, width } = TECHNICAL_PARAMS.bollinger
  const zone = bollingerZone(snapshot)
  const percent = bollingerPercent(snapshot)
  const state =
    zone === null
      ? INSUFFICIENT
      : zone === 'upper'
        ? '收盤價在上軌之外'
        : zone === 'lower'
          ? '收盤價在下軌之外'
          : `收盤價在通道內${percent === null ? '' : `，位置 ${percent.toFixed(0)}%（0 為下軌、100 為上軌）`}`
  return {
    key: 'bollinger',
    name: '布林通道',
    params: `${period}, ${width}`,
    values: [
      { label: '上軌', text: formatValue(upper) },
      { label: '中軌', text: formatValue(middle) },
      { label: '下軌', text: formatValue(lower) },
    ],
    state,
    tone: zone === 'upper' ? 'rise' : zone === 'lower' ? 'fall' : 'ink',
    description: `中軌是 ${period} 日均線，上下軌是中軌加減 ${width} 倍標準差。通道寬窄反映近期波動大小，價格大多數時間落在通道內。`,
  }
}

function sarReading(snapshot: TechnicalSnapshot): IndicatorReading {
  const { value, rising } = snapshot.sar
  const { step, max } = TECHNICAL_PARAMS.sar
  return {
    key: 'sar',
    name: 'SAR 拋物線轉向',
    params: `${step}, ${max}`,
    values: [{ label: 'SAR', text: formatValue(value) }],
    state:
      rising === null
        ? INSUFFICIENT
        : rising
          ? 'SAR 在股價下方，判定為上行段'
          : 'SAR 在股價上方，判定為下行段',
    tone: rising === null ? 'ink' : rising ? 'rise' : 'fall',
    description:
      '跟著股價移動的停損點，股價穿過它就翻轉方向。點在股價下方代表這一段被判定為上行，盤整時容易來回翻轉。',
  }
}

function dmiReading(snapshot: TechnicalSnapshot): IndicatorReading {
  const { plusDi, minusDi, adx } = snapshot.dmi
  let state = INSUFFICIENT
  let tone: Tone = 'ink'
  if (plusDi !== null && minusDi !== null && adx !== null) {
    if (adx < ADX_TREND) {
      state = `ADX 低於 ${ADX_TREND}，沒有明顯趨勢`
    } else {
      state = `ADX 在 ${ADX_TREND} 以上，${plusDi >= minusDi ? '+DI 較大，趨勢向上' : '−DI 較大，趨勢向下'}`
      tone = toneOf(plusDi - minusDi)
    }
  }
  return {
    key: 'dmi',
    name: 'DMI／ADX 趨向指標',
    params: String(TECHNICAL_PARAMS.dmi),
    values: [
      { label: '+DI', text: formatValue(plusDi, 1) },
      { label: '−DI', text: formatValue(minusDi, 1) },
      { label: 'ADX', text: formatValue(adx, 1) },
    ],
    state,
    tone,
    description: `+DI 與 −DI 分別衡量向上、向下的動向強度；ADX 只看趨勢強不強、不看方向，${ADX_TREND} 以下通常視為沒有明顯趨勢。`,
  }
}

function biasReading(snapshot: TechnicalSnapshot): IndicatorReading {
  const { short, long } = snapshot.bias
  const [shortPeriod, longPeriod] = TECHNICAL_PARAMS.bias
  return {
    key: 'bias',
    name: '乖離率 BIAS',
    params: `${shortPeriod}, ${longPeriod}`,
    values: [
      { label: `${shortPeriod} 日`, text: formatSigned(short, 2, '%'), tone: toneOf(short ?? 0) },
      { label: `${longPeriod} 日`, text: formatSigned(long, 2, '%'), tone: toneOf(long ?? 0) },
    ],
    state:
      short === null
        ? INSUFFICIENT
        : `收盤價${short >= 0 ? '高於' : '低於'} ${shortPeriod} 日均線 ${Math.abs(short).toFixed(2)}%`,
    tone: toneOf(short ?? 0),
    description: '收盤價偏離均線幾個百分點。偏離多大算大沒有固定標準，要跟同一檔自己過去的乖離比。',
  }
}

function williamsReading(snapshot: TechnicalSnapshot): IndicatorReading {
  const value = snapshot.williamsR
  const period = TECHNICAL_PARAMS.williams
  let state = INSUFFICIENT
  let tone: Tone = 'ink'
  if (value !== null) {
    if (value > -20) {
      state = '高於 −20，收在區間高檔'
      tone = 'rise'
    } else if (value < -80) {
      state = '低於 −80，收在區間低檔'
      tone = 'fall'
    } else {
      state = '介於 −80 與 −20 之間'
    }
  }
  return {
    key: 'williams',
    name: '威廉指標 %R',
    params: String(period),
    values: [{ label: '%R', text: formatValue(value, 1) }],
    state,
    tone,
    description: `收盤價在最近 ${period} 日區間裡的位置，0 貼近區間高點、−100 貼近低點。和 KD 的概念相同、方向相反。`,
  }
}

function cciReading(snapshot: TechnicalSnapshot): IndicatorReading {
  const value = snapshot.cci
  const period = TECHNICAL_PARAMS.cci
  let state = INSUFFICIENT
  let tone: Tone = 'ink'
  if (value !== null) {
    if (value > 100) {
      state = '高於 +100，明顯強於近期平均'
      tone = 'rise'
    } else if (value < -100) {
      state = '低於 −100，明顯弱於近期平均'
      tone = 'fall'
    } else {
      state = '介於 ±100 之間'
    }
  }
  return {
    key: 'cci',
    name: 'CCI 順勢指標',
    params: String(period),
    values: [{ label: 'CCI', text: formatSigned(value, 1) }],
    state,
    tone,
    description: `典型價（高＋低＋收再除以 3）偏離其 ${period} 日均值的程度，±100 是常用的參考線。`,
  }
}

function atrReading(snapshot: TechnicalSnapshot): IndicatorReading {
  const { atr: value, close } = snapshot
  return {
    key: 'atr',
    name: 'ATR 平均真實波幅',
    params: String(TECHNICAL_PARAMS.atr),
    values: [{ label: 'ATR', text: formatValue(value) }],
    state:
      value === null || close === null
        ? INSUFFICIENT
        : `約為收盤價的 ${((value / close) * 100).toFixed(1)}%`,
    tone: 'ink',
    description: '一天大概會波動多少元（不是百分比）。只代表波動大小，和漲跌方向無關。',
  }
}

function obvReading(snapshot: TechnicalSnapshot): IndicatorReading {
  const { value, ma20 } = snapshot.obv
  const rising = value !== null && ma20 !== null ? value - ma20 : null
  return {
    key: 'obv',
    name: 'OBV 能量潮',
    params: '',
    values: [{ label: 'OBV', text: formatLots(value) }],
    state:
      rising === null
        ? INSUFFICIENT
        : rising >= 0
          ? '高於自己的 20 日平均，量能累積中'
          : '低於自己的 20 日平均，量能流出中',
    tone: toneOf(rising ?? 0),
    description:
      '收漲把當天成交量加上去、收跌減掉，累積成一條線。數值本身隨起算日而定，只看方向是否與股價一致。',
  }
}

function volumeReading(snapshot: TechnicalSnapshot): IndicatorReading {
  const { latest, ma5, ma20 } = snapshot.volume
  const [shortPeriod, longPeriod] = TECHNICAL_PARAMS.volumeMa
  return {
    key: 'volume',
    name: '成交量',
    params: `${shortPeriod}, ${longPeriod}`,
    values: [
      { label: '量', text: formatLots(latest) },
      { label: `${shortPeriod} 日均量`, text: formatLots(ma5) },
      { label: `${longPeriod} 日均量`, text: formatLots(ma20) },
    ],
    state:
      latest === null || ma20 === null || ma20 === 0
        ? INSUFFICIENT
        : `今日量是 ${longPeriod} 日均量的 ${(latest / ma20).toFixed(2)} 倍`,
    tone: 'ink',
    description: '當日成交張數與均量。量比均量大代表今天特別熱絡；含盤後與零股交易。',
  }
}

/** 各指標的數值、參數、狀態與白話定義，依畫面顯示順序排列 */
export function technicalReadings(snapshot: TechnicalSnapshot): IndicatorReading[] {
  return [
    kdReading(snapshot),
    macdReading(snapshot),
    rsiReading(snapshot),
    bollingerReading(snapshot),
    sarReading(snapshot),
    dmiReading(snapshot),
    biasReading(snapshot),
    williamsReading(snapshot),
    cciReading(snapshot),
    atrReading(snapshot),
    obvReading(snapshot),
    volumeReading(snapshot),
  ]
}

// ── 綜合訊號 ──

export interface SignalVote {
  key: string
  name: string
  /** 這一項看到了什麼，例如「收盤 102.50 低於 20 日均線 103.69」 */
  reading: string
  /** 1 偏多、−1 偏空、0 中立；算不出來時為 null，不計入 */
  vote: 1 | 0 | -1 | null
}

export type SignalLabel = '偏多' | '偏空' | '中性' | '資料不足'

export interface CompositeSignal {
  label: SignalLabel
  /** 偏多票數減偏空票數 */
  score: number
  bullish: number
  bearish: number
  neutral: number
  votes: SignalVote[]
}

/** 淨票數達到這個門檻才稱偏多或偏空 */
export const SIGNAL_THRESHOLD = 3
/** 至少要有這麼多項算得出來，才給綜合訊號 */
export const SIGNAL_MIN_VOTES = 4

const compare = (a: number, b: number): 1 | 0 | -1 => (a > b ? 1 : a < b ? -1 : 0)
const RELATION = { 1: '高於', 0: '等於', [-1]: '低於' } as const

function signalVotes(snapshot: TechnicalSnapshot): SignalVote[] {
  const { close, macd: macdValues, kd, rsi: rsiValues, dmi: dmiValues, sar } = snapshot
  const ma20 = movingAverage(snapshot, 20)
  const ma60 = movingAverage(snapshot, 60)
  const longRsi = TECHNICAL_PARAMS.rsi[1]
  const unknown = (key: string, name: string): SignalVote => ({
    key,
    name,
    reading: INSUFFICIENT,
    vote: null,
  })

  const priceVote =
    close === null || ma20 === null
      ? unknown('price', '股價與月線')
      : {
          key: 'price',
          name: '股價與月線',
          reading: `收盤 ${close.toFixed(2)} ${RELATION[compare(close, ma20)]} 20 日均線 ${ma20.toFixed(2)}`,
          vote: compare(close, ma20),
        }

  const trendVote =
    ma20 === null || ma60 === null
      ? unknown('trend', '月線與季線')
      : {
          key: 'trend',
          name: '月線與季線',
          reading: `20 日均線 ${ma20.toFixed(2)} ${RELATION[compare(ma20, ma60)]} 60 日均線 ${ma60.toFixed(2)}`,
          vote: compare(ma20, ma60),
        }

  const macdVote =
    macdValues.histogram === null
      ? unknown('macd', 'MACD')
      : {
          key: 'macd',
          name: 'MACD',
          reading: `柱 ${formatSigned(macdValues.histogram)}，DIF ${RELATION[compare(macdValues.histogram, 0)]} MACD 線`,
          vote: compare(macdValues.histogram, 0),
        }

  const kdVote =
    kd.k === null || kd.d === null
      ? unknown('kd', 'KD')
      : {
          key: 'kd',
          name: 'KD',
          reading: `K ${kd.k.toFixed(1)} ${RELATION[compare(kd.k, kd.d)]} D ${kd.d.toFixed(1)}`,
          vote: compare(kd.k, kd.d),
        }

  const rsiVote =
    rsiValues.long === null
      ? unknown('rsi', 'RSI')
      : {
          key: 'rsi',
          name: 'RSI',
          reading: `${longRsi} 日 RSI ${rsiValues.long.toFixed(1)} ${RELATION[compare(rsiValues.long, 50)]} 50`,
          vote: compare(rsiValues.long, 50),
        }

  const { plusDi, minusDi, adx } = dmiValues
  const dmiVote =
    plusDi === null || minusDi === null || adx === null
      ? unknown('dmi', 'DMI')
      : adx < ADX_TREND
        ? {
            key: 'dmi',
            name: 'DMI',
            reading: `ADX ${adx.toFixed(1)} 低於 ${ADX_TREND}，沒有明顯趨勢`,
            vote: 0 as const,
          }
        : {
            key: 'dmi',
            name: 'DMI',
            reading: `ADX ${adx.toFixed(1)}，+DI ${plusDi.toFixed(1)} ${RELATION[compare(plusDi, minusDi)]} −DI ${minusDi.toFixed(1)}`,
            vote: compare(plusDi, minusDi),
          }

  const sarVote =
    sar.rising === null || sar.value === null
      ? unknown('sar', 'SAR')
      : {
          key: 'sar',
          name: 'SAR',
          reading: `SAR ${sar.value.toFixed(2)} 在股價${sar.rising ? '下方（上行段）' : '上方（下行段）'}`,
          vote: sar.rising ? (1 as const) : (-1 as const),
        }

  return [priceVote, trendVote, macdVote, kdVote, rsiVote, dmiVote, sarVote]
}

/**
 * 綜合訊號：七項各投一票（偏多 +1、偏空 −1、中立 0），淨票數達 ±SIGNAL_THRESHOLD 才稱偏多或偏空。
 * 七項都是「順著趨勢看」的判讀；過熱、超賣不計票，另外列在各指標的狀態裡。
 * 算得出來的項目不足 SIGNAL_MIN_VOTES 項時不給結論。
 */
export function compositeSignal(snapshot: TechnicalSnapshot): CompositeSignal {
  const votes = signalVotes(snapshot)
  let bullish = 0
  let bearish = 0
  let neutral = 0
  for (const { vote } of votes) {
    if (vote === 1) bullish++
    else if (vote === -1) bearish++
    else if (vote === 0) neutral++
  }
  const score = bullish - bearish
  const label: SignalLabel =
    bullish + bearish + neutral < SIGNAL_MIN_VOTES
      ? '資料不足'
      : score >= SIGNAL_THRESHOLD
        ? '偏多'
        : score <= -SIGNAL_THRESHOLD
          ? '偏空'
          : '中性'
  return { label, score, bullish, bearish, neutral, votes }
}
