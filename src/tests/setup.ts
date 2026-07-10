import { vi } from 'vitest'

// Mock localStorage (happy-dom 在 import 階段尚未提供)
const storageMap = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => storageMap.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storageMap.set(key, value)),
    removeItem: vi.fn((key: string) => storageMap.delete(key)),
    clear: vi.fn(() => storageMap.clear()),
    get length() {
      return storageMap.size
    },
    key: vi.fn((index: number) => [...storageMap.keys()][index] ?? null),
  },
  writable: true,
  configurable: true,
})

// Mock環境變數
vi.stubEnv('VITE_FINMIND_API_URL', 'https://api.finmindtrade.com/api/v4')
vi.stubEnv('VITE_FINMIND_API_TOKEN', 'test-token')

// 設定全域時區
process.env.TZ = 'Asia/Taipei'
