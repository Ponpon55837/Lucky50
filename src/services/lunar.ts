// @ts-expect-error - lunar-javascript doesn't have TypeScript definitions
import { Solar } from 'lunar-javascript'
import { s2t } from 'chinese-s2t'
import {
  RECOMMENDATION_RISK,
  applyFactors,
  assessTradingDay,
  recommendationFromScore,
  type Recommendation,
  type RiskLevel,
  type ScoreFactor,
} from '@/utils/almanac'
import { toLocalDateString } from '@/utils/date'

export interface LunarData {
  // 基本日期資訊
  lunarYear: string
  lunarMonth: string
  lunarDay: string

  // 天干地支
  ganZhi: string
  monthGanZhi: string
  dayGanZhi: string

  // 生肖星座
  zodiac: string
  constellation: string
  naYin: string

  // 節氣節日
  jieQi: string
  festivals: string[]

  // 宜忌
  yi: string[]
  ji: string[]

  // 其他資訊
  pengZu: string
  naYinDay: string
  jiuXing: string

  // 沖煞與神位
  /** 沖煞描述，例如「(丙戌)狗」 */
  chongDesc: string
  /** 煞方，例如「南」 */
  sha: string
  /** 財神方位，例如「正南」 */
  caiShen: string
  /** 喜神方位 */
  xiShen: string
  /** 福神方位 */
  fuShen: string
  /** 值日天神，例如「司命」 */
  tianShen: string
  /** 值日天神吉凶：「吉」或「凶」 */
  tianShenLuck: string
  /** 建除十二神，例如「成」 */
  zhiXing: string
}

/** 不看個人命盤、只看日子本身的投資建議 */
export interface InvestmentAdvice {
  luckyScore: number
  luckyDirection: string
  advice: string
  riskLevel: RiskLevel
  recommendation: Recommendation
  factors: ScoreFactor[]
}

/** lunar-javascript 中本服務用到的方法 */
interface LunarDay {
  getYearInChinese(): string
  getMonthInChinese(): string
  getDayInChinese(): string
  getYearInGanZhi(): string
  getMonthInGanZhi(): string
  getDayInGanZhi(): string
  getYearShengXiao(): string
  getYearNaYin(): string
  getDayNaYin(): string
  getJieQi(): string
  getFestivals(): string[]
  getDayYi(): string[]
  getDayJi(): string[]
  getPengZuGan(): string
  getPengZuZhi(): string
  getDayNineStar(): { toString(): string }
  getDayChongDesc(): string
  getDaySha(): string
  getDayPositionCaiDesc(): string
  getDayPositionXiDesc(): string
  getDayPositionFuDesc(): string
  getDayTianShen(): string
  getDayTianShenLuck(): string
  getZhiXing(): string
}

interface SolarDay {
  getLunar(): LunarDay
  getXingZuo(): string
  getFestivals(): string[]
}

const ADVICE_TEXT: Readonly<Record<Recommendation, string>> = {
  BUY: '今日日子好，適合積極布局。',
  HOLD: '今日運勢平穩，建議維持現有部位。',
  OBSERVE: '今日宜觀望，避免大額交易。',
  SELL: '今日日子不佳，建議以避險為主。',
}

/** 走勢圖與五年回測一次會查上千個交易日，超過上限時淘汰最早放入的 */
const CACHE_LIMIT = 2048

/** 某日的擇日加減項；zodiac 留空則只看日子本身 */
export function assessDay(lunar: LunarData, zodiac: string): ScoreFactor[] {
  return assessTradingDay({
    tianShen: lunar.tianShen,
    tianShenLuck: lunar.tianShenLuck,
    zhiXing: lunar.zhiXing,
    yi: lunar.yi,
    ji: lunar.ji,
    dayBranch: lunar.dayGanZhi.charAt(1),
    yearBranch: lunar.ganZhi.charAt(1),
    zodiac,
  })
}

const toTraditional = (text: string) => (text ? s2t(text) : '')
const toTraditionalList = (items: readonly string[]) => items.map(toTraditional)

class LunarService {
  /** 以本地日期為鍵；同一天的農民曆固定不變 */
  private cache = new Map<string, LunarData>()

  getLunarData(date: Date = new Date()): LunarData {
    const year = date.getFullYear()
    if (isNaN(year)) throw new Error('無效的日期參數')
    if (year < 1900 || year > 2100) throw new Error(`年份超出範圍 (1900-2100): ${year}`)

    const key = toLocalDateString(date)
    const cached = this.cache.get(key)
    if (cached) return cached

    const data = this.buildLunarData(Solar.fromYmd(year, date.getMonth() + 1, date.getDate()))
    if (this.cache.size >= CACHE_LIMIT) {
      this.cache.delete(this.cache.keys().next().value!)
    }
    this.cache.set(key, data)
    return data
  }

  private buildLunarData(solar: SolarDay): LunarData {
    const lunar = solar.getLunar()

    return {
      lunarYear: lunar.getYearInChinese(),
      lunarMonth: toTraditional(lunar.getMonthInChinese()),
      lunarDay: lunar.getDayInChinese(),
      ganZhi: lunar.getYearInGanZhi(),
      monthGanZhi: lunar.getMonthInGanZhi(),
      dayGanZhi: lunar.getDayInGanZhi(),
      zodiac: toTraditional(lunar.getYearShengXiao()),
      constellation: toTraditional(solar.getXingZuo()),
      naYin: toTraditional(lunar.getYearNaYin()),
      jieQi: toTraditional(lunar.getJieQi()),
      festivals: toTraditionalList([...lunar.getFestivals(), ...solar.getFestivals()]),
      yi: toTraditionalList(lunar.getDayYi()),
      ji: toTraditionalList(lunar.getDayJi()),
      pengZu: toTraditional(`${lunar.getPengZuGan()} ${lunar.getPengZuZhi()}`),
      naYinDay: toTraditional(lunar.getDayNaYin()),
      jiuXing: toTraditional(lunar.getDayNineStar().toString()),
      chongDesc: toTraditional(lunar.getDayChongDesc()),
      sha: toTraditional(lunar.getDaySha()),
      caiShen: toTraditional(lunar.getDayPositionCaiDesc()),
      xiShen: toTraditional(lunar.getDayPositionXiDesc()),
      fuShen: toTraditional(lunar.getDayPositionFuDesc()),
      tianShen: toTraditional(lunar.getDayTianShen()),
      tianShenLuck: toTraditional(lunar.getDayTianShenLuck()),
      zhiXing: toTraditional(lunar.getZhiXing()),
    }
  }

  /** 尚未設定生辰時的備用建議：只看值日天神、建除與宜忌 */
  getInvestmentAdvice(date: Date = new Date()): InvestmentAdvice {
    const lunar = this.getLunarData(date)
    const factors = assessDay(lunar, '')
    const luckyScore = applyFactors(factors)
    const recommendation = recommendationFromScore(luckyScore)

    return {
      luckyScore,
      luckyDirection: lunar.caiShen,
      advice: ADVICE_TEXT[recommendation],
      riskLevel: RECOMMENDATION_RISK[recommendation],
      recommendation,
      factors,
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const lunarService = new LunarService()
