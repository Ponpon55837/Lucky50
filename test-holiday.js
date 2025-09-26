// 簡單測試台股假期檢查
const { TaiwanStockService } = require('./src/services/taiwanStock.ts')

// 測試教師節 2025-09-28 (下週一)
const teachersDay = new Date('2025-09-28')
console.log(
  '📅 教師節 2025-09-28 (週一) 是否為交易日:',
  TaiwanStockService.isTradingDay(teachersDay)
)

// 測試一般平日
const regularDay = new Date('2025-09-26') // 週四
console.log(
  '📈 一般平日 2025-09-26 (週四) 是否為交易日:',
  TaiwanStockService.isTradingDay(regularDay)
)

// 測試週末
const weekend = new Date('2025-09-27') // 週五
console.log('📅 週末 2025-09-27 (週五) 是否為交易日:', TaiwanStockService.isTradingDay(weekend))

// 測試其他已知假期
const nationalDay = new Date('2024-10-10') // 國慶日
console.log('🇹🇼 國慶日 2024-10-10 是否為交易日:', TaiwanStockService.isTradingDay(nationalDay))

const springFestival = new Date('2024-02-10') // 春節
console.log('🐉 春節 2024-02-10 是否為交易日:', TaiwanStockService.isTradingDay(springFestival))
