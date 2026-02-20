export const useNewTabSheetStore = defineStore('new-tab-sheet', () => {
  const isOpen = ref(false)
  const openSheet = () => {
    isOpen.value = true
  }
  const closeSheet = () => {
    isOpen.value = false
  }
  return { isOpen, openSheet, closeSheet }
})
