/**
 * 將 Date 物件轉換為本地時區的 YYYY-MM-DD 格式字串。
 * 避免 toISOString() 將本地時間轉成 UTC 導致日期偏移。
 */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 將 YYYY-MM-DD 解析為本地時區午夜的 Date。
 * `new Date('YYYY-MM-DD')` 會被當成 UTC，在負時區會跑到前一天。
 */
export function fromLocalDateString(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const

/** 例如 11/16（一） */
export function formatMonthDayWeekday(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}（${WEEKDAYS[date.getDay()]}）`
}

/** 例如 2026 年 11 月 14 日 星期六 */
export function formatFullDate(date: Date): string {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日 星期${WEEKDAYS[date.getDay()]}`
}
