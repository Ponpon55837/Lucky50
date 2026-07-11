/**
 * 生肖與五行計算工具
 * 根據出生日期自動推算生肖、五行屬性
 * 根據姓名筆畫計算姓名學五行
 */

const ZODIAC_LIST = [
  '鼠',
  '牛',
  '虎',
  '兔',
  '龍',
  '蛇',
  '馬',
  '羊',
  '猴',
  '雞',
  '狗',
  '豬',
] as const
export type ZodiacAnimal = (typeof ZODIAC_LIST)[number]

const ELEMENTS = ['金', '水', '木', '木', '土', '火', '火', '土', '金', '金'] as const
export type Element = (typeof ELEMENTS)[number]

/**
 * 根據出生年份推算生肖
 * 生肖以農曆年為準，但此處使用簡化版本（西元年）
 * @param birthDate YYYY-MM-DD 格式的出生日期
 */
export function getZodiacFromDate(birthDate: string): ZodiacAnimal | '' {
  if (!birthDate) return ''
  const parts = birthDate.split('-')
  if (parts.length < 3 || !parts[0]) return ''
  const year = parseInt(parts[0], 10)
  if (isNaN(year)) return ''
  // 生肖計算：(year - 4) % 12 → 0=鼠, 1=牛, ...
  const index = (((year - 4) % 12) + 12) % 12
  return ZODIAC_LIST[index]
}

/**
 * 根據出生年份推算五行屬性
 * 以年份尾數對照天干五行
 * @param birthDate YYYY-MM-DD 格式的出生日期
 */
export function getElementFromDate(birthDate: string): Element {
  if (!birthDate) return '土'
  const parts = birthDate.split('-')
  if (parts.length === 0 || !parts[0]) return '土'
  const year = parseInt(parts[0], 10)
  if (isNaN(year)) return '土'
  return ELEMENTS[year % 10] || '土'
}

/**
 * 姓名筆畫對應五行的映射
 * 以康熙字典筆畫數為基準
 * 筆畫數尾數：1、2→木，3、4→火，5、6→土，7、8→金，9、0→水
 */
const STROKE_ELEMENT_MAP: Record<number, Element> = {
  1: '木',
  2: '木',
  3: '火',
  4: '火',
  5: '土',
  6: '土',
  7: '金',
  8: '金',
  9: '水',
  0: '水',
}

/**
 * 常用中文字筆畫數簡易對照表（康熙字典）
 * 僅列出姓名學常用字，其餘以 Unicode 碼點估算
 */
const COMMON_STROKE_MAP: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 5,
  五: 4,
  六: 4,
  七: 2,
  八: 2,
  九: 2,
  十: 2,
  大: 3,
  小: 3,
  中: 4,
  上: 3,
  下: 3,
  人: 2,
  天: 4,
  地: 6,
  王: 4,
  李: 7,
  張: 11,
  林: 8,
  陳: 11,
  黃: 12,
  吳: 7,
  劉: 15,
  蔡: 14,
  楊: 13,
  許: 11,
  鄭: 19,
  周: 8,
  洪: 10,
  郭: 10,
  何: 7,
  曾: 12,
  彭: 12,
  葉: 12,
  余: 7,
  廖: 14,
  賴: 16,
  徐: 10,
  朱: 6,
  胡: 9,
  高: 10,
  羅: 19,
  梁: 11,
  宋: 7,
  謝: 17,
  唐: 10,
  韓: 17,
  曹: 11,
  馮: 12,
  鄧: 14,
  傅: 12,
  呂: 7,
  蘇: 20,
  盧: 16,
  蔣: 15,
  魏: 14,
  程: 12,
  丁: 2,
  沈: 7,
  袁: 10,
  董: 12,
  范: 11,
  方: 4,
  石: 5,
  姚: 9,
  譚: 19,
  鄒: 12,
  熊: 14,
  白: 5,
  江: 6,
  鍾: 17,
  汪: 7,
  田: 5,
  任: 6,
  姜: 9,
  金: 8,
  崔: 11,
  陸: 16,
  谷: 7,
  史: 5,
  龍: 16,
  段: 9,
  雷: 13,
  黎: 15,
  倪: 10,
  夏: 10,
  萬: 13,
  綜: 14,
}

/**
 * 計算單個字的筆畫數（姓名學用）
 * 使用康熙字典筆畫為主，查表為輔
 */
function getCharacterStrokes(char: string): number {
  // 優先查表
  if (COMMON_STROKE_MAP[char]) {
    return COMMON_STROKE_MAP[char]
  }
  // 無對應時，使用 Unicode 碼點估算（僅供參考）
  const code = char.charCodeAt(0)
  // CJK 區域的字，以碼點模擬（不精確但可用）
  if (code >= 0x4e00 && code <= 0x9fff) {
    return (code % 10) + 1
  }
  return 1
}

/**
 * 根據姓名計算姓名學五行
 * 將名字每個字的筆畫數加總，取尾數對應五行
 * @param name 使用者姓名（不含姓氏也行，會整體計算）
 */
export function getElementFromName(name: string): { element: Element; totalStrokes: number } {
  if (!name || name.trim().length === 0) {
    return { element: '土', totalStrokes: 0 }
  }

  const trimmed = name.trim()
  let totalStrokes = 0
  for (const char of trimmed) {
    totalStrokes += getCharacterStrokes(char)
  }

  const tailDigit = totalStrokes % 10
  const element = STROKE_ELEMENT_MAP[tailDigit] || '土'

  return { element, totalStrokes }
}

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

/**
 * 五行顏色 Tailwind class 對照
 */
const ELEMENT_COLOR_CLASSES: Record<string, string> = {
  金: 'bg-gray-300',
  木: 'bg-green-500',
  水: 'bg-blue-500',
  火: 'bg-red-500',
  土: 'bg-yellow-600',
}

export function getElementColorClass(element: string): string {
  return ELEMENT_COLOR_CLASSES[element] || 'bg-gray-500'
}
