<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AppTabsList from '@/components/app/tab/AppTabsList.vue'
import AppTabDetails from '@/components/app/tab/AppTabDetails.vue'
import { Button } from '@/components/ui/button'
import { menuKey, type MenuInjectionOptions } from '@/providers/injectionKeys'

const route = useRoute()
const router = useRouter()

const { rightSidebarOpen } = inject(menuKey) as MenuInjectionOptions

const selectedTabId = ref<string | number | null>(null)

const onTabSelected = (tabId: number) => {
  router.push({ query: { ...route.query, tabId } })
}

const clearSelection = () => {
  const query = { ...route.query }
  delete query.tabId
  router.push({ query })
}

// Initialize selection from route
if (route.query.tabId) {
  selectedTabId.value = route.query.tabId as string
}

// React to tabId changes
watch(
  () => route.query.tabId,
  (newTabId) => {
    selectedTabId.value = (newTabId as string) || null
  }
)
</script>

<template>
  <aside 
    class="h-full border-l bg-muted/40 flex flex-col transition-[width] duration-300 ease-in-out overflow-hidden"
    :class="{ 'w-96': rightSidebarOpen, 'w-0 border-l-0': !rightSidebarOpen }"
  >
    <!-- Header (matches Sidebar header height) -->
    <div class="flex h-16 items-center border-b px-4 shrink-0 justify-between bg-background/50 backdrop-blur">
      <h2 class="font-semibold text-lg">
        {{ selectedTabId ? 'Tab Details' : 'Active Tabs' }}
      </h2>
      <Button 
        v-if="selectedTabId" 
        variant="ghost" 
        size="icon" 
        @click="clearSelection" 
        class="h-8 w-8 text-muted-foreground hover:text-foreground"
      >
        <iconify-icon icon="lucide:x" />
      </Button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden flex flex-col">
      <!-- Tab Details View -->
      <div v-if="selectedTabId" class="h-full flex flex-col">
        <div class="flex-1 overflow-auto pr-2 p-4">
          <AppTabDetails :key="selectedTabId" :tab-id="selectedTabId" />
        </div>
      </div>

      <!-- Tabs List View -->
      <div v-else class="h-full overflow-hidden p-4">
        <AppTabsList @select-tab="onTabSelected" />
      </div>
    </div>
  </aside>
</template>
