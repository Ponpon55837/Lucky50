import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IntegratedFortuneService } from '@/services/integratedFortune'
import { ENGINE_LIST, ENGINE_SETTINGS_STORAGE_KEY, metaphysicsRegistry } from '@/services/engines'
import { lunarService } from '@/services/lunar'
import { JIA_WU_DAY, PIG_PROFILE, RAT_PROFILE, consecutiveDays } from './helpers/engineInput'

/** 逐日掃描一整年；機器負載高時平行執行可能超過預設 5 秒 */
const YEAR_SCAN_TIMEOUT = 30_000

const append = vi.hoisted(() => vi.fn(() => Promise.resolve()))
vi.mock('@/services/fortuneStore', () => ({ fortuneHistoryStore: { append } }))

const calculate = (profile = PIG_PROFILE, date = JIA_WU_DAY) =>
  IntegratedFortuneService.calculateIntegratedFortune(profile, date)

describe('IntegratedFortuneService', () => {
  beforeEach(() => {
    localStorage.clear()
    append.mockClear()
    metaphysicsRegistry.applySettings(
      Object.fromEntries(
        ENGINE_LIST.map(meta => [meta.id, { enabled: true, weight: meta.defaultWeight }])
      )
    )
  })

  it('投資分數為引擎加權分數還原起伏尺度後的結果', async () => {
    const fortune = await calculate()
    const scores = Object.fromEntries(fortune.enginesResults.map(r => [r.engineId, r.score]))
    const weighted = Math.round(
      (scores.classic * 30 +
        scores['bazi-ten-gods'] * 25 +
        scores['zi-wei'] * 20 +
        scores['feng-shui'] * 15) /
        90
    )
    expect(fortune.engineWeightedScore).toBe(weighted)
    // 有效引擎數 n = (Σw)² / Σw² = 90² / 2150，起伏還原倍率為 √n
    const spread = 90 / Math.sqrt(30 ** 2 + 25 ** 2 + 20 ** 2 + 15 ** 2)
    const expected = Math.round(50 + (weighted - 50) * spread)
    expect(fortune.investmentScore).toBe(Math.max(5, Math.min(95, expected)))
  })

  it('命盤、方位與建議欄位齊全', async () => {
    const fortune = await calculate()
    expect(fortune.personalBaZi).toMatchObject({ dayGanZhi: '丁丑', zodiac: '豬', element: '火' })
    expect(fortune.luckyDirection).toBe(fortune.lunarData.caiShen)
    expect(fortune.avoidDirection).toBe('正北')
    expect(['BUY', 'HOLD', 'OBSERVE', 'SELL']).toContain(fortune.recommendation)
    expect(fortune.advice.length).toBeGreaterThan(0)
    const total = Object.values(fortune.elements).reduce((sum, value) => sum + value, 0)
    expect(Math.abs(total - 100)).toBeLessThanOrEqual(2)
  })

  it('引擎加權分數逐日變化，不再是固定值', async () => {
    const scores = await Promise.all(
      consecutiveDays(30).map(
        async date => (await calculate(PIG_PROFILE, date)).engineWeightedScore
      )
    )
    expect(new Set(scores).size).toBeGreaterThanOrEqual(8)
  })

  it('日沖本命時帶出警示', async () => {
    const fortune = await calculate(RAT_PROFILE)
    expect(fortune.warnings).toContain('今日午日沖生肖鼠，不宜做重大投資決定。')
  })

  it('套用 localStorage 的引擎設定', async () => {
    localStorage.setItem(
      ENGINE_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        classic: { enabled: true, weight: 100 },
        'bazi-ten-gods': { enabled: false, weight: 25 },
        'zi-wei': { enabled: false, weight: 20 },
        'feng-shui': { enabled: false, weight: 15 },
      })
    )
    const fortune = await calculate()
    expect(fortune.enginesResults.map(r => r.engineId)).toEqual(['classic'])
    expect(fortune.investmentScore).toBe(fortune.enginesResults[0].score)
  })

  it('全部引擎停用時退回只看日子的分數', async () => {
    localStorage.setItem(
      ENGINE_SETTINGS_STORAGE_KEY,
      JSON.stringify(
        Object.fromEntries(
          metaphysicsRegistry.getEngines().map(e => [e.engineId, { enabled: false, weight: 10 }])
        )
      )
    )
    const fortune = await calculate()
    expect(fortune.enginesResults).toEqual([])
    expect(fortune.engineWeightedScore).toBe(0)
    expect(fortune.investmentScore).toBe(lunarService.getInvestmentAdvice(JIA_WU_DAY).luckyScore)
  })

  it('計算後寫入歷史，含各引擎分數與權重', async () => {
    const fortune = await calculate()
    expect(append).toHaveBeenCalledTimes(1)
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-11-16',
        investmentScore: fortune.investmentScore,
        engineWeightedScore: fortune.engineWeightedScore,
        enginesResults: expect.arrayContaining([
          expect.objectContaining({ engineId: 'classic', weight: 30 }),
        ]),
      })
    )
  })

  it(
    '整年下來，吉方從不與凶方相同',
    () => {
      for (const date of consecutiveDays(365)) {
        const fortune = IntegratedFortuneService.computeFortune(PIG_PROFILE, date)
        if (fortune.luckyDirection) expect(fortune.luckyDirection).not.toBe(fortune.avoidDirection)
      }
    },
    YEAR_SCAN_TIMEOUT
  )

  it('出生日期無效時拋出錯誤', async () => {
    await expect(calculate({ ...PIG_PROFILE, birthDate: '' })).rejects.toThrow('出生日期不能為空')
  })
})
