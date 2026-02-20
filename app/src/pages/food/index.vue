<script setup lang="ts">
useErrorStore().setError({
  error: 'Eating is cheating!',
  customCode: 404,
})
</script>

<template>
  <AppErrorPage />
</template>
