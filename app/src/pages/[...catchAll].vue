<script setup lang="ts">
import AppErrorPage from '@/components/app/error/AppErrorPage.vue'

useErrorStore().setError({
  error: 'Page Not Found',
  customCode: 404,
})
</script>

<template>
  <AppErrorPage />
</template>
