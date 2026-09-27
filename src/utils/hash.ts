/**
 * FNV-1a 32-bit 字串雜湊 — O(n)、無配置，分佈均勻，適合作為快取鍵
 */
export function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

/** 會影響運勢計算結果的個人資料欄位 */
export interface ProfileKeySource {
  name: string
  birthDate: string
  birthTime: string
  nameElement?: string
  nameStrokes?: number
}

/** 個人資料穩定雜湊：任一影響計算的欄位變動都會產生不同的鍵 */
export function profileHash(p: ProfileKeySource): string {
  return fnv1a(
    [p.name, p.birthDate, p.birthTime, p.nameElement ?? '', p.nameStrokes ?? 0].join('\u0001')
  )
}
