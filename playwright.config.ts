import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://127.0.0.1:4175'

const marketApiURL = 'http://127.0.0.1:4176/api/v4'

export default defineConfig({
  metadata: { marketApiURL },
  testDir: 'e2e',
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 4175 --strictPort --no-open',
    env: { VITE_FINMIND_API_URL: marketApiURL },
    url: baseURL,
  },
})
