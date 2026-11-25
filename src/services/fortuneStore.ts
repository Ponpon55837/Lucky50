import type {
  FortuneRecord,
  HistoryQueryOptions,
  HistoryQueryResult,
  HistoryStats,
} from '@/types/history'

const DB_NAME = 'lucky50_fortune_history'
const DB_VERSION = 1
const STORE_NAME = 'fortunes'
const METADATA_STORE = 'metadata'

type OnRequestSuccess = <T>(request: IDBRequest<T>, handleResult: (result: T) => void) => void

/**
 * IndexedDB 初始化
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = event => {
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
  private database: Promise<IDBDatabase> | null = null

  /**
   * 初始化儲存服務
   */
  async init(): Promise<void> {
    await this.getDatabase()
  }

  /**
   * 新增運勢記錄（同一天同一用戶只保留最新一筆）
   */
  async append(record: FortuneRecord): Promise<void> {
    await this.writeHistory((tx, onSuccess, syncCount) => {
      const store = tx.objectStore(STORE_NAME)
      const save = (id: number) => {
        store.put({ ...record, id })
        syncCount()
      }

      // 不同日期或用戶可能在同一毫秒產生相同的 ID。
      const saveAtAvailableId = (id: number) => {
        onSuccess(store.getKey(id), key => {
          if (key === undefined) {
            save(id)
          } else {
            const nextId = Number.isSafeInteger(id) && id < Number.MAX_SAFE_INTEGER ? id + 1 : 0
            saveAtAvailableId(nextId)
          }
        })
      }

      onSuccess<FortuneRecord[]>(store.index('date').getAll(record.date), sameDate => {
        const existing = sameDate.find(
          current => current.userProfileHash === record.userProfileHash
        )
        if (existing) {
          save(existing.id)
        } else {
          saveAtAvailableId(record.id)
        }
      })
    })
  }

  /**
   * 批次新增運勢記錄
   */
  async appendBatch(records: FortuneRecord[]): Promise<void> {
    if (records.length === 0) return

    // 批次匯入以 ID 為準，重複 ID 採用最後一筆。
    const recordsById = new Map(records.map(record => [record.id, record]))
    await this.writeHistory((tx, _onSuccess, syncCount) => {
      const store = tx.objectStore(STORE_NAME)
      for (const [id, record] of recordsById) {
        store.put({ ...record, id })
      }
      syncCount()
    })
  }

  /**
   * 查詢運勢記錄（支援分頁、篩選、排序）
   */
  async query(options: HistoryQueryOptions): Promise<HistoryQueryResult> {
    let records = await this.getAllFromIDB()

    // 篩選：日期範圍
    if (options.dateRange) {
      records = records.filter(
        r => r.date >= options.dateRange!.start && r.date <= options.dateRange!.end
      )
    }

    // 篩選：分數範圍
    if (options.scoreRange) {
      records = records.filter(
        r =>
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
        買: ['BUY'],
        買入: ['BUY'],
        buy: ['BUY'],
        賣: ['SELL'],
        賣出: ['SELL'],
        sell: ['SELL'],
        持有: ['HOLD'],
        hold: ['HOLD'],
      }
      const matchedRecs = recMap[kw] ?? recMap[kw.replace(/\s/g, '')]

      records = records.filter(
        r =>
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
    await this.writeHistory(tx => {
      tx.objectStore(STORE_NAME).clear()
      tx.objectStore(METADATA_STORE).clear()
    })
  }

  /**
   * 取得總筆數
   */
  async getTotalCount(): Promise<number> {
    // 直接讀取目前的筆數，避免使用舊版資料庫留下的計數。
    const db = await this.getDatabase()
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // ===== 私有方法 =====

  private getDatabase(): Promise<IDBDatabase> {
    this.database ??= openDB().catch(error => {
      this.database = null
      throw error
    })
    return this.database
  }

  private async writeHistory(
    write: (tx: IDBTransaction, onSuccess: OnRequestSuccess, syncCount: () => void) => void
  ): Promise<void> {
    const db = await this.getDatabase()
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, METADATA_STORE], 'readwrite')
      let writeError: unknown
      tx.oncomplete = () => resolve()
      tx.onabort = () => {
        reject(writeError ?? tx.error ?? new DOMException('History write aborted', 'AbortError'))
      }

      const run = (operation: () => void) => {
        try {
          operation()
        } catch (error) {
          writeError = error
          tx.abort()
        }
      }

      // 在請求事件內繼續排程，讓查詢、寫入與計數留在同一交易。
      const onSuccess: OnRequestSuccess = (request, handleResult) => {
        request.onsuccess = () => run(() => handleResult(request.result))
      }
      const syncCount = () => {
        onSuccess(tx.objectStore(STORE_NAME).count(), value => {
          tx.objectStore(METADATA_STORE).put({ key: 'totalCount', value })
        })
      }

      run(() => write(tx, onSuccess, syncCount))
    })
  }

  private async getAllFromIDB(): Promise<FortuneRecord[]> {
    const db = await this.getDatabase()
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll()
      request.onsuccess = () => resolve(request.result as FortuneRecord[])
      request.onerror = () => reject(request.error)
    })
  }
}

// 全域實例
export const fortuneHistoryStore = new FortuneHistoryStore()
