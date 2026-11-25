import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PriceChart from '@/components/charts/PriceChart.vue'
import VolumeChart from '@/components/charts/VolumeChart.vue'
import EngineScoresChart from '@/components/charts/EngineScoresChart.vue'
import type { ETFData } from '@/types'
import { Bar, Line } from 'vue-chartjs'

vi.mock('vue-chartjs', async () => {
  const { defineComponent, h } = await import('vue')
  const Chart = defineComponent({
    props: {
      ariaLabel: { type: String, required: true },
      ariaDescribedby: { type: String, required: true },
      data: { type: Object, required: true },
      options: { type: Object, required: true },
    },
    setup: props => () =>
      h('canvas', {
        role: 'img',
        'aria-label': props.ariaLabel,
        'aria-describedby': props.ariaDescribedby,
      }),
  })
  return { Line: Chart, Bar: Chart }
})

const quote = (date: string, close: number, volume: number): ETFData => ({
  date,
  close,
  volume,
  open: close,
  high: close,
  low: close,
  change: 0,
  changePercent: 0,
})

describe('圖表的文字資料', () => {
  it.each([
    {
      component: PriceChart,
      canvas: Line,
      label: '0050 收盤價',
      values: ['47.25', '53.70'],
      plotted: [47.25, 53.7],
      latestValue: '55.50',
      latestPlotted: 55.5,
    },
    {
      component: VolumeChart,
      canvas: Bar,
      label: '0050 成交量',
      values: ['0', '1,234,567'],
      plotted: [0, 1.234567],
      latestValue: '2,000,001',
      latestPlotted: 2.000001,
    },
  ])('$label 的圖表、敘述和表格一起更新', async testCase => {
    const { component, canvas, label, values, plotted, latestValue, latestPlotted } = testCase
    const older = quote('2025-06-20', 47.25, 0)
    const newer = quote('2026-06-20', 53.7, 1_234_567)
    const wrapper = mount(component, { props: { etfData: [newer, older], period: '3年' } })
    const image = wrapper.get('canvas')
    expect(image.attributes('aria-label')).toBe(`${label}走勢圖（3年）`)
    const summary = wrapper.get(`[id="${image.attributes('aria-describedby')}"]`)
    expect(summary.text()).toContain(`2026-06-20`)
    expect(summary.text()).toContain(values[1])
    expect(wrapper.getComponent(canvas).props('data')).toMatchObject({
      labels: ['2025-06-20', '2026-06-20'],
      datasets: [{ data: plotted }],
    })
    expect(wrapper.find('table').exists()).toBe(false)

    const disclosure = wrapper.get('details')
    disclosure.element.setAttribute('open', '')
    await disclosure.trigger('toggle')
    expect(wrapper.get('caption').text()).toBe(`${label}（3年）資料`)
    expect(wrapper.findAll('th[scope="row"]').map(row => row.text())).toEqual([
      '2025-06-20',
      '2026-06-20',
    ])
    expect(wrapper.findAll('td').map(cell => cell.text())).toEqual(values)

    await wrapper.setProps({ etfData: [quote('2026-06-22', 55.5, 2_000_001)], period: '1個月' })
    expect(image.attributes('aria-label')).toBe(`${label}走勢圖（1個月）`)
    expect(summary.text()).toContain(latestValue)
    expect(wrapper.get('caption').text()).toBe(`${label}（1個月）資料`)
    expect(wrapper.get('th[scope="row"]').text()).toBe('2026-06-22')
    expect(wrapper.get('td').text()).toBe(latestValue)
    expect(wrapper.getComponent(canvas).props('data')).toMatchObject({
      labels: ['2026-06-22'],
      datasets: [{ data: [latestPlotted] }],
    })

    await wrapper.setProps({ etfData: [] })
    expect(wrapper.find('canvas').exists()).toBe(false)
    expect(wrapper.find('details').exists()).toBe(false)
  })

  it('引擎分數提供同分名單和更新後的各引擎權重', async () => {
    const wrapper = mount(EngineScoresChart, {
      props: {
        results: [
          { engineId: 'a', engineName: '八字', score: 80 },
          { engineId: 'b', engineName: '紫微', score: 80 },
        ],
        weights: { a: 65 },
      },
    })
    const image = wrapper.get('canvas')
    expect(image.attributes('aria-label')).toBe('命理引擎分數圖')
    expect(wrapper.get(`[id="${image.attributes('aria-describedby')}"]`).text()).toContain(
      '八字、紫微'
    )
    const disclosure = wrapper.get('details')
    disclosure.element.setAttribute('open', '')
    await disclosure.trigger('toggle')
    expect(wrapper.get('caption').text()).toBe('命理引擎分數資料')
    expect(wrapper.findAll('td').map(cell => cell.text())).toEqual(['80', '65%', '80', '0%'])

    await wrapper.setProps({ weights: { a: 60, b: 40 } })
    expect(wrapper.findAll('td').map(cell => cell.text())).toEqual(['80', '60%', '80', '40%'])
  })
})
