// API 快取服務
export interface CacheItem<T = unknown> {
  data: T
  timestamp: number
  expiresAt: number
}

export class ApiCacheService {
  private static instance: ApiCacheService
  private cache = new Map<string, CacheItem>()
  private defaultTTL = 5 * 60 * 1000 // 5分鐘預設過期時間

  static getInstance(): ApiCacheService {
    if (!this.instance) {
      this.instance = new ApiCacheService()
    }
    return this.instance
  }

  private constructor() {
    // 每分鐘清理過期的快取
    setInterval(() => this.cleanup(), 60 * 1000)
  }

  /**
   * 設定快取
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    })
  }

  /**
   * 取得快取
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // 檢查是否過期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * 檢查快取是否存在且未過期
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * 刪除指定快取
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清空所有快取
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 清理過期的快取項目
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 取得快取統計資訊
   */
  getStats(): {
    totalItems: number
    totalSize: string
    hitRate: number
  } {
    const totalItems = this.cache.size
    const totalSize = new Blob([JSON.stringify(Array.from(this.cache.values()))]).size

    return {
      totalItems,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      hitRate: 0, // 可以後續加入命中率統計
    }
  }

  /**
   * 快取包裝器 - 自動處理快取邏輯
   */
  async cached<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    // 先檢查快取
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // 快取不存在，執行 fetcher
    try {
      const data = await fetcher()
      this.set(key, data, ttl)
      return data
    } catch (error) {
      // 如果 fetcher 失敗，不快取錯誤結果
      throw error
    }
  }

  /**
   * 批次快取操作
   */
  setBatch<T>(items: Array<{ key: string; data: T; ttl?: number }>): void {
    items.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl)
    })
  }

  /**
   * 根據前綴刪除快取
   */
  deleteByPrefix(prefix: string): number {
    let deletedCount = 0
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
        deletedCount++
      }
    }
    return deletedCount
  }
}

// 全域實例
export const apiCache = ApiCacheService.getInstance()

// 快取鍵生成器
export class CacheKeyGenerator {
  /**
   * 生成股票資料快取鍵
   */
  static stock(symbol: string, startDate?: string, endDate?: string): string {
    const dateStr = startDate && endDate ? `_${startDate}_${endDate}` : ''
    return `stock_${symbol}${dateStr}`
  }

  /**
   * 生成農民曆快取鍵
   */
  static lunar(date: Date): string {
    const dateStr = date.toISOString().split('T')[0]
    return `lunar_${dateStr}`
  }

  /**
   * 生成運勢快取鍵
   */
  static fortune(userId: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0]
    return `fortune_${userId}_${dateStr}`
  }

  /**
   * 生成技術指標快取鍵
   */
  static technical(symbol: string, indicator: string): string {
    return `technical_${symbol}_${indicator}`
  }

  /**
   * 生成市場狀態快取鍵
   */
  static marketStatus(date: Date): string {
    const dateStr = date.toISOString().split('T')[0]
    return `market_status_${dateStr}`
  }
}
