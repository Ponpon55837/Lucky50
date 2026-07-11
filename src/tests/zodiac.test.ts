import { describe, it, expect } from 'vitest'
import {
  getZodiacFromDate,
  getElementFromDate,
  getElementFromName,
  getLuckyColors,
  getLuckyNumbers,
  getElementColorClass,
} from '@/utils/zodiac'

// 生肖對照：1984=鼠, 1985=牛, 1986=虎, 1987=兔, 1988=龍, 1989=蛇
//            1990=馬, 1991=羊, 1992=猴, 1993=雞, 1994=狗, 1995=豬
describe('getZodiacFromDate', () => {
  it('1984年→鼠', () => {
    expect(getZodiacFromDate('1984-03-01')).toBe('鼠')
  })

  it('1985年→牛', () => {
    expect(getZodiacFromDate('1985-06-15')).toBe('牛')
  })

  it('1986年→虎', () => {
    expect(getZodiacFromDate('1986-03-20')).toBe('虎')
  })

  it('1987年→兔', () => {
    expect(getZodiacFromDate('1987-12-25')).toBe('兔')
  })

  it('1988年→龍', () => {
    expect(getZodiacFromDate('1988-07-08')).toBe('龍')
  })

  it('1989年→蛇', () => {
    expect(getZodiacFromDate('1989-02-14')).toBe('蛇')
  })

  it('1990年→馬', () => {
    expect(getZodiacFromDate('1990-09-01')).toBe('馬')
  })

  it('1991年→羊', () => {
    expect(getZodiacFromDate('1991-05-30')).toBe('羊')
  })

  it('1992年→猴', () => {
    expect(getZodiacFromDate('1992-11-11')).toBe('猴')
  })

  it('1993年→雞', () => {
    expect(getZodiacFromDate('1993-08-08')).toBe('雞')
  })

  it('1994年→狗', () => {
    expect(getZodiacFromDate('1994-01-01')).toBe('狗')
  })

  it('1995年→豬', () => {
    expect(getZodiacFromDate('1995-06-06')).toBe('豬')
  })

  it('1996年→鼠（12年循環）', () => {
    expect(getZodiacFromDate('1996-01-01')).toBe('鼠')
  })

  it('2020年→鼠', () => {
    expect(getZodiacFromDate('2020-01-25')).toBe('鼠')
  })

  it('空字串回傳空', () => {
    expect(getZodiacFromDate('')).toBe('')
  })

  it('無效格式回傳空', () => {
    expect(getZodiacFromDate('invalid')).toBe('')
  })
})

describe('getElementFromDate', () => {
  it('1990年(尾數0)→金', () => {
    expect(getElementFromDate('1990-01-01')).toBe('金')
  })

  it('1991年(尾數1)→水', () => {
    expect(getElementFromDate('1991-01-01')).toBe('水')
  })

  it('1992年(尾數2)→木', () => {
    expect(getElementFromDate('1992-01-01')).toBe('木')
  })

  it('1994年(尾數4)→土', () => {
    expect(getElementFromDate('1994-01-01')).toBe('土')
  })

  it('1996年(尾數6)→火', () => {
    expect(getElementFromDate('1996-01-01')).toBe('火')
  })

  it('空字串回傳土', () => {
    expect(getElementFromDate('')).toBe('土')
  })

  it('無效年份回傳土', () => {
    expect(getElementFromDate('xxxx-01-01')).toBe('土')
  })
})

describe('getElementFromName', () => {
  it('空字串回傳土且筆畫為0', () => {
    const result = getElementFromName('')
    expect(result.element).toBe('土')
    expect(result.totalStrokes).toBe(0)
  })

  it('純空白字串回傳土且筆畫為0', () => {
    const result = getElementFromName('   ')
    expect(result.element).toBe('土')
    expect(result.totalStrokes).toBe(0)
  })

  it('「大」字筆畫3→火', () => {
    const result = getElementFromName('大')
    expect(result.totalStrokes).toBe(3)
    expect(result.element).toBe('火')
  })

  it('「王」字筆畫4→火', () => {
    const result = getElementFromName('王')
    expect(result.totalStrokes).toBe(4)
    expect(result.element).toBe('火')
  })

  it('「林」字筆畫8→金', () => {
    const result = getElementFromName('林')
    expect(result.totalStrokes).toBe(8)
    expect(result.element).toBe('金')
  })

  it('「林大」合計筆畫11→木', () => {
    const result = getElementFromName('林大')
    expect(result.totalStrokes).toBe(11)
    expect(result.element).toBe('木')
  })

  it('前後空白自動去除', () => {
    const result = getElementFromName('  大  ')
    expect(result.totalStrokes).toBe(3)
    expect(result.element).toBe('火')
  })
})

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

describe('getElementColorClass', () => {
  it('金→bg-gray-300', () => {
    expect(getElementColorClass('金')).toBe('bg-gray-300')
  })

  it('木→bg-green-500', () => {
    expect(getElementColorClass('木')).toBe('bg-green-500')
  })

  it('未知→bg-gray-500', () => {
    expect(getElementColorClass('未知')).toBe('bg-gray-500')
  })
})
