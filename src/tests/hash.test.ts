import { describe, it, expect } from 'vitest'
import { fnv1a, profileHash } from '@/utils/hash'

describe('hash', () => {
  it('fnv1a 穩定且區分不同輸入', () => {
    expect(fnv1a('abc')).toBe(fnv1a('abc'))
    expect(fnv1a('abc')).not.toBe(fnv1a('abd'))
    expect(fnv1a('')).toBe((0x811c9dc5).toString(36))
  })

  it('profileHash：同長度不同姓名不會碰撞', () => {
    const base = { name: '王小明', birthDate: '1990-01-01', birthTime: '10:30' }
    expect(profileHash(base)).not.toBe(profileHash({ ...base, name: '李小華' }))
  })

  it('profileHash：出生時間變動會改變雜湊', () => {
    const base = { name: '王小明', birthDate: '1990-01-01', birthTime: '10:30' }
    expect(profileHash(base)).not.toBe(profileHash({ ...base, birthTime: '11:30' }))
  })
})
