<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

<template>
  <div class="flex items-center justify-center p-8">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    <span class="ml-3 text-gray-600 dark:text-gray-300">載入中...</span>
  </div>
</template>
