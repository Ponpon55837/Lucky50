import { createServer } from 'node:http'
import { once } from 'node:events'
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const today = new Date('2026-03-14T04:00:00Z')
const marketBars = [
  { date: '2026-01-22', close: 53.1, Trading_Volume: 1_810_001 },
  { date: '2026-03-12', close: 56.25, Trading_Volume: 2_320_002 },
  { date: '2026-03-13', close: 57.2, Trading_Volume: 3_150_003 },
].map(({ date, close, Trading_Volume }) => ({
  date,
  close,
  open: close,
  max: close + 1,
  min: close - 1,
  spread: 0,
  stock_id: '0050',
  Trading_Volume,
}))
const companyActions = {
  TaiwanStockSplitPrice: [
    { date: '2025-06-18', before_price: 188.65, after_price: 47.16, stock_id: '0050' },
  ],
  TaiwanStockDividendResult: [
    { date: '2025-08-08', before_price: 50.26, reference_price: 49.9, stock_id: '0050' },
  ],
}

// 使用獨立的 HTTP origin，讓 Chromium 實際執行 CORS。FinMind 的 OPTIONS 回應為 400。
let marketAvailable = true
let preflights = 0
const market = createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    preflights++
    response.writeHead(400).end()
    return
  }
  response.setHeader('Access-Control-Allow-Origin', '*')
  const url = new URL(request.url ?? '/', 'http://localhost')
  if (request.method !== 'GET' || url.pathname !== '/api/v4/data') {
    response.writeHead(404).end()
    return
  }
  if (!marketAvailable) {
    response.writeHead(503).end()
    return
  }

  const dataset = url.searchParams.get('dataset')
  const start = url.searchParams.get('start_date') ?? ''
  const end = url.searchParams.get('end_date') ?? '2026-03-14'
  let data
  if (dataset === 'TaiwanStockPrice') {
    data = marketBars.filter(({ date }) => date >= start && date <= end)
  } else if (dataset === 'TaiwanStockSplitPrice' || dataset === 'TaiwanStockDividendResult') {
    data = companyActions[dataset]
  } else {
    response.writeHead(400).end()
    return
  }
  response
    .writeHead(200, { 'Content-Type': 'application/json' })
    .end(JSON.stringify({ status: 200, data }))
})

test.beforeAll(async () => {
  const api = new URL(test.info().config.metadata.marketApiURL)
  market.listen(Number(api.port), api.hostname)
  await once(market, 'listening')
})
test.afterAll(async () => {
  if (market.listening)
    await new Promise<void>((resolve, reject) =>
      market.close(error => (error ? reject(error) : resolve()))
    )
})
test.beforeEach(async ({ page }) => {
  marketAvailable = true
  preflights = 0
  await page.clock.setFixedTime(today)
})
test.afterEach(() => {
  expect(preflights, 'FinMind 行情與公司行動應直接使用 GET').toBe(0)
})

test('分析圖表在深色和淺色模式中提供具名圖表與鍵盤可查的正確資料', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lucky50-theme', 'dark')
    localStorage.setItem(
      'lucky50-user',
      JSON.stringify({
        profile: {
          surname: '林',
          givenName: '小明',
          name: '林小明',
          birthDate: '1990-01-15',
          birthTime: '12:00',
          zodiac: '',
          element: '',
          nameElement: '',
          nameStrokes: 0,
          luckyColors: [],
          luckyNumbers: [],
        },
      })
    )
  })
  await page.goto('/analytics', { waitUntil: 'domcontentloaded' })

  const priceImage = page.getByRole('img', { name: '0050 收盤價走勢圖（1個月）' })
  const volumeImage = page.getByRole('img', { name: '0050 成交量走勢圖（1個月）' })
  const engineImage = page.getByRole('img', { name: '命理引擎分數圖' })
  await expect(priceImage).toHaveAccessibleDescription(/2026-03-13.*57\.20 元/)
  await expect(volumeImage).toHaveAccessibleDescription(/2026-03-13.*3,150,003 股/)
  await expect(engineImage).toHaveAccessibleDescription(/最高分為 \d+ 分/)

  const periods = page.getByRole('group', { name: '分析時間區間' })
  const oneMonth = periods.getByRole('button', { name: '1個月', exact: true })
  const threeMonths = periods.getByRole('button', { name: '3個月', exact: true })
  await expect(oneMonth).toHaveAttribute('aria-pressed', 'true')
  await expect(threeMonths).toBeEnabled()
  await oneMonth.focus()
  await page.keyboard.press('Tab')
  await expect(threeMonths).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(threeMonths).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('img', { name: '0050 收盤價走勢圖（3個月）' })
  ).toHaveAccessibleDescription(/2026-01-22.*53\.10 元.*2026-03-13.*57\.20 元/)
  await expect(priceImage).toHaveCount(0)

  const priceControl = page.locator('summary').filter({ hasText: '0050 收盤價（3個月）' })
  const priceTable = page.getByRole('table', { name: '0050 收盤價（3個月）資料' })
  await expect(priceTable).toHaveCount(0)
  await priceControl.focus()
  await page.keyboard.press('Enter')
  await expect(priceControl).toBeFocused()
  await expect(priceControl).toHaveCSS('outline-style', 'solid')
  await expect(priceTable.getByRole('row', { name: /2026-01-22/ })).toContainText('53.10')
  await expect(priceTable.getByRole('columnheader', { name: '收盤價（新台幣元）' })).toBeVisible()

  const volumeControl = page.locator('summary').filter({ hasText: '0050 成交量（3個月）' })
  await page.keyboard.press('Tab')
  await expect(volumeControl).toBeFocused()
  await page.keyboard.press('Space')
  const volumeTable = page.getByRole('table', { name: '0050 成交量（3個月）資料' })
  await expect(volumeTable.getByRole('row', { name: /2026-03-13/ })).toContainText('3,150,003')

  const engineControl = page.locator('summary').filter({ hasText: '命理引擎分數' })
  await engineControl.focus()
  await page.keyboard.press('Enter')
  const engineTable = page.getByRole('table', { name: '命理引擎分數資料' })
  await expect(engineTable.getByRole('columnheader', { name: '權重' })).toBeVisible()
  await expect(engineTable.getByRole('rowheader')).toHaveCount(4)

  const audit = () =>
    new AxeBuilder({ page })
      .include('canvas[aria-describedby]')
      .include('.chart-data-summary')
      .include('.chart-data-disclosure')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

  await expect(page.locator('html')).toHaveClass('dark')
  expect((await audit()).violations).toEqual([])
  await page.getByRole('button', { name: '切換至淺色模式' }).click()
  await expect(page.locator('html')).toHaveClass('light')
  expect((await audit()).violations).toEqual([])
})

test('手機版的空態可以重試，離線時保留已驗證的快取成交量', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  marketAvailable = false
  await page.goto('/analytics', { waitUntil: 'domcontentloaded' })

  await expect(page.getByText('缺少所選期間的真實行情，無法計算策略績效。')).toBeVisible()
  await expect(page.getByRole('img', { name: /0050 收盤價走勢圖/ })).toHaveCount(0)
  await expect(page.getByRole('img', { name: /0050 成交量走勢圖/ })).toHaveCount(0)
  await expect(page.locator('.chart-data-disclosure')).toHaveCount(0)

  marketAvailable = true
  await page.getByRole('button', { name: '重新取得行情' }).click()
  await expect(page.getByRole('img', { name: '0050 收盤價走勢圖（1個月）' })).toBeVisible()
  await expect(page.getByRole('img', { name: '0050 成交量走勢圖（1個月）' })).toBeVisible()
  const current = page.getByRole('status').filter({ hasText: /^1個月 · FinMind 行情/ })
  await expect(current).toContainText(/2026-03-12 至 2026-03-13.*擷取於.*12:00/)

  await page.clock.setFixedTime(new Date('2026-03-14T05:00:00Z'))
  await context.setOffline(true)
  const cached = page.getByRole('status').filter({ hasText: /^1個月 · FinMind 快取行情/ })
  await expect(cached).toContainText(/2026-03-12 至 2026-03-13.*擷取於.*12:00/)

  const volumeControl = page.locator('summary').filter({ hasText: '0050 成交量（1個月）' })
  await volumeControl.click()
  const volumeTable = page.getByRole('table', { name: '0050 成交量（1個月）資料' })
  await expect(volumeTable.getByRole('row', { name: /2026-03-13/ })).toContainText('3,150,003')
  await expect(volumeTable.getByRole('rowheader')).toHaveCount(2)

  await context.setOffline(false)
  await expect(current).toContainText(/擷取於.*13:00/)
})
