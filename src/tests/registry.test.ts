import { describe, it, expect, beforeEach } from 'vitest'
import {
  ENGINE_SETTINGS_STORAGE_KEY,
  MetaphysicsEngineRegistry,
  createDefaultRegistry,
  type MetaphysicsResult,
} from '@/services/engines'
import { makeEngineInput } from './helpers/engineInput'

const resultOf = (engineId: string, score: number, extra: Partial<MetaphysicsResult> = {}) => ({
  engineId,
  engineName: engineId,
  score,
  ...extra,
})

describe('MetaphysicsEngineRegistry', () => {
  let registry: MetaphysicsEngineRegistry

  beforeEach(() => {
    localStorage.clear()
    registry = createDefaultRegistry()
  })

  it('設定殘缺或型別不對時略過該欄位，分數不會變成 NaN', () => {
    const before = registry.getSettings()
    registry.applySettings({
      classic: { enabled: true },
      'zi-wei': { weight: Number.NaN },
      'feng-shui': { weight: '40' as unknown as number },
    })
    expect(registry.getSettings()).toEqual(before)
    localStorage.setItem(ENGINE_SETTINGS_STORAGE_KEY, 'null')
    registry.loadFromStorage()
    const results = registry.calculateAll(makeEngineInput())
    expect(Number.isFinite(registry.calculateWeightedScore(results))).toBe(true)
  })

  it('預設註冊四個引擎並保留順序', () => {
    expect(registry.getEngines().map(engine => engine.engineId)).toEqual([
      'classic',
      'bazi-ten-gods',
      'zi-wei',
      'feng-shui',
    ])
    expect(registry.getSettings()).toEqual({
      classic: { enabled: true, weight: 30 },
      'bazi-ten-gods': { enabled: true, weight: 25 },
      'zi-wei': { enabled: true, weight: 20 },
      'feng-shui': { enabled: true, weight: 15 },
    })
  })

  it('停用的引擎不參與計算', () => {
    registry.setEngineEnabled('zi-wei', false)
    const results = registry.calculateAll(makeEngineInput())
    expect(results.map(result => result.engineId)).toEqual([
      'classic',
      'bazi-ten-gods',
      'feng-shui',
    ])
  })

  it('依權重計算加權平均', () => {
    registry.applySettings({
      classic: { enabled: true, weight: 30 },
      'bazi-ten-gods': { enabled: true, weight: 10 },
    })
    expect(
      registry.calculateWeightedScore([resultOf('classic', 80), resultOf('bazi-ten-gods', 40)])
    ).toBe(70)
  })

  it('起伏還原倍率為有效引擎數的平方根', () => {
    registry.applySettings({
      classic: { enabled: true, weight: 20 },
      'bazi-ten-gods': { enabled: true, weight: 20 },
    })
    const results = [resultOf('classic', 80), resultOf('bazi-ten-gods', 40)]
    const summary = registry.summarizeScores(results)
    expect(summary.weighted).toBe(60)
    expect(summary.spread).toBeCloseTo(Math.SQRT2)
    expect(registry.summarizeScores([resultOf('classic', 80)]).spread).toBe(1)
    expect(registry.summarizeScores([])).toEqual({ weighted: null, spread: 1 })
  })

  it('沒有可計權重的結果時回傳 null', () => {
    expect(registry.calculateWeightedScore([])).toBeNull()
    expect(registry.calculateWeightedScore([resultOf('unknown', 80)])).toBeNull()
    registry.setEngineWeight('classic', 0)
    expect(registry.calculateWeightedScore([resultOf('classic', 80)])).toBeNull()
  })

  it('從 localStorage 載入設定', () => {
    localStorage.setItem(
      ENGINE_SETTINGS_STORAGE_KEY,
      JSON.stringify({ classic: { enabled: false, weight: 55 } })
    )
    registry.loadFromStorage()
    expect(registry.getSettings().classic).toEqual({ enabled: false, weight: 55 })
  })

  it('設定格式錯誤時沿用目前設定', () => {
    localStorage.setItem(ENGINE_SETTINGS_STORAGE_KEY, '{壞掉')
    registry.loadFromStorage()
    expect(registry.getSettings().classic).toEqual({ enabled: true, weight: 30 })
  })

  it('單一引擎出錯不影響其他引擎', () => {
    registry.register({
      engineId: 'broken',
      name: '壞掉的引擎',
      description: '',
      version: '0',
      calculate: () => {
        throw new Error('boom')
      },
      getWeight: () => 10,
      setWeight: () => {},
      isEnabled: () => true,
      setEnabled: () => {},
    })
    expect(registry.calculateAll(makeEngineInput())).toHaveLength(4)
  })

  it('彙整警示與機會，方位取第一個有提供的引擎', () => {
    const advice = registry.aggregateAdvice([
      resultOf('a', 50, { warnings: ['w1'] }),
      resultOf('b', 50, { opportunities: ['o1'], luckyDirection: '正南', avoidDirection: '正北' }),
      resultOf('c', 50, { warnings: ['w2'], luckyDirection: '正東' }),
    ])
    expect(advice).toEqual({
      warnings: ['w1', 'w2'],
      opportunities: ['o1'],
      luckyDirection: '正南',
      avoidDirection: '正北',
    })
  })

  it('clear 後沒有引擎', () => {
    registry.clear()
    expect(registry.getEngines()).toEqual([])
    expect(registry.getEngineById('classic')).toBeUndefined()
  })
})
