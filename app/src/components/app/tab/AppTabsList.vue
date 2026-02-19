<script setup lang="ts">
import { useTabsStore } from '@/stores/loaders/tabs'
import { storeToRefs } from 'pinia'
import { Badge } from '@/components/ui/badge'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { formatCurrency } from '@/utils/currency'

const route = useRoute()
const tabsStore = useTabsStore()
const { openTabsList: openTabs, tab: currentTab } = storeToRefs(tabsStore)

const emit = defineEmits(['select-tab'])

// Filter tabs based on search query
const filteredTabs = computed(() => {
  const query = (route.query.search as string)?.toLowerCase() || ''
  if (!query) return openTabs.value
  
  return openTabs.value?.filter(tab => 
    tab.tab_number.toLowerCase().includes(query) || 
    tab.status.toLowerCase().includes(query)
  )
})



onMounted(() => {
  tabsStore.getOpenTabs()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="p-4 border-b">
      <h3 class="font-semibold text-lg">Active Tabs</h3>
      <p class="text-sm text-muted-foreground">
        {{ openTabs?.length || 0 }} open tabs
      </p>
    </div>

    <div class="flex-1 overflow-y-auto p-2 space-y-2">
      <div v-if="filteredTabs?.length" class="space-y-2">
        <div
          v-for="tab in filteredTabs"
          :key="tab.id"
          @click="emit('select-tab', tab.id)"
          class="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors flex justify-between items-center group"
          :class="{ 'bg-muted border-primary': currentTab?.id === tab.id }"
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ tab.tab_number }}</span>
              <Badge v-if="tab.status !== 'open'" variant="outline" class="text-[10px] h-5">
                {{ tab.status }}
              </Badge>
            </div>
            <div class="text-xs text-muted-foreground mt-1">
              {{ new Date(tab.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold">{{ formatCurrency(tab.remaining_balance ?? tab.total_owed) }}</div>
            <iconify-icon 
              icon="lucide:chevron-right" 
              class="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
      
      <div v-else class="flex flex-col items-center justify-center h-40 text-muted-foreground text-center p-4">
        <iconify-icon icon="lucide:receipt" class="text-3xl mb-2 opacity-50" />
        <p>No active tabs</p>
      </div>
    </div>

    <!-- Optional: Quick Create Button could go here -->
  </div>
</template>
