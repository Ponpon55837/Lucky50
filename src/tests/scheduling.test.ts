import { describe, it, expect, vi } from 'vitest'
import { mapInSlices, yieldToMain } from '@/utils/scheduling'

describe('yieldToMain', () => {
  it('讓出主執行緒後繼續', async () => {
    await expect(yieldToMain()).resolves.toBeUndefined()
  })
})

describe('mapInSlices', () => {
  it('結果與 Array.prototype.map 相同', async () => {
    const items = Array.from({ length: 500 }, (_, i) => i)
    expect(await mapInSlices(items, (value, index) => value * 2 + index)).toEqual(
      items.map((value, index) => value * 2 + index)
    )
    expect(await mapInSlices([], value => value)).toEqual([])
  })

  it('每段時間用完就讓出一次，途中不漏項', async () => {
    let now = 0
    const clock = vi.spyOn(performance, 'now').mockImplementation(() => (now += 5))
    try {
      const seen: number[] = []
      await mapInSlices([1, 2, 3, 4, 5, 6, 7], value => seen.push(value))
      expect(seen).toEqual([1, 2, 3, 4, 5, 6, 7])
    } finally {
      clock.mockRestore()
    }
  })

  it('轉換函式丟錯時整體失敗', async () => {
    await expect(
      mapInSlices([1, 2], () => {
        throw new Error('壞了')
      })
    ).rejects.toThrow('壞了')
  })
})
