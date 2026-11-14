import { lunarService, type LunarData } from '@/services/lunar'
import { fromLocalDateString } from '@/utils/date'
import type { UserProfileCompat } from '@/services/integratedFortune'
import type { ElementsEnergy, PersonalBaZi } from '@/types'

export interface BirthChart {
  lunarData: LunarData
  baZi: PersonalBaZi
  /** 命盤卡片不使用當日五行能量，給均分值即可 */
  elements: ElementsEnergy
}

const NEUTRAL_ELEMENTS: Readonly<ElementsEnergy> = {
  wood: 20,
  fire: 20,
  earth: 20,
  metal: 20,
  water: 20,
}

/**
 * 依出生日期建立簡化命盤（時柱以年柱近似），供十神、紫微、風水卡片共用。
 */
export function buildBirthChart(profile: UserProfileCompat): BirthChart {
  const lunarData = lunarService.getLunarData(fromLocalDateString(profile.birthDate))
  return {
    lunarData,
    baZi: {
      yearGanZhi: lunarData.ganZhi,
      monthGanZhi: lunarData.monthGanZhi,
      dayGanZhi: lunarData.dayGanZhi,
      hourGanZhi: lunarData.ganZhi,
      zodiac: lunarData.zodiac,
      element: profile.element,
      naYin: lunarData.naYin,
    },
    elements: { ...NEUTRAL_ELEMENTS },
  }
}

/** 0–100 分轉成一個字的強弱描述，介面上不直接顯示分數 */
export function energyWord(score: number): '強' | '中' | '弱' {
  if (score >= 70) return '強'
  if (score >= 50) return '中'
  return '弱'
}
