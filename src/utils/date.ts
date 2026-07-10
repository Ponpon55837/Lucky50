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
