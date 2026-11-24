import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ZiWeiReadingPanel from '@/components/ZiWeiReadingPanel.vue'
import * as patterns from '@/services/ziwei-enrichment/loadPatterns'
import type { ZiWeiPatternResult } from '@/services/ziwei-enrichment/patterns/types'
import { evaluateZiWeiPatterns } from '@/services/ziwei-enrichment/patterns/evaluate'
import { natalSnapshot } from './fixtures'

const birth = { birthDate: '1950-01-24', birthTime: '22:00' }
const date = new Date(2024, 1, 9)

describe('紫微解讀面板', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('可切換四化層且日期變更會更新流年，不改本命層', async () => {
    vi.stubEnv('VITE_ZIWEI_PATTERNS', 'true')
    const wrapper = mount(ZiWeiReadingPanel, { props: { ...birth, date } })
    const control = wrapper.get('select')
    const reading = wrapper.get('[aria-live="polite"]')
    const natal = reading.text()
    expect(natal).toContain('本命以己干')
    expect(reading.findAll('dt').map(item => item.text())).toEqual(['化祿', '化權', '化科', '化忌'])

    await control.setValue('year')
    expect(reading.text()).toContain('流年以癸干起四化 · 農曆 2023 年')
    await wrapper.get('input[type="date"]').setValue('2024-02-10')
    expect(reading.text()).toContain('流年以甲干起四化 · 農曆 2024 年')
    expect(wrapper.props('date')).toBe(date)

    await control.setValue('month')
    expect(reading.text()).toContain('流月以丙干起四化')
    await wrapper.setProps({ date: new Date(2023, 3, 6) })
    expect(reading.text()).toContain('閏2 月 16 日，按 3 月起算')

    await control.setValue('day')
    expect(reading.text()).toContain('2023-04-06')
    await control.setValue('natal')
    expect(reading.text()).toBe(natal)
  })

  it.each(['', '0024-02-10', '2101-01-01'])(
    '查閱日期 %j 無效時，本命四化仍可檢視',
    async invalidDate => {
      const wrapper = mount(ZiWeiReadingPanel, { props: { ...birth, date } })
      const control = wrapper.get('select')
      await control.setValue('year')
      await wrapper.get('input[type="date"]').setValue(invalidDate)
      expect(wrapper.get('[aria-live="polite"]').text()).toContain(
        '請選擇 1900 至 2100 年之間的日期'
      )
      await control.setValue('natal')
      expect(wrapper.findAll('dt')).toHaveLength(4)
    }
  )

  it('列出弱化格局的成立、破格證據及兩處規則來源', async () => {
    vi.stubEnv('VITE_ZIWEI_PATTERNS', 'true')
    const wrapper = mount(ZiWeiReadingPanel, { props: { ...birth, date } })
    await flushPromises()
    expect(wrapper.get('summary').text()).toContain('府相朝垣見破格因素')
    expect(wrapper.text()).toContain('天府與天相分坐財帛、官祿宮')
    expect(wrapper.text()).toContain('火星（命宮・寅・廟）')
    expect(wrapper.findAll('a').map(link => link.attributes('href'))).toEqual([
      expect.stringContaining('patterns-dinggui.ts'),
      expect.stringContaining('patterns.ts#L181-L187'),
    ])
  })

  it('更換出生資料時忽略較早的格局結果', async () => {
    vi.stubEnv('VITE_ZIWEI_PATTERNS', 'true')
    let resolvePrevious: (results: ZiWeiPatternResult[]) => void = () => undefined
    const previous = new Promise<ZiWeiPatternResult[]>(resolve => {
      resolvePrevious = resolve
    })
    vi.spyOn(patterns, 'loadZiWeiPatterns').mockReturnValueOnce(previous)
    const wrapper = mount(ZiWeiReadingPanel, { props: { ...birth, date } })
    await wrapper.setProps({ birthDate: '1950-07-26', birthTime: '00:00' })
    await flushPromises()
    expect(wrapper.get('summary').text()).toContain('武貪格')
    resolvePrevious(evaluateZiWeiPatterns(natalSnapshot(birth)))
    await flushPromises()
    expect(wrapper.get('summary').text()).toContain('武貪格')
    expect(wrapper.text()).not.toContain('府相朝垣')
  })

  it.each(['', '25:00', '12:00無效'])('無效出生時間 %j 提示未計算', birthTime => {
    const wrapper = mount(ZiWeiReadingPanel, { props: { ...birth, birthTime, date } })
    expect(wrapper.get('[role="status"]').text()).toContain('出生時間')
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('格局載入失敗不影響四化', async () => {
    vi.spyOn(patterns, 'loadZiWeiPatterns').mockRejectedValueOnce(new Error('測試格局載入失敗'))
    const wrapper = mount(ZiWeiReadingPanel, { props: { ...birth, date } })
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('目前無法計算本命格局')
    expect(wrapper.findAll('dt')).toHaveLength(4)
  })
})
