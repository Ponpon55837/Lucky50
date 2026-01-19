<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
  placeholderClass?: string
  rootMargin?: string
}

const props = withDefaults(defineProps<Props>(), {
  className: undefined,
  loading: 'lazy',
  decoding: 'async',
  placeholderClass: 'w-full h-48 flex items-center justify-center',
  rootMargin: '50px',
})

const shouldLoad = ref(props.loading === 'eager')
const loaded = ref(false)
const imgRef = ref<HTMLElement>()

const placeholderStyle = computed(() => ({
  minHeight: '200px',
  backgroundColor: '#f3f4f6',
}))

let observer: IntersectionObserver | null = null

onMounted(() => {
  if (props.loading === 'lazy' && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            shouldLoad.value = true
            observer?.disconnect()
          }
        })
      },
      {
        rootMargin: props.rootMargin,
      }
    )

    if (imgRef.value) {
      observer.observe(imgRef.value)
    }
  } else {
    shouldLoad.value = true
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

const onLoad = () => {
  loaded.value = true
}

const onError = () => {
  console.warn(`Failed to load image: ${props.src}`)
}
</script>

<template>
  <img
    v-if="shouldLoad"
    :src="src"
    :alt="alt"
    :class="className"
    :loading="loading"
    :decoding="decoding"
    @load="onLoad"
    @error="onError"
  >
  <div
    v-else-if="!loaded"
    :class="placeholderClass"
    :style="placeholderStyle"
  >
    <div class="animate-pulse bg-gray-300 dark:bg-gray-700 w-full h-full rounded" />
  </div>
</template>
