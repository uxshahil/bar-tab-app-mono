<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const drinksStore = useDrinksStore()
const usersStore = useUsersStore()
const { drinks } = storeToRefs(drinksStore)
const { users } = storeToRefs(usersStore)

const isLoading = ref(false)

const search = async (query?: string) => {
  isLoading.value = true
  await Promise.all([drinksStore.getDrinks(query), usersStore.getUsers(query)])
  isLoading.value = false
}

const showUsersGrid = computed(
  () => !!route.query.search && !drinks.value?.length && !!users.value?.length,
)

const drinkColumnsNoActions = drinkColumns.filter((c) => c.id !== 'actions')
const userColumnsNoActions = userColumns.filter((c) => c.id !== 'actions')

const onAddToTab = (drink: Drink) => {
  useAddToTabStore().open(drink)
}

onMounted(() => {
  search(route.query.search as string | undefined)
})

watch(
  () => route.query.search,
  (newSearch) => {
    search(newSearch as string | undefined)
  },
)
</script>

<template>
  <AppResourcePage
    v-if="showUsersGrid"
    title="Dashboard"
    :data="users"
    :columns="userColumnsNoActions"
    :loading="isLoading"
    empty-text="No users found"
    pagination-key="dashboard-table"
  />
  <AppResourcePage
    v-else
    title="Dashboard"
    :data="drinks"
    :columns="drinkColumnsNoActions"
    :loading="isLoading"
    empty-text="No drinks found"
    pagination-key="dashboard-table"
    :options="{
      meta: {
        onAddToTab,
        userRole: authStore.profile?.user_role,
      },
    }"
  />
</template>
