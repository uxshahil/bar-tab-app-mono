<script setup lang="ts">
defineProps<{
  message: string
  customCode: number
  details: string
  code: string
  hint: string
  statusCode: number
}>()
</script>

<template>
  <div>
    <iconify-icon icon="lucide:triangle-alert" class="text-7xl text-destructive" />
    <h1 class="font-extrabold text-7xl text-secondary">{{ customCode || code }}</h1>
    <p class="font-extrabold text-7xl text-secondary" v-if="!customCode && !code && statusCode">
      {{ statusCode }}
    </p>
    <p class="text-3xl font-extrabold text-primary my-2">{{ message }}</p>
    <p v-if="hint" class="text-3xl font-extrabold text-primary my-2">{{ hint }}</p>
    <p v-if="details" class="text-3xl font-extrabold text-primary my-2">{{ details }}</p>
    <div class="flex flex-col items-center justify-center gap-5 mt-6 font-light">
      <p class="text-lg text-muted-foreground my-2">
        You'll find lots to explore on the home page.
      </p>
      <RouterLink to="/">
        <Button class="max-w-36"> Back to homepage </Button>
      </RouterLink>
    </div>
  </div>
</template>
