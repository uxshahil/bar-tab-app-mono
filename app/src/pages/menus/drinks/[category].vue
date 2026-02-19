<script setup lang="ts">
import { columns } from '@/components/ui/data-table-columns/DataTableColumnsDrinks'
import { useDrinksStore } from '@/stores/loaders/drinks'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppDrinkSheet from '@/components/app/drinks/AppDrinkSheet.vue'
import AppResourcePage from '@/components/common/AppResourcePage.vue'
import { useAddToTabStore } from '@/stores/ui/addToTab'
import { useAuthStore } from '@/stores/auth'
import type { Drink } from '@/services/supabase/types/drinkTypes'

const route = useRoute()
const drinksStore = useDrinksStore()
const addToTabStore = useAddToTabStore()
const authStore = useAuthStore()
const { categoryDrinks } = storeToRefs(drinksStore)

const categorySlug = computed(() => (route.params as Record<string, string>).category || '')
const categoryTitle = computed(() => {
  const slug = categorySlug.value
  return slug.charAt(0).toUpperCase() + slug.slice(1) + ' Drinks'
})

const isDrinkSheetOpen = ref(false)
const editingDrinkId = ref<number | null>(null)

const onEditDrink = (drink: Drink) => {
  editingDrinkId.value = drink.id
  isDrinkSheetOpen.value = true
}

const onAddToTab = (drink: Drink) => {
  addToTabStore.open(drink)
}

// Fetch data
await drinksStore.getDrinksByCategory(categorySlug.value)

// Watch for route changes to refetch if category changes
watch(
  () => (route.params as Record<string, string>).category || '',
  async (newCategory) => {
    if (newCategory) {
      await drinksStore.getDrinksByCategory(newCategory as string)
    }
  },
)
</script>

<template>
  <AppResourcePage
    :title="categoryTitle"
    :data="categoryDrinks"
    :columns="columns"
    :loading="!categoryDrinks"
    :options="{
      meta: {
        onAddToTab,
        onEditDrink,
        userRole: authStore.profile?.user_role,
      },
    }"
  >
    <template #sheet>
      <AppDrinkSheet
        v-model:open="isDrinkSheetOpen"
        :drink-id="editingDrinkId"
        @close="editingDrinkId = null"
      />
    </template>
  </AppResourcePage>
</template>
