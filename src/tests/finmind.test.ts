import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FinMindService } from '@/services/finmind'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get,
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}))

const rawBar = {
  date: '2026-11-13',
  stock_id: '0050',
  open: '102.85',
  max: 104.4,
  min: 102.1,
  close: '102.5',
  Trading_Volume: '128607213',
  spread: 1.55,
}
const olderBar = {
  ...rawBar,
  date: '2026-11-12',
  open: 103.5,
  max: 104.2,
  min: 100.8,
  close: 100.95,
  spread: -2.25,
}
const startDate = '2026-11-12'
const endDate = '2026-11-13'
const split = { date: '2025-06-18', stock_id: '0050', before_price: 188.65, after_price: 47.16 }
const dividend = {
  date: '2026-01-22',
  stock_id: '0050',
  before_price: 71.85,
  reference_price: 70.85,
}

function respond(data: unknown, status = 200) {
  get.mockResolvedValue({ data: { status, data } })
}

function respondAdjustments(splits: unknown, dividends: unknown) {
  get.mockImplementation(async (_url, config) => ({
    data: config.params.dataset === 'TaiwanStockSplitPrice' ? splits : dividends,
  }))
}

beforeEach(() => {
  get.mockReset()
  vi.setSystemTime(new Date('2026-11-14T01:00:00.000Z'))
})

afterEach(() => vi.useRealTimers())

describe('FinMind 0050 日 K', () => {
  it('排序真實行情並保留資料日期與擷取時間', async () => {
    respond([rawBar, olderBar])

    const snapshot = await FinMindService.getMarketHistory(startDate, endDate)

    expect(get).toHaveBeenCalledWith('/data', {
      params: {
        dataset: 'TaiwanStockPrice',
        data_id: '0050',
        start_date: startDate,
        end_date: endDate,
      },
    })
    expect(snapshot.range).toEqual({ startDate, endDate })
    expect(snapshot.provenance).toEqual({
      source: 'FinMind',
      asOf: endDate,
      fetchedAt: '2026-11-14T01:00:00.000Z',
    })
    expect(snapshot.bars.map(bar => bar.date)).toEqual([startDate, endDate])
    expect(snapshot.bars[1]).toMatchObject({
      open: 102.85,
      high: 104.4,
      low: 102.1,
      close: 102.5,
      volume: 128607213,
      change: 1.55,
    })
    expect(snapshot.bars[1].changePercent).toBeCloseTo((1.55 / 100.95) * 100, 6)
  })

  it('接受舊欄位名稱，無 spread 時變化值為收盤減開盤', async () => {
    respond([
      {
        ...rawBar,
        max: undefined,
        min: undefined,
        Trading_Volume: undefined,
        high: 104.4,
        low: 102.1,
        volume: 0,
        spread: undefined,
      },
    ])
    const [bar] = await FinMindService.getDailyBars(startDate, endDate)
    expect(bar).toMatchObject({ high: 104.4, low: 102.1, volume: 0 })
    expect(bar.change).toBeCloseTo(-0.35)
  })

  it.each([
    ['非數字', { open: 'invalid' }],
    ['非有限', { open: Infinity }],
    ['零價格', { min: 0 }],
    ['部分數字', { open: '102.85bad' }],
    ['遺漏最高價', { max: undefined }],
    ['最高價低於收盤', { max: 102.2 }],
    ['最低價高於開盤', { min: 103 }],
    ['負成交量', { Trading_Volume: -10 }],
    ['遺漏成交量', { Trading_Volume: undefined }],
    ['成交量非整數', { Trading_Volume: '123.45' }],
    ['不合理的昨收', { spread: 103 }],
    ['日期超出區間', { date: '2026-11-16' }],
    ['非日曆日期', { date: '2026-02-30' }],
    ['代號不符', { stock_id: '0056' }],
  ])('整批拒絕有無效 K 棒的回應（%s）', async (_label, overrides) => {
    respond([olderBar, { ...rawBar, ...overrides }])
    await expect(FinMindService.getETFData(startDate, endDate)).rejects.toThrow('行情格式無效')
  })

  it('拒絕重複日期', async () => {
    respond([rawBar, { ...rawBar, close: 102.6 }])
    await expect(FinMindService.getETFData(startDate, endDate)).rejects.toThrow('行情格式無效')
  })

  it.each([
    [200, []],
    [200, { date: endDate }],
    [400, [rawBar]],
  ])('拒絕無數據或來源錯誤', async (status, data) => {
    respond(data, status)
    await expect(FinMindService.getDailyBars(startDate, endDate)).rejects.toThrow(
      'FinMind API 無數據'
    )
  })

  it('行情失敗時不產生合成價格', async () => {
    get.mockRejectedValue(new Error('Network error'))
    await expect(FinMindService.getETFData(startDate, endDate)).rejects.toThrow('Network error')
    await expect(FinMindService.getRealTimePrice()).resolves.toBeNull()
  })

  it('最新價格是最近一筆真實日 K', async () => {
    respond([rawBar, olderBar])
    await expect(FinMindService.getRealTimePrice()).resolves.toMatchObject({
      date: endDate,
      close: 102.5,
    })
  })
})

describe('FinMind 0050 分割與除息', () => {
  it('保存事件前收、參考價與係數，略過尚未生效的事件', async () => {
    respondAdjustments(
      { status: 200, data: [split] },
      {
        status: 200,
        data: [dividend, { ...dividend, date: '2026-12-01', before_price: 0, reference_price: 0 }],
      }
    )

    await expect(FinMindService.getPriceAdjustments()).resolves.toEqual([
      { date: split.date, kind: 'split', beforePrice: 188.65, referencePrice: 47.16, factor: 0.25 },
      {
        date: dividend.date,
        kind: 'dividend',
        beforePrice: 71.85,
        referencePrice: 70.85,
        factor: 70.85 / 71.85,
      },
    ])
  })

  it('任一資料集失敗時不回報完整還原', async () => {
    respondAdjustments({ status: 200, data: [split] }, { status: 400, msg: 'error' })
    await expect(FinMindService.getPriceAdjustments()).rejects.toThrow(
      'FinMind TaiwanStockDividendResult 無數據'
    )
  })

  it('已生效的事件資料損毀時不略過', async () => {
    respondAdjustments(
      { status: 200, data: [split] },
      { status: 200, data: [{ ...dividend, before_price: 0 }] }
    )
    await expect(FinMindService.getPriceAdjustments()).rejects.toThrow('dividend 資料格式無效')
  })

  it('已知分割被漏掉時不回報完整還原', async () => {
    respondAdjustments({ status: 200, data: [] }, { status: 200, data: [dividend] })
    await expect(FinMindService.getPriceAdjustments()).rejects.toThrow('除權息資料不完整')
  })
})

describe('FinMind API 狀態', () => {
  it('將供應端狀態 200 視為連線可用', async () => {
    respond([])
    await expect(FinMindService.checkAPIStatus()).resolves.toBe(true)
  })

  it('網路錯誤與供應端錯誤皆回報失敗', async () => {
    get.mockRejectedValue(new Error('Network error'))
    await expect(FinMindService.checkAPIStatus()).resolves.toBe(false)
    respond([], 500)
    await expect(FinMindService.checkAPIStatus()).resolves.toBe(false)
  })
})
