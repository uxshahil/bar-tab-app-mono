export const useSplitBillSheetStore = defineStore('split-bill-sheet', () => {
  const isOpen = ref(false)
  const tabId = ref<string | number | null>(null)

  const openSheet = (id: string | number) => {
    tabId.value = id
    isOpen.value = true
  }

  const closeSheet = () => {
    isOpen.value = false
    setTimeout(() => {
      tabId.value = null
    }, 300)
  }

  return { isOpen, tabId, openSheet, closeSheet }
})
