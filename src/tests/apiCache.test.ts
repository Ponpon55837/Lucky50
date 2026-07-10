import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ApiCacheService, CacheKeyGenerator } from '@/services/apiCache'

describe('ApiCacheService', () => {
  let cache: ApiCacheService

  beforeEach(() => {
    vi.useFakeTimers()
    cache = ApiCacheService.getInstance()
    cache.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    cache.clear()
  })

  describe('singleton', () => {
    it('getInstance 回傳相同實例', () => {
      const instance1 = ApiCacheService.getInstance()
      const instance2 = ApiCacheService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('set / get', () => {
    it('設定後可取得資料', () => {
      cache.set('key1', { foo: 'bar' })
      expect(cache.get('key1')).toEqual({ foo: 'bar' })
    })

    it('未設定的 key 回傳 null', () => {
      expect(cache.get('nonexistent')).toBeNull()
    })

    it('過期後回傳 null', () => {
      cache.set('key1', 'data', 1000) // 1秒過期
      vi.advanceTimersByTime(999)
      expect(cache.get('key1')).toBe('data') // 還沒過期

      vi.advanceTimersByTime(2)
      expect(cache.get('key1')).toBeNull() // 已過期
    })

    it('可儲存不同型別資料', () => {
      cache.set('str', 'hello')
      cache.set('num', 42)
      cache.set('obj', { a: 1 })
      cache.set('arr', [1, 2, 3])

      expect(cache.get<string>('str')).toBe('hello')
      expect(cache.get<number>('num')).toBe(42)
      expect(cache.get<object>('obj')).toEqual({ a: 1 })
      expect(cache.get<number[]>('arr')).toEqual([1, 2, 3])
    })
  })

  describe('has', () => {
    it('存在且未過期回傳 true', () => {
      cache.set('key1', 'data')
      expect(cache.has('key1')).toBe(true)
    })

    it('不存在回傳 false', () => {
      expect(cache.has('key1')).toBe(false)
    })

    it('過期後回傳 false', () => {
      cache.set('key1', 'data', 1000)
      vi.advanceTimersByTime(1001)
      expect(cache.has('key1')).toBe(false)
    })
  })

  describe('delete', () => {
    it('刪除存在的 key 回傳 true', () => {
      cache.set('key1', 'data')
      expect(cache.delete('key1')).toBe(true)
      expect(cache.get('key1')).toBeNull()
    })

    it('刪除不存在的 key 回傳 false', () => {
      expect(cache.delete('nonexistent')).toBe(false)
    })
  })

  describe('clear', () => {
    it('清空所有快取', () => {
      cache.set('key1', 'data1')
      cache.set('key2', 'data2')
      cache.clear()
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
    })
  })

  describe('deleteByPrefix', () => {
    it('根據前綴刪除快取', () => {
      cache.set('stock_2330', 'data1')
      cache.set('stock_2454', 'data2')
      cache.set('fortune_user1', 'data3')

      const deletedCount = cache.deleteByPrefix('stock_')
      expect(deletedCount).toBe(2)
      expect(cache.get('stock_2330')).toBeNull()
      expect(cache.get('stock_2454')).toBeNull()
      expect(cache.get('fortune_user1')).toBe('data3')
    })

    it('沒有匹配的前綴回傳 0', () => {
      cache.set('stock_2330', 'data')
      expect(cache.deleteByPrefix('other_')).toBe(0)
    })
  })

  describe('cached', () => {
    it('首次呼叫執行 fetcher 並快取結果', async () => {
      const fetcher = vi.fn().mockResolvedValue('result')
      const result = await cache.cached('key1', fetcher)

      expect(result).toBe('result')
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('第二次呼叫使用快取不執行 fetcher', async () => {
      const fetcher = vi.fn().mockResolvedValue('result')

      await cache.cached('key1', fetcher)
      await cache.cached('key1', fetcher)

      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('快取過期後重新執行 fetcher', async () => {
      const fetcher = vi.fn().mockResolvedValue('result')

      await cache.cached('key1', fetcher, 1000)
      vi.advanceTimersByTime(1001)
      await cache.cached('key1', fetcher)

      expect(fetcher).toHaveBeenCalledTimes(2)
    })
  })

  describe('setBatch', () => {
    it('批次設定多筆資料', () => {
      cache.setBatch([
        { key: 'a', data: 1 },
        { key: 'b', data: 2 },
        { key: 'c', data: 3 },
      ])

      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBe(2)
      expect(cache.get('c')).toBe(3)
    })

    it('支援個別 TTL', () => {
      cache.setBatch([
        { key: 'fast', data: 'x', ttl: 100 },
        { key: 'slow', data: 'y', ttl: 5000 },
      ])

      vi.advanceTimersByTime(101)
      expect(cache.get('fast')).toBeNull()
      expect(cache.get('slow')).toBe('y')
    })
  })

  describe('getStats', () => {
    it('空快取回傳 0', () => {
      const stats = cache.getStats()
      expect(stats.totalItems).toBe(0)
    })

    it('有資料時回傳正確數量', () => {
      cache.set('a', 1)
      cache.set('b', 2)
      const stats = cache.getStats()
      expect(stats.totalItems).toBe(2)
      expect(stats.totalSize).toMatch(/KB$/)
    })
  })
})

describe('CacheKeyGenerator', () => {
  it('stock 產生正確格式', () => {
    expect(CacheKeyGenerator.stock('2330')).toBe('stock_2330')
    expect(CacheKeyGenerator.stock('2330', '2024-01-01', '2024-01-31'))
      .toBe('stock_2330_2024-01-01_2024-01-31')
  })

  it('lunar 產生正確格式', () => {
    const key = CacheKeyGenerator.lunar(new Date('2024-01-15'))
    expect(key).toBe('lunar_2024-01-15')
  })

  it('fortune 產生正確格式', () => {
    const key = CacheKeyGenerator.fortune('user123', new Date('2024-06-15'))
    expect(key).toBe('fortune_user123_2024-06-15')
  })

  it('technical 產生正確格式', () => {
    expect(CacheKeyGenerator.technical('2330', 'rsi')).toBe('technical_2330_rsi')
  })

  it('marketStatus 產生正確格式', () => {
    const key = CacheKeyGenerator.marketStatus(new Date('2024-10-10'))
    expect(key).toBe('market_status_2024-10-10')
  })
})
