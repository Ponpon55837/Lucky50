<script setup lang="ts">
import { ref, onUnmounted, watch, computed, nextTick } from 'vue'
import * as THREE from 'three'
import { ChartBarIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ThreeJSScene, createSceneMaterial, tokenHex, disposeObject3D } from '@/utils/three-scene'
import { useVisibleOnce } from '@/composables/useVisibleOnce'
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

const { title = '技術指標 3D' } = defineProps<Props>()

const { isDark } = useTheme()
const dashboardStore = useDashboardStore()
const analyticsStore = useAnalyticsStore()

// 動畫管理
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

// ── 計算屬性 ──
// 圖例色塊以 text-→bg- 轉換，列出完整 class 讓 Tailwind 掃描得到：bg-good bg-bad bg-ink bg-rise bg-fall
const indicators = computed(() => {
  return analyticsStore.calculateTechnicalIndicators(dashboardStore.etfData)
})

const rsiColor = computed(() => {
  const rsi = indicators.value.rsi
  if (rsi > 70) return 'text-bad'
  if (rsi < 30) return 'text-good'
  return 'text-ink'
})

const macdColor = computed(() => {
  const macd = indicators.value.macd
  return macd > 0 ? 'text-rise' : 'text-fall'
})

const bollColor = computed(() => {
  return indicators.value.bollingerBand === 'upper'
    ? 'text-bad'
    : indicators.value.bollingerBand === 'lower'
      ? 'text-good'
      : 'text-ink'
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
  if (signal === '買入') return 'text-good'
  if (signal === '賣出') return 'text-bad'
  return 'text-ink'
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

// 創建 RSI 球體
const createRSISphere = (): THREE.Mesh => {
  const { baseRadius, maxRadius, pulseScale, pulseSpeed, position } = ANIMATION_CONFIG.rsi
  const { rsi } = indicators.value

  const radius = Math.max(baseRadius, Math.min(maxRadius, (rsi / 100) * 1.5))
  const geometry = new THREE.SphereGeometry(radius, 32, 32)
  // 超買偏空用跌綠、超賣偏多用漲紅，中性時以朱印紅作為場景重點
  const color = rsi > 70 ? tokenHex('fall') : rsi < 30 ? tokenHex('rise') : tokenHex('seal')
  const material = createSceneMaterial(color, 0.95)

  const sphere = new THREE.Mesh(geometry, material)
  sphere.position.set(position.x, position.y, position.z)

  // RSI 脈動動畫
  registerAnimation(() => {
    const time = Date.now() * pulseSpeed
    const scale = 1 + Math.sin(time) * pulseScale
    const intensity = Math.abs(rsi - 50) / 50
    sphere.scale.setScalar(scale * (1 + intensity * 0.2))
    sphere.rotation.y += 0.01
  })

  return sphere
}

// 創建 MACD 柱狀圖
const createMACDBar = (): THREE.Mesh => {
  const { baseHeight, heightMultiplier, radius, oscillateScale, rotationSpeed } =
    ANIMATION_CONFIG.macd
  const { macd } = indicators.value

  const height = Math.abs(macd) * heightMultiplier + baseHeight
  const geometry = new THREE.CylinderGeometry(radius.top, radius.bottom, height, 12)
  const color = macd > 0 ? tokenHex('rise') : tokenHex('fall')
  const material = createSceneMaterial(color, 0.92)

  const bar = new THREE.Mesh(geometry, material)
  bar.position.set(0, height / 2, 0)

  // MACD 上升動畫，完成後接續振盪動畫
  bar.scale.y = 0
  registerAnimation(() => {
    bar.scale.y += (1 - bar.scale.y) * 0.08
    if (Math.abs(1 - bar.scale.y) <= 0.01) {
      registerAnimation(() => {
        const time = Date.now() * 0.002
        const offset = Math.sin(time) * oscillateScale
        bar.scale.y = 1 + offset * Math.abs(macd)
        bar.rotation.y += rotationSpeed
      })
      return false
    }
  })

  return bar
}

// 創建布林帶環
const createBollingerRing = (): THREE.Mesh => {
  const { radius, thickness, position, rotationSpeed } = ANIMATION_CONFIG.bollinger
  const { bollingerBand } = indicators.value

  const geometry = new THREE.TorusGeometry(radius, thickness, 16, 100)
  const color =
    bollingerBand === 'upper'
      ? tokenHex('fall')
      : bollingerBand === 'lower'
        ? tokenHex('rise')
        : tokenHex('ink-3')
  const material = createSceneMaterial(color, 0.85)

  const ring = new THREE.Mesh(geometry, material)
  ring.position.set(position.x, position.y, position.z)
  ring.rotation.x = Math.PI / 4

  // 布林帶旋轉動畫
  registerAnimation(() => {
    ring.rotation.x += rotationSpeed.x
    ring.rotation.y += rotationSpeed.y
    ring.rotation.z += rotationSpeed.z

    const time = Date.now() * 0.001
    ring.position.y = Math.sin(time) * 0.3
  })

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
  const kColor = tokenHex('ink-2')
  const kMaterial = createSceneMaterial(kColor, 0.9)
  const kLine = new THREE.Mesh(kGeometry, kMaterial)
  kLine.position.set(-spacing / 2, kHeight / 2, 0)

  // D 線
  const dHeight = baseHeight + (kd.d / 100) * heightMultiplier
  const dGeometry = new THREE.CylinderGeometry(radius, radius, dHeight, 12)
  const dColor = tokenHex('ink-3')
  const dMaterial = createSceneMaterial(dColor, 0.7)
  const dLine = new THREE.Mesh(dGeometry, dMaterial)
  dLine.position.set(spacing / 2, dHeight / 2, 0)

  // 創建連接粒子
  const particles = createKDParticles(kColor, dColor)

  group.add(kLine, dLine, particles)
  group.position.set(position.x, position.y, position.z)

  // KD 線條擺動動畫
  registerAnimation(() => {
    const time = Date.now() * 0.002
    kLine.rotation.z = Math.sin(time) * swingAmplitude + (kd.k / 100 - 0.5) * 0.5
    dLine.rotation.z = Math.sin(time + 0.5) * swingAmplitude + (kd.d / 100 - 0.5) * 0.5
    group.rotation.y += 0.005
  })

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
    opacity: 0.5,
  })

  const particles = new THREE.Points(geometry, material)

  // 粒子流動動畫
  registerAnimation(() => {
    const positions = particles.geometry.attributes.position.array as Float32Array
    const time = Date.now() * 0.001

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3 + 1] += Math.sin(time + i * 0.1) * flowSpeed
      positions[i3 + 2] += Math.cos(time + i * 0.15) * flowSpeed * 0.5
    }
    particles.geometry.attributes.position.needsUpdate = true
  })

  return particles
}

// 創建所有技術指標的 3D 可視化 - 重構後更清晰
const createIndicators = () => {
  if (!scene || !indicatorGroup) return

  // 清空現有內容前先釋放 GPU 資源，避免每次重建都累積記憶體
  disposeObject3D(indicatorGroup)
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
    createIndicators()
  })
})

watch(
  indicators,
  () => {
    nextTick(() => {
      createIndicators()
    })
  },
  { deep: true }
)

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
      <div class="text-xs text-ink-2">
        {{ elementDescriptions[hoveredElement as ElementType] }}
      </div>
    </div>

    <!-- 技術指標圖例 -->
    <div
      v-if="showLegend"
      class="absolute right-4 top-4 w-56 rounded-[10px] border border-line bg-surface/95 p-3 shadow-card"
    >
      <div class="mb-2 flex items-center justify-between">
        <h4 class="font-serif text-sm font-bold text-ink">
          技術分析
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
          @mouseenter="handleElementHover('rsiSphere')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div
              class="h-3 w-3 rounded-full"
              :class="rsiColor.replace('text-', 'bg-')"
            />
            <span class="text-ink-2">RSI</span>
          </div>
          <span
            :class="rsiColor"
            class="font-mono text-xs"
          >{{ indicators.rsi.toFixed(1) }}</span>
        </div>
        <div
          class="flex cursor-pointer items-center justify-between rounded p-1 transition-colors hover:bg-raised"
          @mouseenter="handleElementHover('macdBar')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div
              class="h-4 w-2"
              :class="macdColor.replace('text-', 'bg-')"
            />
            <span class="text-ink-2">MACD</span>
          </div>
          <span
            :class="macdColor"
            class="font-mono text-xs"
          >{{ indicators.macd.toFixed(2) }}</span>
        </div>
        <div
          class="flex cursor-pointer items-center justify-between rounded p-1 transition-colors hover:bg-raised"
          @mouseenter="handleElementHover('bollingerRing')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div
              class="h-0.5 w-3 rounded-full"
              :class="bollColor.replace('text-', 'bg-')"
            />
            <span class="text-ink-2">布林帶</span>
          </div>
          <span
            :class="bollColor"
            class="text-xs"
          >{{ indicators.bollingerBand }}</span>
        </div>
        <div
          class="flex cursor-pointer items-center justify-between rounded p-1 transition-colors hover:bg-raised"
          @mouseenter="handleElementHover('kdOscillator')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="flex space-x-0.5">
              <div class="h-3 w-0.5 bg-ink-2" />
              <div class="h-3 w-0.5 bg-ink-3" />
            </div>
            <span class="text-ink-2">KD</span>
          </div>
          <span class="font-mono text-xs text-ink">
            {{ indicators.kd.k.toFixed(1) }}/{{ indicators.kd.d.toFixed(1) }}
          </span>
        </div>
      </div>
      <div class="mt-3 border-t border-line pt-2 text-center">
        <div
          class="font-serif text-lg font-bold"
          :class="overallSignalColor"
        >
          {{ overallSignal }}
        </div>
        <div class="text-xs text-ink-3">
          總合信號
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
      指標
    </button>
    <div class="absolute left-4 top-4">
      <h3 class="mb-2 font-serif text-base font-bold text-ink">
        {{ title }}
      </h3>
      <div class="space-y-1 text-sm text-ink-2">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-xs text-ink-3">
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
            <div class="text-xs text-ink-3">
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
            <div class="text-xs text-ink-3">
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
            <div class="text-xs text-ink-3">
              KD
            </div>
            <div class="font-mono text-ink">
              {{ indicators.kd.k.toFixed(1) }}/{{ indicators.kd.d.toFixed(1) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="absolute bottom-4 right-4 text-xs">
      <div class="text-center">
        <div
          class="font-serif text-lg font-bold"
          :class="overallSignalColor"
        >
          {{ overallSignal }}
        </div>
        <div class="text-sm text-ink-3">
          技術信號
        </div>
      </div>
    </div>
  </div>
</template>
