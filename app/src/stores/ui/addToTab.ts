import type { Drink } from '@/services/supabase/types/drinkTypes'

export const useAddToTabStore = defineStore('add-to-tab-store', () => {
    const isOpen = ref(false)
    const drink = ref<Drink | null>(null)

    const open = (selectedDrink: Drink) => {
        drink.value = selectedDrink
        isOpen.value = true
    }

    const close = () => {
        isOpen.value = false
        // Optional: clear drink after delay to allow animation to finish
        // but keeping it is fine for now
    }

    return {
        isOpen,
        drink,
        open,
        close
    }
})
