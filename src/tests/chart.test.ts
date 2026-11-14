import { describe, it, expect } from 'vitest'
import { evenIndices, extent, linearScale, smoothPath } from '@/utils/chart'

describe('extent', () => {
  it('單趟取得最小最大值', () => {
    expect(extent([3, 1, 4, 1, 5, 9, 2, 6])).toEqual([1, 9])
  })

  it('空陣列回傳 [0, 0]', () => {
    expect(extent([])).toEqual([0, 0])
  })

  it('大陣列不會堆疊溢位', () => {
    const values = Array.from({ length: 300_000 }, (_, i) => Math.sin(i))
    const [min, max] = extent(values)
    expect(min).toBeGreaterThanOrEqual(-1)
    expect(max).toBeLessThanOrEqual(1)
  })
})

describe('linearScale', () => {
  it('線性映射，可反向', () => {
    const y = linearScale([0, 100], [200, 0])
    expect(y(0)).toBe(200)
    expect(y(50)).toBe(100)
    expect(y(100)).toBe(0)
  })

  it('domain 退化時回傳中點', () => {
    expect(linearScale([5, 5], [0, 10])(5)).toBe(5)
  })
})

describe('smoothPath', () => {
  it('每段一條三次曲線', () => {
    const path = smoothPath([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ])
    expect(path.startsWith('M0 0')).toBe(true)
    expect(path.match(/C/g)).toHaveLength(2)
  })

  it('空輸入回傳空字串', () => {
    expect(smoothPath([])).toBe('')
  })
})

describe('evenIndices', () => {
  it('含頭尾等距取樣', () => {
    expect(evenIndices(61, 3)).toEqual([0, 30, 60])
  })

  it('只取一個時回傳第一個索引', () => {
    expect(evenIndices(10, 1)).toEqual([0])
  })

  it('長度不足時全取', () => {
    expect(evenIndices(2, 5)).toEqual([0, 1])
  })
})
