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
} from '@/utils/three-scene'
import { useVisibleOnce } from '@/composables/useVisibleOnce'
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

const { title = '生肖運勢 3D 展示' } = defineProps<Props>()

const { isDark } = useTheme()
const dashboardStore = useDashboardStore()
const userStore = useUserStore()

// 動畫管理
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
  if (score >= 80) return 'text-good'
  if (score >= 60) return 'text-warn'
  return 'text-bad'
})

const investmentAdvice = computed(() => {
  const score = investmentScore.value
  if (score >= 75) return '積極投資'
  if (score >= 50) return '謹慎投資'
  return '保守觀望'
})

const investmentAdviceColor = computed(() => {
  const advice = investmentAdvice.value
  if (advice === '積極投資') return 'text-good'
  if (advice === '謹慎投資') return 'text-warn'
  return 'text-bad'
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

// 創建生肖能量球
const createZodiacSphere = (): THREE.Mesh => {
  const { baseRadius, maxRadius, pulseScale, pulseSpeed, rotationSpeed } =
    ANIMATION_CONFIG.zodiacSphere
  const score = fortuneScore.value

  const radius = Math.max(baseRadius, Math.min(maxRadius, (score / 100) * 2.5))
  const geometry = new THREE.IcosahedronGeometry(radius, 2)
  // 生肖球是場景唯一的朱印紅重點
  const material = createSceneMaterial(tokenHex('seal'), 0.95)

  const sphere = new THREE.Mesh(geometry, material)
  sphere.position.set(0, 1, 0)

  // 生肖球體脈動和旋轉動畫
  registerAnimation(() => {
    const time = Date.now() * pulseSpeed
    const scale = 1 + Math.sin(time) * pulseScale
    sphere.scale.setScalar(scale)
    sphere.rotation.x += rotationSpeed.x
    sphere.rotation.y += rotationSpeed.y
    sphere.rotation.z += rotationSpeed.z
  })

  return sphere
}

// 創建五行環系統
const createElementRings = (): THREE.Mesh[] => {
  const rings: THREE.Mesh[] = []
  const { count, baseRadius, spacing, baseThickness, thicknessIncrement } =
    ANIMATION_CONFIG.elementRings

  for (let i = 0; i < count; i++) {
    const radius = baseRadius + i * spacing
    const thickness = baseThickness + i * thicknessIncrement

    const geometry = new THREE.TorusGeometry(radius, thickness, 16, 100)
    // 五行環以墨色階呈現，內圈較深、外圈漸淡
    const opacity = 0.85 - i * 0.2
    const material = createSceneMaterial(tokenHex(i === 0 ? 'ink-2' : 'ink-3'), opacity)

    const ring = new THREE.Mesh(geometry, material)
    ring.position.set(0, 0.5, 0)
    ring.rotation.x = Math.PI / 2 + (i * Math.PI) / 8
    ring.rotation.z = (i * Math.PI) / 4

    // 每個環不同速度旋轉
    registerAnimation(() => {
      ring.rotation.z += (0.01 + i * 0.005) * (i % 2 === 0 ? 1 : -1)
      ring.rotation.y += 0.003 * (i + 1)
    })
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
    // 投資強度：偏多用漲紅、偏空用跌綠，中性用墨灰
    const color =
      currentScore >= 70
        ? tokenHex('rise')
        : currentScore >= 50
          ? tokenHex('ink-3')
          : tokenHex('fall')
    const material = createSceneMaterial(color, 0.92)
    const bar = new THREE.Mesh(geometry, material)

    const angle = (i / count) * Math.PI * 2
    bar.position.set(Math.cos(angle) * baseRadius, height / 2 - 1, Math.sin(angle) * baseRadius)

    // 柱狀圖上升動畫，完成後接續波動動畫
    bar.scale.y = 0
    setTimeout(() => {
      registerAnimation(() => {
        bar.scale.y += (1 - bar.scale.y) * 0.08
        if (Math.abs(1 - bar.scale.y) <= 0.01) {
          registerAnimation(() => {
            const time = Date.now() * 0.003 + i
            const offset = Math.sin(time) * 0.1
            bar.scale.y = 1 + offset
          })
          return false
        }
      })
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

  const baseColor = tokenColor('ink-3')
  const accentColor = tokenColor('seal')

  for (let i = 0; i < count; i++) {
    const i3 = i * 3

    // 球形分布
    const radius = minRadius + Math.random() * (maxRadius - minRadius)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.cos(phi)
    positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta)

    // 以墨灰為主，少量朱印紅點綴
    const finalColor = Math.random() < 0.12 ? accentColor : baseColor
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
    opacity: 0.55,
    sizeAttenuation: true,
  })

  const particles = new THREE.Points(geometry, material)

  // 粒子螺旋運動動畫
  registerAnimation(() => {
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
  })

  return particles
}

// 創建運勢可視化 - 重構後更清晰
const createFortuneVisualization = () => {
  if (!scene || !fortuneGroup) return

  // 清空現有內容前先釋放 GPU 資源，避免每次重建都累積記憶體
  disposeObject3D(fortuneGroup)
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

// 監聽的都是字串/數字型 computed，非物件/陣列，不需要 deep 追蹤
watch([zodiac, element, fortuneScore, investmentScore, lunarDate], () => {
  nextTick(() => {
    createFortuneVisualization()
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
      <div class="text-xs text-ink-2">
        {{ elementDescriptions[hoveredElement as ElementType] }}
      </div>
    </div>

    <!-- 運勢分析圖例 -->
    <div
      v-if="showLegend"
      class="absolute right-4 top-4 w-52 rounded-[10px] border border-line bg-surface/95 p-3 shadow-card"
    >
      <div class="mb-2 flex items-center justify-between">
        <h4 class="font-serif text-sm font-bold text-ink">
          運勢分析
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
          @mouseenter="handleElementHover('zodiacSphere')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="h-3 w-3 rounded-full bg-seal" />
            <span class="text-ink-2">{{ zodiac }}生肖</span>
          </div>
          <span
            :class="fortuneScoreColor"
            class="font-mono text-xs"
          >{{ fortuneScore }}</span>
        </div>
        <div
          class="flex cursor-pointer items-center justify-between rounded p-1 transition-colors hover:bg-raised"
          @mouseenter="handleElementHover('elementRings')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="h-0.5 w-3 rounded bg-ink-3" />
            <span class="text-ink-2">{{ element }}五行</span>
          </div>
          <span class="text-xs text-ink-2">強化</span>
        </div>
        <div
          class="flex cursor-pointer items-center justify-between rounded p-1 transition-colors hover:bg-raised"
          @mouseenter="handleElementHover('investmentBars')"
          @mouseleave="handleElementLeave"
        >
          <div class="flex items-center space-x-2">
            <div class="flex space-x-0.5">
              <div class="h-3 w-0.5 bg-rise" />
              <div class="h-2 w-0.5 bg-ink-3" />
              <div class="h-4 w-0.5 bg-fall" />
            </div>
            <span class="text-ink-2">投資建議</span>
          </div>
          <span
            :class="investmentAdviceColor"
            class="text-xs"
          >{{ investmentAdvice }}</span>
        </div>
        <div
          class="flex cursor-pointer items-center space-x-2 rounded p-1 transition-colors hover:bg-raised"
          @mouseenter="handleElementHover('lunarData')"
          @mouseleave="handleElementLeave"
        >
          <div class="h-3 w-3 rounded-full bg-ink-2" />
          <span class="text-ink-2">農曆</span>
          <span class="ml-auto text-xs text-seal-ink">{{ lunarDate.slice(-4) }}</span>
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
      運勢
    </button>

    <div class="absolute left-4 top-4">
      <h3 class="mb-2 font-serif text-base font-bold text-ink">
        {{ title }}
      </h3>
      <div class="space-y-1 text-sm text-ink-2">
        <div>
          生肖: <span class="text-seal-ink">{{ zodiac }}</span>
        </div>
        <div>
          五行: <span class="text-ink">{{ element }}</span>
        </div>
        <div>
          運勢分數: <span
            :class="fortuneScoreColor"
            class="font-mono"
          >{{ fortuneScore }}</span>
        </div>
        <div>
          投資建議: <span :class="investmentAdviceColor">{{ investmentAdvice }}</span>
        </div>
      </div>
    </div>
    <div class="absolute bottom-4 right-4 text-xs text-ink-3">
      <div>農民曆: {{ lunarDate }}</div>
    </div>
  </div>
</template>
