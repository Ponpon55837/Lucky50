<script setup lang="ts">
import { useRouter } from 'vue-router'
import { FaceFrownIcon } from '@heroicons/vue/24/outline'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    goHome()
  }
}
</script>

<template>
  <section class="flex flex-col items-center justify-center py-16 text-center sm:py-24">
    <span class="mb-6 select-none font-mono text-7xl font-bold text-ink/10 sm:text-9xl">404</span>

    <div
      class="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-raised sm:h-20 sm:w-20"
    >
      <FaceFrownIcon
        class="h-8 w-8 text-ink-3 sm:h-10 sm:w-10"
        aria-hidden="true"
      />
    </div>

    <h1 class="mb-3 font-serif text-2xl font-bold text-ink sm:text-3xl">
      找不到頁面
    </h1>
    <p class="mb-8 max-w-md text-sm text-ink-3 sm:text-base">
      您要找的頁面不存在或已被移除，請檢查網址是否正確。
    </p>

    <div class="flex flex-col gap-3 sm:flex-row">
      <button
        class="btn-primary"
        @click="goHome"
      >
        返回首頁
      </button>
      <button
        class="btn-secondary"
        @click="goBack"
      >
        回上一頁
      </button>
    </div>
  </section>
</template>
