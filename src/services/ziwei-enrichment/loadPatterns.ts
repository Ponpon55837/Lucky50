import type { ZiWeiChartSnapshot } from './types'
import type { ZiWeiPatternResult } from './patterns/types'

export async function loadZiWeiPatterns(
  chart: ZiWeiChartSnapshot
): Promise<ZiWeiPatternResult[] | null> {
  if (import.meta.env.VITE_ZIWEI_PATTERNS !== 'true') return null

  const { evaluateZiWeiPatterns } = await import('./patterns/evaluate')
  return evaluateZiWeiPatterns(chart)
}
