import { assessDay } from '@/services/lunar'
import { clashesZodiac } from '@/utils/almanac'
import { BaseEngine, describeFactor } from './base'
import { ENGINE_CATALOG } from './settings'
import type { EngineInput, MetaphysicsResult } from './types'

/** 經典命理：農民曆擇日，看當天日子本身的好壞與它對本命的沖合 */
export class ClassicFortuneEngine extends BaseEngine {
  constructor() {
    super(ENGINE_CATALOG.classic)
  }

  calculate({ today, chart }: EngineInput): MetaphysicsResult {
    const dayBranch = today.dayGanZhi.charAt(1)
    const factors = assessDay(today, chart.zodiac)

    return this.result(factors, {
      summary: `${today.dayGanZhi}日，值日${today.tianShen}，建除值「${today.zhiXing}」`,
      advice: factors.length > 0 ? factors.map(describeFactor) : ['今日無特別吉凶'],
      warnings: clashesZodiac(dayBranch, chart.zodiac)
        ? [`今日${dayBranch}日沖生肖${chart.zodiac}，不宜做重大投資決定。`]
        : undefined,
    })
  }
}
