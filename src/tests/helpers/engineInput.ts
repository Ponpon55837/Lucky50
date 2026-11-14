import { buildBirthChart } from '@/services/engines/birthChart'
import { lunarService } from '@/services/lunar'
import type { EngineInput } from '@/services/engines/types'
import type { UserProfileCompat } from '@/services/integratedFortune'

/** 1995-06-15 08:30 生：八字乙亥、壬午、丁丑、甲辰，屬豬，納音山頭火 */
export const PIG_PROFILE: UserProfileCompat = {
  name: '測試',
  birthDate: '1995-06-15',
  birthTime: '08:30',
  zodiac: '豬',
  element: '火',
  nameElement: '火',
  nameStrokes: 20,
  luckyColors: [],
  luckyNumbers: [],
}

/** 1996-06-15 生：丙子年，屬鼠 */
export const RAT_PROFILE: UserProfileCompat = {
  ...PIG_PROFILE,
  birthDate: '1996-06-15',
  zodiac: '鼠',
}

/** 2026-11-16：甲午日，值日青龍黃道，建除值「危」，宜開市納財，煞北 */
export const JIA_WU_DAY = new Date(2026, 10, 16, 10)

export function makeEngineInput(
  profile: UserProfileCompat = PIG_PROFILE,
  date: Date = JIA_WU_DAY
): EngineInput {
  return {
    profile,
    date,
    today: lunarService.getLunarData(date),
    chart: buildBirthChart(profile),
  }
}

/** 自某日起連續 count 天 */
export function consecutiveDays(count: number, start: Date = JIA_WU_DAY): Date[] {
  return Array.from(
    { length: count },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 10)
  )
}
