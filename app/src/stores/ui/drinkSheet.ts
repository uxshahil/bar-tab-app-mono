export const useDrinkSheetStore = defineStore('drink-sheet', () => {
  const isOpen = ref(false)
  const drinkId = ref<number | null>(null)

  const openSheet = (id?: number | null) => {
    drinkId.value = id ?? null
    isOpen.value = true
  }

  const closeSheet = () => {
    isOpen.value = false
    setTimeout(() => {
      drinkId.value = null
    }, 300)
  }

  return { isOpen, drinkId, openSheet, closeSheet }
})
