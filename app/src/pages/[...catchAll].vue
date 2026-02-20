<script setup lang="ts">
useErrorStore().setError({
  error: 'Page Not Found',
  customCode: 404,
})
</script>

<template>
  <AppErrorPage />
</template>
