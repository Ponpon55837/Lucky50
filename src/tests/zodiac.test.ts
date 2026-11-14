import { describe, it, expect } from 'vitest'
import { getLuckyColors, getLuckyNumbers } from '@/utils/zodiac'

describe('getLuckyColors', () => {
  it('金→白金銀', () => {
    expect(getLuckyColors('金')).toEqual(['白色', '金色', '銀色'])
  })

  it('木→綠青棕', () => {
    expect(getLuckyColors('木')).toEqual(['綠色', '青色', '棕色'])
  })

  it('水→黑藍灰', () => {
    expect(getLuckyColors('水')).toEqual(['黑色', '藍色', '灰色'])
  })

  it('火→紅橙紫', () => {
    expect(getLuckyColors('火')).toEqual(['紅色', '橙色', '紫色'])
  })

  it('土→黃棕橘', () => {
    expect(getLuckyColors('土')).toEqual(['黃色', '棕色', '橘色'])
  })
})

describe('getLuckyNumbers', () => {
  it('金→4,9,14,19', () => {
    expect(getLuckyNumbers('金')).toEqual([4, 9, 14, 19])
  })

  it('木→3,8,13,18', () => {
    expect(getLuckyNumbers('木')).toEqual([3, 8, 13, 18])
  })

  it('水→1,6,11,16', () => {
    expect(getLuckyNumbers('水')).toEqual([1, 6, 11, 16])
  })

  it('火→2,7,12,17', () => {
    expect(getLuckyNumbers('火')).toEqual([2, 7, 12, 17])
  })

  it('土→5,10,15,20', () => {
    expect(getLuckyNumbers('土')).toEqual([5, 10, 15, 20])
  })
})
