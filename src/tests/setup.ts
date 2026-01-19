import { vi } from 'vitest'

// Mock環境變數
vi.stubEnv('VITE_FINMIND_API_URL', 'https://api.finmindtrade.com/api/v4')
vi.stubEnv('VITE_FINMIND_API_TOKEN', 'test-token')

// 設定全域時區
process.env.TZ = 'Asia/Taipei'
