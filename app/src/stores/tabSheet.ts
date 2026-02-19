// Global store for managing tab sheet visibility and state
export const useTabSheetStore = defineStore('tab-sheet', () => {
  const isOpen = ref(false)
  const selectedTabId = ref<string | number | null>(null)

  const openTabSheet = (tabId: string | number) => {
    selectedTabId.value = tabId
    isOpen.value = true
  }

  const closeTabSheet = () => {
    isOpen.value = false
    // Delay clearing tabId to allow animation to complete
    setTimeout(() => {
      selectedTabId.value = null
    }, 300)
  }

  return {
    isOpen,
    selectedTabId,
    openTabSheet,
    closeTabSheet
  }
})
