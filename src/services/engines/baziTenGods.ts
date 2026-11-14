import {
  BRANCH_RELATION_LABEL,
  branchRelation,
  mainStem,
  parseGanZhi,
  stemRelation,
  type BranchRelation,
  type GanZhi,
} from '@/utils/ganzhi'
import {
  TEN_GODS_INVESTMENT_STYLE,
  TEN_GOD_GROUP_LABEL,
  calculateFourPillarsTenGods,
  countTenGods,
  dayMasterStrength,
  favorableGroups,
  findDominantTenGods,
  inferInvestmentPersonality,
  tenGodGroup,
  tenGodOf,
  type FourPillars,
  type TenGodGroup,
} from '@/utils/tenGods'
import type { ScoreFactor } from '@/utils/almanac'
import { BaseEngine, describeFactor } from './base'
import { ENGINE_CATALOG } from './settings'
import type { BirthChart } from './birthChart'
import type { EngineInput, MetaphysicsResult } from './types'

/** 流日天干力量較顯，地支次之 */
const STEM_DELTA = 15
const BRANCH_DELTA = 10
const STEM_COMBINE_DELTA = 5

/** 流日地支與日支（自身宮位）的沖合 */
const DAY_BRANCH_DELTA: Readonly<Record<BranchRelation, number>> = {
  clash: -10,
  sixHarmony: 6,
  threeHarmony: 4,
  harm: -5,
  same: 0,
  none: 0,
}

/** 以日主喜忌看流日干支，列出加減項 */
function dailyFactors(
  pillars: FourPillars,
  day: GanZhi,
  favors: ReadonlySet<TenGodGroup>
): ScoreFactor[] {
  const dayMaster = pillars.day.stem
  const factors: ScoreFactor[] = []
  const judge = (position: string, text: string, group: TenGodGroup, delta: number) => {
    const liked = favors.has(group)
    factors.push({
      label: `流日${position}${text}屬${TEN_GOD_GROUP_LABEL[group]}，為${liked ? '喜' : '忌'}`,
      delta: liked ? delta : -delta,
    })
  }

  const stemGod = tenGodOf(dayMaster, day.stem)
  judge('天干', `${day.stem}（${stemGod}）`, tenGodGroup(stemGod), STEM_DELTA)
  const branchGod = tenGodOf(dayMaster, mainStem(day.branch))
  judge('地支', `${day.branch}（${branchGod}）`, tenGodGroup(branchGod), BRANCH_DELTA)

  const relation = branchRelation(pillars.day.branch, day.branch)
  if (DAY_BRANCH_DELTA[relation] !== 0) {
    factors.push({
      label: `流日地支${day.branch}與日支${pillars.day.branch}${BRANCH_RELATION_LABEL[relation]}`,
      delta: DAY_BRANCH_DELTA[relation],
    })
  }
  if (stemRelation(dayMaster, day.stem) === 'combine') {
    factors.push({ label: `日主${dayMaster}與流日天干${day.stem}五合`, delta: STEM_COMBINE_DELTA })
  }
  return factors
}

/** 命盤本身的十神、旺衰與喜忌；與日期無關，同一張命盤只算一次 */
interface NatalReading {
  favors: ReadonlySet<TenGodGroup>
  summary: string
  personality: string
  details: Record<string, unknown>
}

function readNatal(pillars: FourPillars): NatalReading {
  const gods = calculateFourPillarsTenGods(pillars)
  const dominantGods = findDominantTenGods(countTenGods(gods))
  const personality = inferInvestmentPersonality(gods)
  const strength = dayMasterStrength(pillars)
  const favors = favorableGroups(strength.strong)
  const favorable = [...favors].map(group => TEN_GOD_GROUP_LABEL[group])
  const strengthText = `日主${pillars.day.stem}${strength.strong ? '身強' : '身弱'}，喜${favorable.join('、')}`

  return {
    favors,
    summary: `${strengthText}。主要十神：${dominantGods
      .map(god => `${god}（${TEN_GODS_INVESTMENT_STYLE[god]}）`)
      .join('、')}`,
    personality: personality.description,
    details: {
      gods,
      dominantGods,
      investmentStyle: personality.style,
      investmentDescription: personality.description,
      strong: strength.strong,
      inSeason: strength.inSeason,
      favorable,
      strengthText,
    },
  }
}

/** 八字十神：先定日主旺衰與喜忌，再看流日干支落在哪一類十神 */
export class BaziTenGodsEngine extends BaseEngine {
  /** 命盤物件由 buildBirthChart 共用，以它為鍵；命盤被回收時這裡跟著釋放 */
  private natalCache = new WeakMap<BirthChart, NatalReading>()

  constructor() {
    super(ENGINE_CATALOG.baziTenGods)
  }

  private natalOf(chart: BirthChart): NatalReading {
    let natal = this.natalCache.get(chart)
    if (!natal) {
      natal = readNatal(chart.pillars)
      this.natalCache.set(chart, natal)
    }
    return natal
  }

  calculate({ today, chart }: EngineInput): MetaphysicsResult {
    const natal = this.natalOf(chart)
    const day = parseGanZhi(today.dayGanZhi)
    const factors = day ? dailyFactors(chart.pillars, day, natal.favors) : []

    return this.result(factors, {
      summary: natal.summary,
      personality: natal.personality,
      advice: factors.map(describeFactor),
      details: natal.details,
    })
  }
}
