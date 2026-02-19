<script setup lang="ts">
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import AppTabDetails from '@/components/app/tab/AppTabDetails.vue'
import { useTabsStore } from '@/stores/loaders/tabs'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  tabId?: string | number
}>()

const isOpen = defineModel<boolean>('open')

const tabsStore = useTabsStore()
const { tab } = storeToRefs(tabsStore)

// If tabId is provided, we might want to fetch it, but AppTabDetails handles fetching on mount.
// However, since we are in a sheet that might be toggled, we should ensure the data is fresh or correct.
// The AppTabDetails component fetches data onMounted. 
// If we reuse the same component instance, we might need to watch the tabId.
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="w-[400px] sm:w-[540px] overflow-y-auto max-h-screen px-4">
      <SheetHeader>
        <SheetTitle>Tab Details</SheetTitle>
      </SheetHeader>
      
      <div class="mt-6">
        <AppTabDetails 
          v-if="tabId || tab?.id" 
          :key="tabId || tab?.id"
          :tab-id="tabId || tab?.id || ''" 
        />
        <div v-else class="text-center py-8 text-muted-foreground">
          No tab selected.
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
