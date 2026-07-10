/**
 * 運勢歷史 IndexedDB 儲存服務
 * 參考 HackMD 日誌檢視器的雙層儲存架構
 *
 * 架構：
 * - MemoryCache：短期記憶體快取（最近 100 筆）
 * - IndexedDB：持久化儲存
 */

import type { FortuneRecord, HistoryQueryOptions, HistoryQueryResult, HistoryStats } from '@/types/history'

const DB_NAME = 'lucky50_fortune_history'
const DB_VERSION = 1
const STORE_NAME = 'fortunes'
const METADATA_STORE = 'metadata'
const MAX_MEMORY_CACHE = 100

/**
 * IndexedDB 初始化
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('date', 'date', { unique: false })
        store.createIndex('recommendation', 'recommendation', { unique: false })
        store.createIndex('userProfileHash', 'userProfileHash', { unique: false })
      }

      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 運勢歷史 IndexedDB 儲存服務
 */
export class FortuneHistoryStore {
  private db: IDBDatabase | null = null
  private memoryCache: FortuneRecord[] = []
  private totalCount = 0
  private initialized = false

  /**
   * 初始化儲存服務
   */
  async init(): Promise<void> {
    if (this.initialized) return

    this.db = await openDB()

    // 從 metadata 載入 totalCount
    this.totalCount = (await this.getMetadata('totalCount') as number) ?? 0

    // 從 IndexedDB 載入最近的記錄到記憶體快取
    const recentRecords = await this.getRecentFromIDB(MAX_MEMORY_CACHE)
    this.memoryCache = recentRecords

    this.initialized = true
  }

  /**
   * 新增運勢記錄（同一天同一用戶只保留最新一筆）
   */
  async append(record: FortuneRecord): Promise<void> {
    await this.ensureInitialized()

    // 查找是否已有同日同用戶的記錄
    const existing = this.memoryCache.find(
      r => r.date === record.date && r.userProfileHash === record.userProfileHash
    )

    if (existing) {
      // 更新既有記錄
      await this.writeToIDB({ ...record, id: existing.id })
      // 更新記憶體快取
      const idx = this.memoryCache.findIndex(r => r.id === existing.id)
      if (idx !== -1) this.memoryCache[idx] = { ...record, id: existing.id }
    } else {
      // 新增記錄
      await this.writeToIDB(record)
      this.memoryCache.push(record)
      if (this.memoryCache.length > MAX_MEMORY_CACHE) {
        this.memoryCache.shift()
      }
      this.totalCount++
      await this.setMetadata('totalCount', this.totalCount)
    }
  }

  /**
   * 批次新增運勢記錄
   */
  async appendBatch(records: FortuneRecord[]): Promise<void> {
    await this.ensureInitialized()

    const tx = this.db!.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    for (const record of records) {
      store.put(record)
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })

    // 更新記憶體快取
    this.memoryCache.push(...records)
    if (this.memoryCache.length > MAX_MEMORY_CACHE) {
      this.memoryCache = this.memoryCache.slice(-MAX_MEMORY_CACHE)
    }

    // 更新 totalCount
    this.totalCount += records.length
    await this.setMetadata('totalCount', this.totalCount)
  }

  /**
   * 查詢運勢記錄（支援分頁、篩選、排序）
   */
  async query(options: HistoryQueryOptions): Promise<HistoryQueryResult> {
    await this.ensureInitialized()

    let records = await this.getAllFromIDB()

    // 篩選：日期範圍
    if (options.dateRange) {
      records = records.filter(r =>
        r.date >= options.dateRange!.start && r.date <= options.dateRange!.end
      )
    }

    // 篩選：分數範圍
    if (options.scoreRange) {
      records = records.filter(r =>
        r.investmentScore >= options.scoreRange!.min &&
        r.investmentScore <= options.scoreRange!.max
      )
    }

    // 篩選：推薦類型
    if (options.recommendation) {
      records = records.filter(r => r.recommendation === options.recommendation)
    }

    // 篩選：關鍵字搜尋（支援日期、建議文字、推薦類型中文、分數）
    if (options.keyword) {
      const kw = options.keyword.toLowerCase()
      const recMap: Record<string, string[]> = {
        '買': ['BUY'], '買入': ['BUY'], 'buy': ['BUY'],
        '賣': ['SELL'], '賣出': ['SELL'], 'sell': ['SELL'],
        '持有': ['HOLD'], 'hold': ['HOLD'],
      }
      const matchedRecs = recMap[kw] ?? recMap[kw.replace(/\s/g, '')]

      records = records.filter(r =>
        r.date.includes(kw) ||
        (r.lunarSummary && r.lunarSummary.toLowerCase().includes(kw)) ||
        r.investmentScore.toString().includes(kw) ||
        r.overallScore.toString().includes(kw) ||
        (matchedRecs && matchedRecs.includes(r.recommendation))
      )
    }

    // 排序
    const sortField = options.sortBy ?? 'date'
    const sortDesc = options.sortDesc ?? true
    records.sort((a, b) => {
      const aVal = sortField === 'date' ? a.date : a.investmentScore
      const bVal = sortField === 'date' ? b.date : b.investmentScore
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
      }
      return sortDesc ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number)
    })

    const total = records.length

    // 分頁
    const start = options.pageIndex * options.pageSize
    const paged = records.slice(start, start + options.pageSize)

    return {
      records: paged,
      total,
      pageIndex: options.pageIndex,
      pageSize: options.pageSize,
    }
  }

  /**
   * 取得統計資訊
   */
  async getStats(): Promise<HistoryStats> {
    await this.ensureInitialized()

    const records = await this.getAllFromIDB()

    if (records.length === 0) {
      return {
        totalRecords: 0,
        dateRange: null,
        averageScore: 0,
        recommendationDistribution: { BUY: 0, HOLD: 0, SELL: 0 },
      }
    }

    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
    const totalScore = records.reduce((sum, r) => sum + r.investmentScore, 0)

    return {
      totalRecords: records.length,
      dateRange: {
        earliest: sorted[0].date,
        latest: sorted[sorted.length - 1].date,
      },
      averageScore: Math.round(totalScore / records.length),
      recommendationDistribution: {
        BUY: records.filter(r => r.recommendation === 'BUY').length,
        HOLD: records.filter(r => r.recommendation === 'HOLD').length,
        SELL: records.filter(r => r.recommendation === 'SELL').length,
      },
    }
  }

  /**
   * 清除所有記錄
   */
  async clear(): Promise<void> {
    await this.ensureInitialized()

    const tx = this.db!.transaction([STORE_NAME, METADATA_STORE], 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    tx.objectStore(METADATA_STORE).clear()

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })

    this.memoryCache = []
    this.totalCount = 0
  }

  /**
   * 取得總筆數
   */
  async getTotalCount(): Promise<number> {
    await this.ensureInitialized()
    return this.totalCount
  }

  // ===== 私有方法 =====

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init()
    }
  }

  private async writeToIDB(record: FortuneRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put(record)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  private async getAllFromIDB(): Promise<FortuneRecord[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result as FortuneRecord[])
      request.onerror = () => reject(request.error)
    })
  }

  private async getRecentFromIDB(limit: number): Promise<FortuneRecord[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()
      request.onsuccess = () => {
        const all = request.result as FortuneRecord[]
        // 取最近的 N 筆
        resolve(all.slice(-limit))
      }
      request.onerror = () => reject(request.error)
    })
  }

  private async getMetadata(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(METADATA_STORE, 'readonly')
      const store = tx.objectStore(METADATA_STORE)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result?.value)
      request.onerror = () => reject(request.error)
    })
  }

  private async setMetadata(key: string, value: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(METADATA_STORE, 'readwrite')
      const store = tx.objectStore(METADATA_STORE)
      store.put({ key, value })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }
}

// 全域實例
export const fortuneHistoryStore = new FortuneHistoryStore()
