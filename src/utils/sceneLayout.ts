/**
 * 3D 場景的版面計算（純函式）
 * 資料 → 幾何位置、高度與色調的換算全部集中在這裡，元件只負責把結果交給 three.js。
 */
import { extent, linearScale } from '@/utils/chart'
import {
  ELEMENT_CYCLE,
  ELEMENT_LABEL,
  elementRelation,
  type ElementKey,
  type ElementRelation,
} from '@/utils/ganzhi'
import type { Strength } from '@/utils/almanac'
import type { BollingerZone } from '@/utils/technical'
import type { ElementsEnergy, ETFData } from '@/types'

/** 場景用的語意色調，對應 three-scene 的 ScenePalette */
export type SceneTone = 'rise' | 'fall' | 'flat'

/** 漲紅跌綠；變化為 0 時為平盤 */
export function toneOf(change: number): SceneTone {
  if (change > 0) return 'rise'
  if (change < 0) return 'fall'
  return 'flat'
}

/**
 * 讓相機剛好框住一組點所需的距離。
 * points 為以觀察目標為原點、相機座標系（右、上、朝相機）表示的點；
 * 每個點都要落在水平與垂直視角內，取最遠需求即可，O(n)。
 */
export function fitDistance(
  points: readonly (readonly [number, number, number])[],
  fovDeg: number,
  aspect: number,
  padding = 1.1
): number {
  const tanV = Math.tan((fovDeg * Math.PI) / 360)
  const tanH = tanV * aspect
  let distance = 0
  for (const [x, y, z] of points) {
    distance = Math.max(
      distance,
      z + Math.abs(x * padding) / tanH,
      z + Math.abs(y * padding) / tanV
    )
  }
  return distance
}

/** 座標軸刻度：取 1、2、5 × 10ⁿ 的整齊間距，回傳落在 [min, max] 內的刻度 */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || count < 1) return []
  if (min === max) return [min]
  const rough = (max - min) / count
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map(m => m * magnitude).find(s => s >= rough) ?? 10 * magnitude
  const ticks: number[] = []
  // 以整數倍計算，避免浮點累加誤差
  for (let i = Math.ceil(min / step); i * step <= max + step * 1e-9; i++) {
    ticks.push(Number((i * step).toFixed(10)))
  }
  return ticks
}

// ── 股價 K 線 ──

export interface CandleBar {
  /** 水平位置（場景單位，置中於 0） */
  x: number
  /** 實體底部與高度（場景單位，最小 minBody 讓十字線也看得到） */
  bodyBottom: number
  bodyHeight: number
  /** 影線底部與高度 */
  wickBottom: number
  wickHeight: number
  /** 成交量柱高度（0 ~ volumeHeight） */
  volume: number
  /** 收盤相對開盤 */
  tone: SceneTone
}

export interface CandleLayout {
  bars: CandleBar[]
  /** 每根 K 棒佔的寬度 */
  slot: number
  /** 價格 → 場景高度 */
  priceToY: (price: number) => number
  /** 價格刻度 */
  ticks: number[]
}

export interface CandleLayoutOptions {
  width: number
  height: number
  volumeHeight: number
  minBody?: number
}

/** 把日 K 資料換算成場景座標；價格軸取最低價到最高價，O(n) */
export function candleLayout(
  data: readonly ETFData[],
  { width, height, volumeHeight, minBody = 0.03 }: CandleLayoutOptions
): CandleLayout {
  const lows = data.map(d => d.low)
  const highs = data.map(d => d.high)
  const [low] = extent(lows)
  const [, high] = extent(highs)
  const [, maxVolume] = extent(data.map(d => d.volume))
  const priceToY = linearScale([low, high], [0, height])
  const slot = data.length > 0 ? width / data.length : width
  const left = -width / 2 + slot / 2

  const bars = data.map((d, i) => {
    const top = priceToY(Math.max(d.open, d.close))
    const bottom = priceToY(Math.min(d.open, d.close))
    const bodyHeight = Math.max(minBody, top - bottom)
    const wickBottom = priceToY(d.low)
    return {
      x: left + i * slot,
      bodyBottom: Math.min(bottom, height - bodyHeight),
      bodyHeight,
      wickBottom,
      wickHeight: Math.max(minBody, priceToY(d.high) - wickBottom),
      volume: maxVolume > 0 ? (d.volume / maxVolume) * volumeHeight : 0,
      tone: toneOf(d.close - d.open),
    }
  })

  return { bars, slot, priceToY, ticks: data.length > 0 ? niceTicks(low, high, 4) : [] }
}

// ── 五行 ──

/** 圓周上等分的位置；index 0 在正後方（-z），依順時針（俯視）排列 */
export function ringPosition(index: number, count: number, radius: number): [number, number] {
  const angle = (index / count) * Math.PI * 2
  return [radius * Math.sin(angle), -radius * Math.cos(angle)]
}

export const ELEMENT_RELATION_TEXT: Readonly<Record<ElementRelation, string>> = {
  same: '同我（比劫）',
  generates: '我生（食傷）',
  controls: '我剋（財）',
  controlledBy: '剋我（官殺）',
  generatedBy: '生我（印）',
}

export interface ElementPillar {
  key: ElementKey
  label: string
  /** 能量百分比 */
  value: number
  /** 柱高（場景單位） */
  height: number
  /** 月令旺衰；沒有月支時為 null */
  strength: Strength | null
  isOwn: boolean
  /** 相對於本命五行的關係；沒有本命五行時為 null */
  relation: ElementRelation | null
}

/** 依相生順序（木火土金水）排出五根柱子，最高的一根為 maxHeight */
export function elementPillars(
  energy: ElementsEnergy,
  own: ElementKey | null,
  strengths: Readonly<Record<ElementKey, Strength>> | null,
  maxHeight: number,
  minHeight = 0.08
): ElementPillar[] {
  const peak = Math.max(...ELEMENT_CYCLE.map(key => energy[key]))
  return ELEMENT_CYCLE.map(key => ({
    key,
    label: ELEMENT_LABEL[key],
    value: energy[key],
    height: peak > 0 ? Math.max(minHeight, (energy[key] / peak) * maxHeight) : minHeight,
    strength: strengths?.[key] ?? null,
    isOwn: key === own,
    relation: own ? elementRelation(own, key) : null,
  }))
}

/** 相剋（五角星）連線：木→土→水→火→金→木，以 ELEMENT_CYCLE 的索引表示 */
export const CONTROL_STAR: readonly number[] = [0, 2, 4, 1, 3]

// ── 技術指標 ──

export const BOLLINGER_ZONE_TEXT: Readonly<Record<BollingerZone, string>> = {
  upper: '突破上軌',
  middle: '通道內',
  lower: '跌破下軌',
}

/** 0–100 的振盪指標狀態（RSI 以 30/70、KD 以 20/80 為界） */
export function oscillatorState(
  value: number,
  low: number,
  high: number
): '超買' | '超賣' | '中性' {
  if (value > high) return '超買'
  if (value < low) return '超賣'
  return '中性'
}

/**
 * MACD 以收盤價的百分比表示後映射到 [-1, 1]；±limitPercent 以外視為滿格。
 * 直接用點數比較會隨股價高低失真，換成百分比後不同價位尺度一致。
 */
export function macdRatio(macd: number, price: number, limitPercent = 2): number {
  if (!(price > 0)) return 0
  const ratio = ((macd / price) * 100) / limitPercent
  return Math.max(-1, Math.min(1, ratio))
}
