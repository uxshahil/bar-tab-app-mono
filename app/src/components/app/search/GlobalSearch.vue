<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const router = useRouter()
const route = useRoute()

const searchQuery = ref((route.query.search as string) || '')

const updateSearch = useDebounceFn((query: string) => {
  // If we are on a drink detail page (or any sub-page of drinks), redirect to the main list
  if (route.path.startsWith('/drinks/') && route.path !== '/drinks') {
    router.push({ path: '/drinks', query: { search: query } })
    return
  }

  const queryObj = { ...route.query }

  if (query) {
    queryObj.search = query
  } else {
    delete queryObj.search
  }

  router.replace({ query: queryObj })
}, 300)

watch(searchQuery, (newVal) => {
  updateSearch(newVal)
})

// Sync with route changes (e.g. if cleared elsewhere)
watch(
  () => route.query.search,
  (newSearch) => {
    if (newSearch !== searchQuery.value) {
      searchQuery.value = (newSearch as string) || ''
    }
  },
)
</script>

<template>
  <div class="relative w-full max-w-sm">
    <div class="relative w-full">
      <iconify-icon
        class="absolute top-[50%] translate-y-[-50%] left-2.5 text-muted-foreground z-10"
        icon="lucide:search"
      ></iconify-icon>
      <Input v-model="searchQuery" class="pl-9" placeholder="Search drinks or users..." />
      <button
        v-if="searchQuery"
        @click="searchQuery = ''"
        class="absolute top-[50%] translate-y-[-50%] right-2.5 text-muted-foreground hover:text-foreground"
      >
        <iconify-icon icon="lucide:x" class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
