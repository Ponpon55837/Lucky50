import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { FortuneRecord } from '@/types/history'

// 建立完整的 IndexedDB mock，支援同步觸發 callback
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
    // 使用 Object.defineProperty 以在設定 onsuccess 時立即觸發
    Object.defineProperty(req, 'onsuccess', {
      get() {
        return _onsuccess
      },
      set(fn: ((event: Event) => void) | null) {
        _onsuccess = fn
        // 同步觸發 callback
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
            // 在 onupgradeneeded 之後觸發 onsuccess
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

describe('FortuneHistoryStore', () => {
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

  describe('基本功能', () => {
    it('應該建立 Store 實例', () => {
      expect(store).toBeDefined()
      expect(typeof store.init).toBe('function')
      expect(typeof store.append).toBe('function')
      expect(typeof store.query).toBe('function')
      expect(typeof store.clear).toBe('function')
      expect(typeof store.getStats).toBe('function')
      expect(typeof store.getTotalCount).toBe('function')
    })

    it('初始化後 totalCount 應為 0', async () => {
      const count = await store.getTotalCount()
      expect(count).toBe(0)
    })
  })

  describe('append', () => {
    it('應該成功新增記錄', async () => {
      await store.append({
        id: 1,
        date: '2024-01-15',
        timestamp: Date.now(),
        overallScore: 75,
        investmentScore: 75,
        recommendation: 'BUY',
        elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
        userProfileHash: 'test-hash',
      })
      const count = await store.getTotalCount()
      expect(count).toBe(1)
    })

    it('應該支援批次新增', async () => {
      await store.appendBatch([
        {
          id: 1,
          date: '2024-01-15',
          timestamp: Date.now(),
          overallScore: 75,
          investmentScore: 75,
          recommendation: 'BUY',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          userProfileHash: 'hash1',
        },
        {
          id: 2,
          date: '2024-01-16',
          timestamp: Date.now(),
          overallScore: 55,
          investmentScore: 55,
          recommendation: 'HOLD',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          userProfileHash: 'hash1',
        },
        {
          id: 3,
          date: '2024-01-17',
          timestamp: Date.now(),
          overallScore: 30,
          investmentScore: 30,
          recommendation: 'SELL',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          userProfileHash: 'hash1',
        },
      ])
      const count = await store.getTotalCount()
      expect(count).toBe(3)
    })
  })

  describe('query', () => {
    it('應該回傳空結果當沒有記錄', async () => {
      const result = await store.query({ pageIndex: 0, pageSize: 10 })
      expect(result.records).toEqual([])
      expect(result.total).toBe(0)
    })

    it('應該支援按推薦類型篩選', async () => {
      await store.appendBatch([
        {
          id: 1,
          date: '2024-01-15',
          timestamp: Date.now(),
          overallScore: 75,
          investmentScore: 75,
          recommendation: 'BUY',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          userProfileHash: 'hash1',
        },
        {
          id: 2,
          date: '2024-01-16',
          timestamp: Date.now(),
          overallScore: 55,
          investmentScore: 55,
          recommendation: 'HOLD',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          userProfileHash: 'hash1',
        },
        {
          id: 3,
          date: '2024-01-17',
          timestamp: Date.now(),
          overallScore: 30,
          investmentScore: 30,
          recommendation: 'SELL',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          userProfileHash: 'hash1',
        },
      ])
      const buyResult = await store.query({ pageIndex: 0, pageSize: 10, recommendation: 'BUY' })
      expect(buyResult.records.length).toBe(1)
      expect(buyResult.records[0].recommendation).toBe('BUY')
    })

    it('應該支援按日期範圍篩選', async () => {
      await store.appendBatch([
        {
          id: 1,
          date: '2024-01-15',
          timestamp: Date.now(),
          overallScore: 75,
          investmentScore: 75,
          recommendation: 'BUY',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          userProfileHash: 'hash1',
        },
        {
          id: 2,
          date: '2024-02-15',
          timestamp: Date.now(),
          overallScore: 55,
          investmentScore: 55,
          recommendation: 'HOLD',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          userProfileHash: 'hash1',
        },
      ])
      const result = await store.query({
        pageIndex: 0,
        pageSize: 10,
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
      })
      expect(result.records.length).toBe(1)
      expect(result.records[0].date).toBe('2024-01-15')
    })

    it('應該支援分頁', async () => {
      const records: FortuneRecord[] = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        date: `2024-01-${String(i + 15).padStart(2, '0')}`,
        timestamp: Date.now(),
        overallScore: 50 + i * 10,
        investmentScore: 50 + i * 10,
        recommendation: 'HOLD' as const,
        elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
        userProfileHash: 'hash1',
      }))
      await store.appendBatch(records)
      const page1 = await store.query({ pageIndex: 0, pageSize: 2 })
      expect(page1.records.length).toBe(2)
      expect(page1.total).toBe(5)
      const page2 = await store.query({ pageIndex: 1, pageSize: 2 })
      expect(page2.records.length).toBe(2)
    })

    it('應該支援關鍵字搜尋', async () => {
      await store.appendBatch([
        {
          id: 1,
          date: '2024-01-15',
          timestamp: Date.now(),
          overallScore: 75,
          investmentScore: 75,
          recommendation: 'BUY',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          lunarSummary: '今日宜投資',
          userProfileHash: 'hash1',
        },
        {
          id: 2,
          date: '2024-01-16',
          timestamp: Date.now(),
          overallScore: 55,
          investmentScore: 55,
          recommendation: 'HOLD',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          lunarSummary: '今日宜觀望',
          userProfileHash: 'hash1',
        },
      ])
      const result = await store.query({ pageIndex: 0, pageSize: 10, keyword: '投資' })
      expect(result.records.length).toBe(1)
      expect(result.records[0].lunarSummary).toContain('投資')
    })
  })

  describe('getStats', () => {
    it('應該回傳空統計當沒有記錄', async () => {
      const stats = await store.getStats()
      expect(stats.totalRecords).toBe(0)
      expect(stats.dateRange).toBeNull()
      expect(stats.averageScore).toBe(0)
      expect(stats.recommendationDistribution).toEqual({ BUY: 0, HOLD: 0, SELL: 0 })
    })

    it('應該正確計算統計', async () => {
      await store.appendBatch([
        {
          id: 1,
          date: '2024-01-15',
          timestamp: Date.now(),
          overallScore: 80,
          investmentScore: 80,
          recommendation: 'BUY',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          userProfileHash: 'hash1',
        },
        {
          id: 2,
          date: '2024-01-20',
          timestamp: Date.now(),
          overallScore: 50,
          investmentScore: 50,
          recommendation: 'HOLD',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          userProfileHash: 'hash1',
        },
        {
          id: 3,
          date: '2024-01-25',
          timestamp: Date.now(),
          overallScore: 30,
          investmentScore: 30,
          recommendation: 'SELL',
          elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
          userProfileHash: 'hash1',
        },
      ])
      const stats = await store.getStats()
      expect(stats.totalRecords).toBe(3)
      expect(stats.dateRange).toEqual({ earliest: '2024-01-15', latest: '2024-01-25' })
      expect(stats.averageScore).toBe(53)
      expect(stats.recommendationDistribution).toEqual({ BUY: 1, HOLD: 1, SELL: 1 })
    })
  })

  describe('clear', () => {
    it('應該成功清除所有記錄', async () => {
      await store.append({
        id: 1,
        date: '2024-01-15',
        timestamp: Date.now(),
        overallScore: 75,
        investmentScore: 75,
        recommendation: 'BUY',
        elements: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
        userProfileHash: 'hash1',
      })
      await store.clear()
      const count = await store.getTotalCount()
      expect(count).toBe(0)
    })
  })
})
