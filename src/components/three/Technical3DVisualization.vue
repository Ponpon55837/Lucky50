<script setup lang="ts">
import { computed, ref } from 'vue'
import * as THREE from 'three'
import SceneCard, { type SceneTooltip } from '@/components/three/SceneCard.vue'
import { useSceneStage } from '@/composables/useSceneStage'
import { useAnalyticsStore } from '@/stores/analytics'
import { hasPriceAdjustmentMismatch } from '@/utils/priceAdjust'
import { BOLLINGER_ZONE_TEXT, macdRatio, oscillatorState } from '@/utils/sceneLayout'
import {
  KD_LIMITS,
  RSI_LIMITS,
  TECHNICAL_PARAMS,
  bollingerZone,
  compositeSignal,
  formatSigned,
  formatValue,
  type BollingerZone,
  type Tone,
} from '@/utils/technical'
import {
  createBase,
  createColumns,
  easeOutCubic,
  lineMaterial,
  matteMaterial,
  placeColumn,
} from '@/utils/three-scene'

const { title = '技術指標' } = defineProps<{ title?: string }>()

/** 量規高度：0–100 對應 0–GAUGE_HEIGHT 場景單位；MACD 的零軸在中線 */
const GAUGE_HEIGHT = 3
const GAUGE_X = [-3.3, -1.1, 1.1, 3.3] as const
const SLAB_WIDTH = 1.6
const SLAB_Z = -0.25
const RSI_PERIOD = TECHNICAL_PARAMS.rsi[1]

const analyticsStore = useAnalyticsStore()
const snapshot = computed(() => analyticsStore.technicalSnapshot)

/**
 * 四座量規需要的數值；任何一項還在暖機期就整張不畫（改顯示說明），不拿假值充數。
 * RSI 取 12 日，MACD 取 DIF（快慢線差）。
 */
const indicators = computed(() => {
  const { close, rsi, kd, macd } = snapshot.value
  const zone = bollingerZone(snapshot.value)
  if (
    close === null ||
    rsi.long === null ||
    kd.k === null ||
    kd.d === null ||
    macd.dif === null ||
    zone === null
  ) {
    return null
  }
  return { close, rsi: rsi.long, kd: { k: kd.k, d: kd.d }, macd: macd.dif, zone }
})

const signal = computed(() => compositeSignal(snapshot.value))
const rsiState = computed(() =>
  oscillatorState(indicators.value?.rsi ?? 50, RSI_LIMITS.low, RSI_LIMITS.high)
)
const kState = computed(() =>
  oscillatorState(indicators.value?.kd.k ?? 50, KD_LIMITS.low, KD_LIMITS.high)
)
const zone = computed<BollingerZone>(() => indicators.value?.zone ?? 'middle')
const macdValue = computed(() => indicators.value?.macd ?? 0)
const ratio = computed(() => macdRatio(macdValue.value, indicators.value?.close ?? 0))

const signalClass = computed(() => {
  if (signal.value.label === '偏多') return 'text-rise'
  if (signal.value.label === '偏空') return 'text-fall'
  return 'text-ink'
})

const TONE_CLASS: Readonly<Record<Tone, string>> = {
  rise: 'text-rise',
  fall: 'text-fall',
  ink: 'text-ink',
}
const oscillatorTone = (state: '超買' | '超賣' | '中性'): Tone =>
  state === '超買' ? 'rise' : state === '超賣' ? 'fall' : 'ink'
const macdTone = computed<Tone>(() =>
  macdValue.value > 0 ? 'rise' : macdValue.value < 0 ? 'fall' : 'ink'
)
const macdSide = computed(() =>
  macdValue.value > 0 ? '多方' : macdValue.value < 0 ? '空方' : '持平'
)
const zoneTone = (value: BollingerZone): Tone =>
  value === 'upper' ? 'rise' : value === 'lower' ? 'fall' : 'ink'

const GAUGE_NAMES = ['RSI', 'KD', 'MACD', '布林'] as const

/** 各量規頂部的數值文字與色調 */
const readouts = computed<{ text: string; tone: Tone }[]>(() => {
  const values = indicators.value
  if (!values) return []
  return [
    { text: values.rsi.toFixed(1), tone: oscillatorTone(rsiState.value) },
    {
      text: `${Math.round(values.kd.k)}／${Math.round(values.kd.d)}`,
      tone: oscillatorTone(kState.value),
    },
    { text: formatSigned(values.macd), tone: macdTone.value },
    { text: BOLLINGER_ZONE_TEXT[zone.value], tone: 'ink' },
  ]
})

const hasData = computed(() => indicators.value !== null)
const emptyText = computed(() => {
  if (hasData.value) return ''
  if (hasPriceAdjustmentMismatch(analyticsStore.technicalAdjustmentChecks))
    return '分割或除息前收待查，技術指標暫不提供'
  if (analyticsStore.technicalStatus === 'unavailable') return '無法取得行情，技術指標暫不提供'
  if (analyticsStore.technicalProvenance) return '行情資料不足，無法計算技術指標'
  return '行情載入中…'
})
const subtitle = computed(() => {
  const provenance = analyticsStore.technicalProvenance
  if (!provenance) return '依還原後的日 K 計算'
  const label = analyticsStore.technicalStatus === 'cached' ? '行情快取' : '資料日期'
  return `${label} ${provenance.asOf}`
})
const threeContainer = ref<HTMLElement>()

const { unsupported, hover } = useSceneStage(threeContainer, {
  view: [0, 0.6, 2.4],
  sources: [indicators],
  build: (stage, root, palette) => {
    if (!indicators.value) return

    const { rsi, kd } = indicators.value
    const heightOf = (value: number) => (Math.min(100, Math.max(0, value)) / 100) * GAUGE_HEIGHT
    const mid = GAUGE_HEIGHT / 2
    const seg = GAUGE_HEIGHT / 3
    const [rsiX, kdX, macdX, bollX] = GAUGE_X

    root.add(createBase(palette, { width: 9.6, depth: 1.8 }))

    // 軌道：RSI、KD、MACD 各一根，布林切成下／中／上三段（目前所在段加寬、深色）
    const activeSegment = zone.value === 'upper' ? 2 : zone.value === 'lower' ? 0 : 1
    const trackColumns: { x: number; bottom: number; height: number; width: number }[] = [
      { x: rsiX, bottom: 0, height: GAUGE_HEIGHT, width: 0.1 },
      { x: kdX, bottom: 0, height: GAUGE_HEIGHT, width: 0.1 },
      { x: macdX, bottom: 0, height: GAUGE_HEIGHT, width: 0.1 },
      ...[0, 1, 2].map(index => ({
        x: bollX,
        bottom: index * seg + 0.02,
        height: seg - 0.04,
        width: index === activeSegment ? 0.42 : 0.14,
      })),
    ]
    const tracks = createColumns(trackColumns.length, matteMaterial(0xffffff))
    trackColumns.forEach((track, i) => {
      const active = i >= 3 && i - 3 === activeSegment
      tracks.setColorAt(i, active ? palette['ink-2'] : palette.line)
      placeColumn(tracks, i, [track.x, track.bottom, 0], [track.width, track.height, 0.1])
    })
    root.add(tracks)

    // 區間色帶：貼在量規後方的半透明薄板（RSI 超買／超賣、KD 80／20、MACD 多空兩側）
    const bandBoxes: { x: number; from: number; to: number; tone: 'rise' | 'fall' }[] = [
      { x: rsiX, from: RSI_LIMITS.high, to: 100, tone: 'rise' },
      { x: rsiX, from: 0, to: RSI_LIMITS.low, tone: 'fall' },
      { x: kdX, from: KD_LIMITS.high, to: 100, tone: 'rise' },
      { x: kdX, from: 0, to: KD_LIMITS.low, tone: 'fall' },
    ]
    const bands = createColumns(bandBoxes.length + 2, matteMaterial(0xffffff, { opacity: 0.2 }))
    bandBoxes.forEach((band, i) => {
      bands.setColorAt(i, palette[band.tone])
      placeColumn(
        bands,
        i,
        [band.x, heightOf(band.from), SLAB_Z],
        [SLAB_WIDTH, heightOf(band.to) - heightOf(band.from), 0.04]
      )
    })
    // MACD：零軸以上為多方（紅）、以下為空方（綠），比 RSI 色帶更淡
    bands.setColorAt(bandBoxes.length, palette.rise)
    placeColumn(bands, bandBoxes.length, [macdX, mid, SLAB_Z], [SLAB_WIDTH, mid, 0.04])
    bands.setColorAt(bandBoxes.length + 1, palette.fall)
    placeColumn(bands, bandBoxes.length + 1, [macdX, 0, SLAB_Z], [SLAB_WIDTH, mid, 0.04])
    root.add(bands)

    // 刻度線：RSI 30／70、KD 20／80、MACD 零軸
    const tickPoints: THREE.Vector3[] = []
    const addTick = (x: number, y: number) =>
      tickPoints.push(
        new THREE.Vector3(x - SLAB_WIDTH / 2, y, SLAB_Z + 0.03),
        new THREE.Vector3(x + SLAB_WIDTH / 2, y, SLAB_Z + 0.03)
      )
    for (const value of [RSI_LIMITS.low, RSI_LIMITS.high]) addTick(rsiX, heightOf(value))
    for (const value of [KD_LIMITS.low, KD_LIMITS.high]) addTick(kdX, heightOf(value))
    addTick(macdX, mid)
    root.add(
      new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(tickPoints),
        lineMaterial(palette['ink-3'], 0.7)
      )
    )

    const tickLabelX = SLAB_WIDTH / 2 + 0.06
    const addTickLabel = (text: string, x: number, y: number) =>
      stage.addLabel(text, [x + tickLabelX, y, 0], { variant: 'value', align: 'left' })
    addTickLabel(String(RSI_LIMITS.high), rsiX, heightOf(RSI_LIMITS.high))
    addTickLabel(String(RSI_LIMITS.low), rsiX, heightOf(RSI_LIMITS.low))
    addTickLabel(String(KD_LIMITS.high), kdX, heightOf(KD_LIMITS.high))
    addTickLabel(String(KD_LIMITS.low), kdX, heightOf(KD_LIMITS.low))
    addTickLabel('0', macdX, mid)
    // 超買／超賣名稱放在色帶左外側，避開中央數值柱
    stage.addLabel('超買', [rsiX - SLAB_WIDTH / 2 - 0.06, heightOf(85), 0], {
      align: 'right',
      tone: 'rise',
    })
    stage.addLabel('超賣', [rsiX - SLAB_WIDTH / 2 - 0.06, heightOf(15), 0], {
      align: 'right',
      tone: 'fall',
    })
    stage.addLabel('上軌', [bollX + 0.32, seg * 2, 0], { align: 'left' })
    stage.addLabel('下軌', [bollX + 0.32, seg, 0], { align: 'left' })

    // 數值柱：RSI、K、D、MACD；先放最終位置，入場動畫再縮放
    const macdHeight = Math.abs(ratio.value) * mid
    const macdUp = ratio.value >= 0
    const bars = createColumns(4, matteMaterial(0xffffff))
    bars.setColorAt(0, palette['ink-2'])
    bars.setColorAt(1, palette['ink-2'])
    bars.setColorAt(2, palette['ink-3'])
    bars.setColorAt(3, macdUp ? palette.rise : palette.fall)
    const placeBars = (scale: number) => {
      placeColumn(bars, 0, [rsiX, 0, 0], [0.34, heightOf(rsi) * scale, 0.3])
      placeColumn(bars, 1, [kdX - 0.17, 0, 0], [0.22, heightOf(kd.k) * scale, 0.3])
      placeColumn(bars, 2, [kdX + 0.17, 0, 0], [0.22, heightOf(kd.d) * scale, 0.3])
      const grown = macdHeight * scale
      placeColumn(bars, 3, [macdX, macdUp ? mid : mid - grown, 0], [0.34, grown, 0.3])
    }
    placeBars(1)
    root.add(bars)

    // 名稱（底部前方）與數值（頂部上方）
    GAUGE_X.forEach((x, i) => {
      stage.addLabel(GAUGE_NAMES[i], [x, -0.12, 0.6], {
        variant: 'title',
        anchor: 'below',
        tone: 'ink',
      })
      stage.addLabel(readouts.value[i].text, [x, GAUGE_HEIGHT + 0.14, 0], {
        variant: 'value',
        anchor: 'above',
        tone: readouts.value[i].tone,
      })
    })

    // 透明點選區：每座量規一個，涵蓋整根量規
    const hits = createColumns(4, new THREE.MeshBasicMaterial({ visible: false }))
    GAUGE_X.forEach((x, i) =>
      placeColumn(hits, i, [x, 0, 0], [SLAB_WIDTH, GAUGE_HEIGHT + 0.2, 0.8])
    )
    root.add(hits)

    stage.animate(800, progress => placeBars(easeOutCubic(progress)))
    return [hits]
  },
})

const tooltip = computed<SceneTooltip | null>(() => {
  const hit = hover.value
  if (!hit || hit.instanceId === undefined || !indicators.value) return null
  const { rsi, macd, kd } = indicators.value
  const base = { x: hit.x, y: hit.y }
  switch (hit.instanceId) {
    case 0:
      return {
        ...base,
        title: `RSI 相對強弱指標（${RSI_PERIOD} 日）`,
        lines: [
          { label: '數值', value: rsi.toFixed(1) },
          {
            label: '狀態',
            value: rsiState.value,
            tone: TONE_CLASS[oscillatorTone(rsiState.value)],
          },
          {
            label: '判讀',
            value:
              rsiState.value === '超買'
                ? `RSI 高於 ${RSI_LIMITS.high}，短線偏熱`
                : rsiState.value === '超賣'
                  ? `RSI 低於 ${RSI_LIMITS.low}，短線偏冷`
                  : `RSI 介於 ${RSI_LIMITS.low}–${RSI_LIMITS.high}，中性`,
          },
        ],
      }
    case 1:
      return {
        ...base,
        title: 'KD 隨機指標',
        lines: [
          { label: 'K 值', value: kd.k.toFixed(1) },
          { label: 'D 值', value: kd.d.toFixed(1) },
          { label: '狀態', value: kState.value, tone: TONE_CLASS[oscillatorTone(kState.value)] },
          {
            label: '判讀',
            value:
              kd.k > kd.d
                ? 'K 在 D 之上，短線偏多'
                : kd.k < kd.d
                  ? 'K 在 D 之下，短線偏空'
                  : 'K 與 D 相等',
          },
        ],
      }
    case 2:
      return {
        ...base,
        title: 'MACD 指數平滑異同',
        lines: [
          { label: 'DIF', value: formatSigned(macd), tone: TONE_CLASS[macdTone.value] },
          { label: 'MACD 線', value: formatSigned(snapshot.value.macd.signal) },
          { label: '柱', value: formatSigned(snapshot.value.macd.histogram) },
          { label: '狀態', value: macdSide.value, tone: TONE_CLASS[macdTone.value] },
          {
            label: '判讀',
            value:
              macd > 0
                ? 'DIF 在零軸之上，短期均價高於長期'
                : macd < 0
                  ? 'DIF 在零軸之下，短期均價低於長期'
                  : 'DIF 在零軸',
          },
        ],
      }
    case 3:
      return {
        ...base,
        title: '布林通道',
        lines: [
          {
            label: '位置',
            value: BOLLINGER_ZONE_TEXT[zone.value],
            tone: TONE_CLASS[zoneTone(zone.value)],
          },
          {
            label: '判讀',
            value:
              zone.value === 'upper'
                ? '收盤價在上軌之外，短線偏熱'
                : zone.value === 'lower'
                  ? '收盤價在下軌之外，短線偏冷'
                  : '收盤價在通道內，波動正常',
          },
        ],
      }
    default:
      return null
  }
})
</script>

<template>
  <SceneCard
    :title="title"
    :subtitle="subtitle"
    :unsupported="unsupported"
    :empty="emptyText"
    :tooltip="tooltip"
  >
    <template #stats>
      <div>
        <dt class="text-ink-3">
          綜合訊號
        </dt>
        <dd :class="['font-serif text-base font-bold', signalClass]">
          {{ signal.label }}
        </dd>
      </div>
      <div>
        <dt class="text-ink-3">
          RSI {{ RSI_PERIOD }}
        </dt>
        <dd :class="['font-mono text-base', TONE_CLASS[oscillatorTone(rsiState)]]">
          {{ formatValue(snapshot.rsi.long, 1) }}
        </dd>
      </div>
      <div>
        <dt class="text-ink-3">
          DIF
        </dt>
        <dd :class="['font-mono text-base', TONE_CLASS[macdTone]]">
          {{ formatSigned(snapshot.macd.dif) }}
        </dd>
      </div>
    </template>

    <div
      ref="threeContainer"
      class="absolute inset-0"
    />

    <template #legend>
      <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-rise/30" />紅帶＝超買區</span>
      <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-fall/30" />綠帶＝超賣區</span>
      <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-rise" />MACD 紅柱＝多方</span>
      <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-fall" />綠柱＝空方</span>
    </template>

    <template #fallback>
      <dl class="grid grid-cols-2 gap-x-6 gap-y-1">
        <dt>綜合訊號</dt>
        <dd :class="['font-serif font-bold', signalClass]">
          {{ signal.label }}
        </dd>
        <dt>RSI {{ RSI_PERIOD }}</dt>
        <dd :class="['font-mono', TONE_CLASS[oscillatorTone(rsiState)]]">
          {{ formatValue(snapshot.rsi.long, 1) }}<template v-if="hasData">
            （{{ rsiState }}）
          </template>
        </dd>
        <dt>KD</dt>
        <dd class="font-mono">
          K {{ formatValue(snapshot.kd.k, 1) }}／D {{ formatValue(snapshot.kd.d, 1) }}<template
            v-if="hasData"
          >
            （{{ kState }}）
          </template>
        </dd>
        <dt>MACD DIF</dt>
        <dd :class="['font-mono', TONE_CLASS[macdTone]]">
          {{ formatSigned(snapshot.macd.dif) }}<template v-if="hasData">
            （{{ macdSide }}）
          </template>
        </dd>
        <dt>布林通道</dt>
        <dd>{{ hasData ? BOLLINGER_ZONE_TEXT[zone] : '–' }}</dd>
      </dl>
    </template>
  </SceneCard>
</template>
