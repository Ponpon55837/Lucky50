import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { FortuneRecord } from '@/types/history'

// 建立完整的 IndexedDB mock，支援同步觸發 callback（與既有測試同模式）
function createMockIndexedDB() {
  const stores = new Map<string, Map<string | number, Record<string, unknown>>>()

  const getOrCreateStore = (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map())
    return stores.get(name)!
  }

  function createRequest<T>(result: T) {
    let _onsuccess: ((event: Event) => void) | null = null
    const req = {
      result,
      onsuccess: null as unknown,
      onerror: null as unknown,
    }
    Object.defineProperty(req, 'onsuccess', {
      get() {
        return _onsuccess
      },
      set(fn: ((event: Event) => void) | null) {
        _onsuccess = fn
        if (fn) {
          Promise.resolve().then(() => fn(new Event('success')))
        }
      },
      configurable: true,
    })
    return req
  }

  const mockObjectStore = (name: string) => {
    const data = getOrCreateStore(name)
    return {
      put: vi.fn((record: Record<string, unknown>) => {
        const key = record.id ?? record.key
        data.set(key as string | number, record)
        return createRequest(undefined)
      }),
      get: vi.fn((key: string | number) => {
        return createRequest(data.get(key) ?? undefined)
      }),
      getAll: vi.fn(() => {
        return createRequest(Array.from(data.values()))
      }),
      clear: vi.fn(() => {
        data.clear()
        return createRequest(undefined)
      }),
      createIndex: vi.fn(),
      index: vi.fn(() => ({
        getAll: vi.fn(() => createRequest([])),
      })),
    }
  }

  const mockDB = {
    objectStoreNames: {
      contains: vi.fn((name: string) => stores.has(name)),
    },
    createObjectStore: vi.fn((name: string) => {
      getOrCreateStore(name)
      return mockObjectStore(name)
    }),
    transaction: vi.fn((_names: string | string[], _mode: string) => {
      const tx = {
        objectStore: vi.fn((name: string) => mockObjectStore(name)),
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
        error: null,
      }
      Promise.resolve().then(() => {
        if (tx.oncomplete) tx.oncomplete()
      })
      return tx
    }),
  }

  return {
    open: vi.fn((_name: string, _version: number) => {
      let _onupgradeneeded: ((event: Event) => void) | null = null
      let _onsuccess: ((event: Event) => void) | null = null
      let _onerror: ((event: Event) => void) | null = null

      const req = {
        result: mockDB as unknown as IDBDatabase,
        onsuccess: null as unknown,
        onerror: null as unknown,
        onupgradeneeded: null as unknown,
      }

      Object.defineProperty(req, 'onupgradeneeded', {
        get() {
          return _onupgradeneeded
        },
        set(fn: ((event: Event) => void) | null) {
          _onupgradeneeded = fn
          if (fn) {
            Promise.resolve().then(() => {
              const ev = new Event('upgradeneeded')
              Object.defineProperty(ev, 'target', { value: req, configurable: true })
              fn(ev)
            })
          }
        },
        configurable: true,
      })

      Object.defineProperty(req, 'onsuccess', {
        get() {
          return _onsuccess
        },
        set(fn: ((event: Event) => void) | null) {
          _onsuccess = fn
          if (fn) {
            Promise.resolve().then(() => Promise.resolve().then(() => fn(new Event('success'))))
          }
        },
        configurable: true,
      })

      Object.defineProperty(req, 'onerror', {
        get() {
          return _onerror
        },
        set(fn: ((event: Event) => void) | null) {
          _onerror = fn
        },
        configurable: true,
      })

      return req
    }),
    deleteDatabase: vi.fn(),
  }
}

function makeRecord(overrides: Partial<FortuneRecord>): FortuneRecord {
  return {
    id: Date.now() + Math.floor(Math.random() * 100000),
    date: '2024-01-01',
    timestamp: Date.now(),
    overallScore: 60,
    investmentScore: 60,
    recommendation: 'HOLD',
    elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
    userProfileHash: 'hash1',
    ...overrides,
  }
}

describe('FortuneHistoryStore 邊界與錯誤情境', () => {
  let store: InstanceType<typeof import('@/services/fortuneStore').FortuneHistoryStore>

  beforeEach(async () => {
    Object.defineProperty(globalThis, 'indexedDB', {
      value: createMockIndexedDB(),
      writable: true,
      configurable: true,
    })
    const { FortuneHistoryStore } = await import('@/services/fortuneStore')
    store = new FortuneHistoryStore()
    await store.init()
  })

  describe('正常情境', () => {
    it('同日同 userProfileHash 應去重並更新既有記錄（totalCount 不增加）', async () => {
      await store.append(
        makeRecord({ id: 1, date: '2024-01-15', investmentScore: 70, overallScore: 70 })
      )
      await store.append(
        makeRecord({ id: 2, date: '2024-01-15', investmentScore: 90, overallScore: 90 })
      )

      expect(await store.getTotalCount()).toBe(1)
      const result = await store.query({ pageIndex: 0, pageSize: 10 })
      expect(result.total).toBe(1)
      expect(result.records[0].id).toBe(1)
      expect(result.records[0].investmentScore).toBe(90)
      expect(result.records[0].overallScore).toBe(90)
    })

    it('同日不同 userProfileHash 應保留兩筆', async () => {
      await store.append(makeRecord({ id: 1, date: '2024-01-15', userProfileHash: 'hashA' }))
      await store.append(makeRecord({ id: 2, date: '2024-01-15', userProfileHash: 'hashB' }))

      expect(await store.getTotalCount()).toBe(2)
      const result = await store.query({ pageIndex: 0, pageSize: 10 })
      expect(result.total).toBe(2)
    })

    it('不同日同 userProfileHash 應保留兩筆', async () => {
      await store.append(makeRecord({ id: 1, date: '2024-01-15' }))
      await store.append(makeRecord({ id: 2, date: '2024-01-16' }))

      expect(await store.getTotalCount()).toBe(2)
    })

    it('scoreRange 篩選應正確', async () => {
      await store.appendBatch([
        makeRecord({ id: 1, investmentScore: 30, recommendation: 'SELL' }),
        makeRecord({ id: 2, investmentScore: 60, recommendation: 'HOLD' }),
        makeRecord({ id: 3, investmentScore: 90, recommendation: 'BUY' }),
      ])

      const result = await store.query({
        pageIndex: 0,
        pageSize: 10,
        scoreRange: { min: 40, max: 80 },
      })
      expect(result.total).toBe(1)
      expect(result.records[0].id).toBe(2)
    })

    it('關鍵字搜尋應支援中文建議對映（買→BUY、賣→SELL、持有→HOLD）', async () => {
      await store.appendBatch([
        makeRecord({ id: 1, recommendation: 'BUY' }),
        makeRecord({ id: 2, recommendation: 'SELL' }),
        makeRecord({ id: 3, recommendation: 'HOLD' }),
      ])

      expect((await store.query({ pageIndex: 0, pageSize: 10, keyword: '買' })).records[0].id).toBe(
        1
      )
      expect((await store.query({ pageIndex: 0, pageSize: 10, keyword: '賣' })).records[0].id).toBe(
        2
      )
      expect(
        (await store.query({ pageIndex: 0, pageSize: 10, keyword: '持有' })).records[0].id
      ).toBe(3)
    })

    it('sortBy=score 降序與升序應正確', async () => {
      await store.appendBatch([
        makeRecord({ id: 1, investmentScore: 30 }),
        makeRecord({ id: 2, investmentScore: 90 }),
        makeRecord({ id: 3, investmentScore: 60 }),
      ])

      const desc = await store.query({ pageIndex: 0, pageSize: 10, sortBy: 'score' })
      expect(desc.records.map(r => r.investmentScore)).toEqual([90, 60, 30])

      const asc = await store.query({
        pageIndex: 0,
        pageSize: 10,
        sortBy: 'score',
        sortDesc: false,
      })
      expect(asc.records.map(r => r.investmentScore)).toEqual([30, 60, 90])
    })

    it('重新 init 後 totalCount 與資料應從 IndexedDB 持久化載入', async () => {
      await store.append(makeRecord({ id: 1, date: '2024-01-15' }))
      await store.append(makeRecord({ id: 2, date: '2024-01-16' }))

      const { FortuneHistoryStore } = await import('@/services/fortuneStore')
      const store2 = new FortuneHistoryStore()
      await store2.init()

      expect(await store2.getTotalCount()).toBe(2)
      const result = await store2.query({ pageIndex: 0, pageSize: 10 })
      expect(result.total).toBe(2)
    })
  })

  describe('邊界情境', () => {
    it('分頁超出範圍應回傳空陣列但 total 正確', async () => {
      await store.appendBatch(Array.from({ length: 5 }, (_, i) => makeRecord({ id: i + 1 })))

      const result = await store.query({ pageIndex: 99, pageSize: 2 })
      expect(result.records).toEqual([])
      expect(result.total).toBe(5)
      expect(result.pageIndex).toBe(99)
    })

    it('pageSize=0 應回傳空陣列', async () => {
      await store.append(makeRecord({ id: 1 }))

      const result = await store.query({ pageIndex: 0, pageSize: 0 })
      expect(result.records).toEqual([])
      expect(result.total).toBe(1)
    })

    it('dateRange 頭尾含邊界（start == end）', async () => {
      await store.appendBatch([
        makeRecord({ id: 1, date: '2024-01-15' }),
        makeRecord({ id: 2, date: '2024-01-16' }),
      ])

      const result = await store.query({
        pageIndex: 0,
        pageSize: 10,
        dateRange: { start: '2024-01-15', end: '2024-01-15' },
      })
      expect(result.total).toBe(1)
      expect(result.records[0].date).toBe('2024-01-15')
    })

    it('scoreRange min == max 精準匹配', async () => {
      await store.appendBatch([
        makeRecord({ id: 1, investmentScore: 50 }),
        makeRecord({ id: 2, investmentScore: 50 }),
        makeRecord({ id: 3, investmentScore: 51 }),
      ])

      const result = await store.query({
        pageIndex: 0,
        pageSize: 10,
        scoreRange: { min: 50, max: 50 },
      })
      expect(result.total).toBe(2)
    })

    it('記憶體快取超過 100 筆後查詢仍應正確', async () => {
      const records = Array.from({ length: 105 }, (_, i) =>
        makeRecord({
          id: i + 1,
          date: `2024-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        })
      )
      await store.appendBatch(records)

      expect(await store.getTotalCount()).toBe(105)
      const result = await store.query({ pageIndex: 0, pageSize: 100 })
      expect(result.total).toBe(105)
      expect(result.records.length).toBe(100)
    })
  })

  describe('錯誤情境 / 潛在缺陷驗證', () => {
    it('快取被逐出後，同日同 hash 去重仍應成立（spec：同天同用戶只保留最新一筆）', async () => {
      // 塞入 101 筆不同日期，memoryCache 上限 100，第一筆會被 shift 逐出
      for (let i = 1; i <= 101; i++) {
        await store.append(makeRecord({ id: i, date: `2024-01-${String(i).padStart(2, '0')}` }))
      }

      // 重新寫入第一筆（相同 date + userProfileHash），依 spec 應更新而非新增
      await store.append(makeRecord({ id: 999, date: '2024-01-01', investmentScore: 88 }))

      expect(await store.getTotalCount()).toBe(101)
      const dupCheck = await store.query({
        pageIndex: 0,
        pageSize: 10,
        dateRange: { start: '2024-01-01', end: '2024-01-01' },
      })
      expect(dupCheck.total).toBe(1)
    })

    it('appendBatch 內含重複 id 時 totalCount 應與實際筆數一致', async () => {
      await store.appendBatch([
        makeRecord({ id: 1, date: '2024-01-15' }),
        makeRecord({ id: 1, date: '2024-01-16' }),
      ])

      const result = await store.query({ pageIndex: 0, pageSize: 10 })
      expect(await store.getTotalCount()).toBe(result.total)
    })

    it('關鍵字無匹配應回傳空結果', async () => {
      await store.append(makeRecord({ id: 1, lunarSummary: '今日宜投資' }))

      const result = await store.query({ pageIndex: 0, pageSize: 10, keyword: '不存在的關鍵字' })
      expect(result.total).toBe(0)
      expect(result.records).toEqual([])
    })

    it('clear 後可重新寫入且統計歸零', async () => {
      await store.append(makeRecord({ id: 1 }))
      await store.clear()

      expect(await store.getTotalCount()).toBe(0)
      const empty = await store.getStats()
      expect(empty.totalRecords).toBe(0)
      expect(empty.dateRange).toBeNull()
      expect(empty.averageScore).toBe(0)

      await store.append(makeRecord({ id: 2, date: '2024-02-01', investmentScore: 80 }))
      expect(await store.getTotalCount()).toBe(1)
    })

    it('查詢未初始化前呼叫 query 應自動初始化而不拋錯', async () => {
      const { FortuneHistoryStore } = await import('@/services/fortuneStore')
      const uninit = new FortuneHistoryStore()
      const result = await uninit.query({ pageIndex: 0, pageSize: 10 })
      expect(result.total).toBe(0)
      expect(result.records).toEqual([])
    })
  })

  describe('appendBatch 修復後新邏輯分支', () => {
    it('空批次應直接早退，不改變 totalCount 與資料', async () => {
      await store.append(makeRecord({ id: 1, date: '2024-01-15' }))

      await store.appendBatch([])

      expect(await store.getTotalCount()).toBe(1)
      const result = await store.query({ pageIndex: 0, pageSize: 10 })
      expect(result.total).toBe(1)
      expect(result.records[0].id).toBe(1)
    })

    it('批次內重複 id 應以最後一筆覆寫，totalCount 不重複計算', async () => {
      await store.appendBatch([
        makeRecord({ id: 1, date: '2024-01-15', investmentScore: 30, overallScore: 30 }),
        makeRecord({ id: 1, date: '2024-01-16', investmentScore: 90, overallScore: 90 }),
      ])

      expect(await store.getTotalCount()).toBe(1)
      const result = await store.query({ pageIndex: 0, pageSize: 10 })
      expect(result.total).toBe(1)
      expect(result.records[0].id).toBe(1)
      expect(result.records[0].investmentScore).toBe(90)
      expect(result.records[0].date).toBe('2024-01-16')
    })

    it('批次 id 與既有資料衝突時應更新既有記錄而非新增', async () => {
      await store.append(makeRecord({ id: 1, date: '2024-01-15', investmentScore: 70 }))
      await store.appendBatch([makeRecord({ id: 1, date: '2024-01-15', investmentScore: 99 })])

      expect(await store.getTotalCount()).toBe(1)
      const result = await store.query({ pageIndex: 0, pageSize: 10 })
      expect(result.records.length).toBe(1)
      expect(result.records[0].id).toBe(1)
      expect(result.records[0].investmentScore).toBe(99)
    })

    it('批次同日不同 id 不去重（對比 append 的去重語意）', async () => {
      await store.appendBatch([
        makeRecord({ id: 1, date: '2024-01-15' }),
        makeRecord({ id: 2, date: '2024-01-15' }),
      ])

      expect(await store.getTotalCount()).toBe(2)
      const result = await store.query({
        pageIndex: 0,
        pageSize: 10,
        dateRange: { start: '2024-01-15', end: '2024-01-15' },
      })
      expect(result.total).toBe(2)
    })

    it('批次不同 id 應累加既有資料且總筆數一致', async () => {
      await store.append(makeRecord({ id: 1, date: '2024-01-15' }))
      await store.appendBatch([
        makeRecord({ id: 2, date: '2024-01-16' }),
        makeRecord({ id: 3, date: '2024-01-17' }),
      ])

      expect(await store.getTotalCount()).toBe(3)
      const result = await store.query({ pageIndex: 0, pageSize: 10 })
      expect(result.total).toBe(3)
      expect(result.records.map(r => r.id).sort()).toEqual([1, 2, 3])
    })

    it('批次重複 id 與 append 混用後，append 應依 date+hash 身分去重更新', async () => {
      await store.appendBatch([
        makeRecord({ id: 1, date: '2024-01-15' }),
        makeRecord({ id: 1, date: '2024-01-16' }),
      ])
      await store.append(makeRecord({ id: 5, date: '2024-01-16', userProfileHash: 'hash1' }))

      expect(await store.getTotalCount()).toBe(1)
      const result = await store.query({ pageIndex: 0, pageSize: 10 })
      expect(result.total).toBe(1)
      expect(result.records[0].id).toBe(1)
    })
  })
})
