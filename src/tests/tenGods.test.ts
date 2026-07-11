import { describe, it, expect } from 'vitest'
import {
  getTenGodRelation,
  calculateFourPillarsTenGods,
  countTenGods,
  findDominantTenGods,
  inferInvestmentPersonality,
  getStemElement,
  getStemYinYang,
} from '@/utils/tenGods'

describe('十神計算工具', () => {
  describe('getStemElement', () => {
    it('should return correct element for each stem', () => {
      expect(getStemElement('甲')).toBe('wood')
      expect(getStemElement('乙')).toBe('wood')
      expect(getStemElement('丙')).toBe('fire')
      expect(getStemElement('丁')).toBe('fire')
      expect(getStemElement('戊')).toBe('earth')
      expect(getStemElement('己')).toBe('earth')
      expect(getStemElement('庚')).toBe('metal')
      expect(getStemElement('辛')).toBe('metal')
      expect(getStemElement('壬')).toBe('water')
      expect(getStemElement('癸')).toBe('water')
    })

    it('should return null for invalid stem', () => {
      expect(getStemElement('A')).toBeNull()
    })
  })

  describe('getStemYinYang', () => {
    it('should return correct yin-yang for each stem', () => {
      expect(getStemYinYang('甲')).toBe('yang')
      expect(getStemYinYang('乙')).toBe('yin')
      expect(getStemYinYang('丙')).toBe('yang')
      expect(getStemYinYang('丁')).toBe('yin')
    })

    it('should return null for invalid stem', () => {
      expect(getStemYinYang('A')).toBeNull()
    })
  })

  describe('getTenGodRelation', () => {
    it('should return 比肩 for same element same polarity', () => {
      // 甲(wood,yang) vs 甲(wood,yang) → 比肩
      expect(getTenGodRelation('甲', '甲')).toBe('比肩')
      // 乙(wood,yin) vs 乙(wood,yin) → 比肩
      expect(getTenGodRelation('乙', '乙')).toBe('比肩')
    })

    it('should return 劫財 for same element different polarity', () => {
      // 甲(wood,yang) vs 乙(wood,yin) → 劫財
      expect(getTenGodRelation('甲', '乙')).toBe('劫財')
      expect(getTenGodRelation('乙', '甲')).toBe('劫財')
    })

    it('should return 食神 for element I generate same polarity', () => {
      // 甲(wood,yang) generates fire → 丙(fire,yang) → 食神
      expect(getTenGodRelation('甲', '丙')).toBe('食神')
      // 庚(metal,yang) generates water → 壬(water,yang) → 食神
      expect(getTenGodRelation('庚', '壬')).toBe('食神')
    })

    it('should return 傷官 for element I generate different polarity', () => {
      // 甲(wood,yang) generates fire → 丁(fire,yin) → 傷官
      expect(getTenGodRelation('甲', '丁')).toBe('傷官')
    })

    it('should return 偏財 for element I destroy same polarity', () => {
      // 甲(wood,yang) destroys earth → 戊(earth,yang) → 偏財
      expect(getTenGodRelation('甲', '戊')).toBe('偏財')
    })

    it('should return 正財 for element I destroy different polarity', () => {
      // 甲(wood,yang) destroys earth → 己(earth,yin) → 正財
      expect(getTenGodRelation('甲', '己')).toBe('正財')
    })

    it('should return 七殺 for element that destroys me same polarity', () => {
      // metal destroys wood → 庚(metal,yang) destroys 甲(wood,yang) → 七殺
      expect(getTenGodRelation('甲', '庚')).toBe('七殺')
    })

    it('should return 正官 for element that destroys me different polarity', () => {
      // metal destroys wood → 辛(metal,yin) destroys 甲(wood,yang) → 正官
      expect(getTenGodRelation('甲', '辛')).toBe('正官')
    })

    it('should return 偏印 for element that generates me same polarity', () => {
      // water generates wood → 壬(water,yang) generates 甲(wood,yang) → 偏印
      expect(getTenGodRelation('甲', '壬')).toBe('偏印')
    })

    it('should return 正印 for element that generates me different polarity', () => {
      // water generates wood → 癸(water,yin) generates 甲(wood,yang) → 正印
      expect(getTenGodRelation('甲', '癸')).toBe('正印')
    })

    it('should return 比肩 for invalid input', () => {
      expect(getTenGodRelation('A', '甲')).toBe('比肩')
    })
  })

  describe('calculateFourPillarsTenGods', () => {
    it('should calculate ten gods for all four pillars', () => {
      // 甲子年 丙寅月 壬申日 戊申時
      // 日主：壬(water,yang)
      const result = calculateFourPillarsTenGods('甲子', '丙寅', '壬申', '戊申')

      // 壬(water,yang) generates 甲(wood,yang) → 我生他同陰陽 → 食神
      expect(result.year).toBe('食神')
      // 壬(water,yang) destroys 丙(fire,yang) → 我剋他同陰陽 → 偏財
      expect(result.month).toBe('偏財')
      // 日主本身
      expect(result.day).toBe('比肩')
      // 戊(earth,yang) destroys 壬(water,yang) → 他剋我同陰陽 → 七殺
      expect(result.hour).toBe('七殺')
    })
  })

  describe('countTenGods', () => {
    it('should count ten gods correctly', () => {
      const distribution = {
        year: '偏印' as const,
        month: '七殺' as const,
        day: '比肩' as const,
        hour: '七殺' as const,
      }

      const counts = countTenGods(distribution)
      expect(counts['偏印']).toBe(1)
      expect(counts['七殺']).toBe(2)
      expect(counts['比肩']).toBe(1)
      expect(counts['正財']).toBe(0)
    })
  })

  describe('findDominantTenGods', () => {
    it('should find the most frequent ten gods', () => {
      const counts = {
        比肩: 1,
        劫財: 0,
        食神: 0,
        傷官: 0,
        偏財: 2,
        正財: 0,
        七殺: 2,
        正官: 0,
        偏印: 1,
        正印: 0,
      }

      const dominant = findDominantTenGods(counts)
      expect(dominant).toContain('偏財')
      expect(dominant).toContain('七殺')
    })
  })

  describe('inferInvestmentPersonality', () => {
    it('should infer personality from ten gods distribution', () => {
      // 偏財多 → 積極交易型
      const distribution = {
        year: '偏財' as const,
        month: '偏財' as const,
        day: '比肩' as const,
        hour: '食神' as const,
      }

      const result = inferInvestmentPersonality(distribution)
      expect(result.dominantGods).toContain('偏財')
      expect(result.style).toBe('active')
      expect(result.description).toContain('積極交易')
    })

    it('should infer conservative style for 正財 dominant', () => {
      const distribution = {
        year: '正財' as const,
        month: '正財' as const,
        day: '比肩' as const,
        hour: '正印' as const,
      }

      const result = inferInvestmentPersonality(distribution)
      expect(result.style).toBe('conservative')
      expect(result.description).toContain('穩健持有')
    })

    it('should infer analytical style for 偏印 dominant', () => {
      const distribution = {
        year: '偏印' as const,
        month: '偏印' as const,
        day: '比肩' as const,
        hour: '正印' as const,
      }

      const result = inferInvestmentPersonality(distribution)
      expect(result.style).toBe('analytical')
      expect(result.description).toContain('研究分析')
    })

    it('should infer creative style for 傷官 dominant', () => {
      const distribution = {
        year: '傷官' as const,
        month: '傷官' as const,
        day: '比肩' as const,
        hour: '偏財' as const,
      }

      const result = inferInvestmentPersonality(distribution)
      expect(result.style).toBe('creative')
      expect(result.description).toContain('創意突破')
    })
  })
})
