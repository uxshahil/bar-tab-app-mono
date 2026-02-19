<script setup lang="ts">
import { useTabsStore } from '@/stores/loaders/tabs'
import { storeToRefs } from 'pinia'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/utils/currency'

const tabsStore = useTabsStore()
const { tabs: activeTabs } = storeToRefs(tabsStore)

defineEmits(['select-tab'])



// Calculate time open
const getTimeOpen = (dateString: string) => {
  const start = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 60) return `${diffMins}m`
  const diffHrs = Math.floor(diffMins / 60)
  return `${diffHrs}h ${diffMins % 60}m`
}

onMounted(() => {
  tabsStore.getOpenTabs()
})
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
    <Card 
      v-for="tab in activeTabs" 
      :key="tab.id"
      class="cursor-pointer hover:bg-muted/50 transition-colors"
      @click="$emit('select-tab', tab.id)"
    >
      <CardHeader class="pb-2">
        <div class="flex justify-between items-start">
          <CardTitle class="text-lg">Tab {{ tab.tab_number }}</CardTitle>
          <Badge variant="outline" :class="{
            'bg-green-100 text-green-800': tab.status === 'open',
            'bg-yellow-100 text-yellow-800': tab.status === 'pending_payment'
          }">
            {{ tab.status }}
          </Badge>
        </div>
        <CardDescription class="text-xs">
          Opened {{ getTimeOpen(tab.created_at) }} ago
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">
          {{ formatCurrency(tab.total_owed) }}
        </div>
        <p v-if="tab.special_notes" class="text-xs text-muted-foreground mt-2 truncate">
          {{ tab.special_notes }}
        </p>
      </CardContent>
    </Card>
    
    <div v-if="activeTabs?.length === 0" class="col-span-full text-center py-12 text-muted-foreground">
      No active tabs found.
    </div>
  </div>
</template>
