<script setup lang="ts">
import { ref, onUnmounted, watch, computed, nextTick } from 'vue'
import * as THREE from 'three'
import { ChartBarIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import {
  ThreeJSScene,
  createSceneMaterial,
  tokenColor,
  tokenHex,
  disposeObject3D,
  type SceneToken,
} from '@/utils/three-scene'
import { useVisibleOnce } from '@/composables/useVisibleOnce'
import { useTheme } from '@/composables/useTheme'
import { useDashboardStore } from '@/stores/dashboard'

interface Props {
  title?: string
}

// 配置常量
const ANIMATION_CONFIG = {
  moon: {
    radius: 1.2,
    breathScale: 0.15,
    breathSpeed: 0.8,
    rotationSpeed: { x: 0.003, y: 0.005, z: 0.002 },
  },
  solarTerms: {
    layers: 3,
    baseRadius: 2.2,
    layerSpacing: 0.5,
    baseThickness: 0.08,
    thicknessIncrement: 0.02,
  },
  celestial: {
    branches: { count: 12, radius: 5.5 },
    stems: { count: 10, radius: 3.5 },
  },
  stars: {
    count: 800,
    minRadius: 12,
    maxRadius: 37,
    // PointsMaterial 只支援統一大小
    size: 0.15,
  },
  bars: {
    suitable: { baseRadius: 4.0, maxCount: 6 },
    avoid: { baseRadius: 4.0, maxCount: 6 },
  },
} as const

type FortuneLevel = '大吉' | '吉' | '平' | '忌'

const { title = '農民曆 3D 展示' } = defineProps<Props>()

const { isDark } = useTheme()
const dashboardStore = useDashboardStore()

// 動畫管理
const threeContainer = ref<HTMLElement>()
let scene: ThreeJSScene | null = null
let lunarGroup: THREE.Group | null = null

// 互動狀態管理
const hoveredElement = ref<string | null>(null)
const mousePosition = ref({ x: 0, y: 0 })
const showLegend = ref(false)

// 元素說明數據
type ElementType =
  | 'moon'
  | 'solarTermRings'
  | 'suitableBars'
  | 'avoidBars'
  | 'celestialWheel'
  | 'fortuneIndicator'
  | 'starField'
const elementDescriptions: Record<ElementType, string> = {
  moon: '月亮：農曆的核心，大小和光芒表示當日月相能量',
  solarTermRings: '節氣環：二十四節氣的能量環，不同層級代表時節影響',
  suitableBars: '宜事柱：紅色柱子代表當日適宜做的事情',
  avoidBars: '忌事柱：綠色柱子代表當日需要避免的事情',
  celestialWheel: '天干地支：外圈地支和內圈天干，表示時空能量',
  fortuneIndicator: '運勢指示器：中心柱子代表綜合投資運勢分數',
  starField: '星空背景：閃爍的星星製造宇宙氛圍',
}

// ── 計算屬性 ──
// 從 store 獲取數據 - 優化計算屬性
const lunarData = computed(() => dashboardStore.lunarData)

const lunarDate = computed(() => {
  const data = lunarData.value
  if (!data) return '乙巳年八月初五'

  const { lunarYear = '', lunarMonth = '', lunarDay = '' } = data
  return lunarYear && lunarMonth && lunarDay
    ? `${lunarYear}年${lunarMonth}月${lunarDay}`
    : '乙巳年八月初五'
})

const solarTerm = computed(() => lunarData.value?.jieQi || '秋分')

const suitable = computed(() => lunarData.value?.yi || ['開市', '投資', '求財', '交易'])

const avoid = computed(() => lunarData.value?.ji || ['出行', '搬遷', '動土', '結婚'])

// 運勢相關計算 - 提取為獨立邏輯
const fortuneScore = computed(() => dashboardStore.unifiedInvestmentScore || 50)

const fortuneLevel = computed((): FortuneLevel => {
  const score = fortuneScore.value
  if (score >= 80) return '大吉'
  if (score >= 65) return '吉'
  if (score >= 35) return '平'
  return '忌'
})

const fortuneColor = computed(() => {
  const score = fortuneScore.value
  if (score >= 80) return 'text-good'
  if (score >= 65) return 'text-good'
  if (score >= 35) return 'text-warn'
  return 'text-bad'
})

const fortuneThemeColor = computed((): SceneToken => {
  const score = fortuneScore.value
  if (score >= 65) return 'rise'
  if (score >= 35) return 'ink-3'
  return 'fall'
})

// ── 方法與函式 ──
// 每次重建可視化內容時遞增世代編號，讓上一輪註冊的動畫迴圈在下一幀自動停止，
// 避免舊物件的 requestAnimationFrame 迴圈永久殘留（過去卡頓會隨使用時間變嚴重的主因）
let animationGeneration = 0

const cleanupAnimations = () => {
  animationGeneration++
}

// 註冊一個每幀執行的更新函式；回傳 false 可提前結束該迴圈（例如一次性動畫完成後）
const registerAnimation = (update: () => boolean | void) => {
  const generation = animationGeneration
  const loop = () => {
    if (generation !== animationGeneration) return
    if (update() === false) return
    requestAnimationFrame(loop)
  }
  loop()
}

// 創建月亮組件
const createMoon = (): THREE.Mesh => {
  const { radius, breathScale, breathSpeed, rotationSpeed } = ANIMATION_CONFIG.moon

  const geometry = new THREE.IcosahedronGeometry(radius, 3)
  // 月亮是場景唯一的朱印紅重點
  const material = createSceneMaterial(tokenHex('seal'), 0.95)
  const moon = new THREE.Mesh(geometry, material)
  moon.position.set(0, 1.5, 0)

  // 統一的月亮動畫
  registerAnimation(() => {
    const time = Date.now() * 0.001
    const scale = 1 + Math.sin(time * breathSpeed) * breathScale
    moon.scale.setScalar(scale)
    moon.rotation.x += rotationSpeed.x
    moon.rotation.y += rotationSpeed.y
    moon.rotation.z += rotationSpeed.z
  })

  return moon
}

// 創建節氣環系統
const createSolarTermRings = (): THREE.Mesh[] => {
  const rings: THREE.Mesh[] = []
  const { layers, baseRadius, layerSpacing, baseThickness, thicknessIncrement } =
    ANIMATION_CONFIG.solarTerms

  for (let layer = 0; layer < layers; layer++) {
    const radius = baseRadius + layer * layerSpacing
    const thickness = baseThickness + layer * thicknessIncrement

    const geometry = new THREE.TorusGeometry(radius, thickness, 12, 80)
    const tone: SceneToken = layer === 0 ? 'ink-2' : layer === 1 ? 'ink-3' : 'line'
    const material = createSceneMaterial(tokenHex(tone), 0.8 - layer * 0.1)

    const ring = new THREE.Mesh(geometry, material)
    ring.position.set(0, 0, 0)
    ring.rotation.x = Math.PI / 2 + (layer * Math.PI) / 12
    ring.rotation.z = (layer * Math.PI) / 6

    // 環形動畫
    registerAnimation(() => {
      ring.rotation.z += (0.005 + layer * 0.003) * (layer % 2 === 0 ? 1 : -1)
      ring.rotation.y += 0.002 * (layer + 1)
    })
    rings.push(ring)
  }

  return rings
}

// 創建指示柱（通用函數）
const createIndicatorBars = (
  items: string[],
  config: { baseRadius: number; maxCount: number },
  tone: 'rise' | 'fall',
  startAngle: number,
  yOffset: number,
  isUpward: boolean = true
): THREE.Mesh[] => {
  if (!items?.length) return []

  const bars: THREE.Mesh[] = []
  const count = Math.min(items.length, config.maxCount)

  for (let i = 0; i < count; i++) {
    const height = isUpward ? 1.2 + Math.random() * 0.8 : 1.0 + Math.random() * 0.6
    const geometry = isUpward
      ? new THREE.CylinderGeometry(0.12, 0.18, height, 8)
      : new THREE.CylinderGeometry(0.18, 0.12, height, 8)

    const material = createSceneMaterial(tokenHex(tone), 0.9)
    const bar = new THREE.Mesh(geometry, material)

    const angle = (i / count) * Math.PI + startAngle
    bar.position.set(
      Math.cos(angle) * config.baseRadius,
      yOffset + (isUpward ? height / 2 - 0.5 : -height / 2 + 0.5),
      Math.sin(angle) * config.baseRadius
    )

    // 動態出現動畫
    bar.scale.y = 0
    const delay = isUpward ? i * 200 : i * 250 + 1000

    setTimeout(() => {
      registerAnimation(() => {
        bar.scale.y += (1 - bar.scale.y) * 0.06
        if (Math.abs(1 - bar.scale.y) <= 0.01) {
          // 輕微搖擺
          registerAnimation(() => {
            const time = Date.now() * 0.002 + i + (isUpward ? 0 : Math.PI)
            bar.rotation.z = Math.sin(time) * 0.08
            bar.rotation.x = Math.cos(time * 0.7) * 0.05
          })
          return false
        }
      })
    }, delay)

    bars.push(bar)
  }

  return bars
}

// 創建運勢指示器
const createFortuneIndicator = (): THREE.Mesh => {
  const height = 2.5
  const geometry = new THREE.CylinderGeometry(0.4, 0.6, height, 12)
  const score = fortuneScore.value
  const isExcellent = score >= 80
  const material = createSceneMaterial(tokenHex(fortuneThemeColor.value), isExcellent ? 0.95 : 0.8)

  const indicator = new THREE.Mesh(geometry, material)
  indicator.position.set(0, -1.5, 2.0)

  // 脈動動畫
  registerAnimation(() => {
    const time = Date.now() * 0.003
    const intensity = isExcellent ? 1.2 : score >= 65 ? 1.0 : score >= 35 ? 0.8 : 0.6
    const scale = 1 + Math.sin(time) * 0.1 * intensity
    indicator.scale.setScalar(scale)
    indicator.rotation.y += 0.01 * intensity
  })

  return indicator
}

// 創建天干地支星座
const createCelestialWheel = (): THREE.Mesh[] => {
  const celestialObjects: THREE.Mesh[] = []
  const { branches, stems } = ANIMATION_CONFIG.celestial

  // 地支外環 (12個) - 子丑寅卯辰巳午未申酉戌亥
  for (let i = 0; i < branches.count; i++) {
    const angle = (i / branches.count) * Math.PI * 2

    const geometry = new THREE.OctahedronGeometry(0.2, 0)
    const tone: SceneToken = i % 2 === 0 ? 'ink-2' : 'ink-3'
    const material = createSceneMaterial(tokenHex(tone), 0.8)
    const branch = new THREE.Mesh(geometry, material)

    branch.position.set(
      Math.cos(angle) * branches.radius,
      Math.sin(i * 0.3) * 0.8,
      Math.sin(angle) * branches.radius
    )

    // 地支動畫
    registerAnimation(() => {
      const time = Date.now() * 0.001 + i * 0.5
      branch.rotation.x += 0.008 + i * 0.001
      branch.rotation.y += 0.012 + i * 0.002
      branch.position.y = Math.sin(time * 0.8) * 0.5 + Math.sin(i * 0.3) * 0.8

      // 順時針軌道運動
      const orbitTime = Date.now() * 0.0003 + (i * Math.PI * 2) / branches.count
      branch.position.x = Math.cos(orbitTime) * branches.radius
      branch.position.z = Math.sin(orbitTime) * branches.radius
    })
    celestialObjects.push(branch)
  }

  // 天干內環 (10個) - 甲乙丙丁戊己庚辛壬癸
  for (let i = 0; i < stems.count; i++) {
    const angle = (i / stems.count) * Math.PI * 2

    const geometry = new THREE.TetrahedronGeometry(0.25, 1)
    const material = createSceneMaterial(tokenHex('ink-3'), 0.7)
    const stem = new THREE.Mesh(geometry, material)

    stem.position.set(
      Math.cos(angle) * stems.radius,
      Math.cos(i * 0.4) * 1.2 + 0.8,
      Math.sin(angle) * stems.radius
    )

    // 天干反向旋轉
    registerAnimation(() => {
      const time = Date.now() * 0.001 + i * 0.6
      stem.rotation.x += 0.015 - i * 0.001
      stem.rotation.y -= 0.018 + i * 0.002
      stem.rotation.z += 0.01

      // 上下波動
      stem.position.y = Math.cos(time * 1.2) * 0.6 + Math.cos(i * 0.4) * 1.2 + 0.8

      // 逆時針軌道運動
      const orbitTime = -Date.now() * 0.0005 + (i * Math.PI * 2) / stems.count
      stem.position.x = Math.cos(orbitTime) * stems.radius
      stem.position.z = Math.sin(orbitTime) * stems.radius
    })
    celestialObjects.push(stem)
  }

  return celestialObjects
}

// 創建增強星空背景
const createEnhancedStarField = (): THREE.Points => {
  const { count, minRadius, maxRadius, size } = ANIMATION_CONFIG.stars

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  // 星點只用墨色階，不做彩色
  const starColors = [tokenColor('ink-3'), tokenColor('ink-2'), tokenColor('line')]

  for (let i = 0; i < count; i++) {
    const i3 = i * 3

    // 球形星空分布
    const radius = minRadius + Math.random() * (maxRadius - minRadius)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.cos(phi)
    positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta)

    // 隨機星星顏色
    const starColor = starColors[Math.floor(Math.random() * starColors.length)]
    colors[i3] = starColor.r
    colors[i3 + 1] = starColor.g
    colors[i3 + 2] = starColor.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  })

  const starField = new THREE.Points(geometry, material)
  const baseColors = colors.slice()

  // 星空旋轉和閃爍動畫
  registerAnimation(() => {
    starField.rotation.y += 0.0003
    starField.rotation.x += 0.0001
    starField.rotation.z += 0.0002

    // 星星閃爍：每幀由原始顏色計算，避免原地相乘讓星星越來越暗
    const colorAttr = starField.geometry.attributes.color.array as Float32Array
    const time = Date.now() * 0.001

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const twinkle = ((Math.sin(time * 2 + i * 0.1) + 1) / 2) * 0.4 + 0.6
      colorAttr[i3] = baseColors[i3] * twinkle
      colorAttr[i3 + 1] = baseColors[i3 + 1] * twinkle
      colorAttr[i3 + 2] = baseColors[i3 + 2] * twinkle
    }

    starField.geometry.attributes.color.needsUpdate = true
  })

  return starField
}

// 主要的創建函數 - 重構後更清晰
const createLunarVisualization = () => {
  if (!scene || !lunarGroup) return

  // 清空現有內容前先釋放 GPU 資源，避免每次重建都累積記憶體
  disposeObject3D(lunarGroup)
  lunarGroup.clear()
  cleanupAnimations()

  // 創建各個組件
  const moon = createMoon()
  const solarTermRings = createSolarTermRings()
  const suitableBars = createIndicatorBars(
    suitable.value,
    ANIMATION_CONFIG.bars.suitable,
    'rise',
    Math.PI / 4,
    0,
    true
  )
  const avoidBars = createIndicatorBars(
    avoid.value,
    ANIMATION_CONFIG.bars.avoid,
    'fall',
    (Math.PI * 5) / 4,
    0,
    false
  )
  const fortuneIndicator = createFortuneIndicator()
  const celestialObjects = createCelestialWheel()
  const starField = createEnhancedStarField()

  // 添加所有對象到場景
  lunarGroup.add(
    moon,
    ...solarTermRings,
    ...suitableBars,
    ...avoidBars,
    fortuneIndicator,
    ...celestialObjects,
    starField
  )
}

// 初始化場景
const initScene = () => {
  if (!threeContainer.value || scene) return

  scene = new ThreeJSScene(threeContainer.value, {
    alpha: true,
    antialias: true,
    isDark: isDark.value,
  })

  // 創建農民曆組
  lunarGroup = new THREE.Group()
  scene.addToScene(lunarGroup)

  // 創建農民曆可視化
  createLunarVisualization()

  // 設置相機位置
  scene.getCamera().position.set(0, 3, 6)
  scene.getCamera().lookAt(0, 0, 0)
}

// 清理資源
const cleanup = () => {
  cleanupAnimations()
  scene?.destroy()
  scene = null
  lunarGroup = null
}

const handleMouseMove = (event: MouseEvent) => {
  const rect = threeContainer.value?.getBoundingClientRect()
  if (!rect) return

  mousePosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

const handleElementHover = (elementType: ElementType) => {
  hoveredElement.value = elementType
}

const handleElementLeave = () => {
  hoveredElement.value = null
}

// ── 監聽器 ──
watch(isDark, newTheme => {
  if (!scene) return

  scene.updateTheme(newTheme)
  nextTick(() => {
    createLunarVisualization()
  })
})

// suitable/avoid 是 computed，資料變動時會回傳全新陣列參照，不需要 deep 追蹤
watch([lunarDate, solarTerm, suitable, avoid, fortuneScore], () => {
  nextTick(() => {
    createLunarVisualization()
  })
})

// ── 生命週期 ──
// 只在元件捲動進入可視範圍時才初始化 WebGL 場景，避免同頁多個 3D 卡片一次全部搶佔資源
const { isVisible } = useVisibleOnce(threeContainer)
watch(
  isVisible,
  visible => {
    if (visible) {
      nextTick(() => initScene())
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <div
    class="relative h-full w-full overflow-hidden rounded-card border border-line bg-surface"
    @mousemove="handleMouseMove"
  >
    <div
      ref="threeContainer"
      class="h-full w-full"
    />

    <!-- 動態懸停說明 -->
    <div
      v-if="hoveredElement"
      :style="{ left: mousePosition.x + 10 + 'px', top: mousePosition.y - 10 + 'px' }"
      class="pointer-events-none absolute z-10 max-w-xs rounded-[10px] border border-line bg-surface/95 p-3 shadow-card"
    >
      <div class="mb-1 text-sm font-medium text-ink">
        {{
          hoveredElement === 'moon'
            ? '月亮能量球'
            : hoveredElement === 'solarTermRings'
              ? '節氣環系'
              : hoveredElement === 'suitableBars'
                ? '宜事指示'
                : hoveredElement === 'avoidBars'
                  ? '忌事指示'
                  : hoveredElement === 'celestialWheel'
                    ? '天干地支輪'
                    : hoveredElement === 'fortuneIndicator'
                      ? '運勢指示器'
                      : '星空背景'
        }}
      </div>
      <div class="text-xs text-ink-2">
        {{ elementDescriptions[hoveredElement as ElementType] }}
      </div>
    </div>

    <!-- 農曆分析圖例 -->
    <div
      v-if="showLegend"
      class="absolute right-4 top-4 w-56 rounded-[10px] border border-line bg-surface/95 p-3 shadow-card"
    >
      <div class="mb-2 flex items-center justify-between">
        <h4 class="font-serif text-sm font-bold text-ink">
          農曆分析
        </h4>
        <button
          type="button"
          aria-label="關閉"
          class="rounded text-ink-3 transition-colors hover:text-ink"
          @click="showLegend = false"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
      <div class="space-y-2 text-xs">
        <div
          class="flex cursor-pointer items-center justify-between rounded p-1 transition-colors hover:bg-raised"
          @mouseenter="handleElementHover('moon')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="h-3 w-3 rounded-full bg-seal" />
            <span class="text-ink-2">月亮</span>
          </div>
          <span class="text-xs text-seal-ink">中心能量</span>
        </div>
        <div
          class="flex cursor-pointer items-center justify-between rounded p-1 transition-colors hover:bg-raised"
          @mouseenter="handleElementHover('solarTermRings')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="flex space-x-0.5">
              <div class="h-1 w-1 rounded-full bg-ink-2" />
              <div class="h-1 w-1 rounded-full bg-ink-3" />
              <div class="h-1 w-1 rounded-full bg-line-strong" />
            </div>
            <span class="text-ink-2">節氣</span>
          </div>
          <span class="text-xs text-ink">{{ solarTerm }}</span>
        </div>
        <div
          class="flex cursor-pointer items-center justify-between rounded p-1 transition-colors hover:bg-raised"
          @mouseenter="handleElementHover('suitableBars')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="flex space-x-0.5">
              <div class="h-3 w-0.5 bg-good" />
              <div class="h-2 w-0.5 bg-good" />
              <div class="h-4 w-0.5 bg-good" />
            </div>
            <span class="text-ink-2">宜</span>
          </div>
          <span class="text-xs text-good">{{ suitable?.slice(0, 2).join(', ') }}</span>
        </div>
        <div
          class="flex cursor-pointer items-center justify-between rounded p-1 transition-colors hover:bg-raised"
          @mouseenter="handleElementHover('avoidBars')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="flex space-x-0.5">
              <div class="h-2 w-0.5 bg-bad" />
              <div class="h-3 w-0.5 bg-bad" />
              <div class="h-2 w-0.5 bg-bad" />
            </div>
            <span class="text-ink-2">忌</span>
          </div>
          <span class="text-xs text-bad">{{ avoid?.slice(0, 2).join(', ') }}</span>
        </div>
        <div
          class="flex cursor-pointer items-center justify-between rounded p-1 transition-colors hover:bg-raised"
          @mouseenter="handleElementHover('celestialWheel')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="h-3 w-3 rounded bg-ink-3" />
            <span class="text-ink-2">天干地支</span>
          </div>
          <span class="text-xs text-ink-2">新轉</span>
        </div>
      </div>
    </div>

    <!-- 圖例開關 -->
    <button
      v-if="!showLegend"
      type="button"
      class="absolute right-4 top-4 flex items-center gap-1 rounded-[10px] border border-line bg-surface/95 px-2 py-1.5 text-xs text-ink-2 shadow-card transition-colors hover:text-ink"
      @click="showLegend = true"
    >
      <ChartBarIcon class="h-4 w-4 text-ink-3" />
      農曆
    </button>
    <div class="absolute left-4 top-4">
      <h3 class="mb-2 font-serif text-base font-bold text-ink">
        {{ title }}
      </h3>
      <div class="space-y-1 text-sm text-ink-2">
        <div>
          農曆: <span class="text-seal-ink">{{ lunarDate }}</span>
        </div>
        <div>
          節氣: <span class="text-ink">{{ solarTerm }}</span>
        </div>
        <div>
          宜: <span class="text-good">{{ suitable?.slice(0, 2).join(', ') }}</span>
        </div>
        <div>
          忌: <span class="text-bad">{{ avoid?.slice(0, 2).join(', ') }}</span>
        </div>
      </div>
    </div>
    <div class="absolute bottom-4 right-4 text-xs">
      <div class="text-center">
        <div
          class="mb-1 font-serif text-2xl font-bold"
          :class="fortuneColor"
        >
          {{ fortuneLevel }}
        </div>
        <div class="mb-1 font-mono text-lg font-semibold text-seal-ink">
          {{ fortuneScore }}
        </div>
        <div class="text-sm text-ink-3">
          投資運勢
        </div>
      </div>
    </div>
  </div>
</template>
