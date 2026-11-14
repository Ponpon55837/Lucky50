import { computed, type Ref } from 'vue'
import { lunarService } from '@/services/lunar'
import {
  buildHourWheel,
  classifyTradingDay,
  describeElements,
  elementFromLabel,
  seasonalStrength,
  type Omen,
} from '@/utils/almanac'
import { fromLocalDateString, toLocalDateString } from '@/utils/date'
import { fnv1a32, profileHash } from '@/utils/hash'
import type { LunarData } from '@/services/lunar'
import type { ETFData, UserProfile } from '@/types'

export interface ChartPoint {
  date: string
  close: number
  omen: Omen
}

/**
 * 儀表板的農民曆衍生資料：時辰輪、五行旺衰、走勢圖吉印與籤的種子。
 * 全部是 computed，來源資料不變時不會重算。
 */
export function useDashboardAlmanac(
  lunar: Ref<LunarData | null>,
  /** 時辰輪要看的那一天：今天開盤看今天，休市則看下一個交易日 */
  wheelLunar: Ref<LunarData | null>,
  profile: Ref<UserProfile | null>,
  etfData: Ref<readonly ETFData[]>,
  date: Ref<Date>
) {
  const zodiac = computed(() => profile.value?.zodiac ?? '')

  /** 時辰吉凶依生肖推算，沒有生辰時不顯示 */
  const hourSlots = computed(() => {
    const day = wheelLunar.value
    return zodiac.value && day ? buildHourWheel(zodiac.value, day.dayGanZhi.charAt(1)) : []
  })

  const strengths = computed(() => {
    const monthGanZhi = lunar.value?.monthGanZhi
    return monthGanZhi ? seasonalStrength(monthGanZhi.charAt(1)) : null
  })

  const ownElement = computed(() => elementFromLabel(profile.value?.element ?? ''))
  const nameElement = computed(() => elementFromLabel(profile.value?.nameElement ?? ''))

  const elementReading = computed(() =>
    strengths.value ? describeElements(strengths.value, ownElement.value, nameElement.value) : null
  )

  /** 每個交易日的吉凶；農民曆資料由 lunarService 快取，單趟 O(n) */
  const chartPoints = computed<ChartPoint[]>(() =>
    etfData.value.map(row => {
      const lunar = lunarService.getLunarData(fromLocalDateString(row.date))
      return {
        date: row.date,
        close: row.close,
        omen: classifyTradingDay({
          yi: lunar.yi,
          ji: lunar.ji,
          dayBranch: lunar.dayGanZhi.charAt(1),
          zodiac: zodiac.value,
        }),
      }
    })
  )

  /** 吉日中有幾天收紅（相對前一交易日） */
  const luckyDaySummary = computed(() => {
    const points = chartPoints.value
    let lucky = 0
    let luckyUp = 0
    for (let i = 0; i < points.length; i++) {
      if (points[i].omen !== 'good') continue
      lucky++
      if (i > 0 && points[i].close > points[i - 1].close) luckyUp++
    }
    return { lucky, luckyUp }
  })

  /** 同一人同一天抽到同一支籤 */
  const lotSeed = computed(() => {
    const p = profile.value
    const key = p ? profileHash(p) : 'guest'
    return fnv1a32(`${toLocalDateString(date.value)}|${key}`)
  })

  return {
    hourSlots,
    strengths,
    ownElement,
    nameElement,
    elementReading,
    chartPoints,
    luckyDaySummary,
    lotSeed,
  }
}
