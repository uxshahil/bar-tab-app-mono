import type { Profile } from '@/services/supabase/types/profileTypes'

export const useUserSheetStore = defineStore('user-sheet', () => {
  const isOpen = ref(false)
  const userToEdit = ref<Profile | null>(null)

  const openSheet = (user?: Profile | null) => {
    userToEdit.value = user ?? null
    isOpen.value = true
  }

  const closeSheet = () => {
    isOpen.value = false
    setTimeout(() => {
      userToEdit.value = null
    }, 300)
  }

  return { isOpen, userToEdit, openSheet, closeSheet }
})
