import { branchAt, branchIndex, type Branch } from '@/utils/ganzhi'
import { isBright, type Transformation } from '@/utils/ziwei'
import type { ZiWeiChartSnapshot, ZiWeiSnapshotStar } from '../types'
import type { ZiWeiPatternCondition, ZiWeiPatternResult, ZiWeiPatternStar } from './types'

type StarName = ZiWeiSnapshotStar['name']
type RuleDetails = Pick<ZiWeiPatternResult, 'id' | 'name' | 'sources'>
type RuleConditions = Pick<ZiWeiPatternResult, 'required' | 'supporting' | 'breaking'>

const FOUR_MALEFICS = ['擎羊', '陀羅', '火星', '鈴星'] as const
const WU_TAN_MALEFICS = ['擎羊', '陀羅', '地空', '地劫'] as const
const SOURCE_PATH =
  'https://github.com/Renhuai123/ziwei-doushu/blob/39c0abd3b8dac609975dddfadd4d4e1d3a978deb/lib/ziwei'

function condition(
  id: string,
  description: string,
  matched: boolean,
  branches: readonly Branch[],
  stars: readonly ZiWeiPatternStar[] = []
): ZiWeiPatternCondition {
  return { id, description, matched, branches, stars }
}

function buildContext(chart: ZiWeiChartSnapshot) {
  const { lifeBranch, palaces } = chart
  const life = branchIndex(lifeBranch)
  const wealthAndCareer = [branchAt(life + 8), branchAt(life + 4)]
  const lifeGroup = [lifeBranch, ...wealthAndCareer, branchAt(life + 6)]
  const stars = new Map<StarName, ZiWeiPatternStar>()
  for (const palace of Object.values(palaces)) {
    for (const star of palace.stars) {
      stars.set(star.name, { ...star, branch: palace.branch })
    }
  }

  function findStars(names: readonly StarName[], branches?: readonly Branch[]) {
    return names.flatMap(name => {
      const star = stars.get(name)
      return star && (!branches || branches.includes(star.branch)) ? [star] : []
    })
  }

  function natalStars(type: Transformation, branches: readonly Branch[]) {
    return chart.natalTransformations.entries.flatMap(entry => {
      const star = stars.get(entry.star)
      return entry.type === type &&
        star?.branch === entry.palaceBranch &&
        branches.includes(star.branch)
        ? [{ ...star, natalTransformation: type }]
        : []
    })
  }

  return { lifeBranch, lifeGroup, wealthAndCareer, stars, findStars, natalStars }
}

type Context = ReturnType<typeof buildContext>

function result(
  chart: ZiWeiChartSnapshot,
  rule: RuleDetails,
  { required, supporting, breaking }: RuleConditions
): ZiWeiPatternResult {
  const meetsRequirements = required.every(entry => entry.matched)
  const activeBreaking = meetsRequirements ? breaking.filter(entry => entry.matched) : []
  const status = meetsRequirements
    ? activeBreaking.length > 0
      ? 'weakened'
      : 'qualified'
    : 'not-qualified'
  return {
    ...rule,
    sources: rule.sources.map(source => ({ ...source })),
    status,
    ruleVersion: 1,
    conventionId: chart.conventionId,
    required,
    supporting: meetsRequirements ? supporting.filter(entry => entry.matched) : [],
    breaking: activeBreaking,
  }
}

function fuXiangConditions(context: Context): RuleConditions {
  const { lifeBranch, lifeGroup, wealthAndCareer, findStars, natalStars } = context
  const lifePalace = [lifeBranch]
  const fuXiang = findStars(['天府', '天相'])
  const branches = fuXiang.map(star => star.branch)
  const splitPalaces = wealthAndCareer.every(branch => branches.includes(branch))
  const prosperity = [...findStars(['祿存'], lifePalace), ...natalStars('化祿', lifePalace)]
  const assistant = findStars(['左輔'], lifeGroup)
  const lifeMalefics = findStars(FOUR_MALEFICS, lifePalace)
  const groupMalefics = findStars(FOUR_MALEFICS, lifeGroup)

  return {
    required: [
      condition(
        'life-yin-shen',
        '命宮位於寅或申',
        lifeBranch === '寅' || lifeBranch === '申',
        lifePalace
      ),
      condition(
        'fu-xiang-split',
        '天府與天相分坐財帛、官祿宮',
        splitPalaces,
        wealthAndCareer,
        fuXiang
      ),
    ],
    supporting: [
      condition(
        'life-prosperity',
        '命宮見祿存或本命化祿',
        prosperity.length > 0,
        lifePalace,
        prosperity
      ),
      condition(
        'life-group-zuo-fu',
        '命宮三方四正見左輔',
        assistant.length > 0,
        lifeGroup,
        assistant
      ),
    ],
    breaking: [
      condition(
        'life-malefics',
        '命宮坐四煞之一',
        lifeMalefics.length > 0,
        lifePalace,
        lifeMalefics
      ),
      condition(
        'three-malefics',
        '命宮三方四正聚至少三顆四煞',
        groupMalefics.length >= 3,
        lifeGroup,
        groupMalefics
      ),
    ],
  }
}

function yangLiangConditions(context: Context): RuleConditions {
  const { lifeGroup, stars, findStars, natalStars } = context
  const requiredStars = [
    ['sun', '太陽'],
    ['tian-liang', '天梁'],
    ['wen-chang', '文昌'],
    ['lu-cun', '祿存'],
  ] as const
  const bright = findStars(['太陽', '天梁'], lifeGroup).filter(star => isBright(star.brightness))
  const sun = stars.get('太陽')
  const dimSun = sun?.brightness === '陷' ? [sun] : []
  const natalKe = natalStars('化科', lifeGroup)
  const malefics = findStars(FOUR_MALEFICS, lifeGroup)

  return {
    required: requiredStars.map(([id, name]) => {
      const star = stars.get(name)
      return condition(
        `life-group-${id}`,
        `${name}會照命宮三方四正`,
        star !== undefined && lifeGroup.includes(star.branch),
        lifeGroup,
        star ? [star] : []
      )
    }),
    supporting: [
      condition('sun-or-liang-bright', '太陽或天梁廟旺', bright.length > 0, lifeGroup, bright),
      condition(
        'life-group-natal-ke',
        '命宮三方四正會本命化科',
        natalKe.length > 0,
        lifeGroup,
        natalKe
      ),
    ],
    breaking: [
      condition('sun-fallen', '太陽在陷地', dimSun.length > 0, lifeGroup, dimSun),
      condition(
        'two-malefics',
        '命宮三方四正聚至少兩顆四煞',
        malefics.length >= 2,
        lifeGroup,
        malefics
      ),
    ],
  }
}

function wuTanConditions(context: Context): RuleConditions {
  const { lifeGroup, stars, findStars, natalStars } = context
  const wu = stars.get('武曲')
  const tan = stars.get('貪狼')
  const wuTan = findStars(['武曲', '貪狼'])
  const validBranches = ['丑', '未'] as const
  const sameHouse =
    wu !== undefined && tan?.branch === wu.branch && (wu.branch === '丑' || wu.branch === '未')
  const wuPalace = wu ? [wu.branch] : []
  const fireBell = findStars(['火星', '鈴星'], lifeGroup)
  const natalLu = natalStars('化祿', wuPalace).filter(star => star.name === '武曲')
  const malefics = findStars(WU_TAN_MALEFICS, wuPalace)

  return {
    required: [
      condition('wu-tan-same-house', '武曲與貪狼同坐丑或未', sameHouse, validBranches, wuTan),
      condition(
        'wu-tan-meets-life-group',
        '武曲坐於命宮三方四正',
        wu !== undefined && lifeGroup.includes(wu.branch),
        lifeGroup,
        wu ? [wu] : []
      ),
    ],
    supporting: [
      condition(
        'life-group-fire-bell',
        '命宮三方四正見火星或鈴星',
        fireBell.length > 0,
        lifeGroup,
        fireBell
      ),
      condition('wu-natal-lu', '武曲本命化祿', natalLu.length > 0, wuPalace, natalLu),
    ],
    breaking: [
      condition('wu-tan-malefics', '武貪宮坐羊陀或空劫', malefics.length > 0, wuPalace, malefics),
    ],
  }
}

const RULES: readonly (RuleDetails & { conditions(context: Context): RuleConditions })[] = [
  {
    id: 'fu-xiang-chao-yuan',
    name: '府相朝垣',
    sources: [
      {
        title: 'ziwei-doushu 府相朝垣必要條件',
        url: `${SOURCE_PATH}/patterns-dinggui.ts#L356-L371`,
      },
      {
        title: 'ziwei-doushu 府相朝垣強化與破格條件',
        url: `${SOURCE_PATH}/patterns.ts#L181-L187`,
      },
    ],
    conditions: fuXiangConditions,
  },
  {
    id: 'yang-liang-chang-lu',
    name: '陽梁昌祿',
    sources: [{ title: 'ziwei-doushu 陽梁昌祿', url: `${SOURCE_PATH}/patterns.ts#L199-L229` }],
    conditions: yangLiangConditions,
  },
  {
    id: 'wu-tan',
    name: '武貪格',
    sources: [{ title: 'ziwei-doushu 武貪格', url: `${SOURCE_PATH}/patterns.ts#L267-L298` }],
    conditions: wuTanConditions,
  },
]

export function evaluateZiWeiPatterns(chart: ZiWeiChartSnapshot): ZiWeiPatternResult[] {
  const context = buildContext(chart)
  return RULES.map(({ conditions, ...rule }) => result(chart, rule, conditions(context)))
}
