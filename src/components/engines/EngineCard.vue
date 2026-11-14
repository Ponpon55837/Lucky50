<script setup lang="ts">
defineProps<{
  /** 書籤上的直排短標，例如「八字十神」 */
  tab: string
  /** 卡片標題（供螢幕閱讀器與測試辨識） */
  title: string
  error?: string | null
  empty?: boolean
}>()
</script>

<template>
  <article
    class="relative min-h-[140px] rounded-card border border-line bg-surface py-6 pl-[72px] pr-6"
  >
    <span
      class="absolute bottom-5 left-5 top-5 flex w-[34px] items-center justify-center rounded bg-raised font-serif text-sm font-bold tracking-[0.2em] text-ink-2 [writing-mode:vertical-rl]"
      aria-hidden="true"
    >{{ tab }}</span>
    <h3 class="sr-only">
      {{ title }}
    </h3>
    <p
      v-if="error"
      class="text-danger"
    >
      {{ error }}
    </p>
    <p
      v-else-if="empty"
      class="text-ink-3"
    >
      請先設定出生資料
    </p>
    <div
      v-else
      class="flex flex-col gap-3"
    >
      <slot />
    </div>
  </article>
</template>
