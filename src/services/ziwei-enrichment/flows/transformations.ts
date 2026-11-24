import { toLocalDateString } from '@/utils/date'
import type { Stem } from '@/utils/ganzhi'
import type { ZiWeiChart } from '@/utils/ziwei'
import { adaptZiWeiTransformations } from '../adaptChart'
import type { ZiWeiStemTransformations } from '../types'
import { resolveFlowCalendar } from './calendarContext'

export type ZiWeiLayer = 'natal' | 'year' | 'month' | 'day'

export function buildZiWeiTransformationLayers(chart: ZiWeiChart, natalStem: Stem, date: Date) {
  const calendar = resolveFlowCalendar(date)
  const month = calendar.month
  const layers: Record<ZiWeiLayer, ZiWeiStemTransformations> = {
    natal: adaptZiWeiTransformations(chart, natalStem),
    year: adaptZiWeiTransformations(chart, calendar.yearStem),
    month: adaptZiWeiTransformations(chart, month.stem),
    day: adaptZiWeiTransformations(chart, calendar.dayStem),
  }

  return {
    conventionId: 'lucky50-lunar-flow-v1',
    date: toLocalDateString(date),
    lunarYear: calendar.lunarYear,
    lunarDay: calendar.lunarDay,
    lunarMonth: month.lunarMonth,
    isLeapMonth: month.isLeapMonth,
    effectiveMonth: month.month,
    effectiveMonthYear: calendar.lunarYear + Number(month.nextYear),
    layers,
  } as const
}
