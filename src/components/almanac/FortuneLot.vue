<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { RECOMMENDATION_TEXT, drawLot, type Recommendation } from '@/utils/almanac'

const props = defineProps<{
  score: number
  seed: number
  recommendation: Recommendation
  /** 例如「巳時 09:00–11:00」 */
  bestHour: string | null
  luckyDirection: string
}>()

// 搖籤動畫時序（毫秒）
const SHAKE_MS = 560
const REVEAL_MS = 420

const draw = ref(0)
const shaking = ref(false)
const revealed = ref(true)
let timers: number[] = []

const lot = computed(() => drawLot(props.score, props.seed, draw.value))
const advice = computed(() => RECOMMENDATION_TEXT[props.recommendation])

const reading = computed(() => {
  const parts = [`今天宜${advice.value.label}，避免${advice.value.avoid}`]
  if (props.bestHour) parts.push(`最順的時段是${props.bestHour}`)
  return parts.join('。')
})

const later = (fn: () => void, ms: number) => {
  timers.push(window.setTimeout(fn, ms))
}

const shake = () => {
  if (shaking.value) return
  shaking.value = true
  revealed.value = false
  later(() => {
    draw.value++
    shaking.value = false
    later(() => (revealed.value = true), REVEAL_MS)
  }, SHAKE_MS)
}

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  timers = []
})
</script>

<template>
  <section
    class="lot"
    aria-labelledby="lot-title"
  >
    <div class="lot-tube">
      <svg
        viewBox="0 0 180 220"
        class="h-[150px] w-[120px] overflow-visible lg:h-[220px] lg:w-[180px]"
        aria-hidden="true"
      >
        <g :class="{ 'is-shaking': shaking }">
          <g
            class="fill-seal-on"
            fill-opacity="0.75"
          >
            <rect
              x="62"
              y="40"
              width="7"
              height="110"
              rx="2"
              transform="rotate(-8 65 150)"
            />
            <rect
              x="74"
              y="30"
              width="7"
              height="120"
              rx="2"
              transform="rotate(-3 77 150)"
            />
            <rect
              x="98"
              y="34"
              width="7"
              height="116"
              rx="2"
              transform="rotate(4 101 150)"
            />
            <rect
              x="110"
              y="44"
              width="7"
              height="106"
              rx="2"
              transform="rotate(9 113 150)"
            />
          </g>
          <g
            class="lot-stick"
            :class="{ 'is-up': revealed }"
          >
            <rect
              x="85"
              y="22"
              width="9"
              height="128"
              rx="2"
              class="fill-seal-on"
            />
            <rect
              x="85"
              y="22"
              width="9"
              height="22"
              rx="2"
              class="fill-seal"
            />
          </g>
          <path
            d="M48 96 h84 l-8 104 a8 8 0 0 1 -8 7 h-52 a8 8 0 0 1 -8 -7 z"
            class="fill-gold"
          />
          <path
            d="M48 96 h84 l-1.4 18 h-81.2 z"
            class="fill-seal-deep"
            fill-opacity="0.18"
          />
          <text
            x="90"
            y="162"
            font-size="26"
            font-weight="700"
            text-anchor="middle"
            class="fill-seal-deep font-kai"
          >
            籤
          </text>
        </g>
      </svg>
      <button
        type="button"
        class="lot-button"
        :disabled="shaking"
        @click="shake"
      >
        <ArrowPathIcon class="h-4 w-4" />
        再搖一次
      </button>
    </div>

    <div
      class="lot-slip"
      :class="{ 'is-hidden': !revealed }"
      aria-live="polite"
    >
      <p
        class="lot-verse"
        :aria-label="lot.verse.join('，')"
      >
        <span
          v-for="line in lot.verse"
          :key="line"
        >{{ line }}</span>
      </p>
      <div class="flex min-w-0 flex-col gap-4">
        <h2
          id="lot-title"
          class="flex flex-wrap items-baseline gap-3"
        >
          <span class="text-[13px] tracking-[0.1em] opacity-80">{{ lot.title }}</span>
          <span
            class="font-serif text-5xl font-black leading-none tracking-[0.06em] text-gold lg:text-6xl"
          >
            {{ lot.grade }}
          </span>
        </h2>
        <p class="max-w-[30rem] text-base leading-relaxed opacity-95">
          {{ reading }}
        </p>
        <ul class="flex flex-wrap gap-2 text-[13px]">
          <li class="lot-chip">
            <b>宜</b>{{ advice.label }}
          </li>
          <li class="lot-chip">
            <b>忌</b>{{ advice.avoid }}
          </li>
          <li
            v-if="luckyDirection"
            class="lot-chip"
          >
            <b>財位</b>{{ luckyDirection }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lot {
  @apply relative isolate grid overflow-hidden rounded-[20px] bg-seal text-seal-on lg:grid-cols-[280px_minmax(0,1fr)];
}

/* 紅紙上的淡格線，取自農民曆的表格 */
.lot::before {
  content: '';
  @apply absolute inset-0 -z-10 opacity-[0.08];
  background-image:
    repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 44px),
    repeating-linear-gradient(0deg, currentColor 0 1px, transparent 1px 44px);
}

.lot-tube {
  @apply flex items-end justify-center gap-4 bg-seal-deep p-5 lg:flex-col lg:items-center lg:px-6 lg:pb-7 lg:pt-6;
}

.lot-button {
  @apply inline-flex h-10 items-center gap-2 rounded-full border border-seal-on/40 px-4 text-sm transition-[background-color,transform] duration-150 ease-out hover:bg-seal-on/10 active:scale-[0.97] disabled:opacity-60;
}

.lot-stick {
  transition: transform 700ms var(--ease-out);
}

.lot-stick.is-up {
  transform: translateY(-46px);
}

.is-shaking {
  transform-origin: 90px 200px;
  animation: shake 90ms linear 6 alternate;
}

@keyframes shake {
  from {
    transform: rotate(-5deg);
  }
  to {
    transform: rotate(5deg);
  }
}

.lot-slip {
  @apply grid items-center gap-5 px-5 py-6 transition-[opacity,transform] duration-300 ease-out sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10 lg:px-11 lg:py-9;
}

.lot-slip.is-hidden {
  @apply translate-y-2 opacity-0;
}

.lot-verse {
  @apply flex flex-col font-kai text-xl tracking-[0.08em] sm:h-[250px] sm:gap-2 sm:text-[26px] sm:leading-[1.9] sm:tracking-[0.18em];
}

/* 直書：flex-col 在 vertical-rl 下是由右到左排列各句 */
@media (min-width: 640px) {
  .lot-verse {
    writing-mode: vertical-rl;
  }
}

/* 中間兩句用金色，像籤紙上的套色 */
.lot-verse span:nth-child(2),
.lot-verse span:nth-child(3) {
  @apply text-gold;
}

.lot-chip {
  @apply rounded-full bg-seal-on/15 px-3 py-1;
}

.lot-chip b {
  @apply mr-1 font-medium text-gold;
}
</style>
