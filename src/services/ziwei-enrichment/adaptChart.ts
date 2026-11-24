import { branchAt, branchIndex, type Stem } from '@/utils/ganzhi'
import { brightnessOf, mainStarsOf, transformationsOf, type ZiWeiChart } from '@/utils/ziwei'
import type { ZiWeiChartSnapshot, ZiWeiPalaceSnapshot } from './types'

export function adaptZiWeiChart(chart: ZiWeiChart, yearStem: Stem): ZiWeiChartSnapshot {
  const entries = chart.palaces.map((palace, index) => {
    const { borrowed, stars } = mainStarsOf(chart, index)
    const snapshot: ZiWeiPalaceSnapshot = {
      branch: palace.branch,
      name: palace.name,
      stem: palace.stem,
      stars: [
        ...palace.stars.map(name => ({ name, brightness: brightnessOf(name, palace.branch) })),
        ...palace.minorStars.map(name => ({ name, brightness: null })),
      ],
      borrowed: borrowed ? { fromBranch: branchAt(branchIndex(palace.branch) + 6), stars } : null,
    }
    return [palace.branch, snapshot] as const
  })

  return {
    schemaVersion: 1,
    conventionId: 'lucky50-natal-v1',
    lifeBranch: chart.palaces[0].branch,
    bodyBranch: chart.bodyBranch,
    bureau: { ...chart.bureau },
    palaces: Object.fromEntries(entries) as ZiWeiChartSnapshot['palaces'],
    natalTransformations: {
      sourceStem: yearStem,
      entries: transformationsOf(chart, yearStem).map(({ type, star, palaceIndex }) => ({
        type,
        star,
        palaceBranch: chart.palaces[palaceIndex].branch,
      })),
    },
  }
}
