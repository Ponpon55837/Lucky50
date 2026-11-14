<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/layout/NavBar.vue'
import Footer from './components/layout/Footer.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
</script>

<template>
  <NavBar />
  <div class="flex min-h-screen flex-col lg:pl-[88px]">
    <main class="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <RouterView />
    </main>
    <Footer />
  </div>
  <ToastContainer />
</template>
