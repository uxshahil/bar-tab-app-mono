<script setup lang="ts">
import { columns } from '@/components/ui/data-table-columns/DataTableColumnsDrinks'
import { useDrinksStore } from '@/stores/loaders/drinks'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import type { Drink } from '@/services/supabase/types/drinkTypes'
import AppDrinkSheet from '@/components/app/drinks/AppDrinkSheet.vue'
import AppResourcePage from '@/components/common/AppResourcePage.vue'
import { onMounted, watch, ref } from 'vue'

const route = useRoute()

// Add to Tab Logic (Global Store)
import { useAddToTabStore } from '@/stores/ui/addToTab'
import { useAuthStore } from '@/stores/auth'

const addToTabStore = useAddToTabStore()
const authStore = useAuthStore()
const drinksStore = useDrinksStore()
const { drinks } = storeToRefs(drinksStore)

const isDrinkSheetOpen = ref(false)
const editingDrinkId = ref<number | null>(null)

const onEditDrink = (drink: Drink) => {
  editingDrinkId.value = drink.id
  isDrinkSheetOpen.value = true
}

const getDrinks = async (search?: string) => {
  await drinksStore.getDrinks(search)
}

const onAddToTab = (drink: Drink) => {
  addToTabStore.open(drink)
}

// Load initially using current query param
onMounted(() => {
  getDrinks(route.query.search as string | undefined)
})

// React to search query changes (e.g. from navbar)
watch(
  () => route.query.search,
  (newSearch) => {
    getDrinks(newSearch as string | undefined)
  },
)
</script>

<template>
  <AppResourcePage
    title="Drinks"
    :data="drinks"
    :columns="columns"
    :loading="!drinks"
    :pagination-key="'drinks-table'"
    :options="{
      meta: {
        onAddToTab,
        onEditDrink,
        userRole: authStore.profile?.user_role
      }
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
