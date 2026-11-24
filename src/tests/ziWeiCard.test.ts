import { afterEach, describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ZiWeiCard from '@/components/ZiWeiCard.vue'
import type { UserProfileCompat } from '@/services/integratedFortune'

describe('ZiWeiCard', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.doUnmock('@/components/ZiWeiReadingPanel.vue')
  })

  async function expandReading(wrapper: ReturnType<typeof mount<typeof ZiWeiCard>>) {
    const disclosure = wrapper.get('details')
    const element = disclosure.element as HTMLDetailsElement
    element.open = true
    await disclosure.trigger('toggle')
    await vi.dynamicImportSettled()
    await flushPromises()
  }

  const mockProfile: UserProfileCompat = {
    name: '測試',
    birthDate: '1990-05-15',
    birthTime: '10:30',
    zodiac: '馬',
    element: '火',
    nameElement: '火',
    nameStrokes: 20,
    luckyColors: ['紅色'],
    luckyNumbers: [2, 7],
  }

  it('should render title', () => {
    const wrapper = mount(ZiWeiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    expect(wrapper.text()).toContain('紫微斗數分析')
  })

  it('should show empty state when no profile', async () => {
    const wrapper = mount(ZiWeiCard, {
      props: { profile: null, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('請先設定出生資料')
  })

  it('should calculate and display results', async () => {
    const wrapper = mount(ZiWeiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('今日能量')
    expect(wrapper.text()).toMatch(/命宮主星|命無正曜/)
  })

  it('should display three palaces', async () => {
    const wrapper = mount(ZiWeiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('命宮')
    expect(wrapper.text()).toContain('財帛宮')
    expect(wrapper.text()).toContain('官祿宮')
    expect(wrapper.text()).toContain('遷移宮')
  })

  it('顯示星曜亮度與說明', async () => {
    const wrapper = mount(ZiWeiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toMatch(/（[廟旺得利平不陷]）/)
    expect(wrapper.text()).toContain('括號內為星曜亮度')
  })

  it('should display risk assessment', async () => {
    const wrapper = mount(ZiWeiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('風險傾向')
  })

  it('旗標關閉時隱藏格局與四化', () => {
    vi.stubEnv('VITE_ZIWEI_PATTERNS', undefined)
    const wrapper = mount(ZiWeiCard, {
      props: { profile: mockProfile, date: new Date(2024, 1, 10) },
    })
    expect(wrapper.find('summary').exists()).toBe(false)
    expect(wrapper.text()).toContain('今日能量')
  })

  it('旗標開啟且有生日但缺少時間時，卡片提示原因', () => {
    vi.stubEnv('VITE_ZIWEI_PATTERNS', 'true')
    const wrapper = mount(ZiWeiCard, {
      props: { profile: null, missingBirthTime: true, date: new Date(2024, 1, 10) },
    })
    expect(wrapper.text()).toContain('請填寫有效的出生時間，格局與四化目前未計算。')
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('旗標開啟後，展開才顯示四化選擇', async () => {
    vi.stubEnv('VITE_ZIWEI_PATTERNS', 'true')
    const wrapper = mount(ZiWeiCard, {
      props: { profile: mockProfile, date: new Date(2024, 1, 10) },
    })
    expect(wrapper.get('summary').text()).toBe('格局與四化')
    expect(wrapper.find('select').exists()).toBe(false)

    await expandReading(wrapper)
    expect(wrapper.get('select').element.value).toBe('natal')
    expect(wrapper.text()).toContain('傳統命理解讀')
  })

  it('載入失敗時仍可看原卡片並重試', async () => {
    vi.stubEnv('VITE_ZIWEI_PATTERNS', 'true')
    vi.doMock('@/components/ZiWeiReadingPanel.vue', () => {
      throw new Error('測試載入失敗')
    })
    const wrapper = mount(ZiWeiCard, {
      props: { profile: mockProfile, date: new Date(2024, 1, 10) },
    })
    await expandReading(wrapper)
    expect(wrapper.text()).toContain('暫時無法載入紫微解讀')
    expect(wrapper.text()).toContain('今日能量')

    vi.doUnmock('@/components/ZiWeiReadingPanel.vue')
    await wrapper.get('button').trigger('click')
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(wrapper.get('select').element.value).toBe('natal')
  })
})
