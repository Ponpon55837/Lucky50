<script setup lang="ts">
import { computed, ref } from 'vue'
import * as THREE from 'three'
import SceneCard, { type SceneTooltip } from '@/components/three/SceneCard.vue'
import { useSceneStage } from '@/composables/useSceneStage'
import { useDashboardStore } from '@/stores/dashboard'
import { useUserStore } from '@/stores/user'
import { seasonalStrength } from '@/utils/almanac'
import { elementFromLabel, parseGanZhi } from '@/utils/ganzhi'
import {
  CONTROL_STAR,
  ELEMENT_RELATION_TEXT,
  elementPillars,
  ringPosition,
} from '@/utils/sceneLayout'
import {
  createBase,
  createColumns,
  easeOutCubic,
  lineMaterial,
  matteMaterial,
  placeColumn,
  type ScenePalette,
} from '@/utils/three-scene'

const { title = '五行能量' } = defineProps<{ title?: string }>()

const LAYOUT = {
  baseRadius: 3.4,
  ringRadius: 2.55,
  maxHeight: 2.6,
  pillarWidth: 0.55,
  scoreInner: 0.75,
  scoreOuter: 0.95,
  lineLift: 0.01,
}

const dashboardStore = useDashboardStore()
const userStore = useUserStore()

const elements = computed(() => dashboardStore.integratedFortune?.elements ?? null)
const monthBranch = computed(() => {
  const monthGanZhi = dashboardStore.lunarData?.monthGanZhi
  return monthGanZhi ? (parseGanZhi(monthGanZhi)?.branch ?? '') : ''
})
const ownElement = computed(() => {
  const label = userStore.profile?.element
  return label ? elementFromLabel(label) : null
})
const zodiac = computed(() => userStore.profile?.zodiac ?? '—')
const score = computed(() => Math.max(0, Math.min(100, dashboardStore.unifiedInvestmentScore)))
const strengths = computed(() => seasonalStrength(monthBranch.value))
const pillars = computed(() =>
  elements.value
    ? elementPillars(elements.value, ownElement.value, strengths.value, LAYOUT.maxHeight)
    : []
)

const scoreTone = computed(() => {
  if (score.value >= 60) return 'text-rise'
  if (score.value < 40) return 'text-fall'
  return 'text-ink-2'
})

const threeContainer = ref<HTMLElement>()

const ARC_SEGMENTS = 96
/** RingGeometry 每一段（phiSegments = 1）由兩個三角形、6 個索引組成 */
const INDICES_PER_SEGMENT = 6

/** 台面上的圓弧：從正後方順時針畫 fraction × 一圈 */
const arcGeometry = (fraction: number) => {
  const length = Math.max(1e-3, fraction) * Math.PI * 2
  const geometry = new THREE.RingGeometry(
    LAYOUT.scoreInner,
    LAYOUT.scoreOuter,
    ARC_SEGMENTS,
    1,
    Math.PI / 2 - length,
    length
  )
  return geometry.rotateX(-Math.PI / 2)
}

const { unsupported, hover } = useSceneStage(threeContainer, {
  view: [0, 1.7, 1.05],
  sources: [pillars, score],
  build: (stage, root, palette: ScenePalette) => {
    const data = pillars.value
    if (data.length === 0) return

    const { baseRadius, ringRadius, pillarWidth, lineLift } = LAYOUT
    root.add(createBase(palette, { radius: baseRadius }))

    const bases = data.map((_, i) => ringPosition(i, data.length, ringRadius))

    // 相生環：五個柱底依序相連
    const generating = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        bases.map(([x, z]) => new THREE.Vector3(x, lineLift, z))
      ),
      lineMaterial(palette['ink-3'])
    )
    root.add(generating)

    // 相剋五角星：虛線
    const star = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        CONTROL_STAR.map(i => new THREE.Vector3(bases[i][0], lineLift, bases[i][1]))
      ),
      new THREE.LineDashedMaterial({
        color: palette.line,
        dashSize: 0.14,
        gapSize: 0.1,
      })
    )
    star.computeLineDistances()
    root.add(star)

    // 投資分數：淡色底環當刻度，上面疊一段朱紅弧
    const track = new THREE.Mesh(
      arcGeometry(1),
      new THREE.MeshBasicMaterial({ color: palette.line, side: THREE.DoubleSide })
    )
    track.position.y = lineLift
    const arc = new THREE.Mesh(
      arcGeometry(score.value / 100),
      new THREE.MeshBasicMaterial({ color: palette.seal, side: THREE.DoubleSide })
    )
    arc.position.y = lineLift * 2
    root.add(track, arc)
    stage.addLabel(String(Math.round(score.value)), [0, 0.02, 0], {
      variant: 'title',
      tone: 'seal',
      anchor: 'middle',
    })
    stage.addLabel('投資分數', [0, 0.02, 1.05], { anchor: 'below' })

    // 五根柱子共用一個 InstancedMesh；本命為朱紅、當令旺者稍深、其餘為淡灰
    const columns = createColumns(data.length, matteMaterial(0xffffff))
    const place = (scale: number) =>
      data.forEach((pillar, i) =>
        placeColumn(
          columns,
          i,
          [bases[i][0], 0, bases[i][1]],
          [pillarWidth, pillar.height * scale, pillarWidth]
        )
      )
    data.forEach((pillar, i) => {
      const color = pillar.isOwn
        ? palette.seal
        : pillar.strength === '旺'
          ? palette['ink-2']
          : palette['ink-3']
      columns.setColorAt(i, color)
    })
    place(1)
    root.add(columns)

    data.forEach((pillar, i) => {
      const [x, z] = bases[i]
      stage.addLabel(pillar.label, [x, pillar.height + 0.12, z], {
        variant: 'title',
        tone: pillar.isOwn ? 'seal' : 'ink',
        anchor: 'above',
        detail: `${Math.round(pillar.value)}%${pillar.strength ? `・${pillar.strength}` : ''}`,
      })
    })

    stage.animate(800, progress => {
      const eased = easeOutCubic(progress)
      place(eased)
      // 只調整繪製範圍，不在每幀重建幾何
      arc.geometry.setDrawRange(0, Math.round(ARC_SEGMENTS * eased) * INDICES_PER_SEGMENT)
    })
    return [columns]
  },
})

const tooltip = computed<SceneTooltip | null>(() => {
  const hit = hover.value
  if (!hit || hit.instanceId === undefined) return null
  const pillar = pillars.value[hit.instanceId]
  if (!pillar) return null
  const lines: SceneTooltip['lines'] = [{ label: '能量', value: `${pillar.value.toFixed(0)}%` }]
  if (pillar.strength) lines.push({ label: '月令', value: pillar.strength })
  if (pillar.relation)
    lines.push({ label: '與本命', value: ELEMENT_RELATION_TEXT[pillar.relation] })
  return {
    x: hit.x,
    y: hit.y,
    title: pillar.isOwn
      ? `${pillar.label}・本命`
      : `${pillar.label}・${pillar.relation ? ELEMENT_RELATION_TEXT[pillar.relation] : '五行'}`,
    lines,
  }
})
</script>

<template>
  <SceneCard
    :title="title"
    subtitle="命盤五行能量占比與本月旺衰"
    :unsupported="unsupported"
    :empty="elements ? '' : '到個人設定填寫生辰後，這裡會顯示你的五行能量'"
    :tooltip="tooltip"
  >
    <template #stats>
      <div>
        <dt class="text-ink-3">
          生肖
        </dt>
        <dd class="font-serif text-base text-ink">
          {{ zodiac }}
        </dd>
      </div>
      <div>
        <dt class="text-ink-3">
          本命五行
        </dt>
        <dd class="font-serif text-base text-seal-ink">
          {{ userStore.profile?.element ?? '—' }}
        </dd>
      </div>
      <div>
        <dt class="text-ink-3">
          投資分數
        </dt>
        <dd :class="['font-mono text-base', scoreTone]">
          {{ Math.round(score) }}
        </dd>
      </div>
    </template>

    <div
      ref="threeContainer"
      class="absolute inset-0"
    />

    <template #legend>
      <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-seal" />本命五行</span>
      <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-ink-3" />其他五行（高度＝能量占比）</span>
      <span class="inline-flex items-center gap-1.5"><i class="h-0.5 w-4 bg-ink-3" />相生</span>
      <span class="inline-flex items-center gap-1.5"><i class="w-4 border-t border-dashed border-ink-3" />相剋</span>
      <span class="inline-flex items-center gap-1.5"><i class="h-1 w-4 rounded-full bg-seal" />投資分數（滿分 100）</span>
    </template>

    <template #fallback>
      <dl
        v-if="elements"
        class="grid grid-cols-2 gap-x-6 gap-y-1"
      >
        <template
          v-for="pillar in pillars"
          :key="pillar.key"
        >
          <dt>{{ pillar.label }}{{ pillar.isOwn ? '（本命）' : '' }}</dt>
          <dd class="font-mono">
            {{ pillar.value.toFixed(0) }}%{{ pillar.strength ? `・${pillar.strength}` : '' }}
          </dd>
        </template>
        <dt>投資分數</dt>
        <dd :class="['font-mono', scoreTone]">
          {{ Math.round(score) }}
        </dd>
      </dl>
    </template>
  </SceneCard>
</template>
