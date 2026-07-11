// 天干陰陽屬性
const GAN_YIN_YANG: Record<string, 'yang' | 'yin'> = {
  甲: 'yang',
  乙: 'yin',
  丙: 'yang',
  丁: 'yin',
  戊: 'yang',
  己: 'yin',
  庚: 'yang',
  辛: 'yin',
  壬: 'yang',
  癸: 'yin',
}

// 天干五行
const GAN_ELEMENT: Record<string, string> = {
  甲: 'wood',
  乙: 'wood',
  丙: 'fire',
  丁: 'fire',
  戊: 'earth',
  己: 'earth',
  庚: 'metal',
  辛: 'metal',
  壬: 'water',
  癸: 'water',
}

// 五行相生：A 生 B
const ELEMENT_GENERATES: Record<string, string> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
}

// 五行相剋：A 剋 B
const ELEMENT_DESTROYS: Record<string, string> = {
  wood: 'earth',
  fire: 'metal',
  earth: 'water',
  water: 'fire',
  metal: 'wood',
}

// 驗證：wood 剋 earth, earth 剋 water, water 剋 fire, fire 剋 metal, metal 剋 wood

// 十神名稱
export type TenGodName =
  | '比肩'
  | '劫財'
  | '食神'
  | '傷官'
  | '偏財'
  | '正財'
  | '七殺'
  | '正官'
  | '偏印'
  | '正印'

// 十神 → 投資性格映射
export const TEN_GODS_INVESTMENT_STYLE: Record<TenGodName, string> = {
  比肩: '獨立自主型，偏好自主決策',
  劫財: '競爭積極型，善於把握機會',
  食神: '穩健規劃型，注重長期佈局',
  傷官: '創意突破型，善於逆向思考',
  偏財: '積極交易型，偏好短線操作',
  正財: '穩健持有型，注重價值投資',
  七殺: '風險偏好型，敢於大膽佈局',
  正官: '紀律守規型，遵循投資紀律',
  偏印: '研究分析型，重視數據決策',
  正印: '學習成長型，持續精進投資',
}

// 十神 → 投資風格分類
export type InvestmentStyle = 'active' | 'conservative' | 'analytical' | 'creative'

export const TEN_GODS_STYLE_MAP: Record<TenGodName, InvestmentStyle> = {
  比肩: 'conservative',
  劫財: 'active',
  食神: 'conservative',
  傷官: 'creative',
  偏財: 'active',
  正財: 'conservative',
  七殺: 'active',
  正官: 'conservative',
  偏印: 'analytical',
  正印: 'analytical',
}

// 取得天干的五行
export function getStemElement(stem: string): string | null {
  return GAN_ELEMENT[stem] || null
}

// 取得天干的陰陽
export function getStemYinYang(stem: string): 'yang' | 'yin' | null {
  return GAN_YIN_YANG[stem] || null
}

// 判斷兩個天干的十神關係
// dayMaster: 日主天干（我）
// otherStem: 其他天干（他）
export function getTenGodRelation(dayMaster: string, otherStem: string): TenGodName {
  const myElement = getStemElement(dayMaster)
  const myYinYang = getStemYinYang(dayMaster)
  const otherElement = getStemElement(otherStem)
  const otherYinYang = getStemYinYang(otherStem)

  if (!myElement || !myYinYang || !otherElement || !otherYinYang) {
    return '比肩' // 預設
  }

  const samePolarity = myYinYang === otherYinYang

  // 同我者（比劫）
  if (myElement === otherElement) {
    return samePolarity ? '比肩' : '劫財'
  }

  // 我生者（食傷）
  if (ELEMENT_GENERATES[myElement] === otherElement) {
    return samePolarity ? '食神' : '傷官'
  }

  // 我剋者（財星）
  if (ELEMENT_DESTROYS[myElement] === otherElement) {
    return samePolarity ? '偏財' : '正財'
  }

  // 剋我者（官殺）
  if (ELEMENT_DESTROYS[otherElement] === myElement) {
    return samePolarity ? '七殺' : '正官'
  }

  // 生我者（印星）
  if (ELEMENT_GENERATES[otherElement] === myElement) {
    return samePolarity ? '偏印' : '正印'
  }

  return '比肩' // 不應到達這裡
}

// 計算四柱的十神分佈
export interface TenGodsDistribution {
  year: TenGodName // 年柱
  month: TenGodName // 月柱
  day: TenGodName // 日柱（日主本身，固定為比肩）
  hour: TenGodName // 時柱
}

export function calculateFourPillarsTenGods(
  yearGanZhi: string,
  monthGanZhi: string,
  dayGanZhi: string,
  hourGanZhi: string
): TenGodsDistribution {
  const dayMaster = dayGanZhi[0] // 日主天干

  return {
    year: getTenGodRelation(dayMaster, yearGanZhi[0]),
    month: getTenGodRelation(dayMaster, monthGanZhi[0]),
    day: '比肩', // 日主本身就是比肩
    hour: getTenGodRelation(dayMaster, hourGanZhi[0]),
  }
}

// 計算十神出現次數
export function countTenGods(distribution: TenGodsDistribution): Record<TenGodName, number> {
  const counts: Record<TenGodName, number> = {
    比肩: 0,
    劫財: 0,
    食神: 0,
    傷官: 0,
    偏財: 0,
    正財: 0,
    七殺: 0,
    正官: 0,
    偏印: 0,
    正印: 0,
  }

  const gods = Object.values(distribution) as TenGodName[]
  for (const god of gods) {
    counts[god]++
  }

  return counts
}

// 找出最強旺的十神（出現次數最多）
export function findDominantTenGods(counts: Record<TenGodName, number>): TenGodName[] {
  const maxCount = Math.max(...Object.values(counts))
  return (Object.entries(counts) as [TenGodName, number][])
    .filter(([_, count]) => count === maxCount)
    .map(([name]) => name)
}

// 從十神分佈推斷投資性格
export function inferInvestmentPersonality(distribution: TenGodsDistribution): {
  dominantGods: TenGodName[]
  style: InvestmentStyle
  description: string
} {
  const counts = countTenGods(distribution)
  const dominantGods = findDominantTenGods(counts)

  // 計算各風格的權重
  const styleWeights: Record<InvestmentStyle, number> = {
    active: 0,
    conservative: 0,
    analytical: 0,
    creative: 0,
  }

  for (const [god, count] of Object.entries(counts) as [TenGodName, number][]) {
    const style = TEN_GODS_STYLE_MAP[god]
    styleWeights[style] += count
  }

  // 找出最強風格
  const dominantStyle = (Object.entries(styleWeights) as [InvestmentStyle, number][]).reduce(
    (max, [style, weight]) => (weight > max.weight ? { style, weight } : max),
    {
      style: 'conservative' as InvestmentStyle,
      weight: 0,
    }
  ).style

  // 生成描述
  const descriptions = dominantGods.map(god => TEN_GODS_INVESTMENT_STYLE[god])
  const description =
    descriptions.length > 0
      ? `您的投資性格偏向「${dominantStyle === 'active' ? '積極交易' : dominantStyle === 'conservative' ? '穩健持有' : dominantStyle === 'analytical' ? '研究分析' : '創意突破'}型」。${descriptions[0]}。`
      : '您的投資性格均衡，適合多元配置。'

  return {
    dominantGods,
    style: dominantStyle,
    description,
  }
}
