<script setup lang="ts">
import { columns as drinkColumns } from '@/components/ui/data-table-columns/DataTableColumnsDrinks'
import { columns as userColumns } from '@/components/ui/data-table-columns/DataTableColumnsUsers'
import { useDrinksStore } from '@/stores/loaders/drinks'
import { useUsersStore } from '@/stores/loaders/users'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import type { Drink } from '@/services/supabase/types/drinkTypes'
import AppAddToTab from '@/components/app/tab/AppAddToTab.vue'
import { useAuthStore } from '@/stores/auth'
import { computed, onMounted, ref, watch } from 'vue'
import { usePageStore } from '@/stores/page'

usePageStore().pageData.title = 'Dashboard'

const route = useRoute()
const authStore = useAuthStore()
const drinksStore = useDrinksStore()
const usersStore = useUsersStore()
const { drinks } = storeToRefs(drinksStore)
const { users } = storeToRefs(usersStore)

const isAddToTabOpen = ref(false)
const selectedDrink = ref<Drink | null>(null)
const isLoading = ref(false)

const search = async (query?: string) => {
  isLoading.value = true
  await Promise.all([drinksStore.getDrinks(query), usersStore.getUsers(query)])
  isLoading.value = false
}

const showUsersGrid = computed(
  () => !!route.query.search && !drinks.value?.length && !!users.value?.length,
)

const onAddToTab = async (drink: Drink) => {
  // Always open sheet to allow quantity/instruction selection
  selectedDrink.value = drink
  isAddToTabOpen.value = true
}

// Load initially using current query param
onMounted(() => {
  search(route.query.search as string | undefined)
})

// React to search query changes (e.g. from navbar)
watch(
  () => route.query.search,
  (newSearch) => {
    search(newSearch as string | undefined)
  },
)
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Main Content - Drinks or Users Table -->
    <div class="flex-1 overflow-hidden border rounded-lg relative">
      <div class="h-full overflow-auto">
        <DataTable
          v-if="showUsersGrid"
          :data="users ?? []"
          :columns="userColumns"
          :loading="isLoading"
          class="w-full"
          :empty-text="'No users found'"
          pagination-key="dashboard-table"
        />
        <DataTable
          v-else
          :data="drinks ?? []"
          :columns="drinkColumns"
          :loading="isLoading"
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
