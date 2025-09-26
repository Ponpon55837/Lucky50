<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/layout/NavBar.vue'
import Footer from './components/layout/Footer.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
</script>

<template>
  <div id="app">
    <NavBar />
    <main class="min-h-screen">
      <RouterView />
    </main>
    <Footer />
    <ToastContainer />
  </div>
</template>
