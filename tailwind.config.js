/**
 * 設計 tokens：顏色全部指向 style.css 的 CSS 變數（RGB 通道），
 * 讓同一組 class 在深淺兩種主題下自動切換，並支援 `/alpha` 透明度寫法。
 */
const channel = name => `rgb(var(--c-${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 紙與墨：介面主體
        paper: channel('paper'),
        surface: channel('surface'),
        raised: channel('raised'),
        ink: {
          DEFAULT: channel('ink'),
          2: channel('ink-2'),
          3: channel('ink-3'),
        },
        line: {
          DEFAULT: 'rgb(var(--c-ink) / 0.09)',
          strong: 'rgb(var(--c-ink) / 0.18)',
        },
        // 農民曆紅黃：只用在亮點
        seal: {
          DEFAULT: channel('seal'),
          deep: channel('seal-deep'),
          ink: channel('seal-ink'),
          on: channel('on-seal'),
        },
        gold: channel('gold'),
        // 語意色：台股慣例漲紅跌綠，吉凶沿用同一組
        rise: channel('rise'),
        fall: channel('fall'),
        good: channel('rise'),
        bad: channel('fall'),
        warn: channel('warn'),
        danger: channel('danger'),
        // 五行
        el: {
          wood: channel('el-wood'),
          fire: channel('el-fire'),
          earth: channel('el-earth'),
          metal: channel('el-metal'),
          water: channel('el-water'),
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans TC"',
          '"PingFang TC"',
          '"Microsoft JhengHei"',
          'system-ui',
          'sans-serif',
        ],
        serif: ['"Noto Serif TC"', '"Songti TC"', 'serif'],
        kai: ['"LXGW WenKai TC"', '"Kaiti TC"', 'BiauKai', '"Noto Serif TC"', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
      },
    },
  },
  plugins: [],
}
