import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.argv[2]
const { generateChart } = await import(pathToFileURL(resolve(root, 'lib/ziwei/algorithm.ts')).href)
const { BRANCHES, STEMS, SI_HUA_TABLE } = await import(
  pathToFileURL(resolve(root, 'lib/ziwei/constants.ts')).href
)
const inputs = JSON.parse(readFileSync(0, 'utf8'))
const charts = inputs.map(input => {
  const { mingGongBranch, shenGongBranch, wuxingJu, palaces, lunarInfo } = generateChart(input, {
    leapMonth: 'split',
  })
  return {
    mingGongBranch,
    shenGongBranch,
    wuxingJu,
    palaces,
    lunarInfo: { yearStem: lunarInfo.yearStem },
  }
})
process.stdout.write(JSON.stringify({ BRANCHES, STEMS, SI_HUA_TABLE, charts }))
