<script setup lang="ts">
import { ref, watch } from 'vue'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTabsStore } from '@/stores/loaders/tabs'
import { storeToRefs } from 'pinia'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  tabId: string | number
}>()

const isOpen = defineModel<boolean>('open')

const createNewSplit = async () => {
    loading.value = true
    const maxSplitNumber = tabSplits.value?.reduce((max, s) => Math.max(max, s.split_number || 0), 0) || 0
    const nextSplitNumber = maxSplitNumber + 1
    
    await tabsStore.createTabSplit({
        tab_id: Number(props.tabId),
        split_number: nextSplitNumber,
        items_included: [],
        subtotal: 0,
        tax_on_split: 0,
        total_owed: 0,
        amount_paid: 0,
        status: 'pending',
        tip_amount: 0,
        settled_at: null
    })
    
    // Refresh splits
    await tabsStore.getTabSplits(props.tabId.toString())
    loading.value = false
}

const tabsStore = useTabsStore()
const { tabItems, tabSplits } = storeToRefs(tabsStore)

const loading = ref(false)

// Initialize splits if none exist
const initializeSplits = async () => {
  if (!tabSplits.value || tabSplits.value.length === 0) {
    await createNewSplit()
  }

  loading.value = true
  // Fix: Find the maximum split number to avoid conflicts after deletion
  const maxSplitNumber = tabSplits.value?.reduce((max, s) => Math.max(max, s.split_number || 0), 0) || 0
  const nextSplitNumber = maxSplitNumber + 1
  
  await tabsStore.createTabSplit({
    tab_id: Number(props.tabId),
    split_number: nextSplitNumber,
    items_included: [],
    subtotal: 0,
    tax_on_split: 0,
    total_owed: 0,
    amount_paid: 0,
    status: 'pending',
    tip_amount: 0,
    settled_at: null
  })
  
  loading.value = false
}

const deleteSplit = async (splitId: number) => {
  if (!confirm(`Are you sure you want to delete Split? Items will be returned to unassigned.`)) return
  
  loading.value = true
  await tabsStore.deleteTabSplit(splitId, props.tabId)
  loading.value = false
}

const assignItemToSplit = async (itemId: number, splitId: string) => {
  const splitIdNum = Number(splitId)
  if (!splitIdNum) return // Handle "Unassigned" case if needed, or just ignore

  // Find the target split
  const targetSplit = tabSplits.value?.find(s => s.id === splitIdNum)
  if (!targetSplit) return

  // Find the item
  const item = tabItems.value?.find(i => i.id === itemId)
  if (!item) return

  // Remove item from other splits first (if any)
  for (const split of tabSplits.value || []) {
    if (split.items_included?.includes(itemId.toString()) && split.id !== splitIdNum) {
      const newItems = split.items_included.filter(id => id !== itemId.toString())
      // Recalculate totals for the old split
      const removedItemTotal = item.item_total
      await tabsStore.updateTabSplit(split.id, {
        items_included: newItems,
        subtotal: (split.subtotal || 0) - removedItemTotal,
        total_owed: (split.total_owed || 0) - removedItemTotal
      })
    }
  }

  // Add to new split
  if (!targetSplit.items_included?.includes(itemId.toString())) {
    const newItems = [...(targetSplit.items_included || []), itemId.toString()]
    const addedItemTotal = item.item_total
    
    await tabsStore.updateTabSplit(targetSplit.id, {
      items_included: newItems,
      subtotal: (targetSplit.subtotal || 0) + addedItemTotal,
      total_owed: (targetSplit.total_owed || 0) + addedItemTotal
    })
  }
}

const getSplitForItem = (itemId: number) => {
  const split = tabSplits.value?.find(s => s.items_included?.includes(itemId.toString()))
  return split ? split.id.toString() : ''
}



watch(isOpen, async (newVal) => {
  if (newVal) {
    await tabsStore.getTabItems(props.tabId.toString())
    await tabsStore.getTabSplits(props.tabId.toString())
    await initializeSplits()
  }
})
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="w-[400px] sm:w-[600px] overflow-y-auto max-h-screen px-4">
      <SheetHeader>
        <SheetTitle>Split Bill</SheetTitle>
        <SheetDescription>
          Assign items to different splits.
        </SheetDescription>
      </SheetHeader>

      <div class="space-y-6 px-4 pb-2">
        <!-- Splits Summary -->
        <div class="flex gap-2 overflow-x-auto py-4">
          <Button variant="outline" class="h-auto min-w-[100px]" @click="createNewSplit" :disabled="loading">
            <iconify-icon icon="lucide:plus" class="mr-2" />
            Add Split
          </Button>
          <div 
            v-for="split in tabSplits" 
            :key="split.id"
            class="min-w-[120px] p-2 border rounded-lg bg-muted/50 relative group"
          >
            <Button 
                variant="ghost" 
                size="icon" 
                class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                @click.stop="deleteSplit(split.id)"
            >
                <iconify-icon icon="lucide:x" class="text-[10px]" />
            </Button>
            <div class="font-medium text-sm">Split {{ split.split_number }}</div>
            <div class="text-lg font-bold mt-1">{{ formatCurrency(split.total_owed) }}</div>
            <div class="text-xs text-muted-foreground capitalize">{{ split.status }}</div>
          </div>
        </div>

        <!-- Items List -->
        <div class="space-y-4">
          <h3 class="font-medium">Assign Items</h3>
          <div v-if="tabItems?.length" class="space-y-2">
            <div 
              v-for="item in tabItems" 
              :key="item.id"
              class="flex items-center justify-between p-3 border rounded-lg"
            >
              <div class="flex-1">
                <div class="font-medium">{{ item.quantity }}x {{ item.menu_item?.name }}</div>
                <div class="text-sm text-muted-foreground">{{ formatCurrency(item.item_total) }}</div>
              </div>
              
              <div class="w-[140px]">
                <Select :model-value="getSplitForItem(item.id)" @update:model-value="(val: any) => assignItemToSplit(item.id, val)">
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned" disabled>Unassigned</SelectItem>
                    <SelectItem 
                      v-for="split in tabSplits" 
                      :key="split.id" 
                      :value="split.id.toString()"
                    >
                      Split {{ split.split_number }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-muted-foreground">
            No items to split.
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
