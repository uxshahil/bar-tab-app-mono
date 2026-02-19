<script setup lang="ts">
import { columns } from '@/components/ui/data-table-columns/DataTableColumnsDrinks'
import { useDrinksStore } from '@/stores/loaders/drinks'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import type { Drink } from '@/services/supabase/types/drinkTypes'
import AppAddToTab from '@/components/app/tab/AppAddToTab.vue'
import { useAuthStore } from '@/stores/auth'
import { onMounted, ref, watch } from 'vue'
import { usePageStore } from '@/stores/page'

usePageStore().pageData.title = 'Dashboard'

const route = useRoute()
const authStore = useAuthStore()
const drinksStore = useDrinksStore()
const { drinks } = storeToRefs(drinksStore)

const isAddToTabOpen = ref(false)
const selectedDrink = ref<Drink | null>(null)

const getDrinks = async (search?: string) => {
  await drinksStore.getDrinks(search)
}

const onAddToTab = async (drink: Drink) => {
  // Always open sheet to allow quantity/instruction selection
  selectedDrink.value = drink
  isAddToTabOpen.value = true
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
  <div class="h-full flex flex-col">
    <!-- Main Content - Drinks Table -->
    <div class="flex-1 overflow-hidden border rounded-lg relative">
      <div v-if="drinks" class="h-full overflow-auto bg-red">
        <DataTable
          :data="drinks"
          :columns="columns"
          :loading="!drinks"
          class="w-full"
          :empty-text="'No drinks found'"
          pagination-key="dashboard-table"
          :options="{
            meta: {
              onAddToTab,
              userRole: authStore.profile?.user_role,
              hideActionsMenu: true,
            },
          }"
        />
      </div>
    </div>

    <AppAddToTab v-model:open="isAddToTabOpen" :drink="selectedDrink" />
  </div>
</template>
