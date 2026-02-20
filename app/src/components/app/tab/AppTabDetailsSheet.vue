<script setup lang="ts">
const tabSheetStore = useTabSheetStore()
const { isOpen, selectedTabId } = storeToRefs(tabSheetStore)
const { closeTabSheet } = tabSheetStore
</script>

<template>
  <Sheet :open="isOpen" @update:open="(v) => !v && closeTabSheet()">
    <SheetContent class="w-[400px] sm:w-[540px] overflow-y-auto max-h-screen px-4">
      <SheetHeader>
        <SheetTitle>Tab Details</SheetTitle>
      </SheetHeader>

      <div class="mt-6">
        <AppTabDetails v-if="selectedTabId" :key="selectedTabId" :tab-id="selectedTabId" />
        <div v-else class="text-center py-8 text-muted-foreground">No tab selected.</div>
      </div>
    </SheetContent>
  </Sheet>
</template>
