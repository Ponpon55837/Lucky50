// @ts-expect-error - lunar-javascript 尚未提供型別宣告
import { Solar } from 'lunar-javascript'
import { branchAt, parseGanZhi, stemAt, stemIndex, tigerStem, type Stem } from '@/utils/ganzhi'

interface LunarDate {
  getYear(): number
  getMonth(): number
  getDay(): number
  getYearInGanZhi(): string
  getDayInGanZhi(): string
}

export function resolveFlowMonth(yearStem: Stem, signedMonth: number, day: number) {
  const isLeapMonth = signedMonth < 0
  const lunarMonth = Math.abs(signedMonth)
  const effectiveMonth = lunarMonth + Number(isLeapMonth && day > 15)
  const nextYear = effectiveMonth === 13
  const month = nextYear ? 1 : effectiveMonth
  const sourceYearStem = nextYear ? stemAt(stemIndex(yearStem) + 1) : yearStem

  return {
    lunarMonth,
    isLeapMonth,
    month,
    nextYear,
    stem: tigerStem(sourceYearStem, branchAt(month + 1)),
  }
}

export function resolveFlowCalendar(date: Date) {
  const year = date.getFullYear()
  if (!Number.isFinite(year) || year < 1900 || year > 2100) {
    throw new RangeError('四化日期須在 1900 至 2100 年之間')
  }

  const lunar = Solar.fromYmd(year, date.getMonth() + 1, date.getDate()).getLunar() as LunarDate
  const lunarYear = parseGanZhi(lunar.getYearInGanZhi())
  const lunarDay = parseGanZhi(lunar.getDayInGanZhi())
  if (!lunarYear || !lunarDay) throw new Error('無法讀取四化日期的干支')

  return {
    lunarYear: lunar.getYear(),
    lunarDay: lunar.getDay(),
    yearStem: lunarYear.stem,
    dayStem: lunarDay.stem,
    month: resolveFlowMonth(lunarYear.stem, lunar.getMonth(), lunar.getDay()),
  }
}
