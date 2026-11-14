<script setup lang="ts">
import { computed } from 'vue'
import { clashAnimal, tradeItemsFirst } from '@/utils/almanac'
import type { LunarData } from '@/services/lunar'

const props = defineProps<{
  lunar: LunarData
}>()

// 宜忌最多各列八項（交易相關優先），避免表格被撐得太長
const MAX_ITEMS = 8

const yi = computed(() => tradeItemsFirst(props.lunar.yi).slice(0, MAX_ITEMS))
const ji = computed(() => tradeItemsFirst(props.lunar.ji).slice(0, MAX_ITEMS))
const hiddenCount = computed(
  () =>
    Math.max(0, props.lunar.yi.length - MAX_ITEMS) + Math.max(0, props.lunar.ji.length - MAX_ITEMS)
)

const facts = computed(() =>
  [
    {
      label: '沖煞',
      value: [
        props.lunar.chongDesc && `沖${clashAnimal(props.lunar.chongDesc)}`,
        props.lunar.sha && `煞${props.lunar.sha}`,
      ]
        .filter(Boolean)
        .join(' '),
    },
    { label: '財神', value: props.lunar.caiShen },
    { label: '喜神', value: props.lunar.xiShen },
    { label: '納音', value: props.lunar.naYinDay },
  ].filter(fact => fact.value)
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid overflow-hidden rounded border-2 border-seal sm:grid-cols-2">
      <div class="grid grid-cols-[56px_minmax(0,1fr)]">
        <span class="grid place-items-center bg-seal font-kai text-3xl font-bold text-seal-on">宜</span>
        <ul class="yiji-list">
          <li
            v-for="item in yi"
            :key="item"
          >
            {{ item }}
          </li>
          <li
            v-if="yi.length === 0"
            class="text-ink-3"
          >
            諸事不宜
          </li>
        </ul>
      </div>
      <div
        class="grid grid-cols-[56px_minmax(0,1fr)] border-t-2 border-seal sm:border-l-2 sm:border-t-0"
      >
        <span
          class="grid place-items-center border-r-2 border-seal font-kai text-3xl font-bold text-seal-ink"
        >忌</span>
        <ul class="yiji-list text-ink-2">
          <li
            v-for="item in ji"
            :key="item"
          >
            {{ item }}
          </li>
          <li
            v-if="ji.length === 0"
            class="text-ink-3"
          >
            百無禁忌
          </li>
        </ul>
      </div>
    </div>
    <p
      v-if="hiddenCount > 0"
      class="text-xs text-ink-3"
    >
      另有 {{ hiddenCount }} 項宜忌未列出
    </p>
    <dl
      v-if="facts.length"
      class="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <div
        v-for="fact in facts"
        :key="fact.label"
        class="border-t border-line pt-2.5"
      >
        <dt class="text-xs text-ink-3">
          {{ fact.label }}
        </dt>
        <dd class="mt-0.5 font-kai text-lg">
          {{ fact.value }}
        </dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.yiji-list {
  @apply flex flex-wrap content-center gap-x-4 gap-y-1.5 px-4 py-3.5 font-kai text-lg;
}
</style>
