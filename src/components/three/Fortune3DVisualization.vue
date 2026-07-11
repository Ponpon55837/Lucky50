<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as THREE from 'three'
import { ThreeJSScene, createThemeGlowMaterial, getThemeColor } from '@/utils/three-scene'
import { useTheme } from '@/composables/useTheme'
import { useDashboardStore } from '@/stores/dashboard'
import { useUserStore } from '@/stores/user'

interface Props {
  title?: string
}

// 配置常量
const ANIMATION_CONFIG = {
  zodiacSphere: {
    baseRadius: 0.6,
    maxRadius: 1.8,
    pulseScale: 0.15,
    pulseSpeed: 0.002,
    rotationSpeed: { x: 0.005, y: 0.008, z: 0.003 },
  },
  elementRings: {
    count: 3,
    baseRadius: 2.0,
    spacing: 0.4,
    baseThickness: 0.12,
    thicknessIncrement: 0.02,
  },
  investmentBars: {
    count: 5,
    maxHeight: 4,
    baseRadius: 2.5,
    animationDelay: 200,
  },
  particles: {
    count: 300,
    minRadius: 2,
    maxRadius: 8,
    spiralSpeed: { min: 0.5, max: 0.1 },
  },
} as const

type AnimationRefs = Set<() => void>

const { title = '生肖運勢 3D 展示' } = defineProps<Props>()

const { isDark } = useTheme()
const dashboardStore = useDashboardStore()
const userStore = useUserStore()

// 動畫管理
const animationRefs: AnimationRefs = new Set()
const threeContainer = ref<HTMLElement>()
let scene: ThreeJSScene | null = null
let fortuneGroup: THREE.Group | null = null

// 從 store 獲取數據 - 優化計算屬性
const userProfile = computed(() => userStore.profile)
const zodiac = computed(() => userProfile.value?.zodiac || '龍')
const element = computed(() => userProfile.value?.element || '木')
const fortuneScore = computed(() => dashboardStore.unifiedInvestmentScore)
const investmentScore = computed(() => dashboardStore.unifiedInvestmentScore)
const lunarData = computed(() => dashboardStore.lunarData)

// 互動狀態管理
const hoveredElement = ref<string | null>(null)
const mousePosition = ref({ x: 0, y: 0 })
const showLegend = ref(false)

// 元素說明數據
type ElementType = 'zodiacSphere' | 'elementRings' | 'investmentBars' | 'particles' | 'lunarData'
const elementDescriptions: Record<ElementType, string> = {
  zodiacSphere: '生肖能量球：中心能量源，大小與運勢分數成正比',
  elementRings: '五行環系：能量環，不同層級代表不同能量強度',
  investmentBars: '投資指示柱：每根柱子高度代表投資建議強度',
  particles: '五行能量粒子：環繞流動的粒子表示五行能量流動',
  lunarData: '農民曆資訊：當前農曆日期和宜忌事項',
}

const lunarDate = computed(() => {
  const data = lunarData.value
  if (!data) return '乙巳年八月'

  const { lunarYear = '', lunarMonth = '', lunarDay = '' } = data
  return lunarYear && lunarMonth && lunarDay
    ? `${lunarYear}年${lunarMonth}月${lunarDay}`
    : '乙巳年八月'
})

// 計算屬性
const fortuneScoreColor = computed(() => {
  const score = fortuneScore.value
  if (score >= 80) return 'text-success-text'
  if (score >= 60) return 'text-warning-text'
  return 'text-error-text'
})

const investmentAdvice = computed(() => {
  const score = investmentScore.value
  if (score >= 75) return '積極投資'
  if (score >= 50) return '謹慎投資'
  return '保守觀望'
})

const investmentAdviceColor = computed(() => {
  const advice = investmentAdvice.value
  if (advice === '積極投資') return 'text-success-text'
  if (advice === '謹慎投資') return 'text-warning-text'
  return 'text-error-text'
})

// ── 方法與函式 ──
const cleanupAnimations = () => {
  animationRefs.clear()
}

const registerAnimation = (animationFn: () => void) => {
  animationRefs.add(animationFn)
  return animationFn
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

// 獲取五行對應的顏色
const getElementColor = (element: string): number => {
  const elementColors = {
    木: getThemeColor('success', isDark.value), // 綠色
    火: getThemeColor('danger', isDark.value), // 紅色
    土: getThemeColor('warning', isDark.value), // 黃色
    金: getThemeColor('info', isDark.value), // 藍色
    水: getThemeColor('primary', isDark.value), // 深藍色
  }
  return (
    elementColors[element as keyof typeof elementColors] || getThemeColor('secondary', isDark.value)
  )
}

// 創建生肖能量球
const createZodiacSphere = (): THREE.Mesh => {
  const { baseRadius, maxRadius, pulseScale, pulseSpeed, rotationSpeed } =
    ANIMATION_CONFIG.zodiacSphere
  const score = fortuneScore.value

  const radius = Math.max(baseRadius, Math.min(maxRadius, (score / 100) * 2.5))
  const geometry = new THREE.IcosahedronGeometry(radius, 2)
  const color = getThemeColor('accent', isDark.value)
  const material = createThemeGlowMaterial(color, score / 100, isDark.value)

  const sphere = new THREE.Mesh(geometry, material)
  sphere.position.set(0, 1, 0)

  // 生肖球體脈動和旋轉動畫
  const animate = () => {
    if (!sphere.parent) return

    const time = Date.now() * pulseSpeed
    const scale = 1 + Math.sin(time) * pulseScale
    sphere.scale.setScalar(scale)
    sphere.rotation.x += rotationSpeed.x
    sphere.rotation.y += rotationSpeed.y
    sphere.rotation.z += rotationSpeed.z

    requestAnimationFrame(animate)
  }

  registerAnimation(animate)
  animate()

  return sphere
}

// 創建五行環系統
const createElementRings = (): THREE.Mesh[] => {
  const rings: THREE.Mesh[] = []
  const { count, baseRadius, spacing, baseThickness, thicknessIncrement } =
    ANIMATION_CONFIG.elementRings
  const currentElement = element.value

  for (let i = 0; i < count; i++) {
    const radius = baseRadius + i * spacing
    const thickness = baseThickness + i * thicknessIncrement

    const geometry = new THREE.TorusGeometry(radius, thickness, 16, 100)
    const color = getElementColor(currentElement)
    const opacity = 0.9 - i * 0.2
    const material = createThemeGlowMaterial(color, opacity, isDark.value)

    const ring = new THREE.Mesh(geometry, material)
    ring.position.set(0, 0.5, 0)
    ring.rotation.x = Math.PI / 2 + (i * Math.PI) / 8
    ring.rotation.z = (i * Math.PI) / 4

    // 每個環不同速度旋轉
    const animate = () => {
      if (!ring.parent) return

      ring.rotation.z += (0.01 + i * 0.005) * (i % 2 === 0 ? 1 : -1)
      ring.rotation.y += 0.003 * (i + 1)

      requestAnimationFrame(animate)
    }

    registerAnimation(animate)
    animate()
    rings.push(ring)
  }

  return rings
}

// 創建投資指示柱群組
const createInvestmentBars = (): THREE.Mesh[] => {
  const bars: THREE.Mesh[] = []
  const { count, maxHeight, baseRadius, animationDelay } = ANIMATION_CONFIG.investmentBars
  const currentScore = investmentScore.value
  const investmentHeight = Math.max(0.8, (currentScore / 100) * maxHeight)

  for (let i = 0; i < count; i++) {
    const height = investmentHeight * (0.6 + Math.random() * 0.8)
    const geometry = new THREE.CylinderGeometry(0.15, 0.2, height, 8)
    const color =
      currentScore >= 70
        ? getThemeColor('success', isDark.value)
        : currentScore >= 50
          ? getThemeColor('warning', isDark.value)
          : getThemeColor('danger', isDark.value)
    const material = createThemeGlowMaterial(color, 1.0, isDark.value)
    const bar = new THREE.Mesh(geometry, material)

    const angle = (i / count) * Math.PI * 2
    bar.position.set(Math.cos(angle) * baseRadius, height / 2 - 1, Math.sin(angle) * baseRadius)

    // 柱狀圖上升動畫
    bar.scale.y = 0
    setTimeout(() => {
      const animateBar = () => {
        bar.scale.y += (1 - bar.scale.y) * 0.08
        if (Math.abs(1 - bar.scale.y) > 0.01) {
          requestAnimationFrame(animateBar)
        } else {
          // 開始波動動畫
          const oscillate = () => {
            if (!bar.parent) return

            const time = Date.now() * 0.003 + i
            const offset = Math.sin(time) * 0.1
            bar.scale.y = 1 + offset

            requestAnimationFrame(oscillate)
          }
          registerAnimation(oscillate)
          oscillate()
        }
      }
      animateBar()
    }, i * animationDelay)

    bars.push(bar)
  }

  return bars
}

// 創建五行能量粒子效果
const createElementalParticles = (): THREE.Points => {
  const { count, minRadius, maxRadius } = ANIMATION_CONFIG.particles

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const elementColor = new THREE.Color(getElementColor(element.value))
  const accentColor = new THREE.Color(getThemeColor('accent', isDark.value))

  for (let i = 0; i < count; i++) {
    const i3 = i * 3

    // 球形分布
    const radius = minRadius + Math.random() * (maxRadius - minRadius)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.cos(phi)
    positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta)

    // 混合五行色彩
    const mixRatio = Math.random()
    const finalColor = new THREE.Color().lerpColors(elementColor, accentColor, mixRatio)
    colors[i3] = finalColor.r
    colors[i3 + 1] = finalColor.g
    colors[i3 + 2] = finalColor.b

    sizes[i] = Math.random() * 0.05 + 0.02
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: isDark.value ? 0.8 : 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  })

  const particles = new THREE.Points(geometry, material)

  // 粒子螺旋運動動畫
  const animate = () => {
    if (!particles.parent) return

    const positions = particles.geometry.attributes.position.array as Float32Array
    const time = Date.now() * 0.001

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const originalX = positions[i3]
      const originalZ = positions[i3 + 2]

      // 螺旋運動
      const rotationSpeed =
        ANIMATION_CONFIG.particles.spiralSpeed.min +
        (i % 10) * ANIMATION_CONFIG.particles.spiralSpeed.max
      const angle = time * rotationSpeed + i * 0.1
      const radius = Math.sqrt(originalX * originalX + originalZ * originalZ)

      positions[i3] = radius * Math.cos(angle)
      positions[i3 + 2] = radius * Math.sin(angle)
      positions[i3 + 1] += Math.sin(time * 2 + i * 0.1) * 0.003
    }

    particles.geometry.attributes.position.needsUpdate = true
    particles.rotation.y += 0.002

    requestAnimationFrame(animate)
  }

  registerAnimation(animate)
  animate()

  return particles
}

// 創建運勢可視化 - 重構後更清晰
const createFortuneVisualization = () => {
  if (!scene || !fortuneGroup) return

  // 清空現有內容和動畫
  fortuneGroup.clear()
  cleanupAnimations()

  // 創建各個組件
  const zodiacSphere = createZodiacSphere()
  const elementRings = createElementRings()
  const investmentBars = createInvestmentBars()
  const particles = createElementalParticles()

  // 添加所有對象到場景
  fortuneGroup.add(zodiacSphere, ...elementRings, ...investmentBars, particles)
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

  // 創建運勢組
  fortuneGroup = new THREE.Group()
  scene.addToScene(fortuneGroup)

  // 創建運勢可視化
  createFortuneVisualization()

  // 設置相機位置
  scene.getCamera().position.set(0, 2, 5)
  scene.getCamera().lookAt(0, 0, 0)
}

// 清理資源
const cleanup = () => {
  cleanupAnimations()
  scene?.destroy()
  scene = null
  fortuneGroup = null
}

// ── 監聽器 ──
watch(isDark, newTheme => {
  if (!scene) return

  scene.updateTheme(newTheme)
  nextTick(() => {
    createFortuneVisualization()
  })
})

watch(
  [zodiac, element, fortuneScore, investmentScore, lunarDate],
  () => {
    nextTick(() => {
      createFortuneVisualization()
    })
  },
  { deep: true }
)

// ── 生命週期 ──
onMounted(async () => {
  await nextTick()
  initScene()
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <div
    class="relative w-full h-full bg-gradient-to-br from-surface-bg/50 via-card-bg to-surface-bg rounded-lg overflow-hidden border border-border-light"
    @mousemove="handleMouseMove"
  >
    <div ref="threeContainer" class="w-full h-full" />

    <!-- 動態懸停說明 -->
    <div
      v-if="hoveredElement"
      :style="{ left: mousePosition.x + 10 + 'px', top: mousePosition.y - 10 + 'px' }"
      class="absolute z-10 bg-card-bg/90 backdrop-blur-sm border border-border-light rounded-lg p-3 shadow-lg pointer-events-none max-w-xs"
    >
      <div class="text-sm font-medium text-primary-text mb-1">
        {{
          hoveredElement === 'zodiacSphere'
            ? `${zodiac}生肖球`
            : hoveredElement === 'elementRings'
              ? `${element}五行環`
              : hoveredElement === 'investmentBars'
                ? '投資指示柱'
                : hoveredElement === 'particles'
                  ? '五行粒子'
                  : '農曆資訊'
        }}
      </div>
      <div class="text-xs text-secondary-text">
        {{ elementDescriptions[hoveredElement as ElementType] }}
      </div>
    </div>

    <!-- 運勢分析圖例 -->
    <div
      v-if="showLegend"
      class="absolute top-4 right-4 bg-card-bg/80 backdrop-blur-sm border border-border-light rounded-lg p-3 w-52"
    >
      <div class="flex justify-between items-center mb-2">
        <h4 class="text-sm font-semibold text-primary-text">運勢分析</h4>
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
          @mouseenter="handleElementHover('zodiacSphere')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div
              class="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"
            />
            <span class="text-secondary-text">{{ zodiac }}生肖</span>
          </div>
          <span :class="fortuneScoreColor" class="font-mono text-xs">{{ fortuneScore }}</span>
        </div>
        <div
          class="flex items-center justify-between cursor-pointer hover:bg-surface-bg/50 p-1 rounded"
          @mouseenter="handleElementHover('elementRings')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="w-3 h-0.5 bg-gradient-to-r from-green-400 to-blue-400 rounded" />
            <span class="text-secondary-text">{{ element }}五行</span>
          </div>
          <span class="text-info-text text-xs">強化</span>
        </div>
        <div
          class="flex items-center justify-between cursor-pointer hover:bg-surface-bg/50 p-1 rounded"
          @mouseenter="handleElementHover('investmentBars')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="flex space-x-0.5">
              <div class="w-0.5 h-3 bg-green-400" />
              <div class="w-0.5 h-2 bg-yellow-400" />
              <div class="w-0.5 h-4 bg-green-400" />
            </div>
            <span class="text-secondary-text">投資建議</span>
          </div>
          <span :class="investmentAdviceColor" class="text-xs">{{ investmentAdvice }}</span>
        </div>
        <div
          class="flex items-center space-x-2 cursor-pointer hover:bg-surface-bg/50 p-1 rounded"
          @mouseenter="handleElementHover('lunarData')"
          @mouseleave="handleElementLeave"
        >
          <div class="w-3 h-3 bg-yellow-300 rounded-full" />
          <span class="text-secondary-text">農曆</span>
          <span class="text-xs text-accent-text ml-auto">{{ lunarDate.slice(-4) }}</span>
        </div>
      </div>
    </div>

    <!-- 圖例開關 -->
    <button
      v-if="!showLegend"
      class="absolute top-4 right-4 bg-card-bg/80 backdrop-blur-sm border border-border-light rounded-lg p-2 text-xs text-secondary-text hover:text-primary-text"
      @click="showLegend = true"
    >
      🔮 運勢
    </button>

    <div class="absolute top-4 left-4 text-primary-text">
      <h3 class="text-lg font-semibold mb-2 text-primary-text">
        {{ title }}
      </h3>
      <div class="text-sm space-y-1">
        <div>
          生肖: <span class="text-accent-text">{{ zodiac }}</span>
        </div>
        <div>
          五行: <span class="text-info-text">{{ element }}</span>
        </div>
        <div>
          運勢分數: <span :class="fortuneScoreColor">{{ fortuneScore }}</span>
        </div>
        <div>
          投資建議: <span :class="investmentAdviceColor">{{ investmentAdvice }}</span>
        </div>
      </div>
    </div>
    <div class="absolute bottom-4 right-4 text-secondary-text text-xs">
      <div>農民曆: {{ lunarDate }}</div>
    </div>
  </div>
</template>

<style scoped>
.relative {
  position: relative;
}
</style>
