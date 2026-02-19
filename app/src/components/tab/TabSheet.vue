<script setup lang="ts">
import { useTabSheetStore } from '@/stores/tabSheet'
import { storeToRefs } from 'pinia'

const tabSheetStore = useTabSheetStore()
const { isOpen, selectedTabId } = storeToRefs(tabSheetStore)
const { closeTabSheet } = tabSheetStore

const handleOpenChange = (open: boolean) => {
  if (!open) {
    closeTabSheet()
  }
}
</script>

<template>
  <Sheet :open="isOpen" @update:open="handleOpenChange">
    <SheetContent side="right" class="w-full sm:w-2/3 lg:w-1/2 overflow-y-auto max-h-screen px-4">
      <SheetHeader>
        <SheetTitle>Tab Details</SheetTitle>
      </SheetHeader>

      <!-- Tab Details Component -->
      <AppTabDetails v-if="selectedTabId" :tab-id="selectedTabId" class="mt-4" />
    </SheetContent>
  </Sheet>
</template>
