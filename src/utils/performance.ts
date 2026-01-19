// 性能監控工具

// 擴展 Performance 介面以支援 memory 屬性
interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics = new Map<string, number[]>()
  private observers = new Map<string, PerformanceObserver>()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // 開始性能測量
  startMeasure(name: string): void {
    performance.mark(`${name}-start`)
  }

  // 結束性能測量
  endMeasure(name: string): number {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)

    const measure = performance.getEntriesByName(name, 'measure')[0]
    const duration = measure.duration

    // 記錄歷史數據
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    const history = this.metrics.get(name)!
    history.push(duration)

    // 保持最近100次記錄
    if (history.length > 100) {
      history.shift()
    }

    // 清理性能條目
    performance.clearMarks(`${name}-start`)
    performance.clearMarks(`${name}-end`)
    performance.clearMeasures(name)

    return duration
  }

  // 監控函數執行時間
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(name)
    try {
      const result = await fn()
      const duration = this.endMeasure(name)
      console.log(`${name} 執行時間: ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      this.endMeasure(name)
      throw error
    }
  }

  measureSync<T>(name: string, fn: () => T): T {
    this.startMeasure(name)
    try {
      const result = fn()
      const duration = this.endMeasure(name)
      console.log(`${name} 執行時間: ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      this.endMeasure(name)
      throw error
    }
  }

  // 獲取性能統計
  getStats(name: string) {
    const history = this.metrics.get(name)
    if (!history || history.length === 0) {
      return null
    }

    const sorted = [...history].sort((a, b) => a - b)
    return {
      count: history.length,
      avg: history.reduce((a, b) => a + b) / history.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    }
  }

  // 監控長任務
  observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // 超過50ms的任務
            console.warn(`長任務檢測: ${entry.name} 耗時 ${entry.duration.toFixed(2)}ms`)
          }
        }
      })

      try {
        observer.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', observer)
      } catch (e) {
        console.warn('長任務監控不支持')
      }
    }
  }

  // 監控內存使用
  getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as PerformanceWithMemory).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      }
    }
    return null
  }

  // 獲取所有性能報告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      memory: this.getMemoryUsage(),
      metrics: {} as Record<string, { count: number; avg: number; min: number; max: number; median: number; p95: number }>,
    }

    for (const [name] of this.metrics) {
      report.metrics[name] = this.getStats(name)
    }

    return report
  }

  // 清理監控器
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.metrics.clear()
  }
}

// 全局性能監控實例
export const perfMonitor = PerformanceMonitor.getInstance()

// 開發模式下自動開啟長任務監控
if (import.meta.env.DEV) {
  perfMonitor.observeLongTasks()
}
