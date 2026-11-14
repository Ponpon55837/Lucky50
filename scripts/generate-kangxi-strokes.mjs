#!/usr/bin/env node
/**
 * 由 Unicode Unihan 資料庫產生康熙筆畫表 src/data/kangxiStrokes.ts。
 *
 * 用法：
 *   1. 下載 https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip 並解壓
 *   2. node scripts/generate-kangxi-strokes.mjs <解壓後的資料夾>
 *
 * 康熙筆畫 = 康熙部首本身的筆畫 + 部首外筆畫（kRSUnicode）。
 * 部首一律以原形計，所以氵算水四畫、艹算艸六畫、左阝算阜八畫、右阝算邑七畫。
 * 部首外筆畫為 0 的字就是部首本身或其變體，改用實際筆畫（kTotalStrokes），例如「王」為四畫。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const FIRST = 0x4e00
const LAST = 0x9fff
/** 每個字的筆畫以一個字元表示，索引即筆畫數 */
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'

/** 康熙 214 部首依筆畫分組：[該筆畫的最後一個部首編號, 筆畫數] */
const RADICAL_GROUPS = [
  [6, 1],
  [29, 2],
  [60, 3],
  [94, 4],
  [117, 5],
  [146, 6],
  [166, 7],
  [175, 8],
  [186, 9],
  [194, 10],
  [200, 11],
  [204, 12],
  [208, 13],
  [210, 14],
  [211, 15],
  [213, 16],
  [214, 17],
]
const radicalStrokes = radical => RADICAL_GROUPS.find(([last]) => radical <= last)[1]

const sourceDir = process.argv[2]
if (!sourceDir) {
  console.error('用法：node scripts/generate-kangxi-strokes.mjs <Unihan 解壓資料夾>')
  process.exit(1)
}

const source = readFileSync(join(sourceDir, 'Unihan_IRGSources.txt'), 'utf8')
const version = /Unicode Version ([\d.]+)/.exec(source)?.[1] ?? 'unknown'
const radicalStroke = new Map()
const totalStrokes = new Map()
for (const line of source.split('\n')) {
  if (!line.startsWith('U+')) continue
  const [code, field, value] = line.split('\t')
  const codePoint = parseInt(code.slice(2), 16)
  if (codePoint < FIRST || codePoint > LAST) continue
  // 有多個值時第一個為主要歸部
  const first = value.split(' ')[0]
  if (field === 'kRSUnicode') radicalStroke.set(codePoint, first)
  else if (field === 'kTotalStrokes') totalStrokes.set(codePoint, Number(first))
}

let table = ''
let missing = 0
for (let codePoint = FIRST; codePoint <= LAST; codePoint++) {
  const entry = radicalStroke.get(codePoint)
  let strokes = 0
  if (entry) {
    // 部首編號後的撇號表示簡化部首，筆畫仍以康熙原形計
    const [radical, residual] = entry.replaceAll("'", '').split('.').map(Number)
    strokes = residual > 0 ? radicalStrokes(radical) + residual : (totalStrokes.get(codePoint) ?? 0)
  }
  if (strokes === 0) missing++
  if (strokes >= ALPHABET.length) throw new Error(`筆畫超出編碼範圍：U+${codePoint.toString(16)}`)
  table += ALPHABET[strokes]
}

const output = `/**
 * 康熙筆畫表（由 scripts/generate-kangxi-strokes.mjs 產生，請勿手動修改）
 * 來源：Unicode Unihan Database ${version}（kRSUnicode、kTotalStrokes）
 * 範圍：U+${FIRST.toString(16).toUpperCase()}–U+${LAST.toString(16).toUpperCase()}，每個字元代表一個字的筆畫，0 表示無資料
 */
export const KANGXI_FIRST_CODE_POINT = 0x${FIRST.toString(16)}

export const KANGXI_STROKE_ALPHABET =
  '${ALPHABET}'

// prettier-ignore
export const KANGXI_STROKES =
  '${table}'
`
writeFileSync(new URL('../src/data/kangxiStrokes.ts', import.meta.url), output)
console.log(`已產生 ${LAST - FIRST + 1} 字（Unihan ${version}），其中 ${missing} 字無資料`)
