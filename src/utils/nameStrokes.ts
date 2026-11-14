/**
 * 姓名學筆畫與五行
 *
 * 筆畫採康熙字典算法（部首以原形計），資料來自 Unicode Unihan，見 src/data/kangxiStrokes.ts。
 * 少數字因舊字形差異，可能與部分姓名學書籍相差一畫（例如「蕭」「戴」）。
 */
import {
  KANGXI_FIRST_CODE_POINT,
  KANGXI_STROKES,
  KANGXI_STROKE_ALPHABET,
} from '@/data/kangxiStrokes'
import type { Element } from './zodiac'

/** 筆畫字元 → 筆畫數；建一次後查表 O(1) */
const STROKES_BY_SYMBOL: ReadonlyMap<string, number> = new Map(
  Array.from(KANGXI_STROKE_ALPHABET, (symbol, strokes) => [symbol, strokes])
)

/** 姓名學慣例：數字依其數值計，不依實際筆畫 */
const NUMERAL_STROKES: Readonly<Record<string, number>> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
}

/** 筆畫尾數對應五行：1、2 木，3、4 火，5、6 土，7、8 金，9、0 水 */
const ELEMENT_BY_TAIL_DIGIT: readonly Element[] = [
  '水',
  '木',
  '木',
  '火',
  '火',
  '土',
  '土',
  '金',
  '金',
  '水',
]

/** 單一字的康熙筆畫；查不到（非漢字或罕用字）回傳 0 */
export function getKangxiStrokes(char: string): number {
  const numeral = NUMERAL_STROKES[char]
  if (numeral !== undefined) return numeral
  const symbol = KANGXI_STROKES[char.codePointAt(0)! - KANGXI_FIRST_CODE_POINT]
  return symbol === undefined ? 0 : STROKES_BY_SYMBOL.get(symbol)!
}

export interface NameElement {
  /** 總筆畫尾數對應的五行；沒有可計筆畫的字時為空字串 */
  element: Element | ''
  totalStrokes: number
  /** 查不到筆畫、未計入的字 */
  unknownChars: string[]
}

/** 姓名學五行：全名各字康熙筆畫加總，取尾數對應五行 */
export function getElementFromName(name: string): NameElement {
  let totalStrokes = 0
  const unknownChars: string[] = []
  for (const char of name.trim()) {
    const strokes = getKangxiStrokes(char)
    if (strokes === 0) unknownChars.push(char)
    totalStrokes += strokes
  }
  return {
    element: totalStrokes > 0 ? ELEMENT_BY_TAIL_DIGIT[totalStrokes % 10] : '',
    totalStrokes,
    unknownChars,
  }
}
