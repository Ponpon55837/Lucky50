import { perfMonitor } from '@/utils/performance'
import { FortuneService } from '@/services/fortune'

/**
 * 性能測試和報告生成器
 */
export class PerformanceReporter {
  
  /**
   * 運行完整的性能測試套件
   */
  static async runPerformanceTests(): Promise<void> {
    console.log('🚀 開始運行性能測試...')
    
    // 測試用戶資料
    const testProfile = {
      name: '測試用戶',
      birthDate: '1990-05-15',
      birthTime: '10:30',
      zodiac: '馬',
      element: 'metal',
      luckyColors: ['金', '銀', '白'],
      luckyNumbers: [4, 9, 6]
    }

    // 測試不同日期的運勢計算性能
    const dates = [
      new Date('2024-01-15'),
      new Date('2024-02-15'),
      new Date('2024-03-15'),
      new Date('2024-04-15'),
      new Date('2024-05-15')
    ]

    // 並行測試
    const promises = dates.map(async (date, index) => {
      const testName = `fortune_calculation_${index + 1}`
      
      // 運行多次測量以獲得平均值
      for (let i = 0; i < 10; i++) {
        await perfMonitor.measureAsync(testName, async () => {
          FortuneService.calculateDailyFortune(testProfile, date)
          // 模擬一點延遲以測試異步性能
          await new Promise(resolve => setTimeout(resolve, 1))
        })
      }
    })

    await Promise.all(promises)

    // 生成報告
    this.generateReport()
  }

  /**
   * 生成性能報告
   */
  static generateReport(): void {
    console.log('\n📊 性能測試報告')
    console.log('=' .repeat(50))
    
    const report = perfMonitor.generateReport()
    
    // 內存使用情況
    if (report.memory) {
      console.log(`💾 內存使用情況:`)
      console.log(`  已使用: ${report.memory.used} MB`)
      console.log(`  總計: ${report.memory.total} MB`) 
      console.log(`  限制: ${report.memory.limit} MB`)
      console.log(`  使用率: ${((report.memory.used / report.memory.limit) * 100).toFixed(1)}%\n`)
    }

    // 各項指標性能統計
    Object.entries(report.metrics).forEach(([name, stats]) => {
      if (stats) {
        console.log(`⏱️  ${name}:`)
        console.log(`  平均: ${stats.avg.toFixed(2)}ms`)
        console.log(`  最小: ${stats.min.toFixed(2)}ms`)
        console.log(`  最大: ${stats.max.toFixed(2)}ms`)
        console.log(`  中位數: ${stats.median.toFixed(2)}ms`)
        console.log(`  95百分位: ${stats.p95.toFixed(2)}ms`)
        console.log(`  執行次數: ${stats.count}\n`)
      }
    })

    // 緩存統計
    const cacheStats = FortuneService.getCacheStats()
    console.log('🗄️  緩存統計:')
    console.log(`  緩存大小: ${cacheStats.size}`)
    console.log(`  緩存命中率: ${(cacheStats.hitRate * 100).toFixed(1)}%`)
    console.log(`  內存使用: ${cacheStats.memoryUsage.toFixed(2)} KB\n`)

    // 性能建議
    this.generateRecommendations(report)
  }

  /**
   * 生成性能優化建議
   */
  static generateRecommendations(report: any): void {
    console.log('💡 性能優化建議:')
    console.log('-'.repeat(30))

    // 檢查內存使用率
    if (report.memory && (report.memory.used / report.memory.limit) > 0.8) {
      console.log('⚠️  內存使用率過高，建議：')
      console.log('   - 清理不必要的緩存')
      console.log('   - 檢查內存洩漏')
    }

    // 檢查運勢計算性能
    const fortuneStats = Object.entries(report.metrics).find(([name]) => 
      name.includes('fortune_calculation')
    )?.[1] as any

    if (fortuneStats) {
      if (fortuneStats.avg > 10) {
        console.log('⚠️  運勢計算耗時較長，建議：')
        console.log('   - 增加緩存大小')
        console.log('   - 優化計算算法')
      }

      if (fortuneStats.p95 > 50) {
        console.log('⚠️  95百分位延遲過高，建議：')
        console.log('   - 檢查是否有阻塞操作')
        console.log('   - 優化數據結構')
      }
    }

    // 緩存建議
    const cacheStats = FortuneService.getCacheStats()
    if (cacheStats.hitRate < 0.7) {
      console.log('⚠️  緩存命中率較低，建議：')
      console.log('   - 增加緩存容量')
      console.log('   - 優化緩存策略')
    }

    console.log('\n✅ 性能測試完成！')
  }

  /**
   * 生成性能對比報告
   */
  static async compareVersions(testRuns: number = 100): Promise<void> {
    console.log(`🔄 開始版本對比測試 (${testRuns} 次運行)...`)
    
    const testProfile = {
      name: '測試用戶',
      birthDate: '1990-05-15',
      birthTime: '10:30',
      zodiac: '馬',
      element: 'metal',
      luckyColors: ['金', '銀', '白'],
      luckyNumbers: [4, 9, 6]
    }

    const testDate = new Date('2024-01-15')
    
    // 清除緩存以獲得真實性能
    FortuneService.clearCache()

    // 預熱
    for (let i = 0; i < 10; i++) {
      FortuneService.calculateDailyFortune(testProfile, testDate)
    }

    // 正式測試
    const startTime = performance.now()
    for (let i = 0; i < testRuns; i++) {
      FortuneService.calculateDailyFortune(testProfile, testDate)
    }
    const endTime = performance.now()

    const avgTime = (endTime - startTime) / testRuns
    console.log(`\n📈 對比測試結果:`)
    console.log(`  總執行時間: ${(endTime - startTime).toFixed(2)}ms`)
    console.log(`  平均執行時間: ${avgTime.toFixed(2)}ms`)
    console.log(`  每秒處理數: ${(1000 / avgTime).toFixed(0)} ops/sec`)
  }
}

// 開發模式下自動運行性能測試
if (import.meta.env.DEV) {
  // 延遲執行以確保應用完全載入
  setTimeout(() => {
    PerformanceReporter.runPerformanceTests()
  }, 3000)
}