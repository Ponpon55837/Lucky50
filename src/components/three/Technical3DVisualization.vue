<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as THREE from 'three'
import { ThreeJSScene, createThemeGlowMaterial, getThemeColor } from '@/utils/three-scene'
import { useTheme } from '@/composables/useTheme'
import { useDashboardStore } from '@/stores/dashboard'
import { useAnalyticsStore } from '@/stores/analytics'

interface Props {
  title?: string
}

// 配置常量
const ANIMATION_CONFIG = {
  rsi: {
    baseRadius: 0.4,
    maxRadius: 1.2,
    pulseScale: 0.3,
    pulseSpeed: 0.003,
    position: { x: -2, y: 1, z: 0 },
  },
  macd: {
    baseHeight: 0.8,
    heightMultiplier: 3,
    radius: { top: 0.25, bottom: 0.35 },
    oscillateScale: 0.1,
    rotationSpeed: 0.005,
  },
  bollinger: {
    radius: 1.2,
    thickness: 0.18,
    position: { x: 2, y: 0, z: 0 },
    rotationSpeed: { x: 0, y: 0.008, z: 0.02 },
  },
  kd: {
    baseHeight: 2,
    heightMultiplier: 1.5,
    radius: 0.08,
    spacing: 0.8,
    swingAmplitude: 0.3,
    position: { x: 0, y: -1.5, z: 0 },
  },
  particles: {
    count: 50,
    waveAmplitude: 0.5,
    waveFrequency: { x: 1, y: 2 },
    flowSpeed: 0.01,
  },
} as const

type AnimationRefs = Set<() => void>

const { title = '技術指標 3D' } = defineProps<Props>()

const { isDark } = useTheme()
const dashboardStore = useDashboardStore()
const analyticsStore = useAnalyticsStore()

// 動畫管理
const animationRefs: AnimationRefs = new Set()
const threeContainer = ref<HTMLElement>()
let scene: ThreeJSScene | null = null
let indicatorGroup: THREE.Group | null = null

// 互動狀態管理
const hoveredElement = ref<string | null>(null)
const mousePosition = ref({ x: 0, y: 0 })
const showLegend = ref(false)

// 元素說明數據
type ElementType = 'rsiSphere' | 'macdBar' | 'bollingerRing' | 'kdOscillator' | 'particles'
const elementDescriptions: Record<ElementType, string> = {
  rsiSphere: 'RSI球體：相對強弱指標，球體大小反映超買超賣狀態',
  macdBar: 'MACD柱：移動平均線收散，高度和顏色表示趨勢強度',
  bollingerRing: '布林帶環：價格通道上下軌，旋轉這度表示波動率',
  kdOscillator: 'KD振盪器：两根柱子代表K值和D值，交叉信號重要',
  particles: '連接粒子：流動粒子連接各指標，表示市場相關性',
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

// 從 store 獲取技術指標數據
const indicators = computed(() => {
  return analyticsStore.calculateTechnicalIndicators(dashboardStore.etfData)
})

// 計算指標顏色
const rsiColor = computed(() => {
  const rsi = indicators.value.rsi
  if (rsi > 70) return 'text-error-text'
  if (rsi < 30) return 'text-success-text'
  return 'text-accent-text'
})

const macdColor = computed(() => {
  const macd = indicators.value.macd
  return macd > 0 ? 'text-success-text' : 'text-error-text'
})

const bollColor = computed(() => {
  return indicators.value.bollingerBand === 'upper'
    ? 'text-error-text'
    : indicators.value.bollingerBand === 'lower'
      ? 'text-success-text'
      : 'text-accent-text'
})

const overallSignal = computed(() => {
  const { rsi, macd, kd } = indicators.value

  let signals = 0
  if (rsi < 30) signals++
  if (rsi > 70) signals--
  if (macd > 0) signals++
  if (macd < 0) signals--
  if (kd.k > kd.d) signals++
  if (kd.k < kd.d) signals--

  if (signals > 0) return '買入'
  if (signals < 0) return '賣出'
  return '持有'
})

const overallSignalColor = computed(() => {
  const signal = overallSignal.value
  if (signal === '買入') return 'text-success-text'
  if (signal === '賣出') return 'text-error-text'
  return 'text-accent-text'
})

// 創建 RSI 球體
const createRSISphere = (): THREE.Mesh => {
  const { baseRadius, maxRadius, pulseScale, pulseSpeed, position } = ANIMATION_CONFIG.rsi
  const { rsi } = indicators.value

  const radius = Math.max(baseRadius, Math.min(maxRadius, (rsi / 100) * 1.5))
  const geometry = new THREE.SphereGeometry(radius, 32, 32)
  const color =
    rsi > 70
      ? getThemeColor('danger', isDark.value)
      : rsi < 30
        ? getThemeColor('success', isDark.value)
        : getThemeColor('accent', isDark.value)
  const material = createThemeGlowMaterial(color, Math.abs(rsi - 50) / 50, isDark.value)

  const sphere = new THREE.Mesh(geometry, material)
  sphere.position.set(position.x, position.y, position.z)

  // RSI 脈動動畫
  const animate = () => {
    if (!sphere.parent) return

    const time = Date.now() * pulseSpeed
    const scale = 1 + Math.sin(time) * pulseScale
    const intensity = Math.abs(rsi - 50) / 50
    sphere.scale.setScalar(scale * (1 + intensity * 0.2))
    sphere.rotation.y += 0.01

    requestAnimationFrame(animate)
  }

  registerAnimation(animate)
  animate()

  return sphere
}

// 創建 MACD 柱狀圖
const createMACDBar = (): THREE.Mesh => {
  const { baseHeight, heightMultiplier, radius, oscillateScale, rotationSpeed } =
    ANIMATION_CONFIG.macd
  const { macd } = indicators.value

  const height = Math.abs(macd) * heightMultiplier + baseHeight
  const geometry = new THREE.CylinderGeometry(radius.top, radius.bottom, height, 12)
  const color =
    macd > 0 ? getThemeColor('success', isDark.value) : getThemeColor('danger', isDark.value)
  const material = createThemeGlowMaterial(color, 1.0, isDark.value)

  const bar = new THREE.Mesh(geometry, material)
  bar.position.set(0, height / 2, 0)

  // MACD 上升動畫
  bar.scale.y = 0
  const animateMACD = () => {
    bar.scale.y += (1 - bar.scale.y) * 0.08
    if (Math.abs(1 - bar.scale.y) > 0.01) {
      requestAnimationFrame(animateMACD)
    } else {
      // 開始振盪動畫
      const oscillate = () => {
        if (!bar.parent) return

        const time = Date.now() * 0.002
        const offset = Math.sin(time) * oscillateScale
        bar.scale.y = 1 + offset * Math.abs(macd)
        bar.rotation.y += rotationSpeed

        requestAnimationFrame(oscillate)
      }
      registerAnimation(oscillate)
      oscillate()
    }
  }
  animateMACD()

  return bar
}

// 創建布林帶環
const createBollingerRing = (): THREE.Mesh => {
  const { radius, thickness, position, rotationSpeed } = ANIMATION_CONFIG.bollinger
  const { bollingerBand } = indicators.value

  const geometry = new THREE.TorusGeometry(radius, thickness, 16, 100)
  const color =
    bollingerBand === 'upper'
      ? getThemeColor('danger', isDark.value)
      : bollingerBand === 'lower'
        ? getThemeColor('success', isDark.value)
        : getThemeColor('warning', isDark.value)
  const material = createThemeGlowMaterial(color, 0.9, isDark.value)

  const ring = new THREE.Mesh(geometry, material)
  ring.position.set(position.x, position.y, position.z)
  ring.rotation.x = Math.PI / 4

  // 布林帶旋轉動畫
  const animate = () => {
    if (!ring.parent) return

    ring.rotation.x += rotationSpeed.x
    ring.rotation.y += rotationSpeed.y
    ring.rotation.z += rotationSpeed.z

    const time = Date.now() * 0.001
    ring.position.y = Math.sin(time) * 0.3

    requestAnimationFrame(animate)
  }

  registerAnimation(animate)
  animate()

  return ring
}

// 創建 KD 振盪器
const createKDOscillator = (): THREE.Group => {
  const { baseHeight, heightMultiplier, radius, spacing, swingAmplitude, position } =
    ANIMATION_CONFIG.kd
  const { kd } = indicators.value

  const group = new THREE.Group()

  // K 線
  const kHeight = baseHeight + (kd.k / 100) * heightMultiplier
  const kGeometry = new THREE.CylinderGeometry(radius, radius, kHeight, 12)
  const kColor = getThemeColor('info', isDark.value)
  const kMaterial = createThemeGlowMaterial(kColor, 0.9, isDark.value)
  const kLine = new THREE.Mesh(kGeometry, kMaterial)
  kLine.position.set(-spacing / 2, kHeight / 2, 0)

  // D 線
  const dHeight = baseHeight + (kd.d / 100) * heightMultiplier
  const dGeometry = new THREE.CylinderGeometry(radius, radius, dHeight, 12)
  const dColor = getThemeColor('secondary', isDark.value)
  const dMaterial = createThemeGlowMaterial(dColor, 0.9, isDark.value)
  const dLine = new THREE.Mesh(dGeometry, dMaterial)
  dLine.position.set(spacing / 2, dHeight / 2, 0)

  // 創建連接粒子
  const particles = createKDParticles(kColor, dColor)

  group.add(kLine, dLine, particles)
  group.position.set(position.x, position.y, position.z)

  // KD 線條擺動動畫
  const animate = () => {
    if (!group.parent) return

    const time = Date.now() * 0.002
    kLine.rotation.z = Math.sin(time) * swingAmplitude + (kd.k / 100 - 0.5) * 0.5
    dLine.rotation.z = Math.sin(time + 0.5) * swingAmplitude + (kd.d / 100 - 0.5) * 0.5
    group.rotation.y += 0.005

    requestAnimationFrame(animate)
  }

  registerAnimation(animate)
  animate()

  return group
}

// 創建 KD 連接粒子
const createKDParticles = (kColor: number, dColor: number): THREE.Points => {
  const { count, waveAmplitude, waveFrequency, flowSpeed } = ANIMATION_CONFIG.particles

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const t = i / count
    positions[i3] = THREE.MathUtils.lerp(-0.4, 0.4, t)
    positions[i3 + 1] = Math.sin(t * Math.PI * waveFrequency.x) * waveAmplitude + 1
    positions[i3 + 2] = Math.cos(t * Math.PI * waveFrequency.y) * 0.2

    const color = new THREE.Color().lerpColors(new THREE.Color(kColor), new THREE.Color(dColor), t)
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
  })

  const particles = new THREE.Points(geometry, material)

  // 粒子流動動畫
  const animate = () => {
    if (!particles.parent) return

    const positions = particles.geometry.attributes.position.array as Float32Array
    const time = Date.now() * 0.001

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3 + 1] += Math.sin(time + i * 0.1) * flowSpeed
      positions[i3 + 2] += Math.cos(time + i * 0.15) * flowSpeed * 0.5
    }
    particles.geometry.attributes.position.needsUpdate = true

    requestAnimationFrame(animate)
  }

  registerAnimation(animate)
  animate()

  return particles
}

// 創建所有技術指標的 3D 可視化 - 重構後更清晰
const createIndicators = () => {
  if (!scene || !indicatorGroup) return

  // 清空現有內容和動畫
  indicatorGroup.clear()
  cleanupAnimations()

  // 創建各個組件
  const rsiSphere = createRSISphere()
  const macdBar = createMACDBar()
  const bollingerRing = createBollingerRing()
  const kdGroup = createKDOscillator()

  // 添加所有對象到場景
  indicatorGroup.add(rsiSphere, macdBar, bollingerRing, kdGroup)
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

  // 創建指標組
  indicatorGroup = new THREE.Group()
  scene.addToScene(indicatorGroup)

  // 創建指標可視化
  createIndicators()

  // 設置相機位置
  scene.getCamera().position.set(0, 2, 5)
  scene.getCamera().lookAt(0, 0, 0)
}

// 清理資源
const cleanup = () => {
  cleanupAnimations()
  scene?.destroy()
  scene = null
  indicatorGroup = null
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

// 監聽主題變化
watch(isDark, newTheme => {
  if (!scene) return

  scene.updateTheme(newTheme)
  nextTick(() => {
    createIndicators()
  })
})

// 監聽指標變化
watch(
  indicators,
  () => {
    nextTick(() => {
      createIndicators()
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
          hoveredElement === 'rsiSphere'
            ? 'RSI 相對強弱指標'
            : hoveredElement === 'macdBar'
              ? 'MACD 線'
              : hoveredElement === 'bollingerRing'
                ? '布林帶'
                : hoveredElement === 'kdOscillator'
                  ? 'KD 振盪器'
                  : '連接粒子'
        }}
      </div>
      <div class="text-xs text-secondary-text">
        {{ elementDescriptions[hoveredElement as ElementType] }}
      </div>
    </div>

    <!-- 技術指標圖例 -->
    <div
      v-if="showLegend"
      class="absolute top-4 right-4 bg-card-bg/80 backdrop-blur-sm border border-border-light rounded-lg p-3 w-56"
    >
      <div class="flex justify-between items-center mb-2">
        <h4 class="text-sm font-semibold text-primary-text">
          技術分析
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
          @mouseenter="handleElementHover('rsiSphere')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div
              class="w-3 h-3 rounded-full"
              :class="rsiColor.replace('text-', 'bg-')"
            />
            <span class="text-secondary-text">RSI</span>
          </div>
          <span
            :class="rsiColor"
            class="font-mono text-xs"
          >{{ indicators.rsi.toFixed(1) }}</span>
        </div>
        <div
          class="flex items-center justify-between cursor-pointer hover:bg-surface-bg/50 p-1 rounded"
          @mouseenter="handleElementHover('macdBar')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div
              class="w-2 h-4"
              :class="macdColor.replace('text-', 'bg-')"
            />
            <span class="text-secondary-text">MACD</span>
          </div>
          <span
            :class="macdColor"
            class="font-mono text-xs"
          >{{ indicators.macd.toFixed(2) }}</span>
        </div>
        <div
          class="flex items-center justify-between cursor-pointer hover:bg-surface-bg/50 p-1 rounded"
          @mouseenter="handleElementHover('bollingerRing')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div
              class="w-3 h-0.5 rounded-full"
              :class="bollColor.replace('text-', 'bg-')"
            />
            <span class="text-secondary-text">布林帶</span>
          </div>
          <span
            :class="bollColor"
            class="text-xs"
          >{{ indicators.bollingerBand }}</span>
        </div>
        <div
          class="flex items-center justify-between cursor-pointer hover:bg-surface-bg/50 p-1 rounded"
          @mouseenter="handleElementHover('kdOscillator')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="flex space-x-0.5">
              <div class="w-0.5 h-3 bg-blue-400" />
              <div class="w-0.5 h-3 bg-purple-400" />
            </div>
            <span class="text-secondary-text">KD</span>
          </div>
          <span class="text-accent-text font-mono text-xs">
            {{ indicators.kd.k.toFixed(1) }}/{{ indicators.kd.d.toFixed(1) }}
          </span>
        </div>
      </div>
      <div class="mt-3 pt-2 border-t border-border-light text-center">
        <div
          class="text-lg font-bold"
          :class="overallSignalColor"
        >
          {{ overallSignal }}
        </div>
        <div class="text-xs text-secondary-text">
          總合信號
        </div>
      </div>
    </div>

    <!-- 圖例開關 -->
    <button
      v-if="!showLegend"
      class="absolute top-4 right-4 bg-card-bg/80 backdrop-blur-sm border border-border-light rounded-lg p-2 text-xs text-secondary-text hover:text-primary-text"
      @click="showLegend = true"
    >
      📈 指標
    </button>
    <div class="absolute top-4 left-4 text-primary-text">
      <h3 class="text-lg font-semibold mb-2 text-primary-text">
        {{ title }}
      </h3>
      <div class="text-sm space-y-1">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-xs text-secondary-text">
              RSI
            </div>
            <div
              :class="rsiColor"
              class="font-mono"
            >
              {{ indicators.rsi.toFixed(1) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-secondary-text">
              MACD
            </div>
            <div
              :class="macdColor"
              class="font-mono"
            >
              {{ indicators.macd.toFixed(2) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-secondary-text">
              布林帶
            </div>
            <div
              :class="bollColor"
              class="font-mono"
            >
              {{ indicators.bollingerBand }}
            </div>
          </div>
          <div>
            <div class="text-xs text-secondary-text">
              KD
            </div>
            <div class="text-accent-text font-mono">
              {{ indicators.kd.k.toFixed(1) }}/{{ indicators.kd.d.toFixed(1) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="absolute bottom-4 right-4 text-primary-text text-xs">
      <div class="text-center">
        <div
          class="text-lg font-bold"
          :class="overallSignalColor"
        >
          {{ overallSignal }}
        </div>
        <div class="text-sm text-secondary-text">
          技術信號
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
