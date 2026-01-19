<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as THREE from 'three'
import { ThreeJSScene, createThemeGlowMaterial, getThemeColor } from '@/utils/three-scene'
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
    minSize: 0.03,
    maxSize: 0.15,
  },
  bars: {
    suitable: { baseRadius: 4.0, maxCount: 6 },
    avoid: { baseRadius: 4.0, maxCount: 6 },
  },
} as const

type FortuneLevel = '大吉' | '吉' | '平' | '忌'
type AnimationRefs = Set<() => void>

const { title = '農民曆 3D 展示' } = defineProps<Props>()

const { isDark } = useTheme()
const dashboardStore = useDashboardStore()

// 動畫管理
const animationRefs: AnimationRefs = new Set()
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
  moon: '月亮：農曆的核心，大小和光苒表示當日月相能量',
  solarTermRings: '節氣環：二十四節氣的能量環，不同層級代表時節影響',
  suitableBars: '宜事柱：綠色柱子代表當日適宜做的事情',
  avoidBars: '忌事柱：紅色柱子代表當日需要送免的事情',
  celestialWheel: '天干地支：外圈地支和內圈天干，表示時空能量',
  fortuneIndicator: '運勢指示器：中心柱子代表綜合投資運勢分數',
  starField: '星空背景：閃爜的星星製造宇宙氛圍',
}

// 清理所有動畫
const cleanupAnimations = () => {
  animationRefs.clear()
}

// 註冊動畫循環
const registerAnimation = (animationFn: () => void) => {
  animationRefs.add(animationFn)
  return animationFn
}

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
  if (score >= 80) return 'text-emerald-400'
  if (score >= 65) return 'text-green-400'
  if (score >= 35) return 'text-yellow-400'
  return 'text-red-400'
})

const fortuneThemeColor = computed(() => {
  const score = fortuneScore.value
  if (score >= 80) return 'success'
  if (score >= 65) return 'warning'
  if (score >= 35) return 'info'
  return 'danger'
})

// 創建月亮組件
const createMoon = (): THREE.Mesh => {
  const { radius, breathScale, breathSpeed, rotationSpeed } = ANIMATION_CONFIG.moon

  const geometry = new THREE.IcosahedronGeometry(radius, 3)
  const color = getThemeColor('accent', isDark.value)
  const material = createThemeGlowMaterial(color, 0.9, isDark.value)
  const moon = new THREE.Mesh(geometry, material)
  moon.position.set(0, 1.5, 0)

  // 統一的月亮動畫
  const animate = () => {
    if (!moon.parent) return

    const time = Date.now() * 0.001
    const scale = 1 + Math.sin(time * breathSpeed) * breathScale
    moon.scale.setScalar(scale)
    moon.rotation.x += rotationSpeed.x
    moon.rotation.y += rotationSpeed.y
    moon.rotation.z += rotationSpeed.z

    requestAnimationFrame(animate)
  }

  registerAnimation(animate)
  animate()

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
    const colorType = layer === 0 ? 'success' : layer === 1 ? 'warning' : 'info'
    const color = getThemeColor(colorType, isDark.value)
    const material = createThemeGlowMaterial(color, 0.8 - layer * 0.1, isDark.value)

    const ring = new THREE.Mesh(geometry, material)
    ring.position.set(0, 0, 0)
    ring.rotation.x = Math.PI / 2 + (layer * Math.PI) / 12
    ring.rotation.z = (layer * Math.PI) / 6

    // 環形動畫
    const animate = () => {
      if (!ring.parent) return

      ring.rotation.z += (0.005 + layer * 0.003) * (layer % 2 === 0 ? 1 : -1)
      ring.rotation.y += 0.002 * (layer + 1)

      requestAnimationFrame(animate)
    }

    registerAnimation(animate)
    animate()
    rings.push(ring)
  }

  return rings
}

// 創建指示柱（通用函數）
const createIndicatorBars = (
  items: string[],
  config: { baseRadius: number; maxCount: number },
  colorType: 'success' | 'danger',
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

    const color = getThemeColor(colorType, isDark.value)
    const material = createThemeGlowMaterial(color, 0.9, isDark.value)
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
      const animateScale = () => {
        bar.scale.y += (1 - bar.scale.y) * 0.06
        if (Math.abs(1 - bar.scale.y) > 0.01) {
          requestAnimationFrame(animateScale)
        } else {
          // 輕微搖擺
          const sway = () => {
            if (!bar.parent) return

            const time = Date.now() * 0.002 + i + (isUpward ? 0 : Math.PI)
            bar.rotation.z = Math.sin(time) * 0.08
            bar.rotation.x = Math.cos(time * 0.7) * 0.05

            requestAnimationFrame(sway)
          }
          registerAnimation(sway)
          sway()
        }
      }
      animateScale()
    }, delay)

    bars.push(bar)
  }

  return bars
}

// 創建運勢指示器
const createFortuneIndicator = (): THREE.Mesh => {
  const height = 2.5
  const geometry = new THREE.CylinderGeometry(0.4, 0.6, height, 12)
  const color = getThemeColor(fortuneThemeColor.value, isDark.value)
  const score = fortuneScore.value
  const isExcellent = score >= 80
  const material = createThemeGlowMaterial(color, isExcellent ? 1.0 : 0.7, isDark.value)

  const indicator = new THREE.Mesh(geometry, material)
  indicator.position.set(0, -1.5, 2.0)

  // 脈動動畫
  const animate = () => {
    if (!indicator.parent) return

    const time = Date.now() * 0.003
    const intensity = isExcellent ? 1.2 : score >= 65 ? 1.0 : score >= 35 ? 0.8 : 0.6
    const scale = 1 + Math.sin(time) * 0.1 * intensity
    indicator.scale.setScalar(scale)
    indicator.rotation.y += 0.01 * intensity

    requestAnimationFrame(animate)
  }

  registerAnimation(animate)
  animate()

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
    const colorType = i % 3 === 0 ? 'primary' : i % 3 === 1 ? 'secondary' : 'accent'
    const color = getThemeColor(colorType, isDark.value)
    const material = createThemeGlowMaterial(color, 0.8, isDark.value)
    const branch = new THREE.Mesh(geometry, material)

    branch.position.set(
      Math.cos(angle) * branches.radius,
      Math.sin(i * 0.3) * 0.8,
      Math.sin(angle) * branches.radius
    )

    // 地支動畫
    const animate = () => {
      if (!branch.parent) return

      const time = Date.now() * 0.001 + i * 0.5
      branch.rotation.x += 0.008 + i * 0.001
      branch.rotation.y += 0.012 + i * 0.002
      branch.position.y = Math.sin(time * 0.8) * 0.5 + Math.sin(i * 0.3) * 0.8

      // 順時針軌道運動
      const orbitTime = Date.now() * 0.0003 + (i * Math.PI * 2) / branches.count
      branch.position.x = Math.cos(orbitTime) * branches.radius
      branch.position.z = Math.sin(orbitTime) * branches.radius

      requestAnimationFrame(animate)
    }

    registerAnimation(animate)
    animate()
    celestialObjects.push(branch)
  }

  // 天干內環 (10個) - 甲乙丙丁戊己庚辛壬癸
  for (let i = 0; i < stems.count; i++) {
    const angle = (i / stems.count) * Math.PI * 2

    const geometry = new THREE.TetrahedronGeometry(0.25, 1)
    const color = getThemeColor('warning', isDark.value)
    const material = createThemeGlowMaterial(color, 0.9, isDark.value)
    const stem = new THREE.Mesh(geometry, material)

    stem.position.set(
      Math.cos(angle) * stems.radius,
      Math.cos(i * 0.4) * 1.2 + 0.8,
      Math.sin(angle) * stems.radius
    )

    // 天干反向旋轉
    const animate = () => {
      if (!stem.parent) return

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

      requestAnimationFrame(animate)
    }

    registerAnimation(animate)
    animate()
    celestialObjects.push(stem)
  }

  return celestialObjects
}

// 創建增強星空背景
const createEnhancedStarField = (): THREE.Points => {
  const { count, minRadius, maxRadius, minSize, maxSize } = ANIMATION_CONFIG.stars

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const starColors = [
    new THREE.Color(0xffd700), // 金色
    new THREE.Color(0xc0c0c0), // 銀色
    new THREE.Color(getThemeColor('info', isDark.value)),
    new THREE.Color(getThemeColor('accent', isDark.value)),
  ]

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

    sizes[i] = minSize + Math.random() * (maxSize - minSize)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: isDark.value ? 0.95 : 0.8,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  })

  const starField = new THREE.Points(geometry, material)

  // 星空旋轉和閃爍動畫
  const animate = () => {
    if (!starField.parent) return

    starField.rotation.y += 0.0003
    starField.rotation.x += 0.0001
    starField.rotation.z += 0.0002

    // 星星閃爍效果
    const colorAttr = starField.geometry.attributes.color.array as Float32Array
    const sizeAttr = starField.geometry.attributes.size.array as Float32Array
    const time = Date.now() * 0.001

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const twinkle = ((Math.sin(time * 2 + i * 0.1) + 1) / 2) * 0.4 + 0.6
      const pulse = ((Math.sin(time * 3 + i * 0.2) + 1) / 2) * 0.3 + 0.7

      // 顏色閃爍
      colorAttr[i3] *= twinkle
      colorAttr[i3 + 1] *= twinkle
      colorAttr[i3 + 2] *= twinkle

      // 大小脈動
      sizeAttr[i] *= pulse
    }

    starField.geometry.attributes.color.needsUpdate = true
    starField.geometry.attributes.size.needsUpdate = true

    requestAnimationFrame(animate)
  }

  registerAnimation(animate)
  animate()

  return starField
}

// 主要的創建函數 - 重構後更清晰
const createLunarVisualization = () => {
  if (!scene || !lunarGroup) return

  // 清空現有內容和動畫
  lunarGroup.clear()
  cleanupAnimations()

  // 創建各個組件
  const moon = createMoon()
  const solarTermRings = createSolarTermRings()
  const suitableBars = createIndicatorBars(
    suitable.value,
    ANIMATION_CONFIG.bars.suitable,
    'success',
    Math.PI / 4,
    0,
    true
  )
  const avoidBars = createIndicatorBars(
    avoid.value,
    ANIMATION_CONFIG.bars.avoid,
    'danger',
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
    backgroundColor: getThemeColor('background', isDark.value),
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

// 生命週期
onMounted(async () => {
  await nextTick()
  initScene()
})

onUnmounted(() => {
  cleanup()
})

// 鼠標事件處理
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

// 監聽主題變化 - 優化重新創建邏輯
watch(isDark, newTheme => {
  if (!scene) return

  scene.updateTheme(newTheme)
  // 延遲重新創建以避免頻繁更新
  nextTick(() => {
    createLunarVisualization()
  })
})

// 監聽屬性變化 - 優化依賴追蹤
watch(
  [lunarDate, solarTerm, suitable, avoid, fortuneScore],
  () => {
    nextTick(() => {
      createLunarVisualization()
    })
  },
  { deep: true }
)
</script>

<template>
  <div
    class="relative w-full h-full bg-gradient-to-br from-surface-bg/50 via-card-bg to-surface-bg rounded-lg overflow-hidden border border-border-light"
    @mousemove="handleMouseMove"
  >
    <div
      ref="threeContainer"
      class="w-full h-full"
    />

    <!-- 動態懸停說明 -->
    <div
      v-if="hoveredElement"
      :style="{ left: mousePosition.x + 10 + 'px', top: mousePosition.y - 10 + 'px' }"
      class="absolute z-10 bg-card-bg/90 backdrop-blur-sm border border-border-light rounded-lg p-3 shadow-lg pointer-events-none max-w-xs"
    >
      <div class="text-sm font-medium text-primary-text mb-1">
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
      <div class="text-xs text-secondary-text">
        {{ elementDescriptions[hoveredElement as ElementType] }}
      </div>
    </div>

    <!-- 農曆分析圖例 -->
    <div
      v-if="showLegend"
      class="absolute top-4 right-4 bg-card-bg/80 backdrop-blur-sm border border-border-light rounded-lg p-3 w-56"
    >
      <div class="flex justify-between items-center mb-2">
        <h4 class="text-sm font-semibold text-primary-text">
          農曆分析
        </h4>
        <button
          class="text-xs text-secondary-text hover:text-primary-text"
          @click="showLegend = false"
        >
          ×
        </button>
      </div>
      <div class="space-y-2 text-xs">
        <div
          class="flex items-center justify-between cursor-pointer hover:bg-surface-bg/50 p-1 rounded"
          @mouseenter="handleElementHover('moon')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div
              class="w-3 h-3 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full animate-pulse"
            />
            <span class="text-secondary-text">月亮</span>
          </div>
          <span class="text-accent-text text-xs">中心能量</span>
        </div>
        <div
          class="flex items-center justify-between cursor-pointer hover:bg-surface-bg/50 p-1 rounded"
          @mouseenter="handleElementHover('solarTermRings')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="flex space-x-0.5">
              <div class="w-0.5 h-0.5 bg-green-400 rounded-full" />
              <div class="w-0.5 h-0.5 bg-yellow-400 rounded-full" />
              <div class="w-0.5 h-0.5 bg-blue-400 rounded-full" />
            </div>
            <span class="text-secondary-text">節氣</span>
          </div>
          <span class="text-success-text text-xs">{{ solarTerm }}</span>
        </div>
        <div
          class="flex items-center justify-between cursor-pointer hover:bg-surface-bg/50 p-1 rounded"
          @mouseenter="handleElementHover('suitableBars')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="flex space-x-0.5">
              <div class="w-0.5 h-3 bg-green-400" />
              <div class="w-0.5 h-2 bg-green-400" />
              <div class="w-0.5 h-4 bg-green-400" />
            </div>
            <span class="text-secondary-text">宜</span>
          </div>
          <span class="text-success-text text-xs">{{ suitable?.slice(0, 2).join(', ') }}</span>
        </div>
        <div
          class="flex items-center justify-between cursor-pointer hover:bg-surface-bg/50 p-1 rounded"
          @mouseenter="handleElementHover('avoidBars')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="flex space-x-0.5">
              <div class="w-0.5 h-2 bg-red-400" />
              <div class="w-0.5 h-3 bg-red-400" />
              <div class="w-0.5 h-2 bg-red-400" />
            </div>
            <span class="text-secondary-text">忌</span>
          </div>
          <span class="text-error-text text-xs">{{ avoid?.slice(0, 2).join(', ') }}</span>
        </div>
        <div
          class="flex items-center justify-between cursor-pointer hover:bg-surface-bg/50 p-1 rounded"
          @mouseenter="handleElementHover('celestialWheel')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded" />
            <span class="text-secondary-text">天干地支</span>
          </div>
          <span class="text-info-text text-xs">新轉</span>
        </div>
      </div>
    </div>

    <!-- 圖例開關 -->
    <button
      v-if="!showLegend"
      class="absolute top-4 right-4 bg-card-bg/80 backdrop-blur-sm border border-border-light rounded-lg p-2 text-xs text-secondary-text hover:text-primary-text"
      @click="showLegend = true"
    >
      🌙 農曆
    </button>
    <div class="absolute top-4 left-4 text-primary-text">
      <h3 class="text-lg font-semibold mb-2 text-primary-text">
        {{ title }}
      </h3>
      <div class="text-sm space-y-1">
        <div>
          農曆: <span class="text-accent-text">{{ lunarDate }}</span>
        </div>
        <div>
          節氣: <span class="text-success-text">{{ solarTerm }}</span>
        </div>
        <div>
          宜: <span class="text-success-text">{{ suitable?.slice(0, 2).join(', ') }}</span>
        </div>
        <div>
          忌: <span class="text-error-text">{{ avoid?.slice(0, 2).join(', ') }}</span>
        </div>
      </div>
    </div>
    <div class="absolute bottom-4 right-4 text-primary-text text-xs">
      <div class="text-center">
        <div
          class="text-2xl font-bold mb-1"
          :class="fortuneColor"
        >
          {{ fortuneLevel }}
        </div>
        <div class="text-lg font-semibold text-gold-400 mb-1">
          {{ fortuneScore }}
        </div>
        <div class="text-sm text-secondary-text">
          投資運勢
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.relative {
  position: relative;
}
</style>
