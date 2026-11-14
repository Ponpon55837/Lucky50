/**
 * 五行對應的幸運色與幸運數字
 * 生肖與本命五行由命盤推算（services/engines/birthChart.ts），姓名學五行見 utils/nameStrokes.ts
 */

export type Element = '金' | '木' | '水' | '火' | '土'

/**
 * 幸運顏色對照表
 */
const LUCKY_COLORS_MAP: Record<Element, string[]> = {
  金: ['白色', '金色', '銀色'],
  木: ['綠色', '青色', '棕色'],
  水: ['黑色', '藍色', '灰色'],
  火: ['紅色', '橙色', '紫色'],
  土: ['黃色', '棕色', '橘色'],
}

/**
 * 幸運數字對照表
 */
const LUCKY_NUMBERS_MAP: Record<Element, number[]> = {
  金: [4, 9, 14, 19],
  木: [3, 8, 13, 18],
  水: [1, 6, 11, 16],
  火: [2, 7, 12, 17],
  土: [5, 10, 15, 20],
}

/**
 * 根據五行取得幸運顏色
 */
export function getLuckyColors(element: Element): string[] {
  return LUCKY_COLORS_MAP[element] || ['金色']
}

/**
 * 根據五行取得幸運數字
 */
export function getLuckyNumbers(element: Element): number[] {
  return LUCKY_NUMBERS_MAP[element] || [8, 18, 28]
}
